export type ReportStatus = "완료" | "운영 반영" | "로컬 완료" | "진행 중" | "반영 대기" | "예정";
export type WorkRow = { area: string; content: string; status: string; refs?: string[] };
export type IssueRow = { item: string; content: string; plan: string };
export type PlanRow = { area: string; content: string; note: string };
export type RoadmapRow = { task: string; period: string; note: string };
export type Shot = { url: string; caption: string; detail: string; sample?: boolean };

export type ReportContent = {
  title: string;          // TING CLINIC 시스템 고도화
  heading: string;        // TING CLINIC 주간 개발 진행 보고서
  summary: string;
  prev: WorkRow[];
  current: WorkRow[];
  achievement: string;
  shots: Shot[];
  issues: IssueRow[];
  next: PlanRow[];
  roadmap: RoadmapRow[];
};
