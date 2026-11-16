"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import { longRange, periodCode, shortRange, weekLabel, weekRange } from "@/lib/admin/weekly-report/naming";
import type { ReportContent } from "@/lib/admin/weekly-report/types";

type Report = { id: string; project_id: string; week_start: string; name: string; status: string; error: string | null; content: ReportContent; sources: { commits: { sha: string; message: string; url: string }[]; pulls: { number: number; title: string; url: string }[]; truncated: boolean } };

const chip = (s: string) => /운영 반영|^완료/.test(s) ? "ok" : /로컬|진행|대기/.test(s) ? "wait" : "plan";

/** 클릭해서 바로 고치는 칸. 검토 대기 상태에서만 편집된다. */
function Cell({ value, edit, onChange, as: Tag = "span" }: { value: string; edit: boolean; onChange: (v: string) => void; as?: "span" | "p" | "div" }) {
  return <Tag contentEditable={edit} suppressContentEditableWarning className={edit ? "rv-edit" : undefined} onBlur={(e) => { const v = (e.target as HTMLElement).innerText.trim(); if (v !== value) onChange(v); }}>{value}</Tag>;
}

export default function ReportView({ id }: { id: string }) {
  const [r, setR] = useState<Report | null>(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const content = useRef<ReportContent | null>(null);

  useEffect(() => { api<Report>(`/api/admin/reports/${id}`).then((d) => { setR(d); content.current = d.content; }).catch((e) => setMsg(e.message)); }, [id]);
  if (!r) return <p className="rv-msg">{msg || "불러오는 중…"}</p>;
  const c = r.content;
  const edit = r.status === "review";
  const w = weekRange(r.week_start);

  async function patch(body: Record<string, unknown>) {
    setSaving(true); setMsg("");
    try { await api(`/api/admin/reports/${id}`, "PATCH", body); const d = await api<Report>(`/api/admin/reports/${id}`); setR(d); content.current = d.content; }
    catch (e) { setMsg((e as Error).message); } finally { setSaving(false); }
  }
  function set(fn: (c: ReportContent) => void) {
    const next = structuredClone(content.current!); fn(next); content.current = next;
    patch({ content: next });
  }

  const table = (key: "prev" | "current", head: string) => (
    <div className="rv-wrap"><table>
      <thead><tr><th>구분</th><th>{head}</th><th>진행 상태</th></tr></thead>
      <tbody>{c[key].map((row, i) => (
        <tr key={i}>
          <td><Cell value={row.area} edit={edit} onChange={(v) => set((x) => { x[key][i].area = v; })} /></td>
          <td><Cell value={row.content} edit={edit} onChange={(v) => set((x) => { x[key][i].content = v; })} />
            {edit && row.refs?.length ? <small className="rv-refs">근거 · {row.refs.join(", ")}</small> : null}</td>
          <td className="rv-st"><span className={`rv-chip ${chip(row.status)}`}><Cell value={row.status} edit={edit} onChange={(v) => set((x) => { x[key][i].status = v; })} /></span></td>
        </tr>))}
      </tbody>
    </table></div>
  );

  return (
    <div className="rv">
      <div className="rv-bar">
        <Link href="/admin/reports">← 보고서 목록</Link>
        <b>{r.name}</b>
        <span className={`reports-status s-${r.status}`}>{{ generating: "만드는 중", review: "검토 대기", confirmed: "확정", failed: "실패" }[r.status]}</span>
        <span className="rv-actions">
          {r.status === "review" && <button disabled={saving} onClick={() => patch({ status: "confirmed" })}>확정</button>}
          {r.status === "confirmed" && <button disabled={saving} onClick={() => patch({ status: "review" })}>검토로 되돌리기</button>}
          <button onClick={() => { document.title = r.name; window.print(); }}>PDF로 저장</button>
        </span>
      </div>
      {msg && <p className="rv-msg" role="status">{msg}</p>}
      {r.error && <p className="rv-msg">생성 오류: {r.error}</p>}
      {edit && <p className="rv-hint">글자를 클릭하면 바로 고칠 수 있어요. 칸을 벗어나면 저장돼요.</p>}

      <article className="rv-doc">
        <div className="rv-period">{periodCode(r.week_start)}</div>
        <h1>{c.heading} <span>· {weekLabel(r.week_start)}</span></h1>
        <table className="rv-meta"><tbody>
          <tr><td>프로젝트명</td><td>{c.title}</td></tr>
          <tr><td>작업 기간</td><td>{longRange(w.start, w.end)}</td></tr>
        </tbody></table>

        <h2>1. 주간 진행 현황 요약</h2>
        <Cell as="p" value={c.summary} edit={edit} onChange={(v) => set((x) => { x.summary = v; })} />

        <h2>2. 전주 주요 작업 내역 <small>{shortRange(w.prevStart, w.prevEnd)}</small></h2>
        {c.prev.length ? table("prev", "작업 내용") : <p className="rv-none">지난주 보고서가 없어 비워 두었습니다.</p>}

        <h2>3. 금주 작업 수행 내역 <small>{shortRange(w.start, w.end)}</small></h2>
        {table("current", "수행 내용")}
        <div className="rv-note"><b>금주 달성 현황</b> <Cell value={c.achievement} edit={edit} onChange={(v) => set((x) => { x.achievement = v; })} /></div>

        {c.shots.length > 0 && <>
          <h3>주요 화면</h3>
          <div className="rv-shots">{c.shots.map((s, i) => <figure key={i}>
            {/* eslint-disable-next-line @next/next/no-img-element -- 보고서 PDF용 원본 이미지 */}
            <img src={s.url} alt={s.caption} /><figcaption><b>{s.caption}</b>{s.detail}</figcaption></figure>)}</div>
        </>}

        <h2>4. 주요 이슈 및 확인 사항</h2>
        <div className="rv-wrap"><table>
          <thead><tr><th>항목</th><th>내용</th><th>대응 계획</th></tr></thead>
          <tbody>{c.issues.map((row, i) => <tr key={i}>
            <td><Cell value={row.item} edit={edit} onChange={(v) => set((x) => { x.issues[i].item = v; })} /></td>
            <td><Cell value={row.content} edit={edit} onChange={(v) => set((x) => { x.issues[i].content = v; })} /></td>
            <td><Cell value={row.plan} edit={edit} onChange={(v) => set((x) => { x.issues[i].plan = v; })} /></td>
          </tr>)}</tbody>
        </table></div>

        <h2>5. 향후 주요 개발 일정</h2>
        <h3>차주 주요 작업 계획 · {shortRange(w.nextStart, w.nextEnd)}</h3>
        <div className="rv-wrap"><table>
          <thead><tr><th>구분</th><th>계획 내용</th><th>비고</th></tr></thead>
          <tbody>{c.next.map((row, i) => <tr key={i}>
            <td><Cell value={row.area} edit={edit} onChange={(v) => set((x) => { x.next[i].area = v; })} /></td>
            <td><Cell value={row.content} edit={edit} onChange={(v) => set((x) => { x.next[i].content = v; })} /></td>
            <td className="rv-st"><span className="rv-chip plan"><Cell value={row.note || "예정"} edit={edit} onChange={(v) => set((x) => { x.next[i].note = v; })} /></span></td>
          </tr>)}</tbody>
        </table></div>
        {c.roadmap.length > 0 && <>
          <h3>로드맵</h3>
          <div className="rv-wrap"><table>
            <thead><tr><th>주요 과제</th><th>목표 일정</th><th>비고</th></tr></thead>
            <tbody>{c.roadmap.map((row, i) => <tr key={i}><td>{row.task}</td><td>{row.period}</td><td>{row.note}</td></tr>)}</tbody>
          </table></div>
          <p className="rv-foot-note">※ 향후 일정은 최초 개발 로드맵 기준이며, 개발 진행 상황 및 외부 연동 일정에 따라 조정될 수 있습니다.</p>
        </>}
        <div className="rv-foot"><span>{r.name}</span></div>
      </article>

      {r.sources?.commits?.length > 0 && (
        <details className="rv-sources">
          <summary>근거 · 커밋 {r.sources.commits.length}개 · PR {r.sources.pulls.length}개{r.sources.truncated ? " · 일부 생략" : ""}</summary>
          <ul>
            {r.sources.pulls.map((p) => <li key={`p${p.number}`}><a href={p.url} target="_blank" rel="noreferrer">#{p.number}</a> {p.title}</li>)}
            {r.sources.commits.map((cm) => <li key={cm.sha}><a href={cm.url} target="_blank" rel="noreferrer">{cm.sha}</a> {cm.message}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}
