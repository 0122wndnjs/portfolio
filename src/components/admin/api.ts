"use client";

import { startAuthentication } from "@simplewebauthn/browser";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

async function send(url: string, method: string, body: unknown) {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new ApiError(data.error || "요청을 완료하지 못했습니다.", response.status, data.code);
  return data;
}

let pendingReauth: Promise<void> | null = null;

/** 패스키로 다시 인증해 현재 세션을 새로 발급받는다. 동시에 여러 번 호출돼도 한 번만 묻는다. */
export function reauthenticate() {
  pendingReauth ??= (async () => {
    const challenge = await send("/api/admin/auth/login/options", "POST", {});
    const response = await startAuthentication({ optionsJSON: challenge.options });
    await send("/api/admin/auth/login/verify", "POST", { response, challengeId: challenge.challengeId });
  })().finally(() => {
    pendingReauth = null;
  });
  return pendingReauth;
}

/**
 * 관리자 API 호출. 인증 수단 변경 등에서 재인증을 요구하면(403 reauth_required)
 * 패스키 확인 후 한 번 다시 시도한다.
 */
export async function api<T = unknown>(url: string, method = "GET", body?: unknown): Promise<T> {
  try {
    return (await send(url, method, body)) as T;
  } catch (error) {
    if (!(error instanceof ApiError) || error.code !== "reauth_required") throw error;
    try {
      await reauthenticate();
    } catch (reauthError) {
      if (reauthError instanceof ApiError) throw reauthError;
      throw new ApiError("패스키 확인이 취소됐습니다. 다시 시도하세요.", 403, "reauth_required");
    }
    return (await send(url, method, body)) as T;
  }
}

export const isConflict = (error: unknown) => error instanceof ApiError && error.code === "conflict";
