import { describe, expect, it } from "vitest";
import { findRoute, matchPath } from "@/lib/admin/api/router";
import type { Route } from "@/lib/admin/api/common";
import { addDays, seoulDate, validChecklist, validDate, validLinks, validTime } from "@/lib/admin/validation";

describe("validDate", () => {
  it("빈 값은 날짜 없음으로 허용", () => {
    expect(validDate("")).toBe(true);
    expect(validDate(null)).toBe(true);
    expect(validDate(undefined)).toBe(true);
  });
  it("실제로 존재하는 YYYY-MM-DD만 허용", () => {
    expect(validDate("2026-02-28")).toBe(true);
    expect(validDate("2026-02-29")).toBe(false);
    expect(validDate("2026-13-01")).toBe(false);
    expect(validDate("2026-1-01")).toBe(false);
    expect(validDate(20260101)).toBe(false);
  });
});

describe("validTime", () => {
  it("24시간 HH:mm", () => {
    expect(validTime("00:00")).toBe(true);
    expect(validTime("23:59")).toBe(true);
    expect(validTime("24:00")).toBe(false);
    expect(validTime("9:00")).toBe(false);
  });
});

describe("validLinks", () => {
  it("http(s) 링크만 허용", () => {
    expect(validLinks([{ name: "Figma", url: "https://figma.com/x" }])).toBe(true);
    expect(validLinks([{ name: "x", url: "javascript:alert(1)" }])).toBe(false);
    expect(validLinks([{ name: "x", url: "not a url" }])).toBe(false);
    expect(validLinks("[]")).toBe(false);
  });
});

describe("validChecklist", () => {
  it("수정 시에는 항목 id가 필요", () => {
    expect(validChecklist([{ text: "a", done: false }], false)).toBe(true);
    expect(validChecklist([{ text: "a", done: false }], true)).toBe(false);
    expect(validChecklist([{ id: "1", text: "a", done: "no" }], true)).toBe(false);
  });
});

describe("dates", () => {
  it("서울 기준 날짜: UTC 15시 이후는 다음 날", () => {
    expect(seoulDate(new Date("2026-09-24T14:59:00Z"))).toBe("2026-09-24");
    expect(seoulDate(new Date("2026-09-24T15:00:00Z"))).toBe("2026-09-25");
  });
  it("addDays는 월·연 경계를 넘는다", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("router", () => {
  const handler = async () => new Response();
  const routes: Route[] = [
    { method: "PATCH", path: "tasks/:id", handler },
    { method: "PATCH", path: "tasks/:id/checklist", handler },
    { method: "GET", path: "projects/:id", handler },
  ];
  it("세그먼트 수와 메서드가 모두 맞아야 일치", () => {
    expect(matchPath("tasks/:id", ["tasks", "abc"])).toEqual({ id: "abc" });
    expect(matchPath("tasks/:id", ["tasks"])).toBeNull();
    expect(matchPath("tasks/:id", ["tasks", ""])).toBeNull();
    expect(findRoute(routes, "PATCH", ["tasks", "abc", "checklist"])?.route.path).toBe("tasks/:id/checklist");
    expect(findRoute(routes, "PATCH", ["tasks", "abc"])?.route.path).toBe("tasks/:id");
    expect(findRoute(routes, "DELETE", ["tasks", "abc"])).toBeNull();
    expect(findRoute(routes, "GET", ["projects", "p1", "unknown"])).toBeNull();
  });
});
