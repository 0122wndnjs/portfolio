import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/admin/settings", () => ({ getSetting: vi.fn(), setSetting: vi.fn() }));

let google: typeof import("../google");
beforeAll(async () => {
  process.env.GOOGLE_TOKEN_KEY = "test-key";
  google = await import("../google");
});

describe("google", () => {
  it("encrypts and decrypts refresh tokens", () => {
    const sealed = google.encrypt("1//refresh-token");
    expect(sealed).not.toContain("refresh-token");
    expect(google.decrypt(sealed)).toBe("1//refresh-token");
    const [v, iv, tag, data] = sealed.split(".");
    expect(() => google.decrypt([v, iv, tag, data.slice(0, -2) + "AA"].join("."))).toThrow();
  });

  it("computes KST end time across midnight", () => {
    expect(google.endOf("2026-11-14", "10:00", 60)).toBe("2026-11-14T11:00:00");
    expect(google.endOf("2026-11-14", "23:30", 90)).toBe("2026-11-15T01:00:00");
  });

  it("parses guest emails", () => {
    expect(google.parseEmails("A@x.com, b@y.com;a@x.com\nc@z.io")).toEqual(["a@x.com", "b@y.com", "c@z.io"]);
  });
});

describe("eventDescription", () => {
  const base = {
    id: "m1", title: "킥오프", meeting_date: "2026-11-20", start_time: "10:00", duration_minutes: 60,
    location: "", agenda: "범위 확정", decisions: "", guest_emails: "", google_event_id: "", meet_url: "",
    project_name: "openbal", project_client: "오픈발", project_status: "진행 중", project_next_action: "견적 보내기",
    open_tasks: [{ title: "배너 수정", status: "진행 중", due_date: "2026-11-21" }],
  };
  it("includes project details when there are no guests", () => {
    const text = google.eventDescription(base, "https://x.me");
    expect(text).toContain("📁 openbal · 오픈발");
    expect(text).toContain("배너 수정");
    expect(text).toContain("https://x.me/admin/meetings");
  });
  it("hides internal details from invited guests", () => {
    const text = google.eventDescription({ ...base, guest_emails: "c@client.com" }, "https://x.me");
    expect(text).toContain("범위 확정");
    expect(text).not.toContain("견적 보내기");
    expect(text).not.toContain("배너 수정");
    expect(text).not.toContain("x.me");
  });
});
