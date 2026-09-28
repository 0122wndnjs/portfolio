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
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-[#05060a] text-white select-none relative overflow-hidden">
      <style>{`
        @keyframes laser-sweep {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 0.95; }
          85% { opacity: 0.95; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes cyber-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes cyber-spin-rev {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes grid-glow {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.55; }
        }
        .animate-laser {
          animation: laser-sweep 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-cyber-spin {
          animation: cyber-spin 20s linear infinite;
        }
        .animate-cyber-spin-rev {
          animation: cyber-spin-rev 16s linear infinite;
        }
        .animate-grid-pulse {
          animation: grid-glow 4s ease-in-out infinite;
        }
      `}</style>

      {/* Cyber Grid - Global fine matrix */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 240, 255, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 240, 255, 0.12) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, #000 30%, transparent 90%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, #000 30%, transparent 90%)",
        }}
      />

      {/* Futuristic 3D Cyber Horizon Floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[50vh] pointer-events-none overflow-hidden animate-grid-pulse"
        style={{
          perspective: "450px",
          perspectiveOrigin: "50% 0%",
        }}
      >
        <div
          className="absolute inset-0 origin-top"
          style={{
            transform: "rotateX(72deg) translateY(-20%) scale(1.6)",
            backgroundImage: `
              linear-gradient(to right, rgba(0, 240, 255, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 240, 255, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
            maskImage: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.9) 25%, transparent 90%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.9) 25%, transparent 90%)",
          }}
        />
      </div>

      {/* Scanline CRT overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(0, 0, 0, 0.8) 2px, rgba(0, 0, 0, 0.8) 4px)",
        }}
      />

      {/* Cyberpunk Ambient Light Flares */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-cyan-500/15 via-indigo-600/20 to-purple-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 w-full h-48 bg-gradient-to-t from-cyan-950/20 via-transparent to-transparent pointer-events-none" />

      {/* Ambient Sci-Fi HUD Details on Screen Corners */}
      <div className="absolute top-6 left-7 font-mono text-[10px] text-cyan-500/40 tracking-[0.2em] pointer-events-none select-none flex flex-col gap-1 hidden sm:flex">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-cyan-400/80 shadow-[0_0_6px_#00f0ff]" />
          <span>SYS // BIOMETRIC_GATEWAY</span>
        </div>
        <span className="text-zinc-600 text-[9px]">ENCRYPT: FIDO2 · WEBAUTHN</span>
      </div>

      <div className="absolute top-6 right-7 font-mono text-[10px] text-cyan-500/40 tracking-[0.2em] pointer-events-none select-none text-right flex flex-col gap-1 hidden sm:flex">
        <div className="flex items-center justify-end gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
          <span className="text-emerald-400/80">ONLINE</span>
        </div>
        <span className="text-zinc-600 text-[9px]">NODE: 0x7F001 // SECURE</span>
      </div>

      <div className="absolute bottom-6 left-7 font-mono text-[9px] text-zinc-600 tracking-[0.25em] pointer-events-none select-none hidden sm:block">
        [ID: PRIVATE_WORKSPACE]
      </div>

      <div className="absolute bottom-6 right-7 font-mono text-[9px] text-zinc-600 tracking-[0.25em] pointer-events-none select-none hidden sm:block">
        PORT: 443 // TLS_V1.3
      </div>

      {configured ? (
        <div className="relative flex flex-col items-center justify-center">
          {/* Main Futuristic Biometric Button */}
          <button
            onClick={login}
            disabled={busy}
            aria-label="Passkey 인증"
            className="group relative flex flex-col items-center justify-center cursor-pointer transition-transform duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed outline-none"
          >
            {/* Concentric Circle & Scanner Assembly (Perfect Center Alignment) */}
            <div className="relative flex items-center justify-center w-36 h-36">
              {/* Corner HUD Reticles exactly framing the 36x36 scanner unit */}
              <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500/40 group-hover:border-cyan-400 group-hover:w-4 group-hover:h-4 transition-all duration-300 pointer-events-none" />
              <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500/40 group-hover:border-cyan-400 group-hover:w-4 group-hover:h-4 transition-all duration-300 pointer-events-none" />
              <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-500/40 group-hover:border-cyan-400 group-hover:w-4 group-hover:h-4 transition-all duration-300 pointer-events-none" />
              <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-500/40 group-hover:border-cyan-400 group-hover:w-4 group-hover:h-4 transition-all duration-300 pointer-events-none" />

              {/* Outer Orbit Rings - Perfectly concentric with the core button */}
              <div className="absolute w-36 h-36 rounded-full border border-dashed border-cyan-500/25 group-hover:border-cyan-400/60 animate-cyber-spin pointer-events-none transition-colors duration-500" />
              <div className="absolute w-30 h-30 rounded-full border border-dotted border-indigo-400/30 group-hover:border-indigo-400/60 animate-cyber-spin-rev pointer-events-none transition-colors duration-500" />

              {/* Glowing Pulse Wave */}
              <div className="absolute w-28 h-28 rounded-full bg-cyan-400/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              {/* Core Scanner Housing (24x24 / 96px) */}
              <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-[#080c16]/95 border border-cyan-500/40 group-hover:border-cyan-300 backdrop-blur-2xl shadow-[0_0_35px_rgba(0,240,255,0.18),inset_0_1px_3px_rgba(0,240,255,0.3)] group-hover:shadow-[0_0_55px_rgba(0,240,255,0.45),inset_0_1px_4px_rgba(0,240,255,0.6)] transition-all duration-300 overflow-hidden">
                {/* Laser Scanner Beam Sweep */}
                {!busy && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="animate-laser absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#00f0ff]" />
                  </div>
                )}

                {/* Busy State vs Biometric Icon */}
                {busy ? (
                  <div className="relative flex items-center justify-center">
                    <div className="w-9 h-9 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin shadow-[0_0_15px_rgba(0,240,255,0.6)]" />
                  </div>
                ) : (
                  <IoFingerPrint className="w-11 h-11 text-zinc-400 group-hover:text-cyan-300 group-hover:scale-105 transition-all duration-300 group-hover:drop-shadow-[0_0_16px_rgba(0,240,255,0.9)]" />
                )}
              </div>
            </div>

            {/* Futuristic Tech Typography */}
            <div className="mt-5 flex items-center gap-2 font-mono text-[11px] tracking-[0.25em] text-cyan-400/80 group-hover:text-cyan-300 uppercase transition-colors">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  busy
                    ? "bg-cyan-400 animate-ping"
                    : "bg-cyan-400 shadow-[0_0_8px_#00f0ff]"
                }`}
              />
              <span>{busy ? "SCANNING..." : "PASSKEY // AUTH"}</span>
            </div>
          </button>

          {/* Minimal Cyber Error */}
          {error && (
            <p
              role="alert"
              className="mt-4 font-mono text-[11px] text-rose-400 text-center tracking-wider bg-rose-950/40 border border-rose-500/30 px-3 py-1.5 rounded-lg"
            >
              {"// ERROR: "}{error}
            </p>
          )}

          {/* Discreet Bypass / Recovery Option */}
          {showRecovery ? (
            <div className="mt-8 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  placeholder="RECOVERY_CODE"
                  className="w-48 rounded-lg bg-black/60 border border-cyan-500/30 px-3 py-2 text-xs text-cyan-300 placeholder-zinc-600 outline-none focus:border-cyan-400 font-mono text-center shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                  autoFocus
                />
                <button
                  onClick={recover}
                  disabled={busy || !recoveryCode}
                  className="rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 px-3 py-2 text-xs font-mono text-cyan-300 transition disabled:opacity-30 cursor-pointer"
                >
                  RUN
                </button>
              </div>
              <button
                onClick={() => setShowRecovery(false)}
                className="text-[10px] font-mono text-zinc-600 hover:text-zinc-400 tracking-wider transition cursor-pointer"
              >
                {"// CLOSE"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowRecovery(true)}
              className="absolute -bottom-14 text-[10px] font-mono text-zinc-700 hover:text-cyan-400/70 tracking-widest transition cursor-pointer"
            >
              [BYPASS_KEY]
            </button>
          )}
        </div>
      ) : (
        /* Initial Setup Mode */
        <div className="relative w-full max-w-sm px-6">
          <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-black/40 border border-cyan-500/20 backdrop-blur-xl shadow-[0_0_40px_rgba(0,240,255,0.08)]">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 mb-4 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
              <IoFingerPrint className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-sm font-mono tracking-widest text-cyan-300 uppercase">
              INITIALIZE // PASSKEY
            </h1>
            <p className="mt-1 text-[11px] font-mono text-zinc-500">
              BOOTSTRAP_TOKEN REQUIRED
            </p>

            <div className="mt-6 w-full flex flex-col gap-3">
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                type="password"
                autoComplete="off"
                placeholder="TOKEN"
                className="w-full rounded-lg bg-black/60 border border-cyan-500/30 px-4 py-2.5 text-xs text-cyan-200 placeholder-zinc-600 outline-none focus:border-cyan-400 font-mono text-center"
              />
              <button
                onClick={enroll}
                disabled={busy || !token}
                className="w-full rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 py-2.5 text-xs font-mono tracking-widest text-cyan-200 transition active:scale-[0.99] disabled:opacity-30 cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.15)]"
              >
                {busy ? "ENROLLING..." : "REGISTER_DEVICE"}
              </button>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 font-mono text-[11px] text-rose-400"
              >
                {"// "}{error}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
