"use client";

import { useState } from "react";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { IoFingerPrint } from "react-icons/io5";

type ChallengePayload = {
  options: Parameters<typeof startRegistration>[0]["optionsJSON"];
  challengeId: string;
};

export default function AdminLogin({ configured }: { configured: boolean }) {
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const [error, setError] = useState("");

  async function request<T>(url: string, body?: unknown): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
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
    <main className="admin-login">
      <style>{`
        .admin-login { min-height: 100vh; min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 36px; background: radial-gradient(ellipse 60% 50% at 50% 45%, #10141c 0%, #0b0c0f 70%); color: #e7e5e4; user-select: none; padding: 24px; }
        .admin-login-word { font-size: 12px; letter-spacing: .5em; padding-left: .5em; color: #a8a29e; font-weight: 500; }
        .admin-login-key { position: relative; width: 152px; height: 152px; border-radius: 50%; display: grid; place-items: center; background: #14161b; border: 1px solid #2a2e37; color: #bfdbfe; cursor: pointer;
          box-shadow: 0 0 0 10px rgba(147,197,253,.035), 0 0 0 22px rgba(147,197,253,.02), 0 0 60px rgba(96,165,250,.12);
          transition: transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s ease, border-color .25s ease; }
        .admin-login-key:hover:not(:disabled), .admin-login-key:focus-visible { transform: scale(1.03); border-color: #3b4252; outline: none;
          box-shadow: 0 0 0 10px rgba(147,197,253,.06), 0 0 0 22px rgba(147,197,253,.035), 0 0 80px rgba(96,165,250,.25); }
        .admin-login-key:active:not(:disabled) { transform: scale(.97); }
        .admin-login-key:disabled { cursor: progress; }
        .admin-login-key.is-busy::after { content: ""; position: absolute; inset: -7px; border-radius: 50%; border: 1px solid transparent; border-top-color: #93c5fd; animation: admin-login-spin 1s linear infinite; }
        @keyframes admin-login-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .admin-login-key, .admin-login-key.is-busy::after { transition: none; animation: none; } }
        .admin-login-hint { font-size: 14px; font-weight: 300; color: #a8a29e; min-height: 20px; }
        .admin-login-error { font-size: 13px; color: #fca5a5; }
        .admin-login-quiet { font-size: 12px; color: #78716c; background: none; border: 0; cursor: pointer; padding: 8px; }
        .admin-login-quiet:hover { color: #d6d3d1; }
        .admin-login-field { display: flex; gap: 8px; }
        .admin-login-field input { width: 200px; height: 44px; border-radius: 10px; border: 1px solid #2a2e37; background: #14161b; color: #e7e5e4; padding: 0 14px; font-size: 14px; outline: none; text-align: center; }
        .admin-login-field input:focus { border-color: #60a5fa; }
        .admin-login-field button { height: 44px; padding: 0 16px; border-radius: 10px; border: 1px solid #2a2e37; background: #1c2029; color: #e7e5e4; font-size: 14px; cursor: pointer; }
        .admin-login-field button:disabled { opacity: .4; cursor: not-allowed; }
      `}</style>

      <div className="admin-login-word">WORKSPACE</div>

      {configured ? (
        <>
          <button
            type="button"
            onClick={login}
            disabled={busy}
            aria-label="패스키로 로그인"
            className={`admin-login-key ${busy ? "is-busy" : ""}`}
          >
            <IoFingerPrint size={64} aria-hidden="true" />
          </button>
          <div className="admin-login-hint" aria-live="polite">
            {busy ? "확인 중…" : "터치해서 잠금 해제"}
          </div>
          {error && <p role="alert" className="admin-login-error">{error}</p>}
          {showRecovery ? (
            <div className="admin-login-field">
              <input
                type="password"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value)}
                placeholder="복구 코드"
                aria-label="복구 코드"
                autoFocus
              />
              <button type="button" onClick={recover} disabled={busy || !recoveryCode}>확인</button>
            </div>
          ) : (
            <button type="button" className="admin-login-quiet" onClick={() => setShowRecovery(true)}>
              패스키를 쓸 수 없나요?
            </button>
          )}
        </>
      ) : (
        <>
          <div className="admin-login-key" aria-hidden="true">
            <IoFingerPrint size={64} />
          </div>
          <div className="admin-login-hint">이 기기를 패스키로 등록하세요</div>
          <div className="admin-login-field">
            <input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              type="password"
              autoComplete="off"
              placeholder="설정 토큰"
              aria-label="설정 토큰"
            />
            <button type="button" onClick={enroll} disabled={busy || !token}>
              {busy ? "등록 중…" : "등록"}
            </button>
          </div>
          {error && <p role="alert" className="admin-login-error">{error}</p>}
        </>
      )}
    </main>
  );
}
