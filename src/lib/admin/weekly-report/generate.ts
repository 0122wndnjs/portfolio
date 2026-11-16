import "server-only";
import { db } from "@/lib/admin/db";
import { newId, now } from "@/lib/admin/api/common";
import { writeReport } from "./ai";
import { collectRepo } from "./github";
import { reportName, shortRange, weekRange } from "./naming";
import type { ReportContent, RoadmapRow, WorkRow } from "./types";

type Project = { id: string; name: string; report_name: string; report_title: string; repo_full_name: string; repo_branch: string; report_roadmap: string };

const at = (date: string) => new Date(`${date}T00:00:00+09:00`).toISOString();
const json = <T,>(s: unknown, fallback: T): T => { try { return typeof s === "string" ? JSON.parse(s) : fallback; } catch { return fallback; } };

export async function reportTargets() {
  return db.prepare(`SELECT id,name,report_name,report_title,repo_full_name,repo_branch,report_roadmap FROM projects WHERE weekly_report=TRUE AND kind IN ('외주','개인') AND status IN ('준비 중','진행 중','보류') ORDER BY name`).all() as Promise<Project[]>;
}

/** 한 프로젝트의 한 주 보고서를 만든다. 이미 확정된 보고서는 건드리지 않는다. */
export async function generateReport(projectId: string, weekStart: string, opts: { force?: boolean } = {}) {
  const project = await db.prepare(`SELECT id,name,report_name,report_title,repo_full_name,repo_branch,report_roadmap FROM projects WHERE id=?`).get(projectId) as Project | undefined;
  if (!project) throw new Error("프로젝트를 찾을 수 없습니다.");
  const r = weekRange(weekStart);
  const name = reportName(weekStart, project.report_name || project.name);
  const existing = await db.prepare(`SELECT id,status FROM weekly_reports WHERE project_id=? AND week_start=?`).get(projectId, weekStart) as { id: string; status: string } | undefined;
  if (existing && (existing.status === "confirmed" || (!opts.force && existing.status === "review"))) return { id: existing.id, skipped: true };
  const id = existing?.id ?? newId();
  const ts = now();
  if (existing) await db.prepare(`UPDATE weekly_reports SET status='generating',error=NULL,name=?,updated_at=? WHERE id=?`).run(name, ts, id);
  else await db.prepare(`INSERT INTO weekly_reports(id,project_id,week_start,name,status,created_at,updated_at) VALUES(?,?,?,?,'generating',?,?)`).run(id, projectId, weekStart, name, ts, ts);

  try {
    const [done, open, meetings, prevReport] = await Promise.all([
      db.prepare(`SELECT title,description FROM tasks WHERE project_id=? AND archived=0 AND status='완료' AND completed_at>=? AND completed_at<? ORDER BY completed_at`).all(projectId, at(r.start), at(r.nextStart)) as Promise<{ title: string; description: string }[]>,
      db.prepare(`SELECT title,status,due_date FROM tasks WHERE project_id=? AND archived=0 AND status<>'완료' ORDER BY COALESCE(due_date,'9999-12-31') LIMIT 40`).all(projectId) as Promise<{ title: string; status: string; due_date: string | null }[]>,
      db.prepare(`SELECT title,meeting_date AS date,agenda,decisions FROM meetings WHERE project_id=? AND meeting_date BETWEEN ? AND ? ORDER BY meeting_date`).all(projectId, r.start, r.nextEnd) as Promise<{ title: string; date: string; agenda: string; decisions: string }[]>,
      db.prepare(`SELECT content FROM weekly_reports WHERE project_id=? AND week_start=? AND status IN ('review','confirmed')`).get(projectId, r.prevStart) as Promise<{ content: string } | undefined>,
    ]);
    const prevRows = (json<Partial<ReportContent>>(prevReport?.content, {}).current ?? []).map(({ area, content, status }: WorkRow) => ({ area, content, status }));
    const repo = project.repo_full_name ? await collectRepo(project.repo_full_name, project.repo_branch || "main", r.start, r.end) : null;
    const ai = await writeReport({
      project: project.report_title || project.name,
      range: shortRange(r.start, r.end), prevRange: shortRange(r.prevStart, r.prevEnd), nextRange: shortRange(r.nextStart, r.nextEnd),
      prevRows, repo, doneTasks: done, openTasks: open,
      meetings: meetings.map((m) => ({ title: m.title, date: m.date, notes: [m.agenda, m.decisions].filter(Boolean).join("\n") })),
    });
    const title = project.report_title || project.name;
    const content: ReportContent = {
      title,
      heading: `${title.replace(/\s*(시스템\s*)?(고도화|개발|구축|리뉴얼)$/, "").toUpperCase()} 주간 개발 진행 보고서`,
      summary: ai.summary, prev: ai.prev, current: ai.current, achievement: ai.achievement,
      shots: [], issues: ai.issues, next: ai.next,
      roadmap: json<RoadmapRow[]>(project.report_roadmap, []),
    };
    const sources = repo ? { commits: repo.commits, pulls: repo.pulls.map(({ number, title, url }) => ({ number, title, url })), truncated: repo.truncated } : { commits: [], pulls: [], truncated: false };
    await db.prepare(`UPDATE weekly_reports SET status='review',content=?,sources=?,error=NULL,updated_at=? WHERE id=?`).run(JSON.stringify(content), JSON.stringify(sources), now(), id);
    return { id, name, skipped: false };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await db.prepare(`UPDATE weekly_reports SET status='failed',error=?,updated_at=? WHERE id=?`).run(message.slice(0, 1000), now(), id);
    throw e;
  }
}
