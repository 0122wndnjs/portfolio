import "server-only";
import { audit } from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";
import { HttpError, json } from "@/lib/admin/http";
import { isInternalProjectKind, isProjectKind } from "@/lib/admin/project-kinds";
import { PROJECT_STATUSES, isOneOf, validDate, validLinks } from "@/lib/admin/validation";
import { invoicesWithPayments } from "./billing";
import {
  CONFLICT_MESSAGE,
  type Context,
  type Row,
  type Route,
  assertFresh,
  dateOrNull,
  expectedVersion,
  newId,
  now,
  safeProject,
  safeTask,
} from "./common";

const EDITABLE = [
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

async function projectTasks(projectId: string) {
  const rows = await db
    .prepare("SELECT * FROM tasks WHERE project_id=? AND archived=0 ORDER BY status,position,created_at")
    .all(projectId) as Row[];
  return rows.map(safeTask);
}

async function findProject(projectId: string) {
  const row = await db.prepare("SELECT * FROM projects WHERE id=?").get(projectId) as Row | undefined;
  if (!row) throw new HttpError(404, "프로젝트를 찾을 수 없습니다.");
  return row;
}

async function projectDetail({ params }: Context) {
  const row = await findProject(params.id);
  const [tasks, invoices] = await Promise.all([
    projectTasks(params.id),
    invoicesWithPayments(params.id),
  ]);
  return json({ ...safeProject(row), tasks, invoices });
}

export const projectRoutes: Route[] = [
  {
    method: "GET",
    path: "projects",
    async handler({ url }) {
      const status = url.searchParams.get("status") || "";
      const kind = url.searchParams.get("kind") || "";
      const q = `%${url.searchParams.get("q") || ""}%`;
      const rows = await db
        .prepare(
          `SELECT p.*, COUNT(t.id) AS task_count, SUM(CASE WHEN t.status='완료' THEN 1 ELSE 0 END) AS done_count FROM projects p LEFT JOIN tasks t ON t.project_id=p.id AND t.archived=0 WHERE ((?='' AND p.status IN ('준비 중','진행 중','보류')) OR (?<>'' AND p.status=?)) AND (?='' OR p.kind=? OR (?='회사' AND p.kind='회사 마케팅')) AND (p.name LIKE ? OR p.client LIKE ?) GROUP BY p.id ORDER BY CASE p.status WHEN '진행 중' THEN 0 WHEN '준비 중' THEN 1 WHEN '보류' THEN 2 ELSE 3 END, COALESCE(p.due_date,'9999-12-31'),p.updated_at DESC`,
        )
        .all(status, status, status, kind, kind, kind, q, q) as Row[];
      return json(rows.map(safeProject));
    },
  },
  { method: "GET", path: "projects/:id", handler: projectDetail },
  { method: "GET", path: "projects/:id/detail", handler: projectDetail },
  {
    method: "GET",
    path: "projects/:id/tasks",
    async handler({ params }) {
      await findProject(params.id);
      return json(await projectTasks(params.id));
    },
  },
  {
    method: "GET",
    path: "projects/:id/invoices",
    async handler({ params }) {
      await findProject(params.id);
      return json(await invoicesWithPayments(params.id));
    },
  },
  {
    method: "POST",
    path: "projects",
    async handler({ body }) {
      const name = String(body.name || "").trim();
      const client = String(body.client || "").trim();
      const kind = String(body.kind || "외주");
      const status = String(body.status || "준비 중");
      if (!isProjectKind(kind)) throw new HttpError(400, "업무 유형이 올바르지 않습니다.");
      if (!name || name.length > 100 || !client || client.length > 80)
        throw new HttpError(400, "프로젝트명(1~100자)과 고객명(1~80자)을 입력하세요.");
      if (!isOneOf(PROJECT_STATUSES, status)) throw new HttpError(400, "프로젝트 상태가 올바르지 않습니다.");
      if (!validDate(body.start_date) || !validDate(body.due_date))
        throw new HttpError(400, "프로젝트 날짜 형식이 올바르지 않습니다.");
      if (body.description !== undefined && String(body.description).length > 10000)
        throw new HttpError(400, "프로젝트 설명은 10,000자 이내로 입력하세요.");
      if (body.links !== undefined && !validLinks(body.links))
        throw new HttpError(400, "프로젝트 링크 형식이 올바르지 않습니다.");
      const contractAmount = body.contract_amount ? Number(body.contract_amount) : null;
      if (contractAmount !== null && (!Number.isSafeInteger(contractAmount) || contractAmount < 0))
        throw new HttpError(400, "계약 금액은 0원 이상의 정수여야 합니다.");
      const startDate = dateOrNull(body.start_date);
      const dueDate = dateOrNull(body.due_date);
      if (startDate && dueDate && dueDate < startDate)
        throw new HttpError(400, "마감일은 시작일보다 빠를 수 없습니다.");
      const projectId = newId();
      const timestamp = now();
      await db.prepare(
        "INSERT INTO projects(id,name,client,description,contact,email,kind,status,start_date,due_date,contract_amount,memo,links,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      ).run(
        projectId,
        name,
        client,
        String(body.description || ""),
        String(body.contact || ""),
        String(body.email || ""),
        kind,
        status,
        startDate,
        dueDate,
        isInternalProjectKind(kind) ? null : contractAmount,
        String(body.memo || ""),
        JSON.stringify(body.links || []),
        timestamp,
        timestamp,
      );
      await audit("project.created", { projectId });
      return json({ id: projectId }, 201);
    },
  },
  {
    method: "PATCH",
    path: "projects/:id",
    async handler({ params, body }) {
      const projectId = params.id;
      const updates = EDITABLE.filter((key) => key in body);
      if (!updates.length) throw new HttpError(400, "수정할 항목이 없습니다.");
      const current = await db
        .prepare("SELECT kind,start_date,due_date,updated_at FROM projects WHERE id=?")
        .get(projectId) as
        | { kind: string; start_date: string | null; due_date: string | null; updated_at: string }
        | undefined;
      if (!current) throw new HttpError(404, "프로젝트를 찾을 수 없습니다.");
      const expected = expectedVersion(body);
      assertFresh(current.updated_at, expected);
      if (body.contract_amount !== undefined && isInternalProjectKind(current.kind))
        throw new HttpError(400, "회사 업무에는 계약 금액을 입력할 수 없습니다.");
      if (body.name !== undefined && (!String(body.name).trim() || String(body.name).trim().length > 100))
        throw new HttpError(400, "프로젝트명은 1~100자로 입력하세요.");
      if (body.client !== undefined && (!String(body.client).trim() || String(body.client).trim().length > 80))
        throw new HttpError(400, "고객명은 1~80자로 입력하세요.");
      if (
        (body.start_date !== undefined && !validDate(body.start_date)) ||
        (body.due_date !== undefined && !validDate(body.due_date))
      )
        throw new HttpError(400, "프로젝트 날짜 형식이 올바르지 않습니다.");
      if (body.description !== undefined && String(body.description).length > 10000)
        throw new HttpError(400, "프로젝트 설명은 10,000자 이내로 입력하세요.");
      if (body.memo !== undefined && String(body.memo).length > 20000)
        throw new HttpError(400, "프로젝트 메모는 20,000자 이내로 입력하세요.");
      if (body.links !== undefined && !validLinks(body.links))
        throw new HttpError(400, "프로젝트 링크 형식이 올바르지 않습니다.");
      if (body.status !== undefined && !isOneOf(PROJECT_STATUSES, body.status))
        throw new HttpError(400, "프로젝트 상태가 올바르지 않습니다.");
      const startDate = body.start_date === undefined ? current.start_date : dateOrNull(body.start_date);
      const dueDate = body.due_date === undefined ? current.due_date : dateOrNull(body.due_date);
      if (startDate && dueDate && dueDate < startDate)
        throw new HttpError(400, "마감일은 시작일보다 빠를 수 없습니다.");
      const contract =
        body.contract_amount === undefined || body.contract_amount === "" || body.contract_amount === null
          ? null
          : Number(body.contract_amount);
      if (contract !== null && (!Number.isSafeInteger(contract) || contract < 0))
        throw new HttpError(400, "계약 금액은 0원 이상의 정수여야 합니다.");

      const values = updates.map((key) => {
        if (key === "links") return JSON.stringify(body.links);
        if (key === "contract_amount") return contract;
        if (key === "start_date") return startDate;
        if (key === "due_date") return dueDate;
        if (key === "name" || key === "client") return String(body[key]).trim();
        return body[key] === null || body[key] === undefined ? "" : String(body[key]);
      });
      const timestamp = now();
      const result = await db
        .prepare(
          `UPDATE projects SET ${updates.map((key) => `${key}=?`).join(",")},updated_at=? WHERE id=?${expected ? " AND updated_at=?" : ""}`,
        )
        .run(...values, timestamp, projectId, ...(expected ? [expected] : []));
      if (!result.changes) throw new HttpError(409, CONFLICT_MESSAGE, "conflict");
      await audit("project.updated", { projectId, fields: updates });
      return json({ ok: true, updated_at: timestamp });
    },
  },
];
