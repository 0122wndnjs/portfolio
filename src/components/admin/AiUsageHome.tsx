"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/components/admin/api";
import { addDays, compactTokens as compact, seoulToday, shortDate } from "./redesign-utils";

type Summary = {
  month: string;
  totals: Array<{ tool: "claude" | "codex"; tokens: number; output: number; days: number }>;
  months: Array<{ month: string; tool: "claude" | "codex"; tokens: number }>;
  top: Array<{ folder: string; project_id: string | null; project_name: string | null; tokens: number; days: number; claude: number }>;
  daily: Array<{ usage_date: string; tokens: number }>;
  synced_at: string | null;
};

const prevMonth = (month: string) => {
  const d = new Date(`${month}-01T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 7);
};

/** 홈 오른쪽 "AI 사용" 통계 카드. */
export default function AiUsageHome() {
  const [data, setData] = useState<Summary | null>(null);
  useEffect(() => {
    let active = true;
    api<Summary>("/api/admin/ai-usage/summary")
      .then((rows) => active && setData(rows))
      .catch(() => active && setData(null));
    return () => {
      active = false;
    };
  }, []);
  if (!data || data.totals.length === 0) return null;

  const monthTotal = (month: string) => data.months.filter((m) => m.month === month).reduce((s, m) => s + m.tokens, 0);
  const now = monthTotal(data.month);
  const before = monthTotal(prevMonth(data.month));
  const change = before ? Math.round((100 * (now - before)) / before) : null;
  const all = data.totals.reduce((s, t) => s + t.tokens, 0);

  const months = [...new Set(data.months.map((m) => m.month))];
  const monthMax = Math.max(1, ...months.map(monthTotal));

  const today = seoulToday();
  const dailyMap = new Map(data.daily.map((d) => [d.usage_date, d.tokens]));
  const days = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));
  const dayMax = Math.max(1, ...days.map((d) => dailyMap.get(d) || 0));
  const activeDays = days.filter((d) => dailyMap.get(d)).length;
  const topMax = Math.max(1, ...data.top.map((t) => t.tokens));

  return (
    <section className="rd-card rd-card-pad rd-ai rd-ai-home">
      <h2>AI 사용</h2>
      <div className="rd-ai-hero">
        <div>
          <span className="rd-eyebrow">이번 달</span>
          <strong>{compact(now)}</strong>
          {change !== null && <small className={change > 0 ? "is-up" : "is-down"}>지난달 대비 {change > 0 ? "+" : ""}{change}%</small>}
        </div>
        <div>
          <span className="rd-eyebrow">누적</span>
          <strong>{compact(all)}</strong>
          <small>{data.totals.map((t) => `${t.tool === "claude" ? "Claude" : "Codex"} ${Math.round((100 * t.tokens) / Math.max(all, 1))}%`).join(" · ")}</small>
        </div>
      </div>

      <h3 className="rd-ai-sub">최근 30일 · {activeDays}일 작업</h3>
      <div className="rd-ai-spark" role="img" aria-label={`최근 30일 중 ${activeDays}일 사용`}>
        {days.map((d) => (
          <span key={d} title={`${shortDate(d)} · ${compact(dailyMap.get(d) || 0)}`} className={d === today ? "is-today" : ""} style={{ height: `${Math.max(4, (100 * (dailyMap.get(d) || 0)) / dayMax)}%`, opacity: dailyMap.get(d) ? 1 : 0.25 }} />
        ))}
      </div>

      <h3 className="rd-ai-sub">이번 달 TOP 5</h3>
      <ol className="rd-ai-top">
        {data.top.map((t, i) => {
          const label = t.project_name || t.folder;
          const body = (
            <>
              <span className="rd-ai-rank">{i + 1}</span>
              <span className="rd-ai-name">{label}<small>{t.days}일</small></span>
              <b>{compact(t.tokens)}</b>
              <span className="rd-ai-meter"><span className="is-claude" style={{ width: `${(100 * t.claude) / topMax}%` }} /><span className="is-codex" style={{ width: `${(100 * (t.tokens - t.claude)) / topMax}%` }} /></span>
            </>
          );
          return <li key={t.folder}>{t.project_id ? <Link href={`/admin/projects/${t.project_id}`}>{body}</Link> : <div title="프로젝트에 폴더를 연결하면 이름으로 보여요">{body}</div>}</li>;
        })}
        {data.top.length === 0 && <li className="rd-eyebrow">이번 달 기록이 아직 없어요.</li>}
      </ol>

      <h3 className="rd-ai-sub">월별</h3>
      <div className="rd-ai-months">
        {months.map((m) => {
          const claude = data.months.find((x) => x.month === m && x.tool === "claude")?.tokens || 0;
          const codex = data.months.find((x) => x.month === m && x.tool === "codex")?.tokens || 0;
          return (
            <div key={m} title={`${m} · Claude ${compact(claude)} · Codex ${compact(codex)}`}>
              <span className="rd-ai-col">
                <span className="is-codex" style={{ height: `${(100 * codex) / monthMax}%` }} />
                <span className="is-claude" style={{ height: `${(100 * claude) / monthMax}%` }} />
              </span>
              <small>{Number(m.slice(5))}월</small>
            </div>
          );
        })}
      </div>
      <div className="rd-ai-legend"><span className="is-claude">Claude Code</span><span className="is-codex">Codex</span></div>
      {data.synced_at && <p className="rd-eyebrow">매일 자정 자동 동기화 · 마지막 {new Date(data.synced_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>}
    </section>
  );
}
