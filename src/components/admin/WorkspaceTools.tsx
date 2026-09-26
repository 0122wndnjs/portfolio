"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "./api";
import { seoulDate, addDays } from "@/lib/admin/validation";

type Result = { id: string; type: string; project_id: string; title: string; excerpt: string };
type Trash = { id: string; entity: string; title: string; deleted_at: string };
type ReportItem = { id: string; title: string; project_name: string; kind: string; decisions?: string };
type Report = { start: string; end: string; tasks: ReportItem[]; meetings: ReportItem[]; projects: { id: string; name: string; kind: string; next_action: string; waiting_reason: string; next_check_date: string | null }[] };
type Preview = { fingerprint: string; added: Record<string, number>; skipped: Record<string, number>; conflicts: string[]; conflictCount: number };
const labels: Record<string, string> = { project: "프로젝트·메모", task: "작업", meeting: "미팅", quote: "견적서", invoice: "청구", payment: "입금" };
const fieldClass = "rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm";
const buttonClass = "rounded-xl bg-[#6853d7] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50";
function monday() {
  const today = seoulDate();
  const day = new Date(today + "T00:00:00+09:00").getUTCDay();
  // UTC is the previous day at Seoul midnight: Sunday UTC means Monday Seoul.
  return addDays(today, -day);
}
export default function WorkspaceTools() {
  const [tab, setTab] = useState("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searched, setSearched] = useState(false);
  const [start, setStart] = useState(monday);
  const [kind, setKind] = useState("회사");
  const [report, setReport] = useState<Report | null>(null);
  const [trash, setTrash] = useState<Trash[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [backup, setBackup] = useState<unknown>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  useEffect(() => {
    if (tab !== "trash") return;
    let active = true;
    api<Trash[]>("/api/admin/trash").then((rows) => { if (active) setTrash(rows); }).catch((e: Error) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [tab]);
  const matches = (value: string) => !kind || (kind === "회사" ? value !== "외주" : value === "외주");
  const reportText = report ? [
    `주간 업무 보고 · ${report.start} ~ ${report.end}`,
    "", "완료한 업무",
    ...report.tasks.filter((item) => matches(item.kind)).map((item) => `- [${item.project_name}] ${item.title}`),
    "", "미팅·결정사항",
    ...report.meetings.filter((item) => matches(item.kind)).map((item) => `- [${item.project_name}] ${item.title}\n  ${item.decisions || "결정사항 미기록"}`),
    "", "현재 다음 행동·대기 사항",
    ...report.projects.filter((item) => matches(item.kind) && (item.next_action || item.waiting_reason || item.next_check_date)).map((item) => `- ${item.name}: ${item.next_action || "다음 행동 미등록"}${item.waiting_reason ? " / 대기: " + item.waiting_reason : ""}${item.next_check_date ? " / 다음 확인: " + item.next_check_date : ""}`),
  ].join("\n") : "";
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(""); setNotice("");
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : "처리 실패"); }
    finally { setBusy(false); }
  }
  return <div className="space-y-4">
    <h1 className="text-xl font-semibold">업무 도구</h1>
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="업무 도구">
      {[["search", "통합 검색"], ["report", "주간 보고"], ["trash", "휴지통·복구"], ["export", "내보내기"]].map(([id, title]) => <button role="tab" aria-selected={tab === id} key={id} onClick={() => { setTab(id); setError(""); setNotice(""); }} className={tab === id ? buttonClass : fieldClass}>{title}</button>)}
    </div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="text-sm text-[#5035ba]">{notice}</p>}
    {tab === "search" && <>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void run(async () => { setResults(await api<Result[]>(`/api/admin/search?q=${encodeURIComponent(query)}`)); setSearched(true); }); }}>
        <input className={fieldClass + " min-w-0 flex-1"} aria-label="통합 검색어" required maxLength={200} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="프로젝트, 작업, 미팅, 견적, 청구, 입금 검색" />
        <button className={buttonClass} disabled={busy}>검색</button>
      </form>
      {searched && <p className="text-xs text-gray-500">{results.length}건{results.length === 100 ? " · 최대 100건, 검색어를 좁혀주세요." : ""}</p>}
      <div className="grid gap-2 md:grid-cols-2">{results.map((item) => <Link key={item.type + item.id} className="rounded-xl border border-black/5 bg-white p-4" href={item.type === "task" ? `/admin/projects/${item.project_id}?task=${item.id}` : item.type === "meeting" ? `/admin/meetings?project=${item.project_id}&meeting=${item.id}` : item.type === "quote" ? `/admin/quotes?project=${item.project_id}&quote=${item.id}` : item.type === "invoice" || item.type === "payment" ? `/admin/projects/${item.project_id}?tab=입금#${item.type}-${item.id}` : `/admin/projects/${item.id}?tab=링크·메모`}>
        <small className="text-[#6853d7]">{labels[item.type]}</small><h2 className="mt-1 text-sm font-semibold">{item.title}</h2><p className="mt-1 line-clamp-2 text-xs text-gray-500">{item.excerpt}</p>
      </Link>)}</div>
      {searched && !results.length && <p className="p-4 text-sm text-gray-500">일치하는 기록이 없습니다.</p>}
    </>}
    {tab === "report" && <>
      <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); void run(async () => setReport(await api<Report>(`/api/admin/weekly-report?start=${start}`))); }}>
        <label className="text-xs">시작일 · 7일간<input aria-label="보고 시작일" required type="date" className={fieldClass + " ml-2"} value={start} onChange={(e) => { setStart(e.target.value); setReport(null); }} /></label>
        <select aria-label="보고 업무 유형" className={fieldClass} value={kind} onChange={(e) => setKind(e.target.value)}><option value="회사">회사 업무</option><option value="외주">외주</option><option value="">전체</option></select>
        <button className={buttonClass} disabled={busy}>보고 만들기</button>
      </form>
      <p className="text-xs text-gray-500">완료 작업·미팅은 선택한 기간 기준. 다음 행동·대기 사항은 현재 상태입니다.</p>
      {report && <><textarea aria-label="주간 보고 내용" readOnly rows={18} className={fieldClass + " w-full font-mono"} value={reportText} /><button className={buttonClass} onClick={() => void run(async () => { await navigator.clipboard.writeText(reportText); setNotice("보고 내용 복사했어요."); })}>보고 복사</button></>}
    </>}
    {tab === "trash" && <>
      <p className="text-xs text-gray-500">보관한 작업과 삭제한 청구·입금을 복구합니다. 복구한 작업은 원래 프로젝트에 돌아갑니다.</p>
      <button disabled={busy} className={fieldClass} onClick={() => void run(async () => setTrash(await api<Trash[]>("/api/admin/trash")))}>새로고침</button>
      {trash.map((item) => <div key={item.entity + item.id} className="flex items-center justify-between gap-3 rounded-xl border border-black/5 bg-white p-3"><div className="min-w-0"><small className="text-gray-500">{labels[item.entity]} · {new Date(item.deleted_at).toLocaleDateString("ko-KR")}</small><p className="truncate text-sm">{item.title}</p></div><button disabled={busy} className={buttonClass} onClick={() => void run(async () => { await api(`/api/admin/trash/${item.id}/restore`, "POST", { entity: item.entity }); setTrash(await api<Trash[]>("/api/admin/trash")); setNotice("복구했어요."); })}>복구</button></div>)}
      {!trash.length && <p className="p-4 text-sm text-gray-500">복구할 항목이 없습니다.</p>}
    </>}
    {tab === "export" && <div className="grid gap-3 lg:grid-cols-2">
      <section className="space-y-4 rounded-xl border border-black/5 bg-white p-5"><h2 className="font-semibold">업무 데이터 내보내기</h2><p className="text-sm text-gray-500">프로젝트·작업·미팅·견적·청구·입금·휴지통을 JSON 파일로 저장합니다. 인증 정보와 텔레그램 비밀키는 포함하지 않습니다.</p><a download className={buttonClass + " inline-block"} href="/api/admin/export">JSON 다운로드</a></section>
      <section className="space-y-4 rounded-xl border border-black/5 bg-white p-5"><h2 className="font-semibold">백업 파일 복원</h2><p className="text-sm text-gray-500">먼저 추가·중복·충돌 건수를 확인합니다. 같은 ID에 다른 내용이 있으면 복원을 중단합니다. 기존 기록은 덮어쓰지 않습니다.</p>
        <input type="file" accept=".json,application/json" aria-label="백업 JSON 파일" className="block w-full text-xs" onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          setBackup(null); setPreview(null);
          if (!file) return;
          void run(async () => {
            if (file.size > 10_000_000) throw new Error("백업 파일은 10MB 이하여야 합니다.");
            const parsed: unknown = JSON.parse(await file.text());
            const result = await api<Preview>("/api/admin/import/preview", "POST", { backup: parsed });
            setBackup(parsed); setPreview(result);
          });
        }} />
        {preview && <div className="space-y-2 text-xs"><p>추가 {Object.values(preview.added).reduce((a, b) => a + b, 0)}건 · 이미 같은 기록 {Object.values(preview.skipped).reduce((a, b) => a + b, 0)}건 · 충돌 {preview.conflictCount}건</p>{preview.conflicts.length > 0 && <ul className="max-h-32 overflow-auto text-red-700">{preview.conflicts.map((item) => <li key={item}>{item}</li>)}</ul>}<button type="button" className={buttonClass} disabled={busy || !backup || preview.conflictCount > 0} onClick={() => void run(async () => { await api("/api/admin/import/apply", "POST", { backup, fingerprint: preview.fingerprint }); setBackup(null); setPreview(null); setNotice("백업 기록을 복원했어요. 화면을 새로고침하면 반영됩니다."); })}>충돌 없는 기록 복원</button></div>}
      </section>
    </div>}
  </div>;
}
