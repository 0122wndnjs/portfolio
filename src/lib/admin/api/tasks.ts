import "server-only";
import { db } from "@/lib/admin/db";
import { HttpError, json } from "@/lib/admin/http";
import { hasRelationCycle, type TaskRelation } from "@/lib/admin/task-relations";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  addDays,
  isOneOf,
  seoulDate,
  validChecklist,
  validDate,
  validLinks,
} from "@/lib/admin/validation";
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
  safeTask,
} from "./common";

type Checklist = Array<{ id: string; text: string; done: boolean }>;

const EDITABLE = [
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

function validateTaskFields(body: Body, { requireChecklistIds }: { requireChecklistIds: boolean }) {
  if (body.title !== undefined && (!String(body.title).trim() || String(body.title).trim().length > 200))
    throw new HttpError(400, "작업 제목(1~200자)을 입력하세요.");
  if (body.description !== undefined && String(body.description).length > 10000)
    throw new HttpError(400, "작업 설명은 10,000자 이내로 입력하세요.");
  if (body.due_date !== undefined && !validDate(body.due_date))
    throw new HttpError(400, "마감일 형식이 올바르지 않습니다.");
  if (body.status !== undefined && !isOneOf(TASK_STATUSES, body.status))
    throw new HttpError(400, "작업 상태가 올바르지 않습니다.");
  if (body.priority !== undefined && !isOneOf(TASK_PRIORITIES, body.priority))
    throw new HttpError(400, "우선순위가 올바르지 않습니다.");
  if (body.checklist !== undefined && !validChecklist(body.checklist, requireChecklistIds))
    throw new HttpError(400, "체크리스트 형식이 올바르지 않습니다.");
  if (body.links !== undefined && !validLinks(body.links))
    throw new HttpError(400, "작업 링크 형식이 올바르지 않습니다.");
}

/** 새 작업을 해당 상태 열의 맨 끝에 추가한다. 트랜잭션 안에서 호출. */
export async function insertTask(task: {
  projectId: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string | null;
  checklist?: unknown;
  links?: unknown;
}) {
  const status = task.status || "할 일";
  const timestamp = now();
  const taskId = newId();
  const position = await db
    .prepare("SELECT COALESCE(MAX(position)+1,0) AS count FROM tasks WHERE project_id=? AND status=? AND archived=0")
    .get(task.projectId, status) as { count: number };
  await db.prepare(
    "INSERT INTO tasks(id,project_id,title,description,status,priority,due_date,position,checklist,links,waiting_since,completed_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
  ).run(
    taskId,
    task.projectId,
    task.title,
    task.description || "",
    status,
    task.priority || "보통",
    task.dueDate ?? null,
    Number(position.count),
    JSON.stringify(task.checklist || []),
    JSON.stringify(task.links || []),
    status === "확인 대기" ? timestamp : null,
    status === "완료" ? timestamp : null,
    timestamp,
    timestamp,
  );
  return taskId;
}

async function lockChecklist(taskId: string) {
  const task = await db.prepare("SELECT checklist FROM tasks WHERE id=? FOR UPDATE").get(taskId) as
    | { checklist: string }
    | undefined;
  if (!task) throw new HttpError(404, "작업을 찾을 수 없습니다.");
  return JSON.parse(task.checklist) as Checklist;
}

async function saveChecklist(taskId: string, checklist: Checklist) {
  const timestamp = now();
  await db.prepare("UPDATE tasks SET checklist=?,updated_at=? WHERE id=?").run(JSON.stringify(checklist), timestamp, taskId);
  return timestamp;
}

export const taskRoutes: Route[] = [
  {
    method: "POST", path: "tasks/:id/children",
    async handler({ params, body }) {
      const title = String(body.title || "").trim();
      if (!title || title.length > 200) throw new HttpError(400, "하위 작업 제목은 1~200자로 입력하세요.");
      const id = await db.transaction(async () => {
        const parent = await db.prepare("SELECT project_id FROM tasks WHERE id=? AND archived=0 FOR UPDATE").get(params.id);
        if (!parent) throw new HttpError(404, "상위 작업을 찾을 수 없습니다.");
        const childId = await insertTask({ projectId: String(parent.project_id), title });
        await db.prepare("UPDATE tasks SET parent_id=? WHERE id=?").run(params.id, childId);
        return childId;
      });
      return json({ id }, 201);
    },
  },
  {
    method: "GET",
    path: "tasks/:id/relations",
    async handler({ params }) {
      const task = await db.prepare("SELECT project_id,parent_id,depends_on_id FROM tasks WHERE id=? AND archived=0").get(params.id);
      if (!task) throw new HttpError(404, "작업을 찾을 수 없습니다.");
      const options = await db.prepare("SELECT id,title,status,parent_id,depends_on_id,archived FROM tasks WHERE project_id=? ORDER BY created_at").all(task.project_id);
      return json({ ...task, options });
    },
  },
  {
    method: "PATCH",
    path: "tasks/:id/relations",
    async handler({ params, body }) {
      await db.transaction(async () => {
        const task = await db.prepare("SELECT project_id FROM tasks WHERE id=? AND archived=0").get(params.id);
        if (!task) throw new HttpError(404, "작업을 찾을 수 없습니다.");
        await db.prepare("SELECT id FROM projects WHERE id=? FOR UPDATE").get(task.project_id);
        const rows = await db.prepare("SELECT id,parent_id,depends_on_id,archived FROM tasks WHERE project_id=?").all(task.project_id) as (TaskRelation & { archived: number })[];
        const current = rows.find((row) => row.id === params.id)!;
        const links = { parent_id: current.parent_id, depends_on_id: current.depends_on_id };
        for (const field of ["parent_id", "depends_on_id"] as const) {
          if (!(field in body)) continue;
          const value = body[field];
          if (value !== null && typeof value !== "string") throw new HttpError(400, "작업 연결 형식이 올바르지 않습니다.");
          if (value && (!rows.some((row) => row.id === value && !row.archived) || hasRelationCycle(rows, params.id, value, field)))
            throw new HttpError(400, "같은 프로젝트의 작업을 선택하세요. 자신 또는 순환 관계로 연결할 수 없습니다.");
          links[field] = value || null;
        }
        await db.prepare("UPDATE tasks SET parent_id=?,depends_on_id=?,updated_at=? WHERE id=?").run(links.parent_id, links.depends_on_id, now(), params.id);
      });
      return json({ ok: true });
    },
  },
  {
    method: "GET",
    path: "tasks",
    async handler({ url }) {
      const status = url.searchParams.get("status") || "";
      const projectId = url.searchParams.get("project") || "";
      const priority = url.searchParams.get("priority") || "";
      const due = url.searchParams.get("due") || "";
      const includeClosed = url.searchParams.get("includeClosed") === "true";
      const where = ["t.archived=0"];
      const filters: unknown[] = [];
      if (status) {
        where.push("t.status=?");
        filters.push(status);
      } else where.push("t.status<>'완료'");
      if (!includeClosed) where.push("p.status IN ('준비 중','진행 중','보류')");
      if (projectId) {
        where.push("p.id=?");
        filters.push(projectId);
      }
      if (priority) {
        where.push("t.priority=?");
        filters.push(priority);
      }
      const today = seoulDate();
      if (due === "today") {
        where.push("t.due_date=?");
        filters.push(today);
      }
      if (due === "week") {
        where.push("t.due_date BETWEEN ? AND ?");
        filters.push(today, addDays(today, 7));
      }
      if (due === "overdue") {
        where.push("t.due_date < ?");
        filters.push(today);
      }
      if (due === "waiting") where.push("t.status='확인 대기'");
      if (due === "unscheduled") where.push("t.due_date IS NULL");
      const rows = await db
        .prepare(
          `SELECT t.*,p.name AS project_name,p.status AS project_status FROM tasks t JOIN projects p ON p.id=t.project_id WHERE ${where.join(" AND ")} ORDER BY CASE t.status WHEN '확인 대기' THEN 0 WHEN '진행 중' THEN 1 WHEN '할 일' THEN 2 ELSE 3 END,COALESCE(t.due_date,'9999-12-31'),t.position`,
        )
        .all(...filters) as Row[];
      return json(rows.map(safeTask));
    },
  },
  {
    method: "POST",
    path: "projects/:id/tasks",
    async handler({ params, body }) {
      if (!(await db.prepare("SELECT id FROM projects WHERE id=?").get(params.id)))
        throw new HttpError(404, "프로젝트를 찾을 수 없습니다.");
      const title = String(body.title || "").trim();
      if (!title) throw new HttpError(400, "작업 제목(1~200자)을 입력하세요.");
      validateTaskFields(body, { requireChecklistIds: false });
      const taskId = await db.transaction(() =>
        insertTask({
          projectId: params.id,
          title,
          description: String(body.description || ""),
          status: body.status ? String(body.status) : undefined,
          priority: body.priority ? String(body.priority) : undefined,
          dueDate: dateOrNull(body.due_date),
          checklist: body.checklist,
          links: body.links,
        }),
      );
      return json({ id: taskId }, 201);
    },
  },
  {
    method: "POST",
    path: "projects/:id/order",
    async handler({ params, body }) {
      const projectId = params.id;
      const taskId = String(body.taskId || "");
      const laneStatus = String(body.status || "");
      const beforeTaskId = typeof body.beforeTaskId === "string" ? body.beforeTaskId : "";
      if (!taskId || !isOneOf(TASK_STATUSES, laneStatus))
        throw new HttpError(400, "작업 이동 정보가 올바르지 않습니다.");
      await db.transaction(async () => {
        const task = await db
          .prepare("SELECT status,waiting_since,completed_at FROM tasks WHERE id=? AND project_id=? AND archived=0 FOR UPDATE")
          .get(taskId, projectId) as
          | { status: string; waiting_since: string | null; completed_at: string | null }
          | undefined;
        if (!task) throw new HttpError(404, "작업을 찾을 수 없습니다.");
        const lane = async (status: string) =>
          (
            await db
              .prepare(
                "SELECT id FROM tasks WHERE project_id=? AND status=? AND archived=0 AND id<>? ORDER BY position,created_at",
              )
              .all(projectId, status, taskId) as Array<{ id: string }>
          ).map((row) => row.id);
        const oldLane = await lane(task.status);
        const newLane = task.status === laneStatus ? oldLane : await lane(laneStatus);
        const insertion = beforeTaskId ? newLane.indexOf(beforeTaskId) : newLane.length;
        if (beforeTaskId && insertion < 0)
          throw new HttpError(409, "이동 대상 카드가 변경됐습니다. 새로고침 후 다시 시도하세요.", "conflict");
        newLane.splice(insertion, 0, taskId);
        const timestamp = now();
        const waitingSince =
          laneStatus === "확인 대기" ? (task.status === "확인 대기" ? task.waiting_since : timestamp) : null;
        const completedAt = laneStatus === "완료" ? (task.status === "완료" ? task.completed_at : timestamp) : null;
        await db.prepare("UPDATE tasks SET status=?,waiting_since=?,completed_at=?,updated_at=? WHERE id=?").run(
          laneStatus,
          waitingSince,
          completedAt,
          timestamp,
          taskId,
        );
        // 순서가 바뀐 카드만 갱신한다. updated_at은 내용 수정 충돌 감지에 쓰이므로 순서 변경으로 바꾸지 않는다.
        const update = db.prepare("UPDATE tasks SET position=? WHERE id=? AND position<>?");
        for (const [index, item] of newLane.entries()) await update.run(index, item, index);
        if (task.status !== laneStatus)
          for (const [index, item] of oldLane.entries()) await update.run(index, item, index);
      });
      return json({ ok: true });
    },
  },
  {
    method: "PATCH",
    path: "tasks/:id",
    async handler({ params, body }) {
      const updates = EDITABLE.filter((key) => key in body);
      if (!updates.length) throw new HttpError(400, "수정할 항목이 없습니다.");
      validateTaskFields(body, { requireChecklistIds: true });
      if (
        body.position !== undefined &&
        (typeof body.position !== "number" || !Number.isInteger(body.position) || body.position < 0)
      )
        throw new HttpError(400, "작업 순서가 올바르지 않습니다.");
      if (body.archived !== undefined && typeof body.archived !== "boolean")
        throw new HttpError(400, "보관 상태가 올바르지 않습니다.");
      const old = await db.prepare("SELECT status,updated_at FROM tasks WHERE id=?").get(params.id) as
        | { status: string; updated_at: string }
        | undefined;
      if (!old) throw new HttpError(404, "작업을 찾을 수 없습니다.");
      const expected = expectedVersion(body);
      assertFresh(old.updated_at, expected);

      const assignments = updates.map((key) => `${key}=?`);
      const values: unknown[] = updates.map((key) => {
        if (key === "checklist" || key === "links") return JSON.stringify(body[key]);
        if (key === "archived") return body.archived ? 1 : 0;
        if (key === "due_date") return dateOrNull(body.due_date);
        if (key === "title") return String(body.title).trim();
        if (key === "description") return String(body.description ?? "");
        return body[key];
      });
      const timestamp = now();
      if (body.status !== undefined && body.status !== old.status) {
        assignments.push("waiting_since=?", "completed_at=?");
        values.push(body.status === "확인 대기" ? timestamp : null, body.status === "완료" ? timestamp : null);
      }
      assignments.push("updated_at=?");
      values.push(timestamp, params.id);
      if (expected) values.push(expected);
      const result = await db
        .prepare(`UPDATE tasks SET ${assignments.join(",")} WHERE id=?${expected ? " AND updated_at=?" : ""}`)
        .run(...values);
      if (!result.changes) throw new HttpError(409, CONFLICT_MESSAGE, "conflict");
      return json({ ok: true, updated_at: timestamp });
    },
  },
  {
    method: "POST",
    path: "tasks/:id/checklist",
    async handler({ params, body }) {
      const text = String(body.text || "").trim();
      if (!text || text.length > 200) throw new HttpError(400, "체크 항목은 1~200자로 입력하세요.");
      const checklist = await db.transaction(async () => {
        const items = await lockChecklist(params.id);
        if (items.length >= 200) throw new HttpError(400, "체크 항목은 200개까지 추가할 수 있습니다.");
        items.push({ id: newId(), text, done: false });
        await saveChecklist(params.id, items);
        return items;
      });
      return json(checklist, 201);
    },
  },
  {
    method: "PATCH",
    path: "tasks/:id/checklist",
    async handler({ params, body }) {
      const checklist = await db.transaction(async () => {
        const items = await lockChecklist(params.id);
        const item = items.find((entry) => entry.id === body.id);
        if (!item) throw new HttpError(404, "체크 항목을 찾을 수 없습니다.");
        if (body.action === "toggle") item.done = !item.done;
        else if (body.action === "rename") {
          const text = String(body.text || "").trim();
          if (!text || text.length > 200) throw new HttpError(400, "체크 항목은 1~200자로 입력하세요.");
          item.text = text;
        } else if (body.action === "delete") items.splice(items.indexOf(item), 1);
        else throw new HttpError(400, "알 수 없는 체크 항목 동작입니다.");
        await saveChecklist(params.id, items);
        return items;
      });
      return json(checklist);
    },
  },
  {
    method: "DELETE",
    path: "tasks/:id",
    async handler({ params }) {
      const result = await db.prepare("UPDATE tasks SET archived=1,updated_at=? WHERE id=?").run(now(), params.id);
      if (!result.changes) throw new HttpError(404, "작업을 찾을 수 없습니다.");
      return json({ ok: true });
    },
  },
];
