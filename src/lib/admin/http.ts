import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

export const fail = (message: string, status = 400, code?: string) =>
  json(code ? { error: message, code } : { error: message }, status);

export function errorResponse(error: unknown, fallback: string) {
  if (error instanceof HttpError) return fail(error.message, error.status, error.code);
  // 고객 메모 등이 로그에 남지 않도록 오류 종류와 DB 오류 코드만 기록한다.
  const code = (error as { code?: unknown } | null)?.code;
  console.error("[admin]", error instanceof Error ? error.name : "unknown error", code ?? "");
  return fail(fallback, 500);
}
