import { addDays, seoulDate, validTime } from "./validation";

export type Preferences = {
  notifications: boolean;
  overdueDays: number;
  digestTime: string;
  deadlineAlerts: boolean;
  paymentAlerts: boolean;
  weeklyReport: boolean;
};

export const DEFAULT_PREFERENCES: Preferences = {
  notifications: true,
  overdueDays: 3,
  digestTime: "09:00",
  deadlineAlerts: true,
  paymentAlerts: true,
  weeklyReport: true,
};

/** 저장된 값이 없거나 일부 항목이 빠져도 설정 화면과 같은 기본값을 쓴다. */
export function normalizePreferences(input: unknown): Preferences {
  const value = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const flag = (key: keyof Preferences) =>
    typeof value[key] === "boolean" ? (value[key] as boolean) : (DEFAULT_PREFERENCES[key] as boolean);
  return {
    notifications: flag("notifications"),
    deadlineAlerts: flag("deadlineAlerts"),
    paymentAlerts: flag("paymentAlerts"),
    weeklyReport: flag("weeklyReport"),
    overdueDays: Math.min(30, Math.max(1, Math.trunc(Number(value.overdueDays)) || DEFAULT_PREFERENCES.overdueDays)),
    digestTime: validTime(value.digestTime) ? String(value.digestTime) : DEFAULT_PREFERENCES.digestTime,
  };
}

export function parsePreferences(raw: string | undefined) {
  try {
    return normalizePreferences(raw ? JSON.parse(raw) : {});
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export type ReminderTask = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  due_date: string | null;
  waiting_since: string | null;
  project_name: string;
};
export type ReminderInvoice = {
  id: string;
  project_id: string;
  title: string;
  due_date: string | null;
  project_name: string;
  amount: number;
  paid: number;
};
export type ReminderMeeting = {
  id: string;
  project_id: string;
  project_name: string;
  title: string;
  start_time: string;
  agenda: string;
  meet_url?: string;
};
export type ReminderProject = {
  id: string;
  name: string;
  due_date: string | null;
  next_action: string;
  next_check_date: string | null;
};
export type Reminder = { key: string; text: string };

const short = (value: string, max = 90) => {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};
const waitingDay = (value: string) => seoulDate(new Date(value));

export const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];
export const md = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
export const won = (value: number) =>
  value >= 10_000 && value % 10_000 === 0 ? `${(value / 10_000).toLocaleString("ko-KR")}만원` : `${value.toLocaleString("ko-KR")}원`;

/** 텔레그램 HTML 모드용 한 줄: 제목(링크) · 보조 정보 */
export function itemLine(adminUrl: string | undefined, title: string, path: string, meta: string[] = [], prefix = "") {
  const label = escapeHtml(short(title, 60));
  const linked = adminUrl ? `<a href="${escapeHtml(adminUrl + path)}">${label}</a>` : label;
  const tail = meta.filter(Boolean).map((m) => escapeHtml(m)).join(" · ");
  return `${prefix ? `${escapeHtml(prefix)} ` : "• "}${linked}${tail ? ` <i>${tail}</i>` : ""}`;
}

function dailyReport({
  tasks, completedTasks, meetings, projects, invoices, preferences, today, adminUrl,
}: {
  tasks: ReminderTask[];
  completedTasks: ReminderTask[];
  meetings: ReminderMeeting[];
  projects: ReminderProject[];
  invoices: ReminderInvoice[];
  preferences: Preferences;
  today: string;
  adminUrl?: string;
}) {
  const tomorrow = addDays(today, 1);
  const waitingDate = addDays(today, -preferences.overdueDays);
  const line = (title: string, path: string, meta: string[] = [], prefix = "") => itemLine(adminUrl, title, path, meta, prefix);
  const taskPath = (task: ReminderTask) => `/admin/projects/${task.project_id}?task=${task.id}`;
  const byDue = (a: { due_date: string | null }, b: { due_date: string | null }) => String(a.due_date).localeCompare(String(b.due_date));
  const active = tasks.filter((task) => task.status !== "확인 대기");

  const overdue = preferences.deadlineAlerts
    ? active.filter((task) => task.due_date && task.due_date < today).sort(byDue)
      .map((task) => line(task.title, taskPath(task), [task.project_name, `${md(task.due_date!)} 마감`]))
    : [];
  const todayItems = [
    ...meetings.map((meeting) => line(meeting.title, `/admin/meetings?view=list&project=${meeting.project_id}&meeting=${meeting.id}`, [meeting.project_name, meeting.agenda ? short(meeting.agenda, 30) : ""], `🕑 ${meeting.start_time.slice(0, 5)}`) + (meeting.meet_url && /^https:\/\/meet\.google\.com\//.test(meeting.meet_url) ? ` · <a href="${escapeHtml(meeting.meet_url)}">Meet</a>` : "")),
    ...(preferences.deadlineAlerts ? active.filter((task) => task.due_date === today).map((task) => line(task.title, taskPath(task), [task.project_name, "오늘 마감"])) : []),
    ...projects.filter((project) => (preferences.deadlineAlerts && project.due_date && project.due_date <= today) || (project.next_check_date && project.next_check_date <= today)).map((project) => {
      const details: string[] = [];
      if (preferences.deadlineAlerts && project.due_date && project.due_date <= today)
        details.push(project.due_date === today ? "프로젝트 오늘 마감" : `프로젝트 ${md(project.due_date)} 마감 지남`);
      if (project.next_check_date && project.next_check_date <= today) details.push(project.next_action || "진행 상황 확인");
      return line(project.name, `/admin/projects/${project.id}`, details);
    }),
  ];
  const waitingItems = tasks.filter((task) => task.status === "확인 대기" && task.waiting_since && waitingDay(task.waiting_since) <= waitingDate)
    .sort((a, b) => String(a.waiting_since).localeCompare(String(b.waiting_since)))
    .map((task) => {
      const days = Math.max(0, Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${waitingDay(task.waiting_since!)}T00:00:00Z`)) / 86_400_000));
      return line(task.title, taskPath(task), [task.project_name, `${days}일째 대기`]);
    });
  const unpaid = preferences.paymentAlerts
    ? invoices.filter((invoice) => invoice.due_date && invoice.due_date <= tomorrow && Number(invoice.paid) < Number(invoice.amount))
      .sort(byDue)
    : [];
  const unpaidTotal = unpaid.reduce((sum, invoice) => sum + Math.max(0, Number(invoice.amount) - Number(invoice.paid)), 0);
  const moneyItems = unpaid.map((invoice) => line(`${invoice.project_name} ${invoice.title}`, `/admin/money?tab=payments`, [
    won(Math.max(0, Number(invoice.amount) - Number(invoice.paid))),
    invoice.due_date! < today ? `${md(invoice.due_date!)} 지남` : invoice.due_date === today ? "오늘 예정" : "내일 예정",
  ]));
  const upcomingItems = preferences.deadlineAlerts ? [
    ...tasks.filter((task) => task.due_date === tomorrow).map((task) => line(task.title, taskPath(task), [task.project_name])),
    ...projects.filter((project) => project.due_date === tomorrow).map((project) => line(project.name, `/admin/projects/${project.id}`, ["프로젝트 마감"])),
  ] : [];

  const weekday = WEEKDAY[new Date(`${today}T00:00:00Z`).getUTCDay()];
  const lines = [`☀️ <b>${Number(today.slice(5, 7))}월 ${Number(today.slice(8))}일 (${weekday}) 오늘 브리핑</b>`];
  const summary = [
    overdue.length && `🔴 지연 ${overdue.length}`,
    todayItems.length && `📌 오늘 ${todayItems.length}`,
    waitingItems.length && `⏳ 대기 ${waitingItems.length}`,
    unpaid.length && `💰 ${won(unpaidTotal)}`,
  ].filter(Boolean);
  lines.push(summary.length ? summary.join("  ") : "오늘 확인할 일정이 없어요. 여유로운 하루!");
  const addSection = (title: string, items: string[], limit = 5) => {
    if (!items.length) return;
    lines.push("", `<b>${title}</b>`, ...items.slice(0, limit));
    if (items.length > limit) lines.push(`<i>  외 ${items.length - limit}건</i>`);
  };
  addSection(`🔴 지연 ${overdue.length}`, overdue);
  addSection(`📌 오늘 ${todayItems.length}`, todayItems);
  addSection(`⏳ 확인 대기 ${waitingItems.length}`, waitingItems);
  addSection(`💰 정산 확인 · ${won(unpaidTotal)}`, moneyItems);
  addSection(`🗓 내일 ${upcomingItems.length}`, upcomingItems);
  if (completedTasks.length)
    lines.push("", `<b>✅ 어제 완료 ${completedTasks.length}</b>`, escapeHtml(short(completedTasks.map((task) => task.title).join(", "), 200)));
  return lines.join("\n");
}

/**
 * 발송 대상 알림을 만든다. key는 중복 발송 방지 키이므로 형식을 바꾸면
 * 이미 보낸 알림이 다시 발송된다.
 * forceDigest: 하루 한 번 실행되는 예약(Vercel Hobby cron)은 요약 시각과 관계없이 요약을 포함한다.
 */
export function buildReminders({
  tasks,
  invoices,
  completedTasks = [],
  meetings = [],
  projects = [],
  preferences,
  today,
  time,
  forceDigest = false,
  adminUrl,
}: {
  tasks: ReminderTask[];
  invoices: ReminderInvoice[];
  completedTasks?: ReminderTask[];
  meetings?: ReminderMeeting[];
  projects?: ReminderProject[];
  preferences: Preferences;
  today: string;
  time: string;
  forceDigest?: boolean;
  adminUrl?: string;
}): Reminder[] {
  if (!preferences.notifications) return [];
  const tomorrow = addDays(today, 1);
  const waitingDate = addDays(today, -preferences.overdueDays);
  const messages: Reminder[] = [];
  for (const task of tasks) {
    if (preferences.deadlineAlerts && task.due_date === tomorrow)
      messages.push({
        key: `deadline:${task.id}:${task.due_date}:lead`,
        text: `🗓 <b>내일 마감</b>\n${itemLine(adminUrl, task.title, `/admin/projects/${task.project_id}?task=${task.id}`, [task.project_name])}`,
      });
    if (preferences.deadlineAlerts && task.due_date && task.due_date <= today)
      messages.push({
        key: `deadline:${task.id}:${task.due_date}:today`,
        text: `${task.due_date === today ? "📌 <b>오늘 마감</b>" : "🔴 <b>마감 지남</b>"}\n${itemLine(adminUrl, task.title, `/admin/projects/${task.project_id}?task=${task.id}`, [task.project_name, md(task.due_date)])}`,
      });
    if (task.status === "확인 대기" && task.waiting_since && waitingDay(task.waiting_since) <= waitingDate)
      messages.push({
        key: `waiting:${task.id}:${task.waiting_since}`,
        text: `⏳ <b>고객 확인 대기</b>\n${itemLine(adminUrl, task.title, `/admin/projects/${task.project_id}?task=${task.id}`, [task.project_name])}`,
      });
  }
  if (preferences.paymentAlerts)
    for (const invoice of invoices) {
      if (Number(invoice.paid) >= Number(invoice.amount) || !invoice.due_date) continue;
      if (invoice.due_date === today)
        messages.push({
          key: `payment:${invoice.id}:${invoice.due_date}:due`,
          text: `💰 <b>오늘 입금 예정</b>\n${itemLine(adminUrl, `${invoice.project_name} ${invoice.title}`, "/admin/money?tab=payments", [won(Math.max(0, Number(invoice.amount) - Number(invoice.paid)))])}`,
        });
      else if (invoice.due_date < today)
        messages.push({
          key: `payment:${invoice.id}:${invoice.due_date}:overdue`,
          text: `💰 <b>입금 확인 필요</b>\n${itemLine(adminUrl, `${invoice.project_name} ${invoice.title}`, "/admin/money?tab=payments", [won(Math.max(0, Number(invoice.amount) - Number(invoice.paid))), `${md(invoice.due_date)} 지남`])}`,
        });
    }
  if (forceDigest || time >= preferences.digestTime) {
    messages.push({
      key: `digest:${today}`,
      text: dailyReport({ tasks, completedTasks, meetings, projects, invoices, preferences, today, adminUrl }),
    });
  }
  return messages;
}
