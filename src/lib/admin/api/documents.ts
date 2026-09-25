import "server-only";
import { audit } from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";
import { HttpError, json } from "@/lib/admin/http";
import { isInternalProjectKind } from "@/lib/admin/project-kinds";
import { QUOTE_STATUSES, isOneOf, validDate, validTime } from "@/lib/admin/validation";
import {
  CONFLICT_MESSAGE,
  type Body,
  type Route,
  type Row,
  assertFresh,
  dateOrNull,
  expectedVersion,
  newId,
  now,
  parse,
} from "./common";
import { insertTask } from "./tasks";

async function quoteInput(body: Body) {
  const projectId = String(body.project_id || "");
  const title = String(body.title || "").trim();
  const sender = String(body.sender || "").trim();
  const recipient = String(body.recipient || "").trim();
  const issueDate = String(body.issue_date || "");
  const validUntil = dateOrNull(body.valid_until);
  const status = String(body.status || "초안");
  const note = String(body.note || "").trim();
  const taxAmount = Number(body.tax_amount ?? 0);
  const items = body.items;
  const project = await db.prepare("SELECT kind FROM projects WHERE id=?").get(projectId) as
    | { kind: string }
    | undefined;
  if (!project) throw new HttpError(400, "프로젝트를 선택하세요.");
  if (isInternalProjectKind(project.kind)) throw new HttpError(400, "회사 업무에는 견적서를 만들 수 없습니다.");
  if (!title || title.length > 120 || sender.length > 120 || !recipient || recipient.length > 120)
    throw new HttpError(400, "제목과 받는 사람을 입력하세요. 각 항목은 120자 이내여야 합니다.");
  if (!issueDate || !validDate(issueDate) || !validDate(validUntil) || (validUntil && validUntil < issueDate))
    throw new HttpError(400, "발행일과 유효기간을 확인하세요.");
  if (!isOneOf(QUOTE_STATUSES, status)) throw new HttpError(400, "견적 상태가 올바르지 않습니다.");
  if (note.length > 5000) throw new HttpError(400, "안내 문구는 5,000자 이내여야 합니다.");
  if (!Array.isArray(items) || !items.length || items.length > 50)
    throw new HttpError(400, "견적 항목을 1~50개 입력하세요.");
  let subtotal = 0;
  const cleanItems = items.map((item) => {
    if (!item || typeof item !== "object") throw new HttpError(400, "견적 항목 형식이 올바르지 않습니다.");
    const entry = item as Record<string, unknown>;
    const name = String(entry.name || "").trim();
    const quantity = Number(entry.quantity);
    const unitPrice = Number(entry.unit_price);
    if (
      !name ||
      name.length > 200 ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 100000 ||
      !Number.isSafeInteger(unitPrice) ||
      unitPrice < 0 ||
      unitPrice > 100000000000
    )
      throw new HttpError(400, "항목명·수량·단가를 확인하세요.");
    subtotal += quantity * unitPrice;
    if (!Number.isSafeInteger(subtotal)) throw new HttpError(400, "견적 금액이 너무 큽니다.");
    return { name, quantity, unit_price: unitPrice };
  });
  if (!Number.isSafeInteger(taxAmount) || taxAmount < 0 || !Number.isSafeInteger(subtotal + taxAmount))
    throw new HttpError(400, "부가세 금액을 확인하세요.");
  return { projectId, title, sender, recipient, issueDate, validUntil, status, note, taxAmount, items: cleanItems };
}

async function meetingInput(body: Body) {
  const projectId = String(body.project_id || "");
  const title = String(body.title || "").trim();
  const meetingDate = String(body.meeting_date || "");
  const startTime = String(body.start_time || "");
  const attendees = String(body.attendees || "").trim();
  const location = String(body.location || "").trim();
  const agenda = String(body.agenda || "").trim();
  const decisions = String(body.decisions || "").trim();
  if (!(await db.prepare("SELECT 1 FROM projects WHERE id=?").get(projectId)))
    throw new HttpError(400, "프로젝트를 선택하세요.");
  if (!title || title.length > 160) throw new HttpError(400, "미팅 제목은 1~160자로 입력하세요.");
  if (!meetingDate || !validDate(meetingDate)) throw new HttpError(400, "미팅 날짜를 확인하세요.");
  if (!validTime(startTime)) throw new HttpError(400, "미팅 시간을 확인하세요.");
  if (attendees.length > 500 || location.length > 1000 || agenda.length > 10000 || decisions.length > 10000)
    throw new HttpError(400, "미팅 내용이 너무 깁니다.");
  return { projectId, title, meetingDate, startTime, attendees, location, agenda, decisions };
}

export const documentRoutes: Route[] = [
  {
    method: "GET",
    path: "quotes",
    async handler({ url }) {
      const projectId = url.searchParams.get("project");
      const rows = await db
        .prepare(
          `SELECT q.*, p.name AS project_name, (SELECT COUNT(*) FROM quote_task_links l WHERE l.quote_id=q.id) AS imported_item_count FROM quotes q JOIN projects p ON p.id=q.project_id ${projectId ? "WHERE q.project_id=?" : ""} ORDER BY q.issue_date DESC, q.created_at DESC`,
        )
        .all(...(projectId ? [projectId] : [])) as Row[];
      return json(rows.map((row) => ({ ...row, items: parse(row.items) })));
    },
  },
  {
    method: "POST",
    path: "quotes",
    async handler({ body }) {
      const quote = await quoteInput(body);
      const quoteId = newId();
      const number = `Q-${quote.issueDate.replaceAll("-", "")}-${quoteId.slice(0, 6).toUpperCase()}`;
      const timestamp = now();
      await db.prepare(
        "INSERT INTO quotes(id,project_id,number,title,sender,recipient,issue_date,valid_until,status,items,tax_amount,note,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      ).run(quoteId, quote.projectId, number, quote.title, quote.sender, quote.recipient, quote.issueDate, quote.validUntil, quote.status, JSON.stringify(quote.items), quote.taxAmount, quote.note, timestamp, timestamp);
      await audit("quote.created", { quoteId, projectId: quote.projectId });
      return json({ id: quoteId }, 201);
    },
  },
  {
    method: "PATCH",
    path: "quotes/:id",
    async handler({ params, body }) {
      const current = await db.prepare("SELECT items,project_id,updated_at FROM quotes WHERE id=?").get(params.id) as
        | { items: string; project_id: string; updated_at: string }
        | undefined;
      if (!current) throw new HttpError(404, "견적서를 찾을 수 없습니다.");
      const expected = expectedVersion(body);
      assertFresh(current.updated_at, expected);
      const quote = await quoteInput(body);
      const imported = await db.prepare("SELECT COUNT(*) AS count FROM quote_task_links WHERE quote_id=?").get(params.id) as {
        count: number;
      };
      if (imported.count && JSON.stringify(quote.items) !== current.items)
        throw new HttpError(409, "작업으로 가져온 견적 항목은 수정할 수 없습니다.");
      if (imported.count && quote.projectId !== current.project_id)
        throw new HttpError(409, "작업으로 가져온 견적서는 프로젝트를 변경할 수 없습니다.");
      const timestamp = now();
      const result = await db
        .prepare(
          `UPDATE quotes SET project_id=?,title=?,sender=?,recipient=?,issue_date=?,valid_until=?,status=?,items=?,tax_amount=?,note=?,updated_at=? WHERE id=?${expected ? " AND updated_at=?" : ""}`,
        )
        .run(quote.projectId, quote.title, quote.sender, quote.recipient, quote.issueDate, quote.validUntil, quote.status, JSON.stringify(quote.items), quote.taxAmount, quote.note, timestamp, params.id, ...(expected ? [expected] : []));
      if (!result.changes) throw new HttpError(409, CONFLICT_MESSAGE, "conflict");
      await audit("quote.updated", { quoteId: params.id });
      return json({ ok: true, updated_at: timestamp });
    },
  },
  {
    method: "POST",
    path: "quotes/:id/import-tasks",
    async handler({ params }) {
      const quote = await db.prepare("SELECT id,project_id,number,status,items FROM quotes WHERE id=?").get(params.id) as
        | { id: string; project_id: string; number: string; status: string; items: string }
        | undefined;
      if (!quote) throw new HttpError(404, "견적서를 찾을 수 없습니다.");
      if (quote.status !== "수락") throw new HttpError(400, "수락한 견적서만 작업으로 가져올 수 있습니다.");
      const items = parse(quote.items) as Array<{ name: string }>;
      const created = await db.transaction(async () => {
        // 견적서 행을 잠가 동시에 두 번 가져오기를 눌러도 작업이 중복 생성되지 않게 한다.
        await db.prepare("SELECT id FROM quotes WHERE id=? FOR UPDATE").get(params.id);
        let count = 0;
        for (const [index, item] of items.entries()) {
          if (await db.prepare("SELECT 1 FROM quote_task_links WHERE quote_id=? AND item_index=?").get(params.id, index))
            continue;
          const taskId = await insertTask({
            projectId: quote.project_id,
            title: item.name.slice(0, 200),
            description: `견적서 ${quote.number}의 ${index + 1}번 항목`,
          });
          await db.prepare("INSERT INTO quote_task_links(quote_id,item_index,task_id) VALUES(?,?,?)").run(params.id, index, taskId);
          count++;
        }
        return count;
      });
      await audit("quote.tasks.imported", { quoteId: params.id, created });
      return json({ created });
    },
  },
  {
    method: "GET",
    path: "meetings",
    async handler({ url }) {
      const projectId = url.searchParams.get("project");
      const [rows, linked] = await Promise.all([
        db
          .prepare(
            `SELECT m.*, p.name AS project_name, p.kind AS project_kind FROM meetings m JOIN projects p ON p.id=m.project_id ${projectId ? "WHERE m.project_id=?" : ""} ORDER BY m.meeting_date DESC, m.start_time DESC, m.created_at DESC`,
          )
          .all(...(projectId ? [projectId] : [])) as Promise<Row[]>,
        db
          .prepare(
            `SELECT l.meeting_id,t.id,t.title,t.status,t.due_date,t.archived FROM meeting_task_links l JOIN tasks t ON t.id=l.task_id ${projectId ? "JOIN meetings m ON m.id=l.meeting_id WHERE m.project_id=?" : ""}`,
          )
          .all(...(projectId ? [projectId] : [])) as Promise<Row[]>,
      ]);
      return json(rows.map((row) => ({ ...row, tasks: linked.filter((task) => task.meeting_id === row.id) })));
    },
  },
  {
    method: "POST",
    path: "meetings",
    async handler({ body }) {
      const meeting = await meetingInput(body);
      const meetingId = newId();
      const timestamp = now();
      await db.prepare(
        "INSERT INTO meetings(id,project_id,title,meeting_date,start_time,attendees,location,agenda,decisions,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
      ).run(meetingId, meeting.projectId, meeting.title, meeting.meetingDate, meeting.startTime, meeting.attendees, meeting.location, meeting.agenda, meeting.decisions, timestamp, timestamp);
      await audit("meeting.created", { meetingId, projectId: meeting.projectId });
      return json({ id: meetingId }, 201);
    },
  },
  {
    method: "PATCH",
    path: "meetings/:id",
    async handler({ params, body }) {
      const current = await db.prepare("SELECT project_id,updated_at FROM meetings WHERE id=?").get(params.id) as
        | { project_id: string; updated_at: string }
        | undefined;
      if (!current) throw new HttpError(404, "미팅을 찾을 수 없습니다.");
      const expected = expectedVersion(body);
      assertFresh(current.updated_at, expected);
      const meeting = await meetingInput(body);
      if (
        meeting.projectId !== current.project_id &&
        (await db.prepare("SELECT 1 FROM meeting_task_links WHERE meeting_id=? LIMIT 1").get(params.id))
      )
        throw new HttpError(409, "후속 작업이 연결된 미팅은 프로젝트를 변경할 수 없습니다.");
      const timestamp = now();
      const result = await db
        .prepare(
          `UPDATE meetings SET project_id=?,title=?,meeting_date=?,start_time=?,attendees=?,location=?,agenda=?,decisions=?,updated_at=? WHERE id=?${expected ? " AND updated_at=?" : ""}`,
        )
        .run(meeting.projectId, meeting.title, meeting.meetingDate, meeting.startTime, meeting.attendees, meeting.location, meeting.agenda, meeting.decisions, timestamp, params.id, ...(expected ? [expected] : []));
      if (!result.changes) throw new HttpError(409, CONFLICT_MESSAGE, "conflict");
      await audit("meeting.updated", { meetingId: params.id });
      return json({ ok: true, updated_at: timestamp });
    },
  },
  {
    method: "POST",
    path: "meetings/:id/tasks",
    async handler({ params, body }) {
      const meeting = await db.prepare("SELECT project_id FROM meetings WHERE id=?").get(params.id) as
        | { project_id: string }
        | undefined;
      if (!meeting) throw new HttpError(404, "미팅을 찾을 수 없습니다.");
      const title = String(body.title || "").trim();
      if (!title || title.length > 200 || !validDate(body.due_date))
        throw new HttpError(400, "후속 작업 제목과 마감일을 확인하세요.");
      const taskId = await db.transaction(async () => {
        const created = await insertTask({ projectId: meeting.project_id, title, dueDate: dateOrNull(body.due_date) });
        await db.prepare("INSERT INTO meeting_task_links(meeting_id,task_id) VALUES(?,?)").run(params.id, created);
        return created;
      });
      await audit("meeting.task.created", { meetingId: params.id, taskId });
      return json({ id: taskId }, 201);
    },
  },
];
