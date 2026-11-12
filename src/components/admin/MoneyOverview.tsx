"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/components/admin/api";

type Quote = {
  id: string; project_id: string; project_name: string; number: string; title: string;
  issue_date: string; valid_until: string | null; status: string;
  items: Array<{ quantity: number; unit_price: number }>; tax_amount: number;
};
type Invoice = {
  id: string; project_id: string; project_name: string; title: string;
  amount: number; paid_amount: number; balance: number; due_date: string | null;
};
type Row = {
  key: string; name: string; stage: string; amount: number; paid: number | null;
  due: string; tone: "" | "is-danger" | "is-warn"; href: string; action: string; group: Filter;
};
type Filter = "all" | "quote" | "unpaid" | "done";

const won = (value: number) => new Intl.NumberFormat("ko-KR").format(value) + "원";
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

export default function MoneyOverview() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([api<Quote[]>("/api/admin/quotes"), api<Invoice[]>("/api/admin/payments")])
      .then(([quoteRows, invoiceRows]) => {
        if (!active) return;
        setQuotes(quoteRows);
        setInvoices(invoiceRows);
      })
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : "불러오기 실패"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const now = today();
  const rows = useMemo<Row[]>(() => {
    const quoteRows: Row[] = quotes
      .filter((quote) => quote.status === "초안" || quote.status === "발송")
      .map((quote) => ({
        key: `q-${quote.id}`,
        name: `${quote.project_name} · ${quote.title || quote.number}`,
        stage: quote.status === "초안" ? "견적 작성 중" : "견적 발송 · 회신 대기",
        amount: quote.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0) + quote.tax_amount,
        paid: null,
        due: quote.valid_until ? quote.valid_until.slice(5).replace("-", "/") : "—",
        tone: quote.valid_until && quote.valid_until < now ? "is-warn" : "",
        href: `/admin/money?tab=quotes&quote=${quote.id}`,
        action: quote.status === "초안" ? "이어 쓰기" : "열기",
        group: "quote",
      }));
    const invoiceRows: Row[] = invoices.map((invoice) => {
      const late = invoice.balance > 0 && !!invoice.due_date && invoice.due_date < now;
      return {
        key: `i-${invoice.id}`,
        name: `${invoice.project_name} · ${invoice.title}`,
        stage: invoice.balance <= 0 ? "완납" : invoice.paid_amount > 0 ? "일부 입금" : "입금 대기",
        amount: invoice.amount,
        paid: invoice.paid_amount,
        due: invoice.due_date ? invoice.due_date.slice(5).replace("-", "/") : "—",
        tone: late ? "is-danger" : "",
        href: `/admin/projects/${invoice.project_id}?tab=입금`,
        action: invoice.balance > 0 ? "입금 기록" : "보기",
        group: invoice.balance > 0 ? "unpaid" : "done",
      };
    });
    const rank = (row: Row) => (row.tone === "is-danger" ? 0 : row.group === "unpaid" ? 1 : row.group === "quote" ? 2 : 3);
    return [...invoiceRows, ...quoteRows].sort((a, b) => rank(a) - rank(b));
  }, [quotes, invoices, now]);

  const unpaid = invoices.filter((invoice) => invoice.balance > 0);
  const late = unpaid.filter((invoice) => invoice.due_date && invoice.due_date < now);
  const paidTotal = invoices.reduce((sum, invoice) => sum + invoice.paid_amount, 0);
  const visible = rows.filter((row) => filter === "all" || row.group === filter);

  return (
    <div className="rd-page">
      {error && <p role="alert" className="rd-error">{error}</p>}
      <div className="rd-stats">
        <div className="rd-stat"><span>견적 대기</span><strong>{rows.filter((row) => row.group === "quote").length}건</strong></div>
        <div className="rd-stat"><span>받을 금액</span><strong className={unpaid.length ? "is-warn" : ""}>{won(unpaid.reduce((s, i) => s + i.balance, 0))}</strong></div>
        <div className="rd-stat"><span>연체</span><strong className={late.length ? "is-danger" : ""}>{won(late.reduce((s, i) => s + i.balance, 0))}</strong></div>
        <div className="rd-stat"><span>받은 금액 합계</span><strong>{won(paidTotal)}</strong></div>
      </div>
      <section className="rd-card">
        <div className="rd-tabs">
          {([["all", "전체"], ["quote", "견적 대기"], ["unpaid", "입금 대기"], ["done", "완료"]] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>
          ))}
        </div>
        <div className="rd-table-wrap">
          <table className="rd-table">
            <thead>
              <tr><th>프로젝트 · 항목</th><th>진행</th><th className="num">금액</th><th className="num">받은 금액</th><th className="num">기한</th><th aria-label="동작" /></tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.key}>
                  <td>{row.name}</td>
                  <td className="muted">{row.stage}</td>
                  <td className="num">{won(row.amount)}</td>
                  <td className="num">{row.paid === null ? "—" : won(row.paid)}</td>
                  <td className={`num ${row.tone}`}>{row.due}</td>
                  <td className="num"><Link href={row.href} className="rd-btn rd-btn-sm">{row.action}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && visible.length === 0 && <div className="rd-empty">해당 항목이 없어요.</div>}
          {loading && <div className="rd-empty">불러오는 중…</div>}
        </div>
      </section>
    </div>
  );
}
