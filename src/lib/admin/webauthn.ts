import "server-only";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { db } from "@/lib/admin/db";

export async function relyingParty() {
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

export function credentials() {
  return db
    .prepare("SELECT id, public_key, counter, transports FROM credentials")
    .all() as Array<{
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
