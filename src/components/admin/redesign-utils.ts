export const seoulToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

export const addDays = (date: string, days: number) => {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
};

export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export const weekdayOf = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay();

export const shortDate = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

export const won = (value: number) => new Intl.NumberFormat("ko-KR").format(value) + "원";

export function dueLabel(due: string | null, today: string) {
  if (!due) return { text: "—", tone: "" };
  if (due < today) return { text: due === addDays(today, -1) ? "어제" : shortDate(due), tone: "is-danger" };
  if (due === today) return { text: "오늘", tone: "is-today" };
  if (due === addDays(today, 1)) return { text: "내일", tone: "" };
  if (due <= addDays(today, 6)) return { text: WEEKDAYS[weekdayOf(due)], tone: "" };
  return { text: shortDate(due), tone: "" };
}

/** Monday of the week containing `date`. */
export const mondayOf = (date: string) => addDays(date, -((weekdayOf(date) + 6) % 7));

export type SearchResult = { id: string; type: string; project_id: string; title: string; excerpt: string };

export const SEARCH_LABELS: Record<string, string> = { project: "프로젝트·메모", task: "작업", meeting: "미팅", quote: "견적서", invoice: "청구", payment: "입금" };

export function searchHref(item: SearchResult) {
  switch (item.type) {
    case "task": return `/admin/projects/${item.project_id}?task=${item.id}`;
    case "meeting": return `/admin/meetings?view=list&project=${item.project_id}&meeting=${item.id}`;
    case "quote": return `/admin/money?tab=quotes&project=${item.project_id}&quote=${item.id}`;
    case "invoice":
    case "payment": return `/admin/projects/${item.project_id}?tab=입금#${item.type}-${item.id}`;
    default: return `/admin/projects/${item.id}?tab=링크·메모`;
  }
}

/** 토큰 수를 "1.2억 / 340만" 형태로 줄인다. */
export const compactTokens = (n: number) =>
  n >= 1e8 ? `${(n / 1e8).toFixed(1)}억` : n >= 1e4 ? `${Math.round(n / 1e4).toLocaleString("ko-KR")}만` : n.toLocaleString("ko-KR");
