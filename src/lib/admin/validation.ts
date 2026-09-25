export const PROJECT_STATUSES = ["준비 중", "진행 중", "보류", "완료", "취소"] as const;
export const ACTIVE_PROJECT_STATUSES = ["준비 중", "진행 중", "보류"] as const;
export const TASK_STATUSES = ["할 일", "진행 중", "확인 대기", "완료"] as const;
export const TASK_PRIORITIES = ["낮음", "보통", "높음"] as const;
export const QUOTE_STATUSES = ["초안", "발송", "수락", "거절"] as const;

export const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (list as readonly string[]).includes(value);

/** 빈 값(null/undefined/"")은 "날짜 없음"으로 허용한다. */
export function validDate(value: unknown) {
  if (value === null || value === undefined || value === "") return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export const validTime = (value: unknown) =>
  typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export function validLinks(value: unknown) {
  return (
    Array.isArray(value) &&
    value.length <= 50 &&
    value.every((link) => {
      if (
        !link ||
        typeof link.name !== "string" ||
        link.name.trim().length > 80 ||
        typeof link.url !== "string" ||
        link.url.length > 2048
      )
        return false;
      try {
        return ["http:", "https:"].includes(new URL(link.url).protocol);
      } catch {
        return false;
      }
    })
  );
}

export function validChecklist(value: unknown, requireId: boolean) {
  return (
    Array.isArray(value) &&
    value.length <= 200 &&
    value.every(
      (item) =>
        item &&
        (!requireId || typeof item.id === "string") &&
        typeof item.text === "string" &&
        item.text.trim().length <= 200 &&
        typeof item.done === "boolean",
    )
  );
}

/** 서울 기준 YYYY-MM-DD */
export const seoulDate = (at: Date = new Date()) =>
  at.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

/** 서울 기준 HH:mm (24시간) */
export const seoulTime = (at: Date = new Date()) =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Seoul",
  }).format(at);

export function addDays(date: string, days: number) {
  const base = new Date(`${date}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}
