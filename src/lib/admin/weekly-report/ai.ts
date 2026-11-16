import "server-only";
import type { RepoChange } from "./github";
import type { IssueRow, PlanRow, WorkRow } from "./types";

export type AiInput = {
  project: string;
  range: string;
  prevRange: string;
  nextRange: string;
  prevRows: WorkRow[];
  repo: RepoChange | null;
  doneTasks: { title: string; description: string }[];
  openTasks: { title: string; status: string; due_date: string | null }[];
  meetings: { title: string; date: string; notes: string }[];
};
export type AiOutput = { summary: string; prev: WorkRow[]; current: WorkRow[]; achievement: string; issues: IssueRow[]; next: PlanRow[] };

const MODEL = process.env.WEEKLY_REPORT_MODEL || "gemini-3.8-flash";

const SYSTEM = `너는 외주 개발자의 고객용 "주간 개발 진행 보고서"를 쓰는 작성자다.
규칙:
- 독자는 병원·고객사 담당자다. 기술 용어·파일 경로·함수명은 쓰지 말고 무엇이 어떻게 바뀌었는지 화면·기능 기준으로 구체적으로 쓴다. (예: "예약 폼에서 같은 번호로 하루 3회 넘게 신청하면 차단")
- 관리자 주소(/admin/...)처럼 고객이 실제로 쓰는 주소는 써도 된다.
- 근거 없는 내용은 절대 쓰지 않는다. current 행마다 refs에 근거(커밋 sha, PR 번호 #n, 작업 제목)를 넣는다.
- 비슷한 변경은 "구분"별로 묶는다. 구분은 짧은 명사(예: 관리자 UI 개편, 보안 강화, 검색엔진 / SEO).
- 문체는 "~하였습니다/~완료" 보고서체. summary는 3~5문장.
- 상태 값: 완료, 운영 반영, 로컬 완료, 진행 중, 반영 대기, 예정 중 하나.
- prev는 입력의 지난주 행을 유지하되, 이번 주 근거로 상태가 바뀌었으면 상태만 고친다.
- next는 남은 작업·미팅·다음 주 마감에서만 뽑는다. 추측해서 만들지 않는다.
- 출력은 JSON 하나만. 코드블록·설명 없이.
스키마: {"summary":string,"prev":[{"area","content","status"}],"current":[{"area","content","status","refs":[string]}],"achievement":string,"issues":[{"item","content","plan"}],"next":[{"area","content","note"}]}`;

function prompt(i: AiInput) {
  const repo = i.repo
    ? [
        `## 레포 변경 (${i.range})${i.repo.truncated ? " — 일부 생략됨" : ""}`,
        "### 합쳐진 PR", ...i.repo.pulls.map((p) => `#${p.number} ${p.title}\n${p.body}`),
        "### 커밋", ...i.repo.commits.map((c) => `${c.sha} ${c.date.slice(0, 10)} ${c.message}`),
        "### 바뀐 코드", ...i.repo.files.map((f) => `--- ${f.path} (${f.status} +${f.additions} -${f.deletions})\n${f.patch}`),
      ].join("\n")
    : "## 레포 변경\n(연결된 레포 없음 — 작업 기록만으로 작성)";
  return [
    `프로젝트: ${i.project}`, `이번 주: ${i.range} / 지난주: ${i.prevRange} / 다음 주: ${i.nextRange}`,
    "## 지난주 보고서의 금주 작업 행(prev로 사용)", JSON.stringify(i.prevRows),
    "## 이번 주 완료한 작업(작업실)", ...i.doneTasks.map((t) => `- ${t.title}${t.description ? `: ${t.description.slice(0, 400)}` : ""}`),
    "## 남은 작업", ...i.openTasks.map((t) => `- [${t.status}] ${t.title}${t.due_date ? ` (마감 ${t.due_date})` : ""}`),
    "## 미팅", ...i.meetings.map((m) => `- ${m.date} ${m.title}${m.notes ? `\n${m.notes.slice(0, 1200)}` : ""}`),
    repo,
  ].join("\n");
}

function parseJson(text: string): AiOutput {
  const s = text.indexOf("{"), e = text.lastIndexOf("}");
  if (s < 0 || e < s) throw new Error("AI 응답에서 JSON을 찾지 못했습니다.");
  const o = JSON.parse(text.slice(s, e + 1));
  const arr = <T,>(v: unknown) => (Array.isArray(v) ? v : []) as T[];
  return { summary: String(o.summary || ""), prev: arr(o.prev), current: arr(o.current), achievement: String(o.achievement || ""), issues: arr(o.issues), next: arr(o.next) };
}

export async function writeReport(input: AiInput): Promise<AiOutput> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY 환경변수가 필요합니다.");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: prompt(input) }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192, temperature: 0.3 },
    }),
    signal: AbortSignal.timeout(180_000),
  });
  if (!res.ok) throw new Error(`Gemini API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  return parseJson(text);
}
