import "server-only";
import { db } from "@/lib/admin/db";
import { HttpError, json } from "@/lib/admin/http";
import { seoulDate, validDate } from "@/lib/admin/validation";
import { generateReport } from "@/lib/admin/weekly-report/generate";
import { lastWeekStart, mondayOf } from "@/lib/admin/weekly-report/naming";
import type { ReportContent } from "@/lib/admin/weekly-report/types";
import { now, parse, type Route } from "./common";

function shapeContent(value: unknown): ReportContent {
  const c = (parse(value) ?? {}) as Partial<ReportContent>;
  const rows = (v: unknown) => (Array.isArray(v) ? v.slice(0, 60) : []);
  const s = (v: unknown, max = 4000) => String(v ?? "").slice(0, max);
  return {
    title: s(c.title, 120), heading: s(c.heading, 160), summary: s(c.summary), achievement: s(c.achievement),
    prev: rows(c.prev), current: rows(c.current), shots: rows(c.shots), issues: rows(c.issues), next: rows(c.next), roadmap: rows(c.roadmap),
  };
}

export const reportRoutes: Route[] = [
  {
    method: "GET",
    path: "reports",
    async handler({ url }) {
      const project = url.searchParams.get("project_id") || "";
      const rows = await db.prepare(
        `SELECT r.id,r.project_id,r.week_start,r.name,r.status,r.error,r.updated_at,p.name AS project_name FROM weekly_reports r JOIN projects p ON p.id=r.project_id WHERE (?='' OR r.project_id=?) ORDER BY r.week_start DESC,p.name LIMIT 100`,
      ).all(project, project);
      return json(rows);
    },
  },
  {
    method: "GET",
    path: "reports/:id",
    async handler({ params }) {
      const row = await db.prepare(`SELECT r.*,p.name AS project_name FROM weekly_reports r JOIN projects p ON p.id=r.project_id WHERE r.id=?`).get(params.id);
      if (!row) throw new HttpError(404, "보고서를 찾을 수 없습니다.");
      return json({ ...row, content: parse(row.content), sources: parse(row.sources) });
    },
  },
  {
    method: "PATCH",
    path: "reports/:id",
    async handler({ params, body }) {
      const row = await db.prepare(`SELECT status FROM weekly_reports WHERE id=?`).get(params.id) as { status: string } | undefined;
      if (!row) throw new HttpError(404, "보고서를 찾을 수 없습니다.");
      if (row.status === "generating") throw new HttpError(409, "보고서를 만드는 중입니다.");
      const status = body.status === undefined ? row.status : String(body.status);
      if (!["review", "confirmed"].includes(status)) throw new HttpError(400, "상태가 올바르지 않습니다.");
      if (body.content !== undefined && status === "confirmed" && row.status === "confirmed")
        throw new HttpError(409, "확정된 보고서는 먼저 검토 상태로 되돌린 뒤 수정하세요.");
      const content = body.content === undefined ? null : JSON.stringify(shapeContent(body.content));
      await db.prepare(`UPDATE weekly_reports SET status=?,content=COALESCE(?,content),updated_at=? WHERE id=?`).run(status, content, now(), params.id);
      return json({ ok: true });
    },
  },
  {
    method: "POST",
    path: "reports/generate",
    async handler({ body }) {
      const projectId = String(body.project_id || "");
      if (!projectId) throw new HttpError(400, "프로젝트를 고르세요.");
      if (body.week_start !== undefined && !validDate(body.week_start)) throw new HttpError(400, "주 시작일 형식이 올바르지 않습니다.");
      const week = body.week_start ? mondayOf(String(body.week_start)) : lastWeekStart(seoulDate());
      const result = await generateReport(projectId, week, { force: true });
      return json(result);
    },
  },
];
