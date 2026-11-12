import { escapeHtml, itemLine, md, won } from "./reminders";
import { addDays } from "./validation";

export type WeeklyData = {
  /** 이번 주 월요일 (Asia/Seoul) */
  start: string;
  done: Array<{ id: string; project_id: string; project_name: string; title: string }>;
  meetings: Array<{ id: string; project_id: string; project_name: string; title: string; meeting_date: string; start_time: string }>;
  nextTasks: Array<{ id: string; project_id: string; project_name: string; title: string; due_date: string }>;
  nextMeetings: Array<{ id: string; project_id: string; project_name: string; title: string; meeting_date: string; start_time: string }>;
  overdue: Array<{ id: string; project_id: string; project_name: string; title: string; due_date: string }>;
  waiting: Array<{ id: string; project_id: string; project_name: string; title: string; waiting_since: string }>;
  received: Array<{ project_name: string; title: string; amount: number }>;
  nextInvoices: Array<{ project_name: string; title: string; due_date: string; balance: number }>;
  unpaidTotal: number;
  ai: { tokens: number; lastWeek: number; top: Array<{ name: string; tokens: number }> };
};

const compact = (n: number) => (n >= 1e8 ? `${(n / 1e8).toFixed(1)}억` : n >= 1e4 ? `${Math.round(n / 1e4).toLocaleString("ko-KR")}만` : n.toLocaleString("ko-KR"));
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
const dayLabel = (date: string) => `${md(date)}(${WEEKDAY[new Date(`${date}T00:00:00Z`).getUTCDay()]})`;

/** 일요일 밤 주간 리포트(텔레그램 HTML). */
export function buildWeeklyReport(data: WeeklyData, adminUrl?: string) {
  const end = addDays(data.start, 6);
  const line = (title: string, path: string, meta: string[] = [], prefix = "") => itemLine(adminUrl, title, path, meta, prefix);
  const taskPath = (t: { project_id: string; id: string }) => `/admin/projects/${t.project_id}?task=${t.id}`;
  const lines = [`📊 <b>주간 리포트 · ${md(data.start)} ~ ${md(end)}</b>`];
  const receivedTotal = data.received.reduce((s, r) => s + r.amount, 0);
  lines.push(
    [`✅ 완료 ${data.done.length}`, `🤝 미팅 ${data.meetings.length}`, receivedTotal ? `💰 입금 ${won(receivedTotal)}` : "", data.overdue.length ? `🔴 지연 ${data.overdue.length}` : ""]
      .filter(Boolean)
      .join("  "),
  );

  const section = (title: string, items: string[], limit = 6) => {
    if (!items.length) return;
    lines.push("", `<b>${title}</b>`, ...items.slice(0, limit));
    if (items.length > limit) lines.push(`<i>  외 ${items.length - limit}건</i>`);
  };

  // 이번 주 완료: 프로젝트별로 묶어 한 줄씩
  const byProject = new Map<string, string[]>();
  for (const t of data.done) byProject.set(t.project_name, [...(byProject.get(t.project_name) || []), t.title]);
  section(
    `✅ 이번 주 한 일`,
    [...byProject].sort((a, b) => b[1].length - a[1].length).map(([name, titles]) => {
      const shown = titles.slice(0, 3).join(", ");
      return `• <b>${escapeHtml(name)}</b> ${titles.length}건 <i>${escapeHtml(shown.length > 70 ? `${shown.slice(0, 69)}…` : shown)}${titles.length > 3 ? " 등" : ""}</i>`;
    }),
  );

  section(
    `🗓 다음 주 ${data.nextTasks.length + data.nextMeetings.length}`,
    [
      ...data.nextMeetings.map((m) => ({ key: `${m.meeting_date}${m.start_time}`, text: line(m.title, `/admin/meetings?view=list&meeting=${m.id}`, [m.project_name], `🕑 ${dayLabel(m.meeting_date)} ${m.start_time.slice(0, 5)}`) })),
      ...data.nextTasks.map((t) => ({ key: `${t.due_date}99`, text: line(t.title, taskPath(t), [t.project_name, `${dayLabel(t.due_date)} 마감`]) })),
    ].sort((a, b) => a.key.localeCompare(b.key)).map((x) => x.text),
    8,
  );

  section(
    `⚠️ 챙길 것 ${data.overdue.length + data.waiting.length}`,
    [
      ...data.overdue.map((t) => line(t.title, taskPath(t), [t.project_name, `${md(t.due_date)} 마감 지남`], "🔴")),
      ...data.waiting.map((t) => line(t.title, taskPath(t), [t.project_name, `${md(t.waiting_since.slice(0, 10))}부터 대기`], "⏳")),
    ],
  );

  const money = [
    ...data.received.map((r) => `• ${escapeHtml(`${r.project_name} ${r.title}`)} <i>${won(r.amount)} 입금</i>`),
    ...data.nextInvoices.map((i) => `• ${escapeHtml(`${i.project_name} ${i.title}`)} <i>${won(i.balance)} · ${dayLabel(i.due_date)} 예정</i>`),
  ];
  if (money.length || data.unpaidTotal) {
    lines.push("", `<b>💰 정산</b> <i>남은 미수금 ${won(data.unpaidTotal)}</i>`, ...money.slice(0, 6));
  }

  if (data.ai.tokens) {
    const change = data.ai.lastWeek ? Math.round((100 * (data.ai.tokens - data.ai.lastWeek)) / data.ai.lastWeek) : null;
    lines.push(
      "",
      `<b>🤖 AI 사용</b> <i>${compact(data.ai.tokens)} 토큰${change !== null ? ` · 지난주 대비 ${change > 0 ? "+" : ""}${change}%` : ""}</i>`,
      data.ai.top.map((t, i) => `${i + 1}. ${escapeHtml(t.name)} ${compact(t.tokens)}`).join("  "),
    );
  }

  if (lines.length === 2 && !data.done.length) lines.push("", "조용한 한 주였어요. 다음 주도 화이팅!");
  return lines.join("\n");
}
