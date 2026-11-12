import "server-only";
import { db } from "@/lib/admin/db";
import { addDays } from "@/lib/admin/validation";
import type { WeeklyData } from "@/lib/admin/weekly";

/** 이번 주(월~일) 주간 리포트 데이터. today는 보통 일요일. */
export async function loadWeekly(today: string): Promise<WeeklyData> {
  const start = addDays(today, -((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7));
  const end = addDays(start, 6);
  const nextStart = addDays(start, 7);
  const nextEnd = addDays(start, 13);
  const at = (date: string) => new Date(`${date}T00:00:00+09:00`).toISOString();
  const active = "p.status IN ('준비 중','진행 중','보류')";
  const [done, meetings, nextTasks, nextMeetings, overdue, waiting, received, nextInvoices, unpaid, aiWeek, aiLast, aiTop] = await Promise.all([
    db.prepare(`SELECT t.id,t.project_id,t.title,p.name AS project_name FROM tasks t JOIN projects p ON p.id=t.project_id WHERE t.archived=0 AND t.status='완료' AND t.completed_at>=? AND t.completed_at<? ORDER BY t.completed_at`).all(at(start), at(nextStart)),
    db.prepare(`SELECT m.id,m.project_id,m.title,m.meeting_date,m.start_time,p.name AS project_name FROM meetings m JOIN projects p ON p.id=m.project_id WHERE m.meeting_date BETWEEN ? AND ?`).all(start, end),
    db.prepare(`SELECT t.id,t.project_id,t.title,t.due_date,p.name AS project_name FROM tasks t JOIN projects p ON p.id=t.project_id WHERE t.archived=0 AND t.status<>'완료' AND ${active} AND t.due_date BETWEEN ? AND ? ORDER BY t.due_date`).all(nextStart, nextEnd),
    db.prepare(`SELECT m.id,m.project_id,m.title,m.meeting_date,m.start_time,p.name AS project_name FROM meetings m JOIN projects p ON p.id=m.project_id WHERE m.meeting_date BETWEEN ? AND ? ORDER BY m.meeting_date,m.start_time`).all(nextStart, nextEnd),
    db.prepare(`SELECT t.id,t.project_id,t.title,t.due_date,p.name AS project_name FROM tasks t JOIN projects p ON p.id=t.project_id WHERE t.archived=0 AND t.status NOT IN ('완료','확인 대기') AND ${active} AND t.due_date<? ORDER BY t.due_date`).all(today),
    db.prepare(`SELECT t.id,t.project_id,t.title,t.waiting_since,p.name AS project_name FROM tasks t JOIN projects p ON p.id=t.project_id WHERE t.archived=0 AND t.status='확인 대기' AND ${active} AND t.waiting_since IS NOT NULL ORDER BY t.waiting_since`).all(),
    db.prepare(`SELECT p.name AS project_name,i.title,pay.amount FROM payments pay JOIN invoices i ON i.id=pay.invoice_id JOIN projects p ON p.id=i.project_id WHERE pay.paid_at BETWEEN ? AND ? ORDER BY pay.paid_at`).all(start, end),
    db.prepare(`SELECT p.name AS project_name,i.title,i.due_date,i.amount-COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id=i.id),0) AS balance FROM invoices i JOIN projects p ON p.id=i.project_id WHERE i.due_date BETWEEN ? AND ?`).all(nextStart, nextEnd),
    db.prepare(`SELECT COALESCE(SUM(i.amount-COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id=i.id),0)),0) AS total FROM invoices i`).get(),
    db.prepare(`SELECT COALESCE(SUM(input_tokens+cache_read_tokens+cache_write_tokens+output_tokens),0) AS total FROM ai_usage WHERE usage_date BETWEEN ? AND ?`).get(start, end),
    db.prepare(`SELECT COALESCE(SUM(input_tokens+cache_read_tokens+cache_write_tokens+output_tokens),0) AS total FROM ai_usage WHERE usage_date BETWEEN ? AND ?`).get(addDays(start, -7), addDays(start, -1)),
    db.prepare(`SELECT COALESCE(MAX(p.name),u.folder) AS name,SUM(u.input_tokens+u.cache_read_tokens+u.cache_write_tokens+u.output_tokens) AS tokens FROM ai_usage u LEFT JOIN projects p ON p.ai_folder<>'' AND p.ai_folder=u.folder WHERE u.usage_date BETWEEN ? AND ? GROUP BY u.folder ORDER BY 2 DESC LIMIT 3`).all(start, end),
  ]);
  const n = (v: unknown) => Number(v) || 0;
  return {
    start,
    done, meetings, nextTasks, nextMeetings, overdue, waiting,
    received: received.map((r) => ({ ...r, amount: n(r.amount) })),
    nextInvoices: nextInvoices.map((r) => ({ ...r, balance: n(r.balance) })).filter((r) => r.balance > 0),
    unpaidTotal: n((unpaid as { total: unknown } | undefined)?.total),
    ai: { tokens: n((aiWeek as { total: unknown } | undefined)?.total), lastWeek: n((aiLast as { total: unknown } | undefined)?.total), top: aiTop.map((r) => ({ name: String(r.name), tokens: n(r.tokens) })) },
  } as WeeklyData;
}
