import { addDays, validTime } from "./validation";

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
  title: string;
  status: string;
  due_date: string | null;
  waiting_since: string | null;
  project_name: string;
};
export type ReminderInvoice = {
  id: string;
  title: string;
  due_date: string | null;
  project_name: string;
  amount: number;
  paid: number;
};
export type Reminder = { key: string; text: string };

/**
 * 발송 대상 알림을 만든다. key는 중복 발송 방지 키이므로 형식을 바꾸면
 * 이미 보낸 알림이 다시 발송된다.
 * forceDigest: 하루 한 번 실행되는 예약(Vercel Hobby cron)은 요약 시각과 관계없이 요약을 포함한다.
 */
export function buildReminders({
  tasks,
  invoices,
  preferences,
  today,
  time,
  forceDigest = false,
}: {
  tasks: ReminderTask[];
  invoices: ReminderInvoice[];
  preferences: Preferences;
  today: string;
  time: string;
  forceDigest?: boolean;
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
    if (task.status === "확인 대기" && task.waiting_since && task.waiting_since.slice(0, 10) <= waitingDate)
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
  if (messages.length && (forceDigest || time >= preferences.digestTime)) {
    const count = (prefix: string) => messages.filter((item) => item.key.startsWith(prefix)).length;
    messages.push({
      key: `digest:${today}`,
      text: `오늘 일정 ${messages.length}건 · 마감 작업 ${count("deadline:")}건 · 고객 확인 대기 ${count("waiting:")}건 · 입금 일정 ${count("payment:")}건`,
    });
  }
  return messages;
}
