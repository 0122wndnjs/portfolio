export const PROJECT_KINDS = ["외주", "회사", "회사 마케팅"] as const;

export type ProjectKind = (typeof PROJECT_KINDS)[number];

export const PROJECT_KIND_LABELS: Record<ProjectKind, string> = {
  외주: "외주",
  회사: "회사 업무",
  "회사 마케팅": "회사 마케팅 업무",
};

export function isProjectKind(value: string): value is ProjectKind {
  return PROJECT_KINDS.some((kind) => kind === value);
}

export function isInternalProjectKind(kind: string): boolean {
  return kind !== "외주";
}
