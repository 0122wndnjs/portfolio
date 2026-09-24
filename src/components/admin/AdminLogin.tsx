"use client";

import { useState } from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

type ChallengePayload = {
  options: Parameters<typeof startRegistration>[0]["optionsJSON"];
  challengeId: string;
};

export default function AdminLogin({ configured }: { configured: boolean }) {
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState("");

  async function request<T>(url: string, body?: unknown): Promise<T> {
    const response = await fetch(url, {
      method: body === undefined ? "POST" : "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "요청을 완료하지 못했습니다.");
    return data as T;
  }

  async function login() {
    setBusy(true);
    setError("");
    try {
      const challenge = await request<ChallengePayload>(
        "/api/admin/auth/login/options",
      );
      const response = await startAuthentication({
        optionsJSON: challenge.options,
      });
      await request("/api/admin/auth/login/verify", {
        response,
        challengeId: challenge.challengeId,
      });
      window.location.href = "/admin";
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "패스키 인증에 실패했습니다.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function enroll() {
    setBusy(true);
    setError("");
    try {
      const challenge = await request<ChallengePayload>(
        "/api/admin/auth/register/options",
        { bootstrapToken: token },
      );
      const response = await startRegistration({
        optionsJSON: challenge.options,
      });
      await request("/api/admin/auth/register/verify", {
        response,
        challengeId: challenge.challengeId,
        bootstrapToken: token,
        deviceName: navigator.userAgent.includes("iPhone")
          ? "iPhone"
          : "이 기기",
      });
      window.location.href = "/admin";
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "패스키 등록에 실패했습니다.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function recover() {
    setBusy(true);
    setError("");
    try {
      await request("/api/admin/auth/recover", { code: recoveryCode });
      window.location.href = "/admin/settings";
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "계정을 복구하지 못했습니다.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f3f4f8] px-5 text-[#191927]">
      <section className="w-full max-w-[420px] rounded-3xl border border-black/[0.07] bg-white p-8 shadow-[0_24px_80px_rgba(24,24,40,0.09)] sm:p-10">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#24243b] text-white font-semibold">
          JK
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#77778a]">
          Private workspace
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
          작업 관리실
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#747487]">
          등록한 패스키로 안전하게 로그인하세요.
        </p>
        {configured ? (
          <>
            <button
              onClick={login}
              disabled={busy}
              className="mt-8 w-full rounded-xl bg-[#24243b] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#383851] disabled:opacity-50"
            >
              {busy ? "확인 중…" : "패스키로 로그인"}
            </button>
            <div className="mt-6 border-t border-black/[0.06] pt-5">
              <label className="text-xs font-medium text-[#696978]">
                패스키를 사용할 수 없나요?
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  value={recoveryCode}
                  onChange={(event) => setRecoveryCode(event.target.value)}
                  placeholder="일회용 복구 코드"
                  className="min-w-0 flex-1 rounded-xl border border-black/10 px-3 py-2.5 text-xs outline-none focus:border-[#7774f8]"
                />
                <button
                  onClick={recover}
                  disabled={busy || !recoveryCode}
                  className="rounded-xl border border-black/10 px-3 text-xs font-semibold disabled:opacity-50"
                >
                  복구
                </button>
              </div>
              <p className="mt-2 text-[10px] leading-4 text-[#9292a0]">
                복구 코드는 한 번만 사용할 수 있습니다. 복구하면 등록된 패스키를
                다시 추가해야 합니다.
              </p>
            </div>
          </>
        ) : (
          <div className="mt-8">
            <label className="mb-2 block text-sm font-medium">
              최초 관리자 등록 토큰
            </label>
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              type="password"
              autoComplete="off"
              placeholder="서버 환경 변수 값 입력"
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#7774f8]"
            />
            <button
              onClick={enroll}
              disabled={busy || !token}
              className="mt-3 w-full rounded-xl bg-[#24243b] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#383851] disabled:opacity-50"
            >
              {busy ? "패스키 등록 중…" : "이 기기를 관리자 패스키로 등록"}
            </button>
            <p className="mt-3 text-xs leading-5 text-[#858598]">
              토큰은 최초 등록에만 필요합니다. Touch ID, Face ID 또는 기기
              잠금으로 확인합니다.
            </p>
          </div>
        )}
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <p className="mt-8 border-t border-black/[0.06] pt-5 text-xs text-[#9898a5]">
          {" "}
          joowonkim.me · private access
        </p>
      </section>
    </main>
  );
}
