import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/admin/db";

export async function relyingParty() {
  // 운영에서 Host 헤더로 출처를 추정하면 헤더 조작에 취약하므로 명시 설정을 강제한다.
  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_ORIGIN)
    throw new Error("운영 환경에는 ADMIN_ORIGIN 환경변수가 필요합니다.");
  const headerStore = await headers();
  const fallbackProtocol =
    process.env.NODE_ENV === "development" ? "http" : "https";
  const origin =
    process.env.ADMIN_ORIGIN ||
    `${headerStore.get("x-forwarded-proto") || fallbackProtocol}://${headerStore.get("x-forwarded-host") || headerStore.get("host") || "localhost:3000"}`;
  const hostname = new URL(origin).hostname;
  return {
    origin,
    rpID: process.env.WEBAUTHN_RP_ID || hostname,
    rpName: "Joowon Workspace",
  };
}

export async function credentials() {
  const { rpID } = await relyingParty();
  return await db
    .prepare("SELECT id, public_key, counter, transports FROM credentials WHERE rp_id=?")
    .all(rpID) as Array<{
    id: string;
    public_key: string;
    counter: number;
    transports: string;
  }>;
}

export async function assertOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const rp = await relyingParty();
  if (!origin || origin !== rp.origin)
    throw new Error("잘못된 요청 출처입니다.");
}
