"use client";

import { useState, type FormEvent } from "react";
import { api } from "@/components/admin/api";

/** 청구 항목명·청구 금액·입금 예정일 수정. 청구 금액은 이미 받은 금액보다 낮출 수 없다(서버 검증). */
export default function InvoiceEdit({
  invoice,
  onSaved,
  onError,
}: {
  invoice: { id: string; title: string; amount: number; paid_amount: number; due_date: string | null };
  onSaved: () => void | Promise<void>;
  onError: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (Number(values.amount) < invoice.paid_amount) {
      onError(`이미 받은 금액(${invoice.paid_amount.toLocaleString("ko-KR")}원)보다 낮출 수 없어요. 입금 기록을 먼저 수정하거나 취소하세요.`);
      return;
    }
    setSaving(true);
    try {
      await api(`/api/admin/invoices/${invoice.id}`, "PATCH", { title: values.title, amount: Number(values.amount), due_date: values.due_date || null });
      setOpen(false);
      await onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : "청구를 수정하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (!open)
    return (
      <button type="button" className="rd-btn rd-btn-sm" onClick={() => setOpen(true)}>
        청구 수정
      </button>
    );
  return (
    <form className="rd-inline-form" onSubmit={(e) => void save(e)}>
      <label>항목<input name="title" required maxLength={100} defaultValue={invoice.title} /></label>
      <label>청구 금액<input name="amount" required type="number" min={Math.max(1, invoice.paid_amount)} step={1} defaultValue={invoice.amount} /></label>
      <label>입금 예정일<input name="due_date" type="date" defaultValue={invoice.due_date || ""} /></label>
      <button type="submit" className="rd-btn rd-btn-sm is-primary" disabled={saving}>{saving ? "저장 중…" : "저장"}</button>
      <button type="button" className="rd-btn rd-btn-sm" onClick={() => setOpen(false)}>취소</button>
    </form>
  );
}
