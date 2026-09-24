import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { audit, hash, isAuthenticated } from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";
import { assertOrigin } from "@/lib/admin/webauthn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ path: string[] }> };
type Row = Record<string, unknown>;
const now = () => new Date().toISOString();
const id = () => randomBytes(16).toString("hex");
const parse = (value: unknown) =>
  typeof value === "string" ? JSON.parse(value) : value;
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
const fail = (message: string, status = 400) =>
  json({ error: message }, status);
const validDate = (value: unknown) => {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
};
const validLinks = (value: unknown) =>
  Array.isArray(value) &&
  value.length <= 50 &&
  value.every((link) => {
    if (
      !link ||
      typeof link.name !== "string" ||
      link.name.trim().length > 80 ||
      typeof link.url !== "string" ||
      link.url.length > 2048
    )
      return false;
    try {
      return ["http:", "https:"].includes(new URL(link.url).protocol);
    } catch {
      return false;
    }
  });

function getSetting(key: string, fallback = "") {
  return (
    (
      db.prepare("SELECT value FROM settings WHERE key=?").get(key) as
        { value: string } | undefined
    )?.value ?? fallback
  );
}
function setSetting(key: string, value: string) {
  db.prepare(
    "INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
  ).run(key, value);
}
function safeProject(row: Row) {
  return {
    ...row,
    links: parse(row.links),
    contract_amount:
      row.contract_amount === null ? null : Number(row.contract_amount),
  };
}
function safeTask(row: Row) {
  return {
    ...row,
    checklist: parse(row.checklist),
    links: parse(row.links),
    archived: Boolean(row.archived),
  };
}
function safeQuote(row: Row) {
  return { ...row, items: parse(row.items) };
}
function quoteInput(body: Record<string, unknown>) {
  const projectId = String(body.project_id || "");
  const title = String(body.title || "").trim();
  const sender = String(body.sender || "").trim();
  const recipient = String(body.recipient || "").trim();
  const issueDate = String(body.issue_date || "");
  const validUntil = body.valid_until ? String(body.valid_until) : null;
  const status = String(body.status || "초안");
  const note = String(body.note || "").trim();
  const taxAmount = Number(body.tax_amount ?? 0);
  const items = body.items;
  const project = db.prepare("SELECT kind FROM projects WHERE id=?").get(projectId) as { kind: string } | undefined;
  if (!project) throw new Error("프로젝트를 선택하세요.");
  if (project.kind === "회사") throw new Error("회사 업무에는 견적서를 만들 수 없습니다.");
  if (!title || title.length > 120 || sender.length > 120 || !recipient || recipient.length > 120) throw new Error("제목과 받는 사람을 입력하세요. 각 항목은 120자 이내여야 합니다.");
  if (!issueDate || !validDate(issueDate) || !validDate(validUntil) || (validUntil && validUntil < issueDate)) throw new Error("발행일과 유효기간을 확인하세요.");
  if (!["초안", "발송", "수락", "거절"].includes(status)) throw new Error("견적 상태가 올바르지 않습니다.");
  if (note.length > 5000) throw new Error("안내 문구는 5,000자 이내여야 합니다.");
  if (!Array.isArray(items) || !items.length || items.length > 50) throw new Error("견적 항목을 1~50개 입력하세요.");
  let subtotal = 0;
  const cleanItems = items.map((item) => {
    if (!item || typeof item !== "object") throw new Error("견적 항목 형식이 올바르지 않습니다.");
    const entry = item as Record<string, unknown>;
    const name = String(entry.name || "").trim();
    const quantity = Number(entry.quantity);
    const unitPrice = Number(entry.unit_price);
    if (!name || name.length > 200 || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100000 || !Number.isSafeInteger(unitPrice) || unitPrice < 0 || unitPrice > 100000000000) throw new Error("항목명·수량·단가를 확인하세요.");
    subtotal += quantity * unitPrice;
    if (!Number.isSafeInteger(subtotal)) throw new Error("견적 금액이 너무 큽니다.");
    return { name, quantity, unit_price: unitPrice };
  });
  if (!Number.isSafeInteger(taxAmount) || taxAmount < 0 || !Number.isSafeInteger(subtotal + taxAmount)) throw new Error("부가세 금액을 확인하세요.");
  return { projectId, title, sender, recipient, issueDate, validUntil, status, note, taxAmount, items: cleanItems };
}
function meetingInput(body: Record<string, unknown>) {
  const projectId = String(body.project_id || "");
  const title = String(body.title || "").trim();
  const meetingDate = String(body.meeting_date || "");
  const startTime = String(body.start_time || "");
  const attendees = String(body.attendees || "").trim();
  const location = String(body.location || "").trim();
  const agenda = String(body.agenda || "").trim();
  const decisions = String(body.decisions || "").trim();
  if (!db.prepare("SELECT 1 FROM projects WHERE id=?").get(projectId)) throw new Error("프로젝트를 선택하세요.");
  if (!title || title.length > 160) throw new Error("미팅 제목은 1~160자로 입력하세요.");
  if (!meetingDate || !validDate(meetingDate)) throw new Error("미팅 날짜를 확인하세요.");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) throw new Error("미팅 시간을 확인하세요.");
  if (attendees.length > 500 || location.length > 1000 || agenda.length > 10000 || decisions.length > 10000) throw new Error("미팅 내용이 너무 깁니다.");
  return { projectId, title, meetingDate, startTime, attendees, location, agenda, decisions };
}
function invoicesWithPayments(projectId?: string): Array<
  Row & {
    amount: number;
    paid_amount: number;
    balance: number;
    status: string;
    overdue: boolean;
    payments: Row[];
  }
> {
  const rows = db
    .prepare(
      `SELECT i.*, p.name AS project_name, p.status AS project_status FROM invoices i JOIN projects p ON p.id=i.project_id ${projectId ? "WHERE i.project_id=?" : ""} ORDER BY COALESCE(i.due_date,'9999-12-31'),i.created_at`,
    )
    .all(...(projectId ? [projectId] : [])) as Row[];
  const payments = db
    .prepare(
      `SELECT * FROM payments WHERE invoice_id IN (SELECT id FROM invoices ${projectId ? "WHERE project_id=?" : ""}) ORDER BY paid_at`,
    )
    .all(...(projectId ? [projectId] : [])) as Row[];
  return rows.map((row) => {
    const items = payments.filter((payment) => payment.invoice_id === row.id);
    const paid = items.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );
    return {
      ...row,
      amount: Number(row.amount),
      paid_amount: paid,
      balance: Number(row.amount) - paid,
      status:
        paid === 0
          ? "미입금"
          : paid < Number(row.amount)
            ? "부분 입금"
            : "입금 완료",
      overdue:
        Number(row.amount) > paid &&
        !!row.due_date &&
        String(row.due_date) <
          new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" }),
      payments: items,
    };
  });
}

export async function GET(request: Request, context: Context) {
  if (!(await isAuthenticated())) return fail("로그인이 필요합니다.", 401);
  const { path } = await context.params;
  const route = path.join("/");
  const url = new URL(request.url);
  if (route === "projects") {
    const status = url.searchParams.get("status");
    const kind = url.searchParams.get("kind") || "";
    const q = `%${url.searchParams.get("q") || ""}%`;
    const rows = db
      .prepare(
        `SELECT p.*, COUNT(t.id) AS task_count, SUM(CASE WHEN t.status='완료' THEN 1 ELSE 0 END) AS done_count FROM projects p LEFT JOIN tasks t ON t.project_id=p.id AND t.archived=0 WHERE ((?='' AND p.status IN ('준비 중','진행 중','보류')) OR (?<>'' AND p.status=?)) AND (?='' OR p.kind=?) AND (p.name LIKE ? OR p.client LIKE ?) GROUP BY p.id ORDER BY CASE p.status WHEN '진행 중' THEN 0 WHEN '준비 중' THEN 1 WHEN '보류' THEN 2 ELSE 3 END, COALESCE(p.due_date,'9999-12-31'),p.updated_at DESC`,
      )
      .all(status || "", status || "", status || "", kind, kind, q, q) as Row[];
    return json(rows.map(safeProject));
  }
  if (route === "quotes") {
    const projectId = url.searchParams.get("project");
    const rows = db.prepare(`SELECT q.*, p.name AS project_name, (SELECT COUNT(*) FROM quote_task_links l WHERE l.quote_id=q.id) AS imported_item_count FROM quotes q JOIN projects p ON p.id=q.project_id ${projectId ? "WHERE q.project_id=?" : ""} ORDER BY q.issue_date DESC, q.created_at DESC`).all(...(projectId ? [projectId] : [])) as Row[];
    return json(rows.map(safeQuote));
  }
  if (route === "meetings") {
    const projectId = url.searchParams.get("project");
    const rows = db.prepare(`SELECT m.*, p.name AS project_name, p.kind AS project_kind FROM meetings m JOIN projects p ON p.id=m.project_id ${projectId ? "WHERE m.project_id=?" : ""} ORDER BY m.meeting_date DESC, m.start_time DESC, m.created_at DESC`).all(...(projectId ? [projectId] : [])) as Row[];
    const linked = db.prepare(`SELECT l.meeting_id,t.id,t.title,t.status,t.due_date,t.archived FROM meeting_task_links l JOIN tasks t ON t.id=l.task_id ${projectId ? "JOIN meetings m ON m.id=l.meeting_id WHERE m.project_id=?" : ""}`).all(...(projectId ? [projectId] : [])) as Row[];
    return json(rows.map((row) => ({ ...row, tasks: linked.filter((task) => task.meeting_id === row.id) })));
  }
  if (route.startsWith("projects/")) {
    const [, projectId, subroute] = route.split("/");
    const row = db
      .prepare("SELECT * FROM projects WHERE id=?")
      .get(projectId) as Row | undefined;
    if (!row) return fail("프로젝트를 찾을 수 없습니다.", 404);
    if (!subroute || subroute === "detail")
      return json({
        ...safeProject(row),
        tasks: (
          db
            .prepare(
              "SELECT * FROM tasks WHERE project_id=? AND archived=0 ORDER BY status,position,created_at",
            )
            .all(projectId) as Row[]
        ).map(safeTask),
        invoices: invoicesWithPayments(projectId),
      });
    if (subroute === "tasks")
      return json(
        (
          db
            .prepare(
              "SELECT * FROM tasks WHERE project_id=? AND archived=0 ORDER BY status,position,created_at",
            )
            .all(projectId) as Row[]
        ).map(safeTask),
      );
    if (subroute === "invoices") return json(invoicesWithPayments(projectId));
  }
  if (route === "tasks") {
    const selectedStatus = url.searchParams.get("status") || "";
    const projectId = url.searchParams.get("project") || "";
    const priority = url.searchParams.get("priority") || "";
    const due = url.searchParams.get("due") || "";
    const includeClosed = url.searchParams.get("includeClosed") === "true";
    const where = ["t.archived=0"];
    const filters: unknown[] = [];
    if (selectedStatus) {
      where.push("t.status=?");
      filters.push(selectedStatus);
    } else {
      where.push("t.status!='완료'");
    }
    if (!includeClosed) where.push("p.status IN ('준비 중','진행 중','보류')");
    if (projectId) {
      where.push("p.id=?");
      filters.push(projectId);
    }
    if (priority) {
      where.push("t.priority=?");
      filters.push(priority);
    }
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Seoul",
    });
    const week = new Date(Date.now() + 7 * 86400000).toLocaleDateString(
      "en-CA",
      { timeZone: "Asia/Seoul" },
    );
    if (due === "today") {
      where.push("t.due_date=?");
      filters.push(today);
    }
    if (due === "week") {
      where.push("t.due_date BETWEEN ? AND ?");
      filters.push(today, week);
    }
    if (due === "overdue") {
      where.push("t.due_date < ?");
      filters.push(today);
    }
    if (due === "waiting") where.push("t.status='확인 대기'");
    if (due === "unscheduled") where.push("t.due_date IS NULL");
    return json(
      (
        db
          .prepare(
            `SELECT t.*,p.name AS project_name,p.status AS project_status FROM tasks t JOIN projects p ON p.id=t.project_id WHERE ${where.join(" AND ")} ORDER BY CASE t.status WHEN '확인 대기' THEN 0 WHEN '진행 중' THEN 1 WHEN '할 일' THEN 2 ELSE 3 END,COALESCE(t.due_date,'9999-12-31'),t.position`,
          )
          .all(...filters) as Row[]
      ).map(safeTask),
    );
  }
  if (route === "payments") return json(invoicesWithPayments());
  if (route === "dashboard") {
    const projects = db
      .prepare(
        "SELECT COUNT(*) AS count FROM projects WHERE status IN ('준비 중','진행 중')",
      )
      .get() as Row;
    const taskRows = db
      .prepare(
        `SELECT t.*,p.name AS project_name FROM tasks t JOIN projects p ON p.id=t.project_id WHERE t.archived=0 AND t.status!='완료' AND p.status IN ('준비 중','진행 중')`,
      )
      .all() as Row[];
    const date = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Seoul",
    });
    const next = new Date(Date.now() + 7 * 86400000).toLocaleDateString(
      "en-CA",
      { timeZone: "Asia/Seoul" },
    );
    const invoices = invoicesWithPayments();
    const dueTasks = taskRows
      .filter((task) => task.due_date && String(task.due_date) <= next)
      .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)));
    return json({
      project_count: projects.count,
      overdue_tasks: taskRows.filter(
        (task) => task.due_date && String(task.due_date) < date,
      ).length,
      waiting_tasks: taskRows.filter((task) => task.status === "확인 대기"),
      due_tasks: dueTasks,
      unpaid_total: invoices.reduce((sum, invoice) => sum + invoice.balance, 0),
      upcoming_invoices: invoices.filter(
        (invoice) =>
          invoice.balance > 0 &&
          invoice.due_date &&
          String(invoice.due_date) <= next,
      ),
      overdue_invoices: invoices.filter((invoice) => invoice.overdue),
    });
  }
  if (route === "settings") {
    const passkeys = db
      .prepare(
        "SELECT id,device_name,created_at,last_used_at FROM credentials ORDER BY created_at",
      )
      .all();
    const logs = db
      .prepare(
        "SELECT id,message,sent_at,result FROM notification_log ORDER BY sent_at DESC LIMIT 12",
      )
      .all();
    const recoveryCount = (
      db
        .prepare(
          "SELECT COUNT(*) AS count FROM recovery_codes WHERE used_at IS NULL",
        )
        .get() as { count: number }
    ).count;
    const prefs = JSON.parse(
      getSetting(
        "preferences",
        JSON.stringify({
          notifications: true,
          overdueDays: 3,
          digestTime: "09:00",
          deadlineAlerts: true,
          paymentAlerts: true,
        }),
      ),
    );
    return json({
      passkeys,
      telegram_connected: !!getSetting("telegram_chat_id"),
      telegram_username: process.env.TELEGRAM_BOT_USERNAME || "",
      telegram_link: getSetting("telegram_chat_id")
        ? null
        : process.env.TELEGRAM_BOT_USERNAME
          ? `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}`
          : null,
      preferences: prefs,
      logs,
      recovery_count: recoveryCount,
    });
  }
  if (route === "auth/status")
    return json({
      authenticated: await isAuthenticated(),
      configured:
        (
          db.prepare("SELECT COUNT(*) AS count FROM credentials").get() as {
            count: number;
          }
        ).count > 0,
    });
  return fail("요청한 항목을 찾을 수 없습니다.", 404);
}

export async function POST(request: Request, context: Context) {
  if (!(await isAuthenticated())) return fail("로그인이 필요합니다.", 401);
  try {
    await assertOrigin(request);
  } catch {
    return fail("잘못된 요청 출처입니다.", 403);
  }
  const { path } = await context.params;
  const route = path.join("/");
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  try {
    if (route.startsWith("meetings/") && route.endsWith("/tasks")) {
      const meetingId = route.split("/")[1];
      const meeting = db.prepare("SELECT project_id FROM meetings WHERE id=?").get(meetingId) as { project_id: string } | undefined;
      if (!meeting) return fail("미팅을 찾을 수 없습니다.", 404);
      const title = String(body.title || "").trim();
      if (!title || title.length > 200 || !validDate(body.due_date)) return fail("후속 작업 제목과 마감일을 확인하세요.");
      const taskId = id();
      const timestamp = now();
      db.transaction(() => {
        const position = (db.prepare("SELECT COUNT(*) AS count FROM tasks WHERE project_id=? AND status='할 일'").get(meeting.project_id) as { count: number }).count;
        db.prepare("INSERT INTO tasks(id,project_id,title,description,status,priority,due_date,position,checklist,links,waiting_since,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)").run(taskId, meeting.project_id, title, "", "할 일", "보통", body.due_date || null, position, "[]", "[]", null, timestamp, timestamp);
        db.prepare("INSERT INTO meeting_task_links(meeting_id,task_id) VALUES(?,?)").run(meetingId, taskId);
      })();
      audit("meeting.task.created", { meetingId, taskId });
      return json({ id: taskId }, 201);
    }
    if (route === "meetings") {
      const meeting = meetingInput(body);
      const meetingId = id();
      const timestamp = now();
      db.prepare("INSERT INTO meetings(id,project_id,title,meeting_date,start_time,attendees,location,agenda,decisions,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(meetingId, meeting.projectId, meeting.title, meeting.meetingDate, meeting.startTime, meeting.attendees, meeting.location, meeting.agenda, meeting.decisions, timestamp, timestamp);
      audit("meeting.created", { meetingId, projectId: meeting.projectId });
      return json({ id: meetingId }, 201);
    }
    if (route.startsWith("quotes/") && route.endsWith("/import-tasks")) {
      const quoteId = route.split("/")[1];
      const quote = db.prepare("SELECT id,project_id,number,status,items FROM quotes WHERE id=?").get(quoteId) as { id: string; project_id: string; number: string; status: string; items: string } | undefined;
      if (!quote) return fail("견적서를 찾을 수 없습니다.", 404);
      if (quote.status !== "수락") return fail("수락한 견적서만 작업으로 가져올 수 있습니다.");
      const items = parse(quote.items) as Array<{ name: string; quantity: number; unit_price: number }>;
      const created = db.transaction(() => {
        let count = 0;
        let position = (db.prepare("SELECT COUNT(*) AS count FROM tasks WHERE project_id=? AND status='할 일'").get(quote.project_id) as { count: number }).count;
        for (const [index, item] of items.entries()) {
          if (db.prepare("SELECT 1 FROM quote_task_links WHERE quote_id=? AND item_index=?").get(quoteId, index)) continue;
          const taskId = id();
          const timestamp = now();
          db.prepare("INSERT INTO tasks(id,project_id,title,description,status,priority,due_date,position,checklist,links,waiting_since,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)").run(taskId, quote.project_id, item.name, `견적서 ${quote.number}의 ${index + 1}번 항목`, "할 일", "보통", null, position++, "[]", "[]", null, timestamp, timestamp);
          db.prepare("INSERT INTO quote_task_links(quote_id,item_index,task_id) VALUES(?,?,?)").run(quoteId, index, taskId);
          count++;
        }
        return count;
      })();
      audit("quote.tasks.imported", { quoteId, created });
      return json({ created });
    }
    if (route === "quotes") {
      const quote = quoteInput(body);
      const quoteId = id();
      const number = `Q-${quote.issueDate.replaceAll("-", "")}-${quoteId.slice(0, 6).toUpperCase()}`;
      const timestamp = now();
      db.prepare("INSERT INTO quotes(id,project_id,number,title,sender,recipient,issue_date,valid_until,status,items,tax_amount,note,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(quoteId, quote.projectId, number, quote.title, quote.sender, quote.recipient, quote.issueDate, quote.validUntil, quote.status, JSON.stringify(quote.items), quote.taxAmount, quote.note, timestamp, timestamp);
      audit("quote.created", { quoteId, projectId: quote.projectId });
      return json({ id: quoteId }, 201);
    }
    if (route === "projects") {
      const name = String(body.name || "").trim(),
        client = String(body.client || "").trim();
      const kind = String(body.kind || "외주");
      if (!["외주", "회사"].includes(kind)) return fail("업무 유형이 올바르지 않습니다.");
      if (!name || name.length > 100 || !client || client.length > 80)
        return fail("프로젝트명(1~100자)과 고객명(1~80자)을 입력하세요.");
      if (
        body.status &&
        !["준비 중", "진행 중", "보류", "완료", "취소"].includes(
          String(body.status),
        )
      )
        return fail("프로젝트 상태가 올바르지 않습니다.");
      if (!validDate(body.start_date) || !validDate(body.due_date))
        return fail("프로젝트 날짜 형식이 올바르지 않습니다.");
      if (
        body.description !== undefined &&
        String(body.description).length > 10000
      )
        return fail("프로젝트 설명은 10,000자 이내로 입력하세요.");
      if (body.links !== undefined && !validLinks(body.links))
        return fail("프로젝트 링크 형식이 올바르지 않습니다.");
      const contractAmount = body.contract_amount
        ? Number(body.contract_amount)
        : null;
      if (
        contractAmount !== null &&
        (!Number.isSafeInteger(contractAmount) || contractAmount < 0)
      )
        return fail("계약 금액은 0원 이상의 정수여야 합니다.");
      if (
        body.start_date &&
        body.due_date &&
        String(body.due_date) < String(body.start_date)
      )
        return fail("마감일은 시작일보다 빠를 수 없습니다.");
      const projectId = id(),
        timestamp = now();
      db.prepare(
        "INSERT INTO projects(id,name,client,description,contact,email,kind,status,start_date,due_date,contract_amount,memo,links,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      ).run(
        projectId,
        name,
        client,
        String(body.description || ""),
        String(body.contact || ""),
        String(body.email || ""),
        kind,
        String(body.status || "준비 중"),
        body.start_date || null,
        body.due_date || null,
        kind === "회사" ? null : contractAmount,
        String(body.memo || ""),
        JSON.stringify(body.links || []),
        timestamp,
        timestamp,
      );
      audit("project.created", { projectId, name });
      return json({ id: projectId }, 201);
    }
    if (route.startsWith("projects/") && route.endsWith("/tasks")) {
      const projectId = route.split("/")[1];
      if (!db.prepare("SELECT id FROM projects WHERE id=?").get(projectId))
        return fail("프로젝트를 찾을 수 없습니다.", 404);
      const title = String(body.title || "").trim();
      if (!title || title.length > 200)
        return fail("작업 제목(1~200자)을 입력하세요.");
      const taskId = id(),
        status = String(body.status || "할 일"),
        timestamp = now();
      if (!["할 일", "진행 중", "확인 대기", "완료"].includes(status))
        return fail("작업 상태가 올바르지 않습니다.");
      if (!["낮음", "보통", "높음"].includes(String(body.priority || "보통")))
        return fail("우선순위가 올바르지 않습니다.");
      if (!validDate(body.due_date))
        return fail("마감일 형식이 올바르지 않습니다.");
      if (
        body.description !== undefined &&
        String(body.description).length > 10000
      )
        return fail("작업 설명은 10,000자 이내로 입력하세요.");
      if (
        body.checklist !== undefined &&
        (!Array.isArray(body.checklist) ||
          body.checklist.some(
            (item) =>
              !item ||
              typeof item.text !== "string" ||
              item.text.trim().length > 200 ||
              typeof item.done !== "boolean",
          ))
      )
        return fail("체크리스트 형식이 올바르지 않습니다.");
      if (body.links !== undefined && !validLinks(body.links))
        return fail("작업 링크 형식이 올바르지 않습니다.");
      const count = db
        .prepare(
          "SELECT COUNT(*) AS count FROM tasks WHERE project_id=? AND status=?",
        )
        .get(projectId, status) as { count: number };
      db.prepare(
        "INSERT INTO tasks(id,project_id,title,description,status,priority,due_date,position,checklist,links,waiting_since,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
      ).run(
        taskId,
        projectId,
        title,
        String(body.description || ""),
        status,
        String(body.priority || "보통"),
        body.due_date || null,
        count.count,
        JSON.stringify(body.checklist || []),
        JSON.stringify(body.links || []),
        status === "확인 대기" ? timestamp : null,
        timestamp,
        timestamp,
      );
      return json({ id: taskId }, 201);
    }
    if (route.startsWith("projects/") && route.endsWith("/order")) {
      const projectId = route.split("/")[1];
      const taskId = String(body.taskId || "");
      const laneStatus = String(body.status || "");
      const beforeTaskId =
        typeof body.beforeTaskId === "string" ? body.beforeTaskId : "";
      if (
        !taskId ||
        !["할 일", "진행 중", "확인 대기", "완료"].includes(laneStatus)
      )
        return fail("작업 이동 정보가 올바르지 않습니다.");
      const task = db
        .prepare(
          "SELECT status,waiting_since,completed_at FROM tasks WHERE id=? AND project_id=? AND archived=0",
        )
        .get(taskId, projectId) as
        | {
            status: string;
            waiting_since: string | null;
            completed_at: string | null;
          }
        | undefined;
      if (!task) return fail("작업을 찾을 수 없습니다.", 404);
      const timestamp = now();
      const move = db.transaction(() => {
        const oldLane = (
          db
            .prepare(
              "SELECT id FROM tasks WHERE project_id=? AND status=? AND archived=0 AND id!=? ORDER BY position,created_at",
            )
            .all(projectId, task.status, taskId) as Array<{ id: string }>
        ).map((row) => row.id);
        const newLane =
          task.status === laneStatus
            ? oldLane
            : (
                db
                  .prepare(
                    "SELECT id FROM tasks WHERE project_id=? AND status=? AND archived=0 AND id!=? ORDER BY position,created_at",
                  )
                  .all(projectId, laneStatus, taskId) as Array<{ id: string }>
              ).map((row) => row.id);
        const insertion = beforeTaskId
          ? newLane.indexOf(beforeTaskId)
          : newLane.length;
        if (beforeTaskId && insertion < 0)
          throw new Error(
            "이동 대상 카드가 변경됐습니다. 새로고침 후 다시 시도하세요.",
          );
        newLane.splice(insertion, 0, taskId);
        const waitingSince =
          laneStatus === "확인 대기"
            ? task.status === "확인 대기"
              ? task.waiting_since
              : timestamp
            : null;
        db.prepare(
          "UPDATE tasks SET status=?,waiting_since=?,completed_at=?,updated_at=? WHERE id=?",
        ).run(
          laneStatus,
          waitingSince,
          laneStatus === "완료"
            ? task.status === "완료"
              ? task.completed_at
              : timestamp
            : null,
          timestamp,
          taskId,
        );
        const update = db.prepare(
          "UPDATE tasks SET position=?,updated_at=? WHERE id=?",
        );
        newLane.forEach((item, index) => update.run(index, timestamp, item));
        if (task.status !== laneStatus)
          oldLane.forEach((item, index) => update.run(index, timestamp, item));
      });
      try {
        move();
      } catch (error) {
        return fail(
          error instanceof Error
            ? error.message
            : "작업 순서를 저장하지 못했습니다.",
          409,
        );
      }
      return json({ ok: true });
    }
    if (route.startsWith("tasks/") && route.endsWith("/checklist")) {
      const taskId = route.split("/")[1];
      const task = db
        .prepare("SELECT checklist FROM tasks WHERE id=?")
        .get(taskId) as { checklist: string } | undefined;
      if (!task) return fail("작업을 찾을 수 없습니다.", 404);
      const checklist = JSON.parse(task.checklist) as Array<{
        id: string;
        text: string;
        done: boolean;
      }>;
      const text = String(body.text || "").trim();
      if (!text || text.length > 200)
        return fail("체크 항목은 1~200자로 입력하세요.");
      checklist.push({ id: id(), text, done: false });
      db.prepare("UPDATE tasks SET checklist=?,updated_at=? WHERE id=?").run(
        JSON.stringify(checklist),
        now(),
        taskId,
      );
      return json(checklist, 201);
    }
    if (route.startsWith("invoices/") && route.endsWith("/payments")) {
      const invoiceId = route.split("/")[1];
      const invoice = db
        .prepare("SELECT amount FROM invoices WHERE id=?")
        .get(invoiceId) as { amount: number } | undefined;
      if (!invoice) return fail("청구 항목을 찾을 수 없습니다.", 404);
      const amount = Number(body.amount);
      if (!Number.isSafeInteger(amount) || amount < 1)
        return fail("입금액은 1원 이상의 정수여야 합니다.");
      if (!validDate(body.paid_at) || String(body.memo || "").length > 1000)
        return fail("입금일 또는 메모 형식이 올바르지 않습니다.");
      const paid = (
        db
          .prepare(
            "SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE invoice_id=?",
          )
          .get(invoiceId) as { total: number }
      ).total;
      if (paid + amount > invoice.amount)
        return fail("누적 입금액이 청구 금액을 넘을 수 없습니다.");
      const paymentId = id();
      db.prepare(
        "INSERT INTO payments(id,invoice_id,amount,paid_at,memo,created_at) VALUES(?,?,?,?,?,?)",
      ).run(
        paymentId,
        invoiceId,
        amount,
        body.paid_at || new Date().toISOString().slice(0, 10),
        String(body.memo || ""),
        now(),
      );
      audit("payment.created", { invoiceId, amount });
      return json({ id: paymentId }, 201);
    }
    if (route.startsWith("projects/") && route.endsWith("/invoices")) {
      const projectId = route.split("/")[1];
      const project = db.prepare("SELECT kind FROM projects WHERE id=?").get(projectId) as { kind: string } | undefined;
      if (!project)
        return fail("프로젝트를 찾을 수 없습니다.", 404);
      if (project.kind === "회사") return fail("회사 업무에는 입금 항목을 만들 수 없습니다.");
      const title = String(body.title || "").trim(),
        amount = Number(body.amount);
      if (
        !title ||
        title.length > 100 ||
        !Number.isSafeInteger(amount) ||
        amount < 1 ||
        !validDate(body.due_date) ||
        String(body.memo || "").length > 1000
      )
        return fail("청구 항목명과 1원 이상의 청구액을 입력하세요.");
      const invoiceId = id();
      db.prepare(
        "INSERT INTO invoices(id,project_id,title,amount,due_date,memo,created_at) VALUES(?,?,?,?,?,?,?)",
      ).run(
        invoiceId,
        projectId,
        title,
        amount,
        body.due_date || null,
        String(body.memo || ""),
        now(),
      );
      audit("invoice.created", { projectId, amount });
      return json({ id: invoiceId }, 201);
    }
    if (route === "settings/connect-telegram") {
      if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_BOT_USERNAME)
        return fail(
          "서버의 TELEGRAM_BOT_TOKEN과 TELEGRAM_BOT_USERNAME 설정이 필요합니다.",
          503,
        );
      const code = randomBytes(18).toString("base64url");
      setSetting("telegram_connect_hash", hash(code));
      setSetting(
        "telegram_connect_expires",
        new Date(Date.now() + 10 * 60_000).toISOString(),
      );
      return json({
        code,
        url: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${code}`,
        expires_in_seconds: 600,
      });
    }
    if (route === "settings/recovery") {
      const codes = Array.from(
        { length: 10 },
        () =>
          randomBytes(12)
            .toString("hex")
            .toUpperCase()
            .match(/.{1,4}/g)
            ?.join("-") || "",
      );
      const insert = db.prepare(
        "INSERT INTO recovery_codes(code_hash,created_at) VALUES(?,?)",
      );
      db.transaction(() => {
        db.prepare("DELETE FROM recovery_codes").run();
        for (const code of codes)
          insert.run(hash(code.replaceAll("-", "")), now());
      })();
      audit("recovery_codes.regenerated", { count: codes.length });
      return json({ codes });
    }
    if (route === "settings/test-telegram") {
      const chatId = getSetting("telegram_chat_id");
      if (!chatId || !process.env.TELEGRAM_BOT_TOKEN)
        return fail("텔레그램 봇을 먼저 연결하세요.", 409);
      const result = await sendTelegram(
        chatId,
        "Joowon Workspace 테스트 알림입니다.",
      );
      return result.ok
        ? json({ ok: true })
        : fail("텔레그램 발송 실패. 봇 연결과 webhook 설정을 확인하세요.", 502);
    }
    if (route === "settings/retry-notifications") {
      const chatId = getSetting("telegram_chat_id");
      if (!chatId || !process.env.TELEGRAM_BOT_TOKEN)
        return fail("텔레그램 봇을 먼저 연결하세요.", 409);
      const failed = db
        .prepare(
          "SELECT id,dedupe_key,message FROM notification_log WHERE result='failed' ORDER BY sent_at LIMIT 10",
        )
        .all() as Array<{ id: string; dedupe_key: string; message: string }>;
      let sent = 0;
      for (const item of failed) {
        const claim = db
          .prepare(
            "UPDATE notification_log SET result='sending',sent_at=? WHERE id=? AND result='failed'",
          )
          .run(now(), item.id);
        if (!claim.changes) continue;
        const result = await sendTelegram(chatId, item.message);
        db.prepare(
          "UPDATE notification_log SET result=?,sent_at=? WHERE id=? AND result='sending'",
        ).run(result.ok ? "sent" : "failed", now(), item.id);
        if (result.ok) sent++;
      }
      audit("telegram.notifications.retried", {
        attempted: failed.length,
        sent,
      });
      return json({ attempted: failed.length, sent });
    }
    if (route === "settings") {
      const preferences = body.preferences as Record<string, unknown>;
      if (!preferences) return fail("설정 데이터가 없습니다.");
      setSetting(
        "preferences",
        JSON.stringify({
          notifications: !!preferences.notifications,
          overdueDays: Math.min(
            30,
            Math.max(1, Number(preferences.overdueDays) || 3),
          ),
          digestTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(
            String(preferences.digestTime),
          )
            ? preferences.digestTime
            : "09:00",
          deadlineAlerts: !!preferences.deadlineAlerts,
          paymentAlerts: !!preferences.paymentAlerts,
        }),
      );
      audit("settings.updated");
      return json({ ok: true });
    }
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "저장하지 못했습니다.",
    );
  }
  return fail("요청한 작업을 찾을 수 없습니다.", 404);
}

export async function PATCH(request: Request, context: Context) {
  if (!(await isAuthenticated())) return fail("로그인이 필요합니다.", 401);
  try {
    await assertOrigin(request);
  } catch {
    return fail("잘못된 요청 출처입니다.", 403);
  }
  const { path } = await context.params;
  const route = path.join("/");
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const timestamp = now();
  try {
    if (route.startsWith("meetings/")) {
      const meetingId = route.split("/")[1];
      const current = db.prepare("SELECT project_id FROM meetings WHERE id=?").get(meetingId) as { project_id: string } | undefined;
      if (!current) return fail("미팅을 찾을 수 없습니다.", 404);
      const meeting = meetingInput(body);
      if (meeting.projectId !== current.project_id && db.prepare("SELECT 1 FROM meeting_task_links WHERE meeting_id=? LIMIT 1").get(meetingId)) return fail("후속 작업이 연결된 미팅은 프로젝트를 변경할 수 없습니다.", 409);
      db.prepare("UPDATE meetings SET project_id=?,title=?,meeting_date=?,start_time=?,attendees=?,location=?,agenda=?,decisions=?,updated_at=? WHERE id=?").run(meeting.projectId, meeting.title, meeting.meetingDate, meeting.startTime, meeting.attendees, meeting.location, meeting.agenda, meeting.decisions, timestamp, meetingId);
      audit("meeting.updated", { meetingId });
      return json({ ok: true });
    }
    if (route.startsWith("quotes/")) {
      const quoteId = route.split("/")[1];
      const current = db.prepare("SELECT items,project_id FROM quotes WHERE id=?").get(quoteId) as { items: string; project_id: string } | undefined;
      if (!current) return fail("견적서를 찾을 수 없습니다.", 404);
      const quote = quoteInput(body);
      const imported = (db.prepare("SELECT COUNT(*) AS count FROM quote_task_links WHERE quote_id=?").get(quoteId) as { count: number }).count;
      if (imported && JSON.stringify(quote.items) !== current.items) return fail("작업으로 가져온 견적 항목은 수정할 수 없습니다.", 409);
      if (imported && quote.projectId !== current.project_id) return fail("작업으로 가져온 견적서는 프로젝트를 변경할 수 없습니다.", 409);
      db.prepare("UPDATE quotes SET project_id=?,title=?,sender=?,recipient=?,issue_date=?,valid_until=?,status=?,items=?,tax_amount=?,note=?,updated_at=? WHERE id=?").run(quote.projectId, quote.title, quote.sender, quote.recipient, quote.issueDate, quote.validUntil, quote.status, JSON.stringify(quote.items), quote.taxAmount, quote.note, timestamp, quoteId);
      audit("quote.updated", { quoteId });
      return json({ ok: true });
    }
    if (route.startsWith("projects/")) {
      const projectId = route.split("/")[1];
      const allowed = [
        "name",
        "client",
        "description",
        "contact",
        "email",
        "status",
        "start_date",
        "due_date",
        "contract_amount",
        "memo",
        "links",
      ] as const;
      if (body.contract_amount !== undefined) {
        const target = db.prepare("SELECT kind FROM projects WHERE id=?").get(projectId) as { kind: string } | undefined;
        if (target?.kind === "회사") return fail("회사 업무에는 계약 금액을 입력할 수 없습니다.");
      }
      const updates = allowed.filter((key) => key in body);
      if (!updates.length) return fail("수정할 항목이 없습니다.");
      const current = db
        .prepare("SELECT start_date,due_date FROM projects WHERE id=?")
        .get(projectId) as
        { start_date: string | null; due_date: string | null } | undefined;
      if (!current) return fail("프로젝트를 찾을 수 없습니다.", 404);
      if (
        body.name !== undefined &&
        (!String(body.name).trim() || String(body.name).trim().length > 100)
      )
        return fail("프로젝트명은 1~100자로 입력하세요.");
      if (
        body.client !== undefined &&
        (!String(body.client).trim() || String(body.client).trim().length > 80)
      )
        return fail("고객명은 1~80자로 입력하세요.");
      if (
        (body.start_date !== undefined && !validDate(body.start_date)) ||
        (body.due_date !== undefined && !validDate(body.due_date))
      )
        return fail("프로젝트 날짜 형식이 올바르지 않습니다.");
      if (
        body.description !== undefined &&
        String(body.description).length > 10000
      )
        return fail("프로젝트 설명은 10,000자 이내로 입력하세요.");
      if (body.memo !== undefined && String(body.memo).length > 20000)
        return fail("프로젝트 메모는 20,000자 이내로 입력하세요.");
      if (body.links !== undefined && !validLinks(body.links))
        return fail("프로젝트 링크 형식이 올바르지 않습니다.");
      if (
        body.status !== undefined &&
        !["준비 중", "진행 중", "보류", "완료", "취소"].includes(
          String(body.status),
        )
      )
        return fail("프로젝트 상태가 올바르지 않습니다.");
      const startDate =
        body.start_date === undefined
          ? current.start_date
          : String(body.start_date || "") || null;
      const dueDate =
        body.due_date === undefined
          ? current.due_date
          : String(body.due_date || "") || null;
      if (startDate && dueDate && dueDate < startDate)
        return fail("마감일은 시작일보다 빠를 수 없습니다.");
      if (
        body.contract_amount !== undefined &&
        body.contract_amount !== "" &&
        (!Number.isSafeInteger(Number(body.contract_amount)) ||
          Number(body.contract_amount) < 0)
      )
        return fail("계약 금액은 0원 이상의 정수여야 합니다.");
      for (const key of updates) {
        const value =
          key === "links"
            ? JSON.stringify(body[key])
            : key === "contract_amount"
              ? body[key] === ""
                ? null
                : (body[key] ?? null)
              : (body[key] ?? null);
        db.prepare(`UPDATE projects SET ${key}=?,updated_at=? WHERE id=?`).run(
          value,
          timestamp,
          projectId,
        );
      }
      audit("project.updated", { projectId, fields: updates });
      return json({ ok: true });
    }
    if (route.startsWith("tasks/") && route.endsWith("/checklist")) {
      const taskId = route.split("/")[1];
      const task = db
        .prepare("SELECT checklist FROM tasks WHERE id=?")
        .get(taskId) as { checklist: string } | undefined;
      if (!task) return fail("작업을 찾을 수 없습니다.", 404);
      const checklist = JSON.parse(task.checklist) as Array<{
        id: string;
        text: string;
        done: boolean;
      }>;
      const item = checklist.find((entry) => entry.id === body.id);
      if (!item) return fail("체크 항목을 찾을 수 없습니다.", 404);
      if (body.action === "toggle") item.done = !item.done;
      else if (body.action === "rename") {
        const text = String(body.text || "").trim();
        if (!text || text.length > 200)
          return fail("체크 항목은 1~200자로 입력하세요.");
        item.text = text;
      } else if (body.action === "delete")
        checklist.splice(checklist.indexOf(item), 1);
      else return fail("알 수 없는 체크 항목 동작입니다.");
      db.prepare("UPDATE tasks SET checklist=?,updated_at=? WHERE id=?").run(
        JSON.stringify(checklist),
        timestamp,
        taskId,
      );
      return json(checklist);
    }
    if (route.startsWith("tasks/")) {
      const taskId = route.split("/")[1];
      const old = db
        .prepare("SELECT status FROM tasks WHERE id=?")
        .get(taskId) as { status: string } | undefined;
      if (!old) return fail("작업을 찾을 수 없습니다.", 404);
      const allowed = [
        "title",
        "description",
        "status",
        "priority",
        "due_date",
        "position",
        "checklist",
        "links",
        "archived",
      ] as const;
      const updates = allowed.filter((key) => key in body);
      if (!updates.length) return fail("수정할 항목이 없습니다.");
      if (
        body.title !== undefined &&
        (!String(body.title).trim() || String(body.title).trim().length > 200)
      )
        return fail("작업 제목은 1~200자로 입력하세요.");
      if (
        body.description !== undefined &&
        String(body.description).length > 10000
      )
        return fail("작업 설명은 10,000자 이내로 입력하세요.");
      if (body.due_date !== undefined && !validDate(body.due_date))
        return fail("마감일 형식이 올바르지 않습니다.");
      if (
        body.position !== undefined &&
        (typeof body.position !== "number" ||
          !Number.isInteger(body.position) ||
          body.position < 0)
      )
        return fail("작업 순서가 올바르지 않습니다.");
      if (body.archived !== undefined && typeof body.archived !== "boolean")
        return fail("보관 상태가 올바르지 않습니다.");
      if (body.links !== undefined && !validLinks(body.links))
        return fail("작업 링크 형식이 올바르지 않습니다.");
      if (
        body.checklist !== undefined &&
        (!Array.isArray(body.checklist) ||
          body.checklist.some(
            (item) =>
              !item ||
              typeof item.id !== "string" ||
              typeof item.text !== "string" ||
              item.text.trim().length > 200 ||
              typeof item.done !== "boolean",
          ))
      )
        return fail("체크리스트 형식이 올바르지 않습니다.");
      if (
        body.status !== undefined &&
        !["할 일", "진행 중", "확인 대기", "완료"].includes(String(body.status))
      )
        return fail("작업 상태가 올바르지 않습니다.");
      if (
        body.priority !== undefined &&
        !["낮음", "보통", "높음"].includes(String(body.priority))
      )
        return fail("우선순위가 올바르지 않습니다.");
      const assignments = updates.map((key) => `${key}=?`);
      const values = updates.map((key) =>
        key === "checklist" || key === "links"
          ? JSON.stringify(body[key])
          : key === "archived"
            ? body[key]
              ? 1
              : 0
            : (body[key] ?? null),
      );
      if (body.status === "확인 대기" && old.status !== "확인 대기") {
        assignments.push("waiting_since=?");
        values.push(timestamp);
      }
      if (
        body.status &&
        body.status !== "확인 대기" &&
        old.status === "확인 대기"
      ) {
        assignments.push("waiting_since=NULL");
      }
      if (body.status === "완료" && old.status !== "완료") {
        assignments.push("completed_at=?");
        values.push(timestamp);
      }
      if (body.status && body.status !== "완료" && old.status === "완료")
        assignments.push("completed_at=NULL");
      assignments.push("updated_at=?");
      values.push(timestamp, taskId);
      db.prepare(`UPDATE tasks SET ${assignments.join(",")} WHERE id=?`).run(
        ...values,
      );
      return json({ ok: true });
    }
    if (route.startsWith("invoices/")) {
      const invoiceId = route.split("/")[1];
      const row = db
        .prepare("SELECT amount FROM invoices WHERE id=?")
        .get(invoiceId) as { amount: number } | undefined;
      if (!row) return fail("청구 항목을 찾을 수 없습니다.", 404);
      const paid = (
        db
          .prepare(
            "SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE invoice_id=?",
          )
          .get(invoiceId) as { total: number }
      ).total;
      if (
        body.amount !== undefined &&
        (!Number.isSafeInteger(Number(body.amount)) ||
          Number(body.amount) < paid ||
          Number(body.amount) < 1)
      )
        return fail("청구액은 누적 입금액 이상이어야 합니다.");
      const fields = ["title", "amount", "due_date", "memo"].filter(
        (key) => key in body,
      );
      if (!fields.length) return fail("수정할 항목이 없습니다.");
      if (
        body.title !== undefined &&
        (!String(body.title).trim() || String(body.title).trim().length > 100)
      )
        return fail("청구 항목명은 1~100자로 입력하세요.");
      if (body.due_date !== undefined && !validDate(body.due_date))
        return fail("입금 예정일 형식이 올바르지 않습니다.");
      if (body.memo !== undefined && String(body.memo).length > 1000)
        return fail("메모는 1,000자 이내로 입력하세요.");
      for (const field of fields)
        db.prepare(`UPDATE invoices SET ${field}=? WHERE id=?`).run(
          body[field] ?? null,
          invoiceId,
        );
      if (fields.includes("amount"))
        audit("invoice.amount.updated", {
          invoiceId,
          before: row.amount,
          after: body.amount,
          paid,
        });
      return json({ ok: true });
    }
    if (route.startsWith("payments/")) {
      const paymentId = route.split("/")[1];
      const row = db
        .prepare("SELECT invoice_id,amount FROM payments WHERE id=?")
        .get(paymentId) as { invoice_id: string; amount: number } | undefined;
      if (!row) return fail("입금 내역을 찾을 수 없습니다.", 404);
      if (
        body.amount !== undefined &&
        (!Number.isSafeInteger(Number(body.amount)) || Number(body.amount) < 1)
      )
        return fail("입금액은 1원 이상의 정수여야 합니다.");
      if (body.amount !== undefined) {
        const others = (
          db
            .prepare(
              "SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE invoice_id=? AND id!=?",
            )
            .get(row.invoice_id, paymentId) as { total: number }
        ).total;
        const invoice = db
          .prepare("SELECT amount FROM invoices WHERE id=?")
          .get(row.invoice_id) as { amount: number };
        if (others + Number(body.amount) > invoice.amount)
          return fail("누적 입금액이 청구 금액을 넘을 수 없습니다.");
      }
      if (body.paid_at !== undefined && !validDate(body.paid_at))
        return fail("입금일 형식이 올바르지 않습니다.");
      if (body.memo !== undefined && String(body.memo).length > 1000)
        return fail("메모는 1,000자 이내로 입력하세요.");
      for (const field of ["amount", "paid_at", "memo"])
        if (field in body)
          db.prepare(`UPDATE payments SET ${field}=? WHERE id=?`).run(
            body[field],
            paymentId,
          );
      audit("payment.updated", {
        paymentId,
        before: row.amount,
        after: body.amount ?? row.amount,
      });
      return json({ ok: true });
    }
    if (route === "settings/passkeys") {
      const credentialId = String(body.id || "");
      if (!credentialId) return fail("패스키를 지정하세요.");
      const result = db.transaction(() => {
        const credential = db
          .prepare("SELECT id FROM credentials WHERE id=?")
          .get(credentialId);
        if (!credential) return "missing";
        const count = (
          db.prepare("SELECT COUNT(*) AS count FROM credentials").get() as {
            count: number;
          }
        ).count;
        if (count <= 1) return "last";
        db.prepare("DELETE FROM credentials WHERE id=?").run(credentialId);
        return "deleted";
      })();
      if (result === "missing") return fail("패스키를 찾을 수 없습니다.", 404);
      if (result === "last")
        return fail("마지막 패스키는 삭제할 수 없습니다.", 409);
      audit("passkey.deleted", { credentialId });
      return json({ ok: true });
    }
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "수정하지 못했습니다.",
    );
  }
  return fail("요청한 항목을 찾을 수 없습니다.", 404);
}

export async function DELETE(request: Request, context: Context) {
  if (!(await isAuthenticated())) return fail("로그인이 필요합니다.", 401);
  try {
    await assertOrigin(request);
  } catch {
    return fail("잘못된 요청 출처입니다.", 403);
  }
  const { path } = await context.params;
  const route = path.join("/");
  const url = new URL(request.url);
  if (route.startsWith("invoices/")) {
    const invoiceId = route.split("/")[1];
    const payments = (
      db
        .prepare("SELECT COUNT(*) AS count FROM payments WHERE invoice_id=?")
        .get(invoiceId) as { count: number }
    ).count;
    if (payments) return fail("입금 내역을 먼저 정정하거나 삭제하세요.", 409);
    db.prepare("DELETE FROM invoices WHERE id=?").run(invoiceId);
    audit("invoice.deleted", { invoiceId });
    return json({ ok: true });
  }
  if (route.startsWith("payments/")) {
    const paymentId = route.split("/")[1];
    const row = db
      .prepare("SELECT amount FROM payments WHERE id=?")
      .get(paymentId) as { amount: number } | undefined;
    if (!row) return fail("입금 내역을 찾을 수 없습니다.", 404);
    db.prepare("DELETE FROM payments WHERE id=?").run(paymentId);
    audit("payment.deleted", { paymentId, amount: row.amount });
    return json({ ok: true });
  }
  if (route.startsWith("tasks/")) {
    const taskId = route.split("/")[1];
    db.prepare("UPDATE tasks SET archived=1,updated_at=? WHERE id=?").run(
      now(),
      taskId,
    );
    return json({ ok: true });
  }
  if (route === "settings/telegram") {
    setSetting("telegram_chat_id", "");
    audit("telegram.disconnected");
    return json({ ok: true });
  }
  if (route === "settings/recovery") {
    db.prepare("DELETE FROM recovery_codes").run();
    audit("recovery_codes.revoked");
    return json({ ok: true });
  }
  if (route === "settings/sessions") {
    const token = (await cookies()).get("admin_session")?.value;
    db.prepare("DELETE FROM sessions WHERE token_hash!=?").run(
      token ? hash(token) : "",
    );
    return json({ ok: true });
  }
  const ignored = url.searchParams;
  void ignored;
  return fail("요청한 항목을 찾을 수 없습니다.", 404);
}

async function sendTelegram(chatId: string, message: string) {
  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        disable_web_page_preview: true,
      }),
    },
  );
  return { ok: response.ok };
}
