"use client";

import { useState, type FormEvent } from "react";

type Payment = { id: string; amount: number; paid_at: string; memo: string };

async function api(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "입금 내역을 수정하지 못했습니다.");
}

export default function PaymentRow({
  payment,
  onChanged,
  onError,
}: {
  payment: Payment;
  onChanged: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState(String(payment.amount));
  const [paidAt, setPaidAt] = useState(payment.paid_at.slice(0, 10));
  const [memo, setMemo] = useState(payment.memo);
  const date = new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${payment.paid_at.slice(0, 10)}T00:00:00Z`));

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await api(`/api/admin/payments/${payment.id}`, "PATCH", {
        amount: Number(amount),
        paid_at: paidAt,
        memo,
      });
      setEditing(false);
      await onChanged();
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "입금 내역을 수정하지 못했습니다.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (
      !window.confirm(
        "이 입금 내역을 삭제할까요? 미입금 잔액이 다시 계산됩니다.",
      )
    )
      return;
    try {
      await api(`/api/admin/payments/${payment.id}`, "DELETE");
      await onChanged();
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "입금 내역을 삭제하지 못했습니다.",
      );
    }
  }

  if (editing) {
    return (
      <form
        onSubmit={save}
        className="mt-3 grid gap-2 rounded-lg bg-[#f3f3f3] p-3 sm:grid-cols-[1fr_1fr_1.5fr_auto_auto] sm:items-end"
      >
        <label className="text-[10px] text-[#777783]">
          금액
          <input
            required
            min={1}
            step={1}
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="mt-1 block w-full rounded-lg border border-black/10 bg-white px-2 py-2 text-xs"
          />
        </label>
        <label className="text-[10px] text-[#777783]">
          입금일
          <input
            required
            type="date"
            value={paidAt}
            onChange={(event) => setPaidAt(event.target.value)}
            className="mt-1 block w-full rounded-lg border border-black/10 bg-white px-2 py-2 text-xs"
          />
        </label>
        <label className="text-[10px] text-[#777783]">
          메모
          <input
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            className="mt-1 block w-full rounded-lg border border-black/10 bg-white px-2 py-2 text-xs"
          />
        </label>
        <button
          disabled={saving}
          className="min-h-10 rounded-lg bg-[#303030] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          저장
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="min-h-10 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-[#606060]"
        >
          취소
        </button>
      </form>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.05] pt-3 text-[11px] text-[#777783]">
      <span>
        {date} · {new Intl.NumberFormat("ko-KR").format(payment.amount)}원
        {payment.memo && ` · ${payment.memo}`}
      </span>
      <span className="flex gap-2">
        <button
          onClick={() => setEditing(true)}
          className="min-h-10 rounded-md px-3 text-sm text-[#c83238] hover:bg-[#fff1f1]"
        >
          수정
        </button>
        <button
          onClick={remove}
          className="min-h-10 rounded-md px-3 text-sm text-red-600 hover:bg-red-50"
        >
          삭제
        </button>
      </span>
    </div>
  );
}
