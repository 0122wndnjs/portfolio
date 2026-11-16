import { describe, expect, it } from "vitest";
import { lastWeekStart, mondayOf, periodCode, reportName, shortRange, weekLabel, weekRange } from "@/lib/admin/weekly-report/naming";

describe("weekly report naming", () => {
  it("finds monday", () => {
    expect(mondayOf("2026-11-15")).toBe("2026-11-09");
    expect(mondayOf("2026-11-09")).toBe("2026-11-09");
  });
  it("monday 00:00 run targets the week that just ended", () => {
    expect(lastWeekStart("2026-11-16")).toBe("2026-11-09");
  });
  it("labels week by its monday's month", () => {
    expect(weekLabel("2026-11-02")).toBe("11월1주차");
    expect(weekLabel("2026-11-09")).toBe("11월2주차");
    expect(weekLabel("2026-11-30")).toBe("11월5주차");
    expect(weekLabel("2026-12-28")).toBe("12월4주차");
  });
  it("builds name and periods", () => {
    expect(reportName("2026-11-09", "팅 클리닉")).toBe("11월2주차_팅클리닉_주간보고서");
    expect(periodCode("2026-11-09")).toBe("261109 ~ 261115");
    const r = weekRange("2026-11-09");
    expect(shortRange(r.prevStart, r.prevEnd)).toBe("11.02 ~ 11.08");
    expect(r.nextEnd).toBe("2026-11-22");
  });
});
