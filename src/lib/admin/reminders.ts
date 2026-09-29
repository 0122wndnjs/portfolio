import { addDays, seoulDate, validTime } from "./validation";

export type Preferences = {
  notifications: boolean;
  overdueDays: number;
  digestTime: string;
  deadlineAlerts: boolean;
  paymentAlerts: boolean;
};

export const DEFAULT_PREFERENCES: Preferences = {
  notifications: true,
  overdueDays: 3,
  digestTime: "09:00",
  deadlineAlerts: true,
  paymentAlerts: true,
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
  const link = (label: string, path: string) =>
    `• ${short(label)}${adminUrl ? `\n  ${adminUrl}${path}` : ""}`;
  const taskLink = (task: ReminderTask) => `/admin/projects/${task.project_id}?task=${task.id}`;
  const todayItems = [
    ...meetings.map((meeting) => link(`${meeting.start_time} [${meeting.project_name}] ${meeting.title}${meeting.agenda ? ` — ${short(meeting.agenda, 45)}` : ""}`, `/admin/meetings?project=${meeting.project_id}&meeting=${meeting.id}`)),
    ...(preferences.deadlineAlerts ? tasks.filter((task) => task.status !== "확인 대기" && task.due_date && task.due_date <= today).sort((a, b) => String(a.due_date).localeCompare(String(b.due_date))).map((task) =>
      link(`[${task.project_name}] ${task.title} — ${task.due_date === today ? "오늘 마감" : `${task.due_date} 마감 확인`}`, taskLink(task))) : []),
    ...projects.filter((project) => (preferences.deadlineAlerts && project.due_date && project.due_date <= today) || (project.next_check_date && project.next_check_date <= today)).map((project) => {
      const details = [];
      if (preferences.deadlineAlerts && project.due_date && project.due_date <= today)
        details.push(project.due_date === today ? "프로젝트 오늘 마감" : `프로젝트 ${project.due_date} 마감 확인`);
      if (project.next_check_date && project.next_check_date <= today)
        details.push(`${project.next_action || "진행 상황 확인"} · 확인일 ${project.next_check_date}`);
      return link(`[${project.name}] ${details.join(" · ")}`, `/admin/projects/${project.id}`);
    }),
  ];
  const waitingItems = tasks.filter((task) => task.status === "확인 대기" && task.waiting_since && waitingDay(task.waiting_since) <= waitingDate)
    .sort((a, b) => String(a.waiting_since).localeCompare(String(b.waiting_since)))
    .map((task) => {
      const days = Math.max(0, Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${waitingDay(task.waiting_since!)}T00:00:00Z`)) / 86_400_000));
      return link(`[${task.project_name}] ${task.title} — ${days}일째 대기`, taskLink(task));
    });
  const completedItems = completedTasks.map((task) => link(`[${task.project_name}] ${task.title} 완료`, taskLink(task)));
  const upcomingItems = [
    ...(preferences.deadlineAlerts ? tasks.filter((task) => task.due_date === tomorrow).map((task) =>
      link(`[${task.project_name}] ${task.title} — 내일 마감`, taskLink(task))) : []),
    ...(preferences.deadlineAlerts ? projects.filter((project) => project.due_date === tomorrow).map((project) =>
      link(`[${project.name}] 프로젝트 — 내일 마감`, `/admin/projects/${project.id}`)) : []),
    ...(preferences.paymentAlerts ? invoices.filter((invoice) => invoice.due_date && invoice.due_date <= tomorrow && Number(invoice.paid) < Number(invoice.amount)).map((invoice) =>
      link(`[${invoice.project_name}] ${invoice.title} — ${invoice.due_date! < today ? "입금 확인 필요" : invoice.due_date === today ? "오늘 입금 예정" : "내일 입금 예정"} · 잔액 ${Math.max(0, Number(invoice.amount) - Number(invoice.paid)).toLocaleString("ko-KR")}원`, `/admin/projects/${invoice.project_id}?tab=입금#invoice-${invoice.id}`)) : []),
  ];
  const lines = [`📋 ${Number(today.slice(5, 7))}월 ${Number(today.slice(8))}일 · 아침 업무 보고`];
  const addSection = (title: string, items: string[]) => {
    if (!items.length) return;
    lines.push("", `${title} · ${items.length}건`, ...items.slice(0, 4));
    if (items.length > 4) lines.push(`  외 ${items.length - 4}건은 작업실에서 확인`);
  };
  addSection("오늘 움직일 일", todayItems);
  addSection("확인 대기", waitingItems);
  addSection("어제 끝낸 일", completedItems);
  addSection("다가오는 일정", upcomingItems);
  if (lines.length === 1) lines.push("", "오늘 확인할 일정이 없어요.");
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
        text: `내일 마감 · ${task.project_name} / ${task.title}`,
      });
    if (preferences.deadlineAlerts && task.due_date && task.due_date <= today)
      messages.push({
        key: `deadline:${task.id}:${task.due_date}:today`,
        text: `마감 확인 · ${task.project_name} / ${task.title} (${task.due_date})`,
      });
    if (task.status === "확인 대기" && task.waiting_since && waitingDay(task.waiting_since) <= waitingDate)
      messages.push({
        key: `waiting:${task.id}:${task.waiting_since}`,
        text: `고객 확인 대기 · ${task.project_name} / ${task.title}`,
      });
  }
  if (preferences.paymentAlerts)
    for (const invoice of invoices) {
      if (Number(invoice.paid) >= Number(invoice.amount) || !invoice.due_date) continue;
      if (invoice.due_date === today)
        messages.push({
          key: `payment:${invoice.id}:${invoice.due_date}:due`,
          text: `입금 예정 · ${invoice.project_name} / ${invoice.title}`,
        });
      else if (invoice.due_date < today)
        messages.push({
          key: `payment:${invoice.id}:${invoice.due_date}:overdue`,
          text: `입금 확인 · ${invoice.project_name} / ${invoice.title} (${invoice.due_date})`,
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
