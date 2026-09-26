"use client";

import { useState } from "react";
import { estimatedWithholding } from "@/lib/admin/billing";

const won = (amount: number) => `${new Intl.NumberFormat("ko-KR").format(amount)}원`;

export default function PaymentAmountFields({
  initialAmount = "",
  initialWithholding = 0,
  max,
}: {
  initialAmount?: string;
  initialWithholding?: number;
  max?: number;
}) {
  const [amount, setAmount] = useState(initialAmount);
  const [withholding, setWithholding] = useState(String(initialWithholding));
  const [deduct, setDeduct] = useState(initialWithholding > 0);
  const gross = Number(amount) || 0;
  const withheld = deduct ? Number(withholding) || 0 : 0;

  return (
    <div className="payment-amount-fields min-w-0 space-y-2">
      <label className="block text-[11px] font-medium text-[#777783]">
        청구 처리액 (공제 전)
        <input
          name="amount"
          type="number"
          min={1}
          max={max}
          step={1}
          required
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value);
            if (deduct) setWithholding(String(estimatedWithholding(Number(event.target.value))));
          }}
          placeholder={max ? `${won(max)} 이하` : undefined}
          className="mt-1.5 block w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2.5 text-xs text-[#333341] outline-none focus:border-[#6853d7]"
        />
      </label>
      <label className="flex min-h-7 items-center gap-2 text-[11px] font-medium text-[#555562]">
        <input
          type="checkbox"
          checked={deduct}
          onChange={(event) => {
            setDeduct(event.target.checked);
            setWithholding(event.target.checked ? String(estimatedWithholding(gross)) : "0");
          }}
        />
        프리랜서 3.3% 공제
      </label>
      {deduct && (
        <label className="block text-[11px] font-medium text-[#777783]">
          실제 공제액 · 예상 {won(estimatedWithholding(gross))}
          <input
            name="withholding_amount"
            type="number"
            min={0}
            max={Math.max(0, gross - 1)}
            step={1}
            required
            value={withholding}
            onChange={(event) => setWithholding(event.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2.5 text-xs text-[#333341] outline-none focus:border-[#6853d7]"
          />
        </label>
      )}
      {!deduct && <input type="hidden" name="withholding_amount" value="0" />}
      {gross > 0 && (
        <p className="text-[11px] font-semibold text-[#217b55]">
          실수령 {won(Math.max(0, gross - withheld))}
        </p>
      )}
    </div>
  );
}
