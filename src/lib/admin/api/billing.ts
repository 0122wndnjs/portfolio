import "server-only";
import { audit } from "@/lib/admin/auth";
import { fitsInvoice, summarizeInvoices } from "@/lib/admin/billing";
import { db } from "@/lib/admin/db";
import { HttpError, json } from "@/lib/admin/http";
import { isInternalProjectKind } from "@/lib/admin/project-kinds";
import { seoulDate, validDate } from "@/lib/admin/validation";
import { type Route, type Row, dateOrNull, newId, now } from "./common";
import { saveTrash } from "./productivity";

export async function invoicesWithPayments(projectId?: string) {
  const [rows, payments] = await Promise.all([
    db
      .prepare(
        `SELECT i.*, p.name AS project_name, p.status AS project_status FROM invoices i JOIN projects p ON p.id=i.project_id ${projectId ? "WHERE i.project_id=?" : ""} ORDER BY COALESCE(i.due_date,'9999-12-31'),i.created_at`,
      )
      .all(...(projectId ? [projectId] : [])) as Promise<Array<Row & { id: string; amount: number; due_date: string | null }>>,
    db
      .prepare(
        `SELECT * FROM payments WHERE invoice_id IN (SELECT id FROM invoices ${projectId ? "WHERE project_id=?" : ""}) ORDER BY paid_at`,
      )
      .all(...(projectId ? [projectId] : [])) as Promise<Array<Row & { invoice_id: string; amount: number }>>,
  ]);
  return summarizeInvoices(rows, payments, seoulDate());
}

/** 트랜잭션 안에서 호출. 청구 행을 잠가 동시 입금 기록으로 청구액을 넘지 않게 한다. */
async function lockInvoice(invoiceId: string) {
  const invoice = await db
    .prepare("SELECT amount FROM invoices WHERE id=? FOR UPDATE")
    .get(invoiceId) as { amount: number } | undefined;
  if (!invoice) throw new HttpError(404, "청구 항목을 찾을 수 없습니다.");
  return invoice;
}

async function paidTotal(invoiceId: string, excludePaymentId = "") {
  const row = await db
    .prepare("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE invoice_id=? AND id<>?")
    .get(invoiceId, excludePaymentId) as { total: number };
  return Number(row.total);
}

export const billingRoutes: Route[] = [
  {
    method: "GET",
    path: "payments",
    async handler() {
      return json(await invoicesWithPayments());
    },
  },
  {
    method: "POST",
    path: "projects/:id/invoices",
    async handler({ params, body }) {
      const project = await db.prepare("SELECT kind FROM projects WHERE id=?").get(params.id) as
        | { kind: string }
        | undefined;
      if (!project) throw new HttpError(404, "프로젝트를 찾을 수 없습니다.");
      if (isInternalProjectKind(project.kind))
        throw new HttpError(400, "회사 업무에는 입금 항목을 만들 수 없습니다.");
      const title = String(body.title || "").trim();
      const amount = Number(body.amount);
      if (
        !title ||
        title.length > 100 ||
        !Number.isSafeInteger(amount) ||
        amount < 1 ||
        !validDate(body.due_date) ||
        String(body.memo || "").length > 1000
      )
        throw new HttpError(400, "청구 항목명과 1원 이상의 청구액을 입력하세요.");
      const invoiceId = newId();
      await db.prepare(
        "INSERT INTO invoices(id,project_id,title,amount,due_date,memo,created_at) VALUES(?,?,?,?,?,?,?)",
      ).run(invoiceId, params.id, title, amount, dateOrNull(body.due_date), String(body.memo || ""), now());
      await audit("invoice.created", { projectId: params.id, amount });
      return json({ id: invoiceId }, 201);
    },
  },
  {
    method: "POST",
    path: "invoices/:id/payments",
    async handler({ params, body }) {
      const amount = Number(body.amount);
      if (!Number.isSafeInteger(amount) || amount < 1)
        throw new HttpError(400, "입금액은 1원 이상의 정수여야 합니다.");
      if (!validDate(body.paid_at) || String(body.memo || "").length > 1000)
        throw new HttpError(400, "입금일 또는 메모 형식이 올바르지 않습니다.");
      const paymentId = newId();
      await db.transaction(async () => {
        const invoice = await lockInvoice(params.id);
        if (!fitsInvoice(Number(invoice.amount), await paidTotal(params.id), amount))
          throw new HttpError(400, "누적 입금액이 청구 금액을 넘을 수 없습니다.");
        await db.prepare(
          "INSERT INTO payments(id,invoice_id,amount,paid_at,memo,created_at) VALUES(?,?,?,?,?,?)",
        ).run(paymentId, params.id, amount, dateOrNull(body.paid_at) || seoulDate(), String(body.memo || ""), now());
      });
      await audit("payment.created", { invoiceId: params.id, amount });
      return json({ id: paymentId }, 201);
    },
  },
  {
    method: "PATCH",
    path: "invoices/:id",
    async handler({ params, body }) {
      const fields = (["title", "amount", "due_date", "memo"] as const).filter((key) => key in body);
      if (!fields.length) throw new HttpError(400, "수정할 항목이 없습니다.");
      if (body.title !== undefined && (!String(body.title).trim() || String(body.title).trim().length > 100))
        throw new HttpError(400, "청구 항목명은 1~100자로 입력하세요.");
      if (body.due_date !== undefined && !validDate(body.due_date))
        throw new HttpError(400, "입금 예정일 형식이 올바르지 않습니다.");
      if (body.memo !== undefined && String(body.memo).length > 1000)
        throw new HttpError(400, "메모는 1,000자 이내로 입력하세요.");
      const amount = body.amount === undefined ? undefined : Number(body.amount);
      const before = await db.transaction(async () => {
        const invoice = await lockInvoice(params.id);
        const paid = await paidTotal(params.id);
        if (amount !== undefined && (!Number.isSafeInteger(amount) || amount < 1 || amount < paid))
          throw new HttpError(400, "청구액은 누적 입금액 이상이어야 합니다.");
        const values = fields.map((key) =>
          key === "amount"
            ? amount
            : key === "due_date"
              ? dateOrNull(body.due_date)
              : key === "title"
                ? String(body.title).trim()
                : String(body.memo ?? ""),
        );
        await db
          .prepare(`UPDATE invoices SET ${fields.map((key) => `${key}=?`).join(",")} WHERE id=?`)
          .run(...values, params.id);
        return { amount: Number(invoice.amount), paid };
      });
      if (amount !== undefined)
        await audit("invoice.amount.updated", { invoiceId: params.id, before: before.amount, after: amount, paid: before.paid });
      return json({ ok: true });
    },
  },
  {
    method: "PATCH",
    path: "payments/:id",
    async handler({ params, body }) {
      const amount = body.amount === undefined ? undefined : Number(body.amount);
      if (amount !== undefined && (!Number.isSafeInteger(amount) || amount < 1))
        throw new HttpError(400, "입금액은 1원 이상의 정수여야 합니다.");
      if (body.paid_at !== undefined && (!body.paid_at || !validDate(body.paid_at)))
        throw new HttpError(400, "입금일 형식이 올바르지 않습니다.");
      if (body.memo !== undefined && String(body.memo).length > 1000)
        throw new HttpError(400, "메모는 1,000자 이내로 입력하세요.");
      const fields = (["amount", "paid_at", "memo"] as const).filter((key) => key in body);
      if (!fields.length) throw new HttpError(400, "수정할 항목이 없습니다.");
      const before = await db.transaction(async () => {
        const row = await db.prepare("SELECT invoice_id,amount FROM payments WHERE id=?").get(params.id) as
          | { invoice_id: string; amount: number }
          | undefined;
        if (!row) throw new HttpError(404, "입금 내역을 찾을 수 없습니다.");
        const invoice = await lockInvoice(row.invoice_id);
        if (amount !== undefined && !fitsInvoice(Number(invoice.amount), await paidTotal(row.invoice_id, params.id), amount))
          throw new HttpError(400, "누적 입금액이 청구 금액을 넘을 수 없습니다.");
        const values = fields.map((key) =>
          key === "amount" ? amount : key === "paid_at" ? String(body.paid_at) : String(body.memo ?? ""),
        );
        await db
          .prepare(`UPDATE payments SET ${fields.map((key) => `${key}=?`).join(",")} WHERE id=?`)
          .run(...values, params.id);
        return Number(row.amount);
      });
      await audit("payment.updated", { paymentId: params.id, before, after: amount ?? before });
      return json({ ok: true });
    },
  },
  {
    method: "DELETE",
    path: "invoices/:id",
    async handler({ params }) {
      await db.transaction(async () => {
        await lockInvoice(params.id);
        const payments = await db
          .prepare("SELECT COUNT(*) AS count FROM payments WHERE invoice_id=?")
          .get(params.id) as { count: number };
        if (payments.count) throw new HttpError(409, "입금 내역을 먼저 정정하거나 삭제하세요.");
        const row = await db.prepare("DELETE FROM invoices WHERE id=? RETURNING *").get(params.id);
        if (row) await saveTrash("invoice", row);
      });
      await audit("invoice.deleted", { invoiceId: params.id });
      return json({ ok: true });
    },
  },
  {
    method: "DELETE",
    path: "payments/:id",
    async handler({ params }) {
      const row = await db.transaction(async () => {
        const payment = await db.prepare("SELECT invoice_id FROM payments WHERE id=?").get(params.id);
        if (!payment) throw new HttpError(404, "입금 내역을 찾을 수 없습니다.");
        await lockInvoice(String(payment.invoice_id));
        const deleted = await db.prepare("DELETE FROM payments WHERE id=? RETURNING *").get(params.id);
        if (!deleted) throw new HttpError(404, "입금 내역을 찾을 수 없습니다.");
        await saveTrash("payment", deleted);
        return deleted;
      });
      await audit("payment.deleted", { paymentId: params.id, amount: row.amount });
      return json({ ok: true });
    },
  },
];
