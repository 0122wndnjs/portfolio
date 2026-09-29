import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREFERENCES,
  type ReminderInvoice,
  type ReminderTask,
  buildReminders,
  normalizePreferences,
  parsePreferences,
} from "@/lib/admin/reminders";

const task = (overrides: Partial<ReminderTask>): ReminderTask => ({
  id: "t1",
  project_id: "p1",
  title: "메인 화면",
  status: "진행 중",
  due_date: null,
  waiting_since: null,
  project_name: "A사",
  ...overrides,
});
const invoice = (overrides: Partial<ReminderInvoice>): ReminderInvoice => ({
  id: "i1",
  project_id: "p1",
  title: "잔금",
  due_date: null,
  project_name: "A사",
  amount: 1000,
  paid: 0,
  ...overrides,
});
const base = { preferences: DEFAULT_PREFERENCES, today: "2026-09-25", time: "08:00" };
const keys = (items: Array<{ key: string }>) => items.map((item) => item.key);

describe("preferences", () => {
  it("저장된 설정이 없으면 기본값(알림 켜짐)을 쓴다", () => {
    expect(parsePreferences(undefined)).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences("{}")).toEqual(DEFAULT_PREFERENCES);
    expect(parsePreferences("not json")).toEqual(DEFAULT_PREFERENCES);
  });

  it("범위를 벗어난 값은 보정한다", () => {
    const value = normalizePreferences({ overdueDays: 99, digestTime: "25:00", notifications: false });
    expect(value.overdueDays).toBe(30);
    expect(value.digestTime).toBe("09:00");
    expect(value.notifications).toBe(false);
    expect(normalizePreferences({ overdueDays: 0 }).overdueDays).toBe(3);
    expect(normalizePreferences({ overdueDays: -5 }).overdueDays).toBe(1);
  });
});

describe("buildReminders", () => {
  it("내일 마감은 사전 알림, 오늘·지난 마감은 마감 확인", () => {
    const result = buildReminders({
      ...base,
      tasks: [task({ id: "tomorrow", due_date: "2026-09-26" }), task({ id: "today", due_date: "2026-09-25" }), task({ id: "late", due_date: "2026-09-20" })],
      invoices: [],
    });
    expect(keys(result)).toEqual([
      "deadline:tomorrow:2026-09-26:lead",
      "deadline:today:2026-09-25:today",
      "deadline:late:2026-09-20:today",
    ]);
  });

  it("월말을 넘는 내일 계산", () => {
    const result = buildReminders({ ...base, today: "2026-09-30", tasks: [task({ due_date: "2026-10-01" })], invoices: [] });
    expect(keys(result)).toEqual(["deadline:t1:2026-10-01:lead"]);
  });

  it("확인 대기는 기준 일수가 지나야 알린다", () => {
    const waiting = (since: string) => task({ id: since, status: "확인 대기", waiting_since: `${since}T03:00:00.000Z` });
    const result = buildReminders({ ...base, tasks: [waiting("2026-09-22"), waiting("2026-09-23")], invoices: [] });
    expect(keys(result)).toEqual(["waiting:2026-09-22:2026-09-22T03:00:00.000Z"]);
  });

  it("입금 예정일 당일은 예정, 지나면 연체. 완납·예정일 없음은 제외", () => {
    const result = buildReminders({
      ...base,
      tasks: [],
      invoices: [
        invoice({ id: "due", due_date: "2026-09-25" }),
        invoice({ id: "late", due_date: "2026-09-01", paid: 500 }),
        invoice({ id: "paid", due_date: "2026-09-01", paid: 1000 }),
        invoice({ id: "none" }),
      ],
    });
    expect(keys(result)).toEqual(["payment:due:2026-09-25:due", "payment:late:2026-09-01:overdue"]);
  });

  it("종류별 알림 끄기와 전체 끄기", () => {
    const input = { ...base, tasks: [task({ due_date: "2026-09-25" })], invoices: [invoice({ due_date: "2026-09-25" })] };
    expect(buildReminders({ ...input, preferences: { ...DEFAULT_PREFERENCES, deadlineAlerts: false } }).map((item) => item.key)).toEqual(["payment:i1:2026-09-25:due"]);
    expect(buildReminders({ ...input, preferences: { ...DEFAULT_PREFERENCES, notifications: false } })).toEqual([]);
  });

  it("요약은 설정 시각 이후 또는 하루 1회 예약 실행에서만 포함", () => {
    const input = { ...base, tasks: [task({ due_date: "2026-09-25" })], invoices: [] };
    expect(keys(buildReminders(input))).not.toContain("digest:2026-09-25");
    expect(keys(buildReminders({ ...input, time: "09:00" }))).toContain("digest:2026-09-25");
    expect(keys(buildReminders({ ...input, forceDigest: true }))).toContain("digest:2026-09-25");
  });

  it("아침 업무 보고에 오늘 할 일, 확인 대기, 어제 완료와 다가오는 일정을 구체적으로 담는다", () => {
    const result = buildReminders({
      ...base,
      time: "09:00",
      adminUrl: "https://joowonkim.me",
      tasks: [
        task({ id: "due", title: "메인 화면 수정", due_date: "2026-09-25" }),
        task({ id: "waiting", title: "시안 피드백", status: "확인 대기", waiting_since: "2026-09-20T00:00:00.000Z" }),
        task({ id: "tomorrow", title: "배포", due_date: "2026-09-26" }),
      ],
      completedTasks: [task({ id: "done", title: "로그인 화면", status: "완료" })],
      meetings: [{ id: "m1", project_id: "p1", project_name: "A사", title: "킥오프", start_time: "14:00", agenda: "요구사항 확인" }],
      projects: [{ id: "p1", name: "A사", due_date: "2026-09-26", next_action: "고객에게 연락", next_check_date: "2026-09-25" }],
      invoices: [invoice({ id: "pay", title: "잔금", due_date: "2026-09-26", amount: 1000, paid: 200 })],
    });
    const report = result.find((item) => item.key === "digest:2026-09-25")?.text || "";
    expect(report).toContain("아침 업무 보고");
    expect(report).toContain("14:00 [A사] 킥오프");
    expect(report).toContain("메인 화면 수정 — 오늘 마감");
    expect(report).toContain("시안 피드백 — 5일째 대기");
    expect(report).toContain("로그인 화면 완료");
    expect(report).toContain("고객에게 연락");
    expect(report).toContain("프로젝트 — 내일 마감");
    expect(report).toContain("잔액 800원");
    expect(report).toContain("https://joowonkim.me/admin/projects/p1?task=due");
    expect(report).not.toContain("오늘 일정");
  });

  it("알림 대상이 없는 날도 하루 한 번 빈 업무 보고를 만든다", () => {
    expect(buildReminders({ ...base, time: "08:00", tasks: [], invoices: [] })).toEqual([]);
    const result = buildReminders({ ...base, time: "10:00", tasks: [], invoices: [] });
    expect(result).toEqual([{ key: "digest:2026-09-25", text: expect.stringContaining("오늘 확인할 일정이 없어요") }]);
  });
});
