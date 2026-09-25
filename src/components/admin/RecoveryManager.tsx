"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/admin/api";


export default function RecoveryManager() {
  const [count, setCount] = useState(0),
    [codes, setCodes] = useState<string[]>([]),
    [error, setError] = useState(""),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    void api<{ recovery_count: number }>("/api/admin/settings")
      .then((data) => setCount(data.recovery_count))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "설정을 읽지 못했습니다."),
      );
  }, []);
  async function issue() {
    if (
      count &&
      !window.confirm(
        "기존 복구 코드가 모두 무효화됩니다. 새 코드를 발급할까요?",
      )
    )
      return;
    try {
      const data = await api<{ codes: string[] }>(
        "/api/admin/settings/recovery",
        "POST",
        {},
      );
      setCodes(data.codes);
      setCount(data.codes.length);
      setError("");
      setCopied(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "발급 실패");
    }
  }
  async function revoke() {
    if (!window.confirm("모든 복구 코드를 무효화할까요?")) return;
    try {
      await api("/api/admin/settings/recovery", "DELETE");
      setCodes([]);
      setCount(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "폐기 실패");
    }
  }
  return (
    <section className="mt-5 rounded-2xl border border-black/[0.055] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">계정 복구 코드</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-[#92929f]">
            패스키를 모두 잃었을 때 쓰는 일회용 코드입니다. 새로 발급하면 기존
            코드는 전부 무효화됩니다.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={issue}
            className="rounded-xl bg-[#25253b] px-3.5 py-2.5 text-xs font-semibold text-white"
          >
            복구 코드 발급
          </button>
          {count > 0 && (
            <button
              onClick={revoke}
              className="rounded-xl border border-black/10 px-3 py-2.5 text-xs font-medium text-[#777783]"
            >
              모두 폐기
            </button>
          )}
        </div>
      </div>
      <p className="mt-3 text-[11px] text-[#8d8d9a]">
        사용 가능 {count}개. 코드는 발급 직후 한 번만 표시됩니다.
      </p>
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {error}
        </p>
      )}
      {codes.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-900">
            지금 복사해 안전한 곳에 저장하세요. 이 화면을 벗어나면 다시 볼 수
            없습니다.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-[11px] text-amber-950 sm:grid-cols-5">
            {codes.map((code) => (
              <span key={code}>{code}</span>
            ))}
          </div>
          <button
            onClick={() =>
              void navigator.clipboard
                .writeText(codes.join("\n"))
                .then(() => setCopied(true))
            }
            className="mt-4 rounded-lg bg-amber-900 px-3 py-2 text-[11px] font-semibold text-white"
          >
            {copied ? "복사 완료" : "전체 복사"}
          </button>
        </div>
      )}
    </section>
  );
}
