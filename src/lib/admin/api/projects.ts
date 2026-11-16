import "server-only";
import { audit } from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";
import { HttpError, json } from "@/lib/admin/http";
import { isInternalProjectKind, isProjectKind } from "@/lib/admin/project-kinds";
import { PROJECT_STATUSES, addDays, isOneOf, seoulDate, validDate, validLinks } from "@/lib/admin/validation";
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

function addMonths(month: string, delta: number) {
  const d = new Date(`${month}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 7);
}

const EDITABLE = [
  "next_action",
  "waiting_reason",
  "next_check_date",
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
  "ai_folder",
  "weekly_report",
  "report_name",
  "report_title",
  "repo_full_name",
  "repo_branch",
  "report_roadmap",
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
          `SELECT p.*, COUNT(t.id) AS task_count, SUM(CASE WHEN t.status='완료' THEN 1 ELSE 0 END) AS done_count FROM projects p LEFT JOIN tasks t ON t.project_id=p.id AND t.archived=0 WHERE (?='전체' OR (?='' AND p.status IN ('준비 중','진행 중','보류')) OR p.status=?) AND (?='' OR p.kind=? OR (?='회사' AND p.kind='회사 마케팅')) AND (p.name LIKE ? OR p.client LIKE ?) GROUP BY p.id ORDER BY CASE p.status WHEN '진행 중' THEN 0 WHEN '준비 중' THEN 1 WHEN '보류' THEN 2 WHEN '완료' THEN 3 WHEN '취소' THEN 4 ELSE 5 END, COALESCE(p.due_date,'9999-12-31'),p.updated_at DESC`,
        )
        .all(status, status, status, kind, kind, kind, q, q) as Row[];
      return json(rows.map(safeProject));
    },
  },
  { method: "GET", path: "projects/:id", handler: projectDetail },
  {
    method: "GET",
    path: "ai-usage/summary",
    async handler() {
      const tokens = "SUM(u.input_tokens+u.cache_read_tokens+u.cache_write_tokens+u.output_tokens)::bigint";
      const month = seoulDate().slice(0, 7);
      const [totals, months, top, daily, synced] = await Promise.all([
        db.prepare(`SELECT u.tool,${tokens} AS tokens,SUM(u.output_tokens)::bigint AS output,COUNT(DISTINCT u.usage_date)::int AS days FROM ai_usage u GROUP BY u.tool`).all(),
        db.prepare(`SELECT SUBSTRING(u.usage_date,1,7) AS month,u.tool,${tokens} AS tokens FROM ai_usage u WHERE u.usage_date >= ? GROUP BY 1,2 ORDER BY 1`).all(`${addMonths(month, -5)}-01`),
        db.prepare(`SELECT u.folder,MAX(p.id) AS project_id,MAX(p.name) AS project_name,${tokens} AS tokens,COUNT(DISTINCT u.usage_date)::int AS days,
            SUM(CASE WHEN u.tool='claude' THEN u.input_tokens+u.cache_read_tokens+u.cache_write_tokens+u.output_tokens ELSE 0 END)::bigint AS claude
          FROM ai_usage u LEFT JOIN projects p ON p.ai_folder<>'' AND p.ai_folder=u.folder
          WHERE u.usage_date LIKE ? GROUP BY u.folder ORDER BY 4 DESC LIMIT 5`).all(`${month}-%`),
        db.prepare(`SELECT u.usage_date,${tokens} AS tokens FROM ai_usage u WHERE u.usage_date >= ? GROUP BY 1 ORDER BY 1`).all(addDays(seoulDate(), -29)),
        db.prepare("SELECT MAX(synced_at) AS synced_at FROM ai_usage").get() as Promise<{ synced_at: string | null } | undefined>,
      ]);
      const num = (rows: Row[]) => rows.map((row) => ({ ...row, ...Object.fromEntries(["tokens", "output", "claude"].filter((k) => k in row).map((k) => [k, Number(row[k])])) }));
      return json({ month, totals: num(totals), months: num(months), top: num(top), daily: num(daily), synced_at: synced?.synced_at || null });
    },
  },
  {
    method: "GET",
    path: "projects/:id/ai-usage",
    async handler({ params }) {
      const project = await db.prepare("SELECT ai_folder FROM projects WHERE id=?").get(params.id) as { ai_folder: string } | undefined;
      if (!project) throw new HttpError(404, "프로젝트를 찾을 수 없습니다.");
      const folder = project.ai_folder.trim();
      if (!folder) return json({ folder: "", days: [], synced_at: null });
      const days = await db.prepare(
        `SELECT usage_date,tool,account,
          SUM(input_tokens)::bigint AS input_tokens,SUM(cache_read_tokens)::bigint AS cache_read_tokens,
          SUM(cache_write_tokens)::bigint AS cache_write_tokens,SUM(output_tokens)::bigint AS output_tokens,
          SUM(requests)::int AS requests,COUNT(DISTINCT session_id)::int AS sessions
        FROM ai_usage WHERE folder=? GROUP BY usage_date,tool,account ORDER BY usage_date DESC,tool,account`,
      ).all(folder);
      const synced = await db.prepare("SELECT MAX(synced_at) AS synced_at FROM ai_usage").get() as { synced_at: string | null } | undefined;
      return json({
        folder,
        days: days.map((row) => ({ ...row, input_tokens: Number(row.input_tokens), cache_read_tokens: Number(row.cache_read_tokens), cache_write_tokens: Number(row.cache_write_tokens), output_tokens: Number(row.output_tokens) })),
        synced_at: synced?.synced_at || null,
      });
    },
  },
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
      const kind = String(body.kind || "외주");
      const client = kind === "개인" ? "개인" : String(body.client || "").trim();
      const status = String(body.status || "준비 중");
      if (!isProjectKind(kind)) throw new HttpError(400, "업무 유형이 올바르지 않습니다.");
      if (!name || name.length > 100 || !client || client.length > 80)
        throw new HttpError(400, kind === "개인" ? "프로젝트명은 1~100자로 입력하세요." : "프로젝트명(1~100자)과 고객/조직명(1~80자)을 입력하세요.");
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
      for (const key of ["next_action", "waiting_reason"]) {
        if (body[key] !== undefined && (typeof body[key] !== "string" || body[key].length > 1000))
          throw new HttpError(400, "다음 행동·대기 사유는 1,000자 이내로 입력하세요.");
      }
      if (body.next_check_date !== undefined && !validDate(body.next_check_date))
        throw new HttpError(400, "다음 확인일을 확인하세요.");
      if (body.weekly_report !== undefined && typeof body.weekly_report !== "boolean")
        throw new HttpError(400, "주간 보고서 설정이 올바르지 않습니다.");
      for (const key of ["report_name", "report_title"]) {
        if (body[key] !== undefined && (typeof body[key] !== "string" || body[key].length > 100))
          throw new HttpError(400, "보고서 이름·제목은 100자 이내로 입력하세요.");
      }
      if (body.repo_full_name !== undefined && (typeof body.repo_full_name !== "string" || (body.repo_full_name !== "" && !/^[\w.-]+\/[\w.-]+$/.test(body.repo_full_name))))
        throw new HttpError(400, "레포는 owner/repo 형식으로 입력하세요.");
      if (body.repo_branch !== undefined && (typeof body.repo_branch !== "string" || !/^[\w./-]{1,100}$/.test(body.repo_branch)))
        throw new HttpError(400, "브랜치 이름이 올바르지 않습니다.");
      if (body.report_roadmap !== undefined) {
        let ok = typeof body.report_roadmap === "string" && body.report_roadmap.length <= 5000;
        try { ok = ok && Array.isArray(JSON.parse(String(body.report_roadmap))); } catch { ok = false; }
        if (!ok) throw new HttpError(400, "로드맵 형식이 올바르지 않습니다.");
      }
      if (body.ai_folder !== undefined && (typeof body.ai_folder !== "string" || body.ai_folder.length > 100 || /[\\/]/.test(body.ai_folder)))
        throw new HttpError(400, "로컬 폴더는 슬래시 없이 폴더 이름만 100자 이내로 입력하세요.");
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
        throw new HttpError(400, "외주 프로젝트에만 계약 금액을 입력할 수 있습니다.");
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
        if (key === "next_check_date") return dateOrNull(body.next_check_date);
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
