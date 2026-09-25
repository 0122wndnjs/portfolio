"use client";

import type { ReactNode } from "react";

export const dateLabel = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("ko-KR", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${value.slice(0, 10)}T00:00:00Z`))
    : "날짜 없음";

export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="sr-only">{eyebrow}</p>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="sr-only">{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Button({
  children,
  onClick,
  kind = "dark",
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: "dark" | "light" | "quiet";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const styles = {
    dark: "bg-[#6853d7] text-white hover:bg-[#5035ba]",
    light: "border border-black/10 bg-white text-[#3a3a49] hover:bg-gray-50",
    quiet: "text-[#777785] hover:bg-black/[0.04]",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[kind]}`}
    >
      {children}
    </button>
  );
}
export function Field({
  name,
  label,
  type = "text",
  required = false,
  value,
  min,
  max,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  value?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label className="min-w-[130px] flex-1 text-[11px] font-medium text-[#777783]">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={value}
        min={min}
        max={max}
        className="mt-1.5 block w-full rounded-xl border border-black/[0.09] bg-white px-3 py-2.5 text-xs text-[#333341] outline-none focus:border-[#6853d7]"
      />
    </label>
  );
}
export function Toast({ text }: { text: string }) {
  return (
    <div className="fixed bottom-5 right-5 rounded-xl bg-[#24243b] px-4 py-3 text-sm text-white shadow-lg">
      {text}
    </div>
  );
}
