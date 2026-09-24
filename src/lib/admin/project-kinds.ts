export const PROJECT_KINDS = ["외주", "회사"] as const;

// Keep the removed value readable for projects saved before the two-kind simplification.
export type ProjectKind = (typeof PROJECT_KINDS)[number] | "회사 마케팅";

export const PROJECT_KIND_LABELS: Record<ProjectKind, string> = {
  외주: "외주",
  회사: "회사 업무",
  "회사 마케팅": "회사 업무",
};

export function isProjectKind(value: string): value is ProjectKind {
  return PROJECT_KINDS.some((kind) => kind === value);
}

export function isInternalProjectKind(kind: string): boolean {
  return kind !== "외주";
}

export function matchesProjectKind(projectKind: string, filterKind: string): boolean {
  if (!filterKind) return true;
  if (filterKind === "회사") return isInternalProjectKind(projectKind);
  return projectKind === filterKind;
}
