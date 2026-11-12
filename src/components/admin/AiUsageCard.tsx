"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/components/admin/api";
import { WEEKDAYS, compactTokens as compact, seoulToday, shortDate, weekdayOf } from "./redesign-utils";

type Day = {
  usage_date: string; tool: "claude" | "codex"; account: string;
  input_tokens: number; cache_read_tokens: number; cache_write_tokens: number; output_tokens: number;
  requests: number; sessions: number;
};
type Usage = { folder: string; days: Day[]; synced_at: string | null };

const total = (d: Day) => d.input_tokens + d.cache_read_tokens + d.cache_write_tokens + d.output_tokens;
const TOOL_LABEL = { claude: "Claude Code", codex: "Codex" } as const;

/** 프로젝트 상세 오른쪽 "AI 사용" 카드. 데이터는 로컬 `npm run sync:ai-usage`로 올라온다. */
export default function AiUsageCard({
  projectId,
  folder,
  onSaved,
}: {
  projectId: string;
  folder: string;
  onSaved: (folder: string, updatedAt: string) => void;
}) {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let active = true;
    api<Usage>(`/api/admin/projects/${projectId}/ai-usage`)
      .then((data) => active && setUsage(data))
      .catch(() => active && setUsage(null));
    return () => {
      active = false;
    };
  }, [projectId, folder]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("folder") || "").trim();
    try {
      const result = await api<{ updated_at: string }>(`/api/admin/projects/${projectId}`, "PATCH", { ai_folder: value });
      setEditing(false);
      setError("");
      onSaved(value, result.updated_at);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    }
  }

  const days = usage?.days || [];
  const month = seoulToday().slice(0, 7);
  const thisMonth = days.filter((d) => d.usage_date.startsWith(month));
  const sum = (rows: Day[]) => rows.reduce((s, d) => s + total(d), 0);
  const byTool = (["claude", "codex"] as const).map((tool) => ({ tool, value: sum(days.filter((d) => d.tool === tool)) }));
  const all = sum(days);
  const accounts = [...new Set(days.filter((d) => d.tool === "codex").map((d) => d.account))].filter(Boolean);
  const accountLabel = (d: Day) => (d.tool === "codex" && accounts.length > 1 ? `Codex ${String.fromCharCode(65 + accounts.indexOf(d.account))}` : TOOL_LABEL[d.tool]);

  // 날짜별 묶음
  const dates = [...new Set(days.map((d) => d.usage_date))];
  const visibleDates = showAll ? dates : dates.slice(0, 7);

  return (
    <section className="rd-card rd-card-pad rd-ai">
      <div className="rd-side-head">
        <h2>AI 사용</h2>
        <button type="button" className="rd-link-btn rd-eyebrow" onClick={() => setEditing((v) => !v)}>{folder ? `📁 ${folder}` : "폴더 연결"}</button>
      </div>
      {editing && (
        <form className="rd-ai-form" onSubmit={(e) => void save(e)}>
          <label className="rd-eyebrow">~/Documents/GitHub/
            <input name="folder" defaultValue={folder} placeholder="폴더 이름" maxLength={100} aria-label="로컬 폴더 이름" autoFocus />
          </label>
          <button type="submit" className="rd-btn rd-btn-sm is-primary">저장</button>
        </form>
      )}
      {error && <p role="alert" className="rd-error">{error}</p>}
      {!folder && !editing && <p className="rd-eyebrow">로컬 폴더를 연결하면 Claude Code·Codex 토큰 사용량이 여기에 나와요.</p>}
      {folder && usage && days.length === 0 && <p className="rd-eyebrow">아직 기록이 없어요. 터미널에서 <code>npm run sync:ai-usage</code>를 실행하세요.</p>}
      {days.length > 0 && (
        <>
          <div className="rd-line"><span>이번 달</span><b>{compact(sum(thisMonth))} 토큰</b></div>
          <div className="rd-line"><span>전체 · {dates.length}일 작업</span><span>{compact(all)}</span></div>
          <span className="rd-ai-bar" aria-hidden="true">
            {byTool.map(({ tool, value }) => value > 0 && <span key={tool} className={`is-${tool}`} style={{ width: `${(100 * value) / Math.max(all, 1)}%` }} />)}
          </span>
          <div className="rd-ai-legend">
            {byTool.map(({ tool, value }) => <span key={tool} className={`is-${tool}`}>{TOOL_LABEL[tool]} {compact(value)}</span>)}
          </div>
          <h3 className="rd-ai-sub">작업한 날</h3>
          <ul className="rd-ai-days">
            {visibleDates.map((date) => {
              const rows = days.filter((d) => d.usage_date === date);
              return (
                <li key={date}>
                  <span className="rd-eyebrow">{shortDate(date)} ({WEEKDAYS[weekdayOf(date)]})</span>
                  <span className="rd-ai-tags">{rows.map((d) => <span key={`${d.tool}-${d.account}`} className={`is-${d.tool}`} title={`세션 ${d.sessions}개 · 요청 ${d.requests}회 · 출력 ${d.output_tokens.toLocaleString("ko-KR")}`}>{accountLabel(d)} {compact(total(d))}</span>)}</span>
                </li>
              );
            })}
          </ul>
          {dates.length > 7 && <button type="button" className="rd-more rd-link-btn" onClick={() => setShowAll((v) => !v)}>{showAll ? "접기" : `${dates.length - 7}일 더 보기`}</button>}
          {usage?.synced_at && <p className="rd-eyebrow">마지막 동기화 {new Date(usage.synced_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>}
        </>
      )}
    </section>
  );
}
