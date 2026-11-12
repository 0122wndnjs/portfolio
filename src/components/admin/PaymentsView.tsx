"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FiPlus, FiSearch } from "react-icons/fi";
import { api } from "@/components/admin/api";
import PaymentAmountFields from "@/components/admin/PaymentAmountFields";
import PaymentRow from "@/components/admin/PaymentRow";
import SidePanel from "./SidePanel";
import { seoulToday, shortDate, won } from "./redesign-utils";

type Payment = { id: string; amount: number; withholding_amount: number; paid_at: string; memo: string };
type Invoice = {
  id: string; project_id: string; project_name: string; title: string;
  amount: number; paid_amount: number; withholding_amount: number; net_received_amount: number;
  balance: number; due_date: string | null; payments: Payment[];
};
type Project = { id: string; name: string; kind: string; status: string };
type Filter = "open" | "done" | "all";

async function load() {
  const [invoices, projects] = await Promise.all([
    api<Invoice[]>("/api/admin/payments"),
    api<Project[]>("/api/admin/projects?status=전체"),
  ]);
  return { invoices, projects: projects.filter((project) => project.kind === "외주" && project.status !== "취소") };
}

export default function PaymentsView() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<Filter>("open");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftAmount, setDraftAmount] = useState("");
  const today = seoulToday();

  const reload = useCallback(async () => {
    try {
      const data = await load();
      setInvoices(data.invoices);
      setProjects(data.projects);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    }
  }, []);
  useEffect(() => {
    let active = true;
    load()
      .then((data) => {
        if (!active) return;
        setInvoices(data.invoices);
        setProjects(data.projects);
      })
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : "불러오기 실패"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const open = invoices.filter((invoice) => invoice.balance > 0);
  const late = open.filter((invoice) => invoice.due_date && invoice.due_date < today);
  const visible = invoices
    .filter((invoice) => (filter === "open" ? invoice.balance > 0 : filter === "done" ? invoice.balance <= 0 : true))
    .filter((invoice) => `${invoice.project_name} ${invoice.title}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => Number(a.balance <= 0) - Number(b.balance <= 0) || (a.due_date || "9999").localeCompare(b.due_date || "9999"));
  const selected = invoices.find((invoice) => invoice.id === openId);

  async function createInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    setSaving(true);
    try {
      await api(`/api/admin/projects/${String(values.project)}/invoices`, "POST", values);
      setCreating(false);
      setNotice("청구를 추가했어요.");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "청구를 추가하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function editInvoice(event: FormEvent<HTMLFormElement>, invoice: Invoice) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    const amount = Number(values.amount);
    const syncPayment = values.sync_payment === "on" && invoice.payments.length === 1;
    setSaving(true);
    try {
      // 청구액을 입금액보다 낮추는 경우: 입금 기록을 먼저 줄여야 서버 검증(누적 입금 ≤ 청구액)을 통과한다.
      if (syncPayment && amount < invoice.paid_amount)
        await api(`/api/admin/payments/${invoice.payments[0].id}`, "PATCH", { amount });
      await api(`/api/admin/invoices/${invoice.id}`, "PATCH", { title: values.title, amount, due_date: values.due_date || null });
      if (syncPayment && amount > invoice.paid_amount)
        await api(`/api/admin/payments/${invoice.payments[0].id}`, "PATCH", { amount });
      setEditing(false);
      setNotice("청구를 수정했어요.");
      setError("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "수정하지 못했습니다.");
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function recordPayment(event: FormEvent<HTMLFormElement>, invoice: Invoice) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    try {
      await api(`/api/admin/invoices/${invoice.id}/payments`, "POST", Object.fromEntries(new FormData(form).entries()));
      form.reset();
      setNotice("입금을 기록했어요.");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rd-page">
      <div className="rd-stats">
        <div className="rd-stat"><span>받을 금액</span><strong className={open.length ? "is-warn" : ""}>{won(open.reduce((s, i) => s + i.balance, 0))}</strong></div>
        <div className="rd-stat"><span>미완료 청구</span><strong>{open.length}건</strong></div>
        <div className="rd-stat"><span>연체</span><strong className={late.length ? "is-danger" : ""}>{late.length}건</strong></div>
        <div className="rd-stat"><span>실수령액 합계</span><strong>{won(invoices.reduce((s, i) => s + i.net_received_amount, 0))}</strong></div>
      </div>
      {error && <p role="alert" className="rd-error">{error}</p>}
      {notice && <p className="rd-eyebrow" aria-live="polite">{notice}</p>}
      <section className="rd-card">
        <div className="rd-tabs rd-tabs-split">
          <div>
            {([["open", "받을 금액"], ["done", "입금 완료"], ["all", "전체"]] as const).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>
            ))}
          </div>
          <div className="rd-actions">
            <label className="rd-search rd-search-sm"><FiSearch aria-hidden="true" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="프로젝트·항목 검색" aria-label="청구 검색" /></label>
            <button type="button" className="rd-btn is-primary" disabled={!projects.length} onClick={() => setCreating(true)}><FiPlus /> 청구 추가</button>
          </div>
        </div>
        <div className="rd-table-wrap">
          <table className="rd-table">
            <thead><tr><th>프로젝트 · 항목</th><th>진행</th><th className="num">청구</th><th className="num">받은 금액</th><th className="num">남은 금액</th><th className="num">입금 예정</th><th aria-label="동작" /></tr></thead>
            <tbody>
              {visible.map((invoice) => {
                const isLate = invoice.balance > 0 && !!invoice.due_date && invoice.due_date < today;
                return (
                  <tr key={invoice.id} className={openId === invoice.id ? "is-selected" : ""}>
                    <td><button type="button" className="rd-row-button rd-link" onClick={() => { setOpenId(invoice.id); setEditing(false); }}>{invoice.project_name} · {invoice.title}</button></td>
                    <td className="muted">
                      <span className="rd-progress"><span style={{ width: `${Math.min(100, (100 * invoice.paid_amount) / Math.max(invoice.amount, 1))}%` }} /></span>
                      {invoice.balance <= 0 ? "완납" : invoice.paid_amount > 0 ? "일부 입금" : "입금 대기"}
                    </td>
                    <td className="num">{won(invoice.amount)}</td>
                    <td className="num">{won(invoice.paid_amount)}</td>
                    <td className={`num ${invoice.balance > 0 ? "is-warn" : ""}`}>{invoice.balance > 0 ? won(invoice.balance) : "—"}</td>
                    <td className={`num ${isLate ? "is-danger" : ""}`}>{invoice.due_date ? shortDate(invoice.due_date) : "—"}</td>
                    <td className="num"><button type="button" className="rd-btn rd-btn-sm" onClick={() => setOpenId(invoice.id)}>{invoice.balance > 0 ? "입금 기록" : "보기"}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {loading && <div className="rd-empty">불러오는 중…</div>}
          {!loading && visible.length === 0 && <div className="rd-empty">{query ? "검색 결과가 없어요." : "해당 청구가 없어요."}</div>}
        </div>
      </section>

      {selected && (
        <SidePanel title={selected.title} eyebrow={selected.project_name} onClose={() => { setOpenId(null); setEditing(false); }}>
          {editing ? (
            <form className="rd-form" onSubmit={(event) => void editInvoice(event, selected)}>
              <h3>청구 수정</h3>
              <label>청구 항목<input name="title" required maxLength={100} defaultValue={selected.title} /></label>
              <label>청구 금액<input name="amount" required type="number" min={1} step={1} value={draftAmount} onChange={(e) => setDraftAmount(e.target.value)} /></label>
              <label>입금 예정일<input name="due_date" type="date" defaultValue={selected.due_date || ""} /></label>
              {selected.payments.length === 1 && selected.paid_amount > 0 && Number(draftAmount) !== selected.paid_amount && (
                <label className="rd-check"><input name="sync_payment" type="checkbox" defaultChecked={selected.balance <= 0} /> 입금 기록도 {won(Number(draftAmount) || 0)}으로 맞추기</label>
              )}
              {selected.payments.length > 1 && Number(draftAmount) < selected.paid_amount && (
                <p className="rd-eyebrow">이미 받은 돈({won(selected.paid_amount)})보다 낮출 수 없어요. 아래 입금 내역에서 금액을 먼저 고쳐주세요.</p>
              )}
              <div className="rd-actions">
                <button type="submit" className="rd-btn is-primary" disabled={saving}>{saving ? "저장 중…" : "저장"}</button>
                <button type="button" className="rd-btn" onClick={() => setEditing(false)}>취소</button>
              </div>
            </form>
          ) : (
            <button type="button" className="rd-btn rd-btn-sm" onClick={() => { setDraftAmount(String(selected.amount)); setEditing(true); }}>청구 수정</button>
          )}
          <div className="rd-kv">
            <span>청구</span><strong>{won(selected.amount)}</strong>
            <span>받은 금액</span><strong>{won(selected.paid_amount)}</strong>
            {selected.withholding_amount > 0 && <><span>공제</span><strong>{won(selected.withholding_amount)}</strong></>}
            <span>실수령</span><strong>{won(selected.net_received_amount)}</strong>
            <span>남은 금액</span><strong className={selected.balance > 0 ? "is-warn" : ""}>{selected.balance > 0 ? won(selected.balance) : "입금 완료"}</strong>
            <span>입금 예정</span><strong>{selected.due_date || "미정"}</strong>
          </div>
          <span className="rd-progress rd-progress-lg"><span style={{ width: `${Math.min(100, (100 * selected.paid_amount) / Math.max(selected.amount, 1))}%` }} /></span>
          {selected.balance > 0 && (
            <form className="rd-form" onSubmit={(event) => void recordPayment(event, selected)}>
              <h3>입금 기록</h3>
              <PaymentAmountFields key={`${selected.id}:${selected.paid_amount}`} max={selected.balance} />
              <label>입금일<input name="paid_at" type="date" defaultValue={today} required /></label>
              <label>메모<input name="memo" placeholder="선택 입력" /></label>
              <button type="submit" className="rd-btn is-primary" disabled={saving}>{saving ? "저장 중…" : "기록 저장"}</button>
            </form>
          )}
          {selected.payments.length > 0 && (
            <div className="rd-note">
              <h3>입금 내역 {selected.payments.length}건</h3>
              {selected.payments.map((payment) => <PaymentRow key={payment.id} payment={payment} onChanged={reload} onError={setError} />)}
            </div>
          )}
          <Link href={`/admin/projects/${selected.project_id}?tab=입금`} className="rd-more">프로젝트에서 보기 →</Link>
        </SidePanel>
      )}

      {creating && (
        <SidePanel title="청구 추가" onClose={() => setCreating(false)}>
          <form className="rd-form" onSubmit={(event) => void createInvoice(event)}>
            <label>프로젝트
              <select name="project" required defaultValue="">
                <option value="" disabled>프로젝트 선택</option>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              </select>
            </label>
            <label>청구 항목<input name="title" required maxLength={100} placeholder="예: 착수금" /></label>
            <label>청구 금액<input name="amount" required type="number" min={1} step={1} placeholder="원" /></label>
            <label>입금 예정일<input name="due_date" type="date" /></label>
            <button type="submit" className="rd-btn is-primary" disabled={saving}>{saving ? "저장 중…" : "청구 추가"}</button>
          </form>
        </SidePanel>
      )}
    </div>
  );
}
