/** 주간 보고서 기간·이름 규칙. 주는 월~일, 주차는 그 주 월요일이 속한 달 기준. */

const pad = (n: number) => String(n).padStart(2, "0");

function shift(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** date가 속한 주의 월요일 */
export function mondayOf(date: string) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return shift(date, -((day + 6) % 7));
}

/** 오늘(서울) 기준 지난주 월요일. 월요일 00시에 돌면 막 끝난 주가 된다. */
export function lastWeekStart(today: string) {
  return shift(mondayOf(today), -7);
}

export function weekRange(weekStart: string) {
  return { start: weekStart, end: shift(weekStart, 6), prevStart: shift(weekStart, -7), prevEnd: shift(weekStart, -1), nextStart: shift(weekStart, 7), nextEnd: shift(weekStart, 13) };
}

/** "11월2주차" */
export function weekLabel(weekStart: string) {
  const [, m, d] = weekStart.split("-").map(Number);
  return `${m}월${Math.ceil(d / 7)}주차`;
}

/** "11월2주차_팅클리닉_주간보고서" */
export function reportName(weekStart: string, shortName: string) {
  const name = shortName.trim().replace(/[\\/:*?"<>|\s]+/g, "");
  return `${weekLabel(weekStart)}_${name}_주간보고서`;
}

/** "261109 ~ 261115" */
export function periodCode(weekStart: string) {
  const { end } = weekRange(weekStart);
  const f = (s: string) => s.slice(2).replaceAll("-", "");
  return `${f(weekStart)} ~ ${f(end)}`;
}

/** "11.09 ~ 11.15" */
export function shortRange(start: string, end: string) {
  const f = (s: string) => `${s.slice(5, 7)}.${s.slice(8, 10)}`;
  return `${f(start)} ~ ${f(end)}`;
}

/** "2026.11.09 ~ 2026.11.15" */
export function longRange(start: string, end: string) {
  return `${start.replaceAll("-", ".")} ~ ${end.replaceAll("-", ".")}`;
}

export { pad };
