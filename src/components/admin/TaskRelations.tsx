"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "./api";

type Option = { id: string; title: string; status: string; archived: number; parent_id: string | null; depends_on_id: string | null };
type Data = { parent_id: string | null; depends_on_id: string | null; options: Option[] };

export default function TaskRelations({ taskId, projectId, refresh }: { taskId: string; projectId: string; refresh: () => Promise<void> }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  useEffect(() => {
    let active = true;
    api<Data>(`/api/admin/tasks/${taskId}/relations`).then((value) => { if (active) setData(value); }).catch((e: Error) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [taskId]);
  async function change(field: string, value: string) {
    setBusy(true); setError("");
    try {
      await api(`/api/admin/tasks/${taskId}/relations`, "PATCH", { [field]: value || null });
      setData(await api<Data>(`/api/admin/tasks/${taskId}/relations`));
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "연결 저장 실패"); }
    finally { setBusy(false); }
  }
  const dependency = data?.options.find((item) => item.id === data.depends_on_id);
  return <section className="mb-5 rounded-xl bg-[#f5f3ff] p-3 text-xs">
    <h3 className="mb-2 font-semibold">작업 연결</h3>
    {error && <p role="alert" className="mb-2 text-red-600">{error}</p>}
    {!data ? (!error && <p>연결 불러오는 중…</p>) : <>
      <div className="grid gap-2 sm:grid-cols-2">
        {([["parent_id", "상위 작업"], ["depends_on_id", "먼저 끝낼 작업"]] as const).map(([field, label]) => <label key={field}>{label}
          <select aria-label={label} disabled={busy} value={data[field] || ""} onChange={(e) => void change(field, e.target.value)} className="mt-1 w-full rounded-lg border border-black/10 bg-white p-2">
            <option value="">없음</option>
            {data.options.filter((item) => item.id !== taskId && (!item.archived || item.id === data[field])).map((item) => <option key={item.id} value={item.id}>{item.title} · {item.archived ? "보관됨" : item.status}</option>)}
          </select>
        </label>)}
      </div>
      {dependency && <p className="mt-2 text-amber-800">선행 작업: {dependency.title} · {dependency.archived ? "보관됨 — 연결을 확인하세요" : dependency.status} (진행 참고용)</p>}
      <div className="mt-3 space-y-1">{data.options.filter((item) => item.parent_id === taskId && !item.archived).map((item) => <Link className="block rounded-lg bg-white p-2" key={item.id} href={`/admin/projects/${projectId}?task=${item.id}`}>↳ {item.title} · {item.status}</Link>)}</div>
      <form className="mt-2 flex gap-2" onSubmit={async (event) => {
        event.preventDefault(); setBusy(true); setError("");
        try {
          await api(`/api/admin/tasks/${taskId}/children`, "POST", { title });
          setTitle(""); setData(await api<Data>(`/api/admin/tasks/${taskId}/relations`)); await refresh();
        } catch (e) { setError(e instanceof Error ? e.message : "추가 실패"); }
        finally { setBusy(false); }
      }}>
        <input aria-label="하위 작업 제목" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="하위 작업 추가" className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white p-2" />
        <button disabled={busy} className="rounded-lg bg-[#6853d7] px-3 text-white">추가</button>
      </form>
    </>}
  </section>;
}
