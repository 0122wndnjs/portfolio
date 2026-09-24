"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FiArrowLeft, FiFileText, FiPlus, FiPrinter, FiX } from "react-icons/fi";
import { projectColor } from "@/lib/admin/project-colors";

type Item = { name: string; quantity: number; unit_price: number };
type Quote = {
  id: string; project_id: string; project_name: string; number: string; title: string;
  sender: string; recipient: string; issue_date: string; valid_until: string | null;
  status: string; items: Item[]; tax_amount: number; note: string;
  imported_item_count: number;
};
type Project = { id: string; name: string; client: string };
type Draft = Omit<Quote, "id" | "project_name" | "number" | "imported_item_count">;
const won = (value: number) => new Intl.NumberFormat("ko-KR").format(value) + "원";
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
const newDraft = (project?: Project, sender = ""): Draft => ({
  project_id: project?.id || "", title: project ? `${project.name} 견적서` : "",
  sender, recipient: project?.client || "", issue_date: today(), valid_until: null,
  status: "초안", items: [{ name: "", quantity: 1, unit_price: 0 }], tax_amount: 0, note: "",
});
async function api<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "요청을 완료하지 못했습니다.");
  return data as T;
}
async function fetchQuoteData() {
  const [quotes, active, finished, cancelled] = await Promise.all([
    api<Quote[]>("/api/admin/quotes"),
    api<Project[]>("/api/admin/projects?kind=외주"),
    api<Project[]>("/api/admin/projects?status=완료&kind=외주"),
    api<Project[]>("/api/admin/projects?status=취소&kind=외주"),
  ]);
  return { quotes, projects: [...active, ...finished, ...cancelled] };
}

export default function QuotesPage({ initialProjectId = "" }: { initialProjectId?: string }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Quote | null>(null);
  const [filter, setFilter] = useState(initialProjectId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [itemsLocked, setItemsLocked] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      const data = await fetchQuoteData();
      setQuotes(data.quotes);
      setProjects(data.projects);
      setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "견적서를 불러오지 못했어요."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    void fetchQuoteData().then((data) => {
      if (!active) return;
      setQuotes(data.quotes);
      setProjects(data.projects);
      setLoading(false);
    }).catch((e: unknown) => {
      if (!active) return;
      setError(e instanceof Error ? e.message : "견적서를 불러오지 못했어요.");
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const openNew = () => {
    const project = projects.find((item) => item.id === filter) || projects[0];
    setDraft(newDraft(project, quotes[0]?.sender || ""));
    setEditingId(null);
    setItemsLocked(false);
    setError("");
  };
  const edit = (quote: Quote) => {
    setDraft({ project_id: quote.project_id, title: quote.title, sender: quote.sender, recipient: quote.recipient, issue_date: quote.issue_date, valid_until: quote.valid_until, status: quote.status, items: quote.items.map((item) => ({ ...item })), tax_amount: quote.tax_amount, note: quote.note });
    setEditingId(quote.id);
    setItemsLocked(quote.imported_item_count > 0);
    setError("");
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft || saving) return;
    setSaving(true);
    setError("");
    try {
      await api(editingId ? `/api/admin/quotes/${editingId}` : "/api/admin/quotes", editingId ? "PATCH" : "POST", draft);
      await load();
      setDraft(null);
      setEditingId(null);
      setNotice(editingId ? "견적서를 수정했어요." : "견적서를 만들었어요.");
    } catch (e) { setError(e instanceof Error ? e.message : "저장하지 못했어요."); }
    finally { setSaving(false); }
  };
  const updateItem = (index: number, key: keyof Item, value: string) => {
    if (!draft) return;
    const items = draft.items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: key === "name" ? value : Number(value) } : item);
    setDraft({ ...draft, items });
  };
  const importTasks = async (quote: Quote) => {
    if (importing) return;
    setImporting(quote.id);
    setError("");
    try {
      const result = await api<{ created: number }>(`/api/admin/quotes/${quote.id}/import-tasks`, "POST");
      await load();
      setNotice(`${result.created}개 작업을 ${quote.project_name} 보드에 추가했어요.`);
    } catch (e) { setError(e instanceof Error ? e.message : "작업을 가져오지 못했어요."); }
    finally { setImporting(null); }
  };
  const subtotal = draft?.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0) || 0;
  const visible = quotes.filter((quote) => !filter || quote.project_id === filter);

  return (
    <div className="quotes-page">
      <header className="quotes-heading">
        <div><h1>견적서</h1><p>프로젝트별 견적을 작성하고 인쇄하거나 PDF로 저장하세요.</p></div>
        <button type="button" className="board-primary" onClick={openNew} disabled={!projects.length}><FiPlus /> 견적서 만들기</button>
      </header>
      {error && <p className="board-error" role="alert">{error}<button type="button" onClick={() => setError("")} aria-label="오류 닫기"><FiX /></button></p>}
      {notice && <p className="quotes-notice" role="status">{notice}</p>}
      <div className="quotes-toolbar">
        <select aria-label="프로젝트 필터" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="">모든 프로젝트</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <span>{visible.length}건</span>
      </div>
      {loading ? <p className="quotes-empty">견적서를 불러오는 중…</p> : !projects.length ? <div className="quotes-empty">견적서를 만들려면 외주 프로젝트가 필요해요.<br /><Link href="/admin/projects?kind=외주&new=1">외주 프로젝트 만들기 →</Link></div> : !visible.length ? <div className="quotes-empty">아직 견적서가 없어요.<br />첫 견적서를 만들어보세요.</div> : <div className="quotes-list">
        {visible.map((quote) => {
          const amount = quote.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0) + quote.tax_amount;
          return <article className="quote-card" key={quote.id} style={{ "--project-solid": projectColor(quote.project_id).solid } as React.CSSProperties}>
            <div className="quote-card-main"><span className="quote-card-icon"><FiFileText /></span><div><span className="quote-number">{quote.number} · {quote.project_name}</span><h2>{quote.title}</h2><p>{quote.recipient} · 발행 {quote.issue_date}{quote.valid_until ? ` · 유효 ${quote.valid_until}` : ""}</p></div></div>
            <div className="quote-card-side"><strong>{won(amount)}</strong><span className={`quote-status status-${quote.status}`}>{quote.status}</span></div>
            <div className="quote-card-actions"><button type="button" onClick={() => edit(quote)}>수정</button><button type="button" onClick={() => setPreview(quote)}>미리보기 · 인쇄</button>{quote.status === "수락" && quote.imported_item_count < quote.items.length && <button type="button" disabled={importing === quote.id} onClick={() => void importTasks(quote)}>{importing === quote.id ? "가져오는 중…" : "작업으로 가져오기"}</button>}{quote.imported_item_count > 0 && <Link href={`/admin/projects/${quote.project_id}`}>작업 {quote.imported_item_count}개 연결됨 ↗</Link>}</div>
          </article>;
        })}
      </div>}

      {draft && <div className="quote-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDraft(null); }}><section className="quote-editor" role="dialog" aria-modal="true" aria-label={editingId ? "견적서 수정" : "견적서 만들기"}>
        <div className="quote-editor-heading"><div><h2>{editingId ? "견적서 수정" : "새 견적서"}</h2><p>항목별 단가와 수량을 입력하세요.</p></div><button type="button" onClick={() => setDraft(null)} aria-label="닫기"><FiX /></button></div>
        <form onSubmit={(event) => void save(event)} className="quote-form">
          <div className="quote-form-grid">
            <label>프로젝트<select value={draft.project_id} disabled={itemsLocked} onChange={(event) => { const project = projects.find((item) => item.id === event.target.value); setDraft({ ...draft, project_id: event.target.value, recipient: project?.client || draft.recipient }); }} required>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
            <label>진행 상태 (수동 기록)<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>{["초안", "발송", "수락", "거절"].map((status) => <option key={status}>{status}</option>)}</select></label>
            <label className="quote-span">견적서 제목<input required maxLength={120} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="웹사이트 구축 견적서" /></label>
            <label>보내는 사람 / 업체<input maxLength={120} value={draft.sender} onChange={(event) => setDraft({ ...draft, sender: event.target.value })} placeholder="이름 또는 상호" /></label>
            <label>받는 사람 / 업체<input required maxLength={120} value={draft.recipient} onChange={(event) => setDraft({ ...draft, recipient: event.target.value })} /></label>
            <label>발행일<input type="date" required value={draft.issue_date} onChange={(event) => setDraft({ ...draft, issue_date: event.target.value })} /></label>
            <label>유효기간<input type="date" value={draft.valid_until || ""} min={draft.issue_date} onChange={(event) => setDraft({ ...draft, valid_until: event.target.value || null })} /></label>
          </div>
          <div className="quote-items-heading"><h3>견적 항목</h3>{itemsLocked ? <span className="quote-items-locked">작업으로 가져온 항목은 수정할 수 없어요.</span> : <button type="button" onClick={() => setDraft({ ...draft, items: [...draft.items, { name: "", quantity: 1, unit_price: 0 }] })} disabled={draft.items.length >= 50}><FiPlus /> 항목 추가</button>}</div>
          <div className="quote-items">{draft.items.map((item, index) => <div className="quote-item" key={index}>
            <label>항목<input required disabled={itemsLocked} maxLength={200} value={item.name} onChange={(event) => updateItem(index, "name", event.target.value)} placeholder="작업 내용" /></label>
            <label>수량<input type="number" disabled={itemsLocked} min={1} max={100000} required value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} /></label>
            <label>단가<input type="number" disabled={itemsLocked} min={0} max={100000000000} required value={item.unit_price} onChange={(event) => updateItem(index, "unit_price", event.target.value)} /></label>
            <strong>{won(item.quantity * item.unit_price)}</strong>
            <button type="button" onClick={() => setDraft({ ...draft, items: draft.items.filter((_, itemIndex) => itemIndex !== index) })} disabled={itemsLocked || draft.items.length === 1} aria-label={`${index + 1}번 항목 삭제`}><FiX /></button>
          </div>)}</div>
          <div className="quote-form-grid quote-form-bottom"><label>부가세 (직접 입력)<input type="number" min={0} value={draft.tax_amount} onChange={(event) => setDraft({ ...draft, tax_amount: Number(event.target.value) })} /></label><div className="quote-totals"><span>공급가액 {won(subtotal)}</span><span>부가세 {won(draft.tax_amount)}</span><strong>합계 {won(subtotal + draft.tax_amount)}</strong></div><label className="quote-span">안내 / 조건<textarea maxLength={5000} rows={3} value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="작업 범위, 결제 조건, 유효기간 안내 등" /></label></div>
          <div className="quote-editor-footer"><button type="button" className="board-secondary" onClick={() => setDraft(null)}>취소</button><button type="submit" className="board-primary" disabled={saving}>{saving ? "저장 중…" : "견적서 저장"}</button></div>
        </form>
      </section></div>}

      {preview && <div className="quote-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreview(null); }}><section className="quote-preview-dialog" role="dialog" aria-modal="true" aria-label="견적서 미리보기"><div className="quote-preview-controls"><button type="button" onClick={() => setPreview(null)}><FiArrowLeft /> 목록</button><button type="button" className="board-primary" onClick={() => window.print()}><FiPrinter /> 인쇄 / PDF 저장</button></div><QuoteDocument quote={preview} /></section></div>}
    </div>
  );
}

function QuoteDocument({ quote }: { quote: Quote }) {
  const subtotal = quote.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  return <article className="quote-document">
    <header><span>ESTIMATE</span><h1>견적서</h1><p>{quote.number}</p></header>
    <div className="quote-document-title"><h2>{quote.title}</h2><span>{quote.status}</span></div>
    <div className="quote-document-info"><div><small>받는 분</small><strong>{quote.recipient}</strong><small>프로젝트</small><strong>{quote.project_name}</strong></div><div><small>보내는 분</small><strong>{quote.sender || "—"}</strong><small>발행일 · 유효기간</small><strong>{quote.issue_date} · {quote.valid_until || "별도 안내"}</strong></div></div>
    <table><thead><tr><th>견적 항목</th><th>수량</th><th>단가</th><th>금액</th></tr></thead><tbody>{quote.items.map((item, index) => <tr key={index}><td>{item.name}</td><td>{item.quantity}</td><td>{won(item.unit_price)}</td><td>{won(item.quantity * item.unit_price)}</td></tr>)}</tbody></table>
    <div className="quote-document-total"><span>공급가액 <strong>{won(subtotal)}</strong></span><span>부가세 <strong>{won(quote.tax_amount)}</strong></span><p>합계 <strong>{won(subtotal + quote.tax_amount)}</strong></p></div>
    {quote.note && <div className="quote-document-note"><strong>안내 및 조건</strong><p>{quote.note}</p></div>}
  </article>;
}
