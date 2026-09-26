import "server-only";
import { db } from "@/lib/admin/db";
import { audit } from "@/lib/admin/auth";
import { HttpError, json } from "@/lib/admin/http";
import { addDays, seoulDate, validDate } from "@/lib/admin/validation";
import { type Route, type Row, now, newId } from "./common";

export async function saveTrash(entity: "invoice" | "payment", row: Row) {
  await db.prepare("INSERT INTO admin_trash(id,entity,title,payload,deleted_at) VALUES(?,?,?,?,?)")
    .run(newId(), entity, String(row.title || `입금 ${row.amount}원`), JSON.stringify(row), now());
}

const exportTables = ["projects", "tasks", "invoices", "payments", "quotes", "quote_task_links", "meetings", "meeting_task_links", "admin_trash"] as const;

export const productivityRoutes: Route[] = [
  {
    method: "GET", path: "search",
    async handler({ url }) {
      const query = (url.searchParams.get("q") || "").trim();
      if (!query) return json([]);
      if (query.length > 200) throw new HttpError(400, "검색어는 200자 이내로 입력하세요.");
      const q = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
      const rows = await db.prepare(`
        SELECT 'project' AS type,id,id AS project_id,name AS title,description || ' ' || memo AS excerpt FROM projects
        WHERE name ILIKE ? OR client ILIKE ? OR description ILIKE ? OR memo ILIKE ?
        UNION ALL
        SELECT 'task',id,project_id,title,description FROM tasks WHERE archived=0 AND (title ILIKE ? OR description ILIKE ?)
        UNION ALL
        SELECT 'meeting',id,project_id,title,agenda || ' ' || decisions FROM meetings WHERE title ILIKE ? OR agenda ILIKE ? OR decisions ILIKE ?
        UNION ALL
        SELECT 'quote',id,project_id,title,note FROM quotes WHERE title ILIKE ? OR note ILIKE ?
        ORDER BY type,title LIMIT 100
      `).all(...Array(11).fill(q));
      return json(rows.map((row) => ({ ...row, excerpt: String(row.excerpt).slice(0, 180) })));
    },
  },
  {
    method: "GET", path: "weekly-report",
    async handler({ url }) {
      const start = url.searchParams.get("start") || seoulDate();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !validDate(start)) throw new HttpError(400, "시작일을 확인하세요.");
      const end = addDays(start, 6);
      const after = addDays(start, 7);
      const fromTime = new Date(start + "T00:00:00+09:00").toISOString();
      const toTime = new Date(after + "T00:00:00+09:00").toISOString();
      const tasks = await db.prepare("SELECT t.id,t.project_id,t.title,t.status,p.name AS project_name,p.kind FROM tasks t JOIN projects p ON p.id=t.project_id WHERE t.archived=0 AND t.status='완료' AND t.completed_at>=? AND t.completed_at<? ORDER BY p.name,t.completed_at").all(fromTime, toTime);
      const meetings = await db.prepare("SELECT m.id,m.project_id,m.title,m.decisions,p.name AS project_name,p.kind FROM meetings m JOIN projects p ON p.id=m.project_id WHERE m.meeting_date BETWEEN ? AND ? ORDER BY m.meeting_date").all(start, end);
      const projects = await db.prepare("SELECT id,name,kind,next_action,waiting_reason FROM projects WHERE status IN ('준비 중','진행 중','보류') ORDER BY name").all();
      return json({ start, end, tasks, meetings, projects });
    },
  },
  {
    method: "GET", path: "trash",
    async handler() {
      const tasks = await db.prepare("SELECT t.id,'task' AS entity,t.title,t.updated_at AS deleted_at,p.name AS project_name FROM tasks t JOIN projects p ON p.id=t.project_id WHERE t.archived=1").all();
      const rows = await db.prepare("SELECT id,entity,title,deleted_at FROM admin_trash").all();
      return json([...tasks, ...rows].sort((a, b) => String(b.deleted_at).localeCompare(String(a.deleted_at))));
    },
  },
  {
    method: "POST", path: "trash/:id/restore",
    async handler({ params, body }) {
      await db.transaction(async () => {
        if (body.entity === "task") {
          const result = await db.prepare("UPDATE tasks SET archived=0,updated_at=? WHERE id=? AND archived=1").run(now(), params.id);
          if (!result.changes) throw new HttpError(404, "복구할 작업이 없습니다.");
          return;
        }
        const entry = await db.prepare("SELECT entity,payload FROM admin_trash WHERE id=? FOR UPDATE").get(params.id);
        if (!entry) throw new HttpError(404, "복구할 항목이 없습니다.");
        const row = JSON.parse(String(entry.payload)) as Row;
        if (entry.entity === "invoice") {
          if (!await db.prepare("SELECT id FROM projects WHERE id=?").get(row.project_id)) throw new HttpError(409, "원본 프로젝트가 없습니다.");
          await db.prepare("INSERT INTO invoices(id,project_id,title,amount,due_date,memo,created_at) VALUES(?,?,?,?,?,?,?)").run(row.id,row.project_id,row.title,row.amount,row.due_date,row.memo,row.created_at);
        } else if (entry.entity === "payment") {
          const invoice = await db.prepare("SELECT amount FROM invoices WHERE id=? FOR UPDATE").get(row.invoice_id);
          if (!invoice) throw new HttpError(409, "청구 항목부터 복구하세요.");
          const paid = await db.prepare("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE invoice_id=?").get(row.invoice_id);
          if (Number(paid?.total) + Number(row.amount) > Number(invoice.amount)) throw new HttpError(409, "복구하면 청구 금액을 초과합니다. 현재 입금 내역을 확인하세요.");
          await db.prepare("INSERT INTO payments(id,invoice_id,amount,paid_at,memo,created_at) VALUES(?,?,?,?,?,?)").run(row.id,row.invoice_id,row.amount,row.paid_at,row.memo,row.created_at);
        }
        await db.prepare("DELETE FROM admin_trash WHERE id=?").run(params.id);
      });
      await audit("trash.restored", { id: params.id, entity: body.entity });
      return json({ ok: true });
    },
  },
  {
    method: "GET", path: "export",
    async handler() {
      const data = await db.transaction(async () => {
        await db.prepare("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY").run();
        const tables: Record<string, Row[]> = {};
        for (const table of exportTables) tables[table] = await db.prepare(`SELECT * FROM ${table}`).all();
        return tables;
      });
      return new Response(JSON.stringify({ version: 1, exported_at: now(), tables: data }, null, 2), {
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="workspace-${seoulDate()}.json"` },
      });
    },
  },
];
