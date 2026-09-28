import { describe, expect, it } from "vitest";
import { isInternalProjectKind, isProjectKind, matchesProjectKind } from "@/lib/admin/project-kinds";

describe("project kinds", () => {
  it("새 개인 프로젝트를 허용한다", () => {
    expect(isProjectKind("개인")).toBe(true);
    expect(isProjectKind("회사 마케팅")).toBe(false);
    expect(isInternalProjectKind("개인")).toBe(true);
  });

  it("개인 프로젝트를 회사 필터와 분리한다", () => {
    expect(matchesProjectKind("개인", "개인")).toBe(true);
    expect(matchesProjectKind("개인", "회사")).toBe(false);
    expect(matchesProjectKind("회사 마케팅", "회사")).toBe(true);
    expect(matchesProjectKind("외주", "개인")).toBe(false);
    expect(matchesProjectKind("개인", "")).toBe(true);
  });
});
