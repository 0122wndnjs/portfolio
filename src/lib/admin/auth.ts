import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/admin/db";
import { HttpError } from "@/lib/admin/http";
import { relyingParty } from "@/lib/admin/webauthn";

export const SESSION_COOKIE = "admin_session";
const SESSION_DAYS = 7;
const REAUTH_WINDOW_MS = 5 * 60_000;

export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/** 길이와 내용이 모두 같을 때만 true. 비교 시간이 입력에 따라 달라지지 않는다. */
export function safeEqual(a: unknown, b: string | undefined) {
  if (typeof a !== "string" || !b) return false;
  return timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)));
}

export async function saveChallenge(challenge: string, kind: string) {
  const id = randomBytes(24).toString("hex");
  await db.prepare("DELETE FROM challenges WHERE expires_at < ?").run(
    new Date().toISOString(),
  );
  await db.prepare(
    "INSERT INTO challenges(id,challenge,kind,expires_at) VALUES(?,?,?,?)",
  ).run(id, challenge, kind, new Date(Date.now() + 5 * 60_000).toISOString());
  return id;
}

export async function consumeChallenge(id: string, kind: string) {
  const row = await db
    .prepare(
      "DELETE FROM challenges WHERE id=? AND kind=? RETURNING challenge,expires_at",
    )
    .get(id, kind) as { challenge: string; expires_at: string } | undefined;
  if (!row || row.expires_at < new Date().toISOString()) return null;
  return row.challenge;
}

/** 새 세션을 발급한다. 같은 브라우저의 이전 세션은 폐기한다(재인증 시 세션 교체). */
export async function createSession() {
  const { rpID } = await relyingParty();
  const previous = (await cookies()).get(SESSION_COOKIE)?.value;
  if (previous)
    await db.prepare("DELETE FROM sessions WHERE token_hash=? AND rp_id=?").run(hash(previous), rpID);
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 86_400_000,
  ).toISOString();
  await db.prepare(
    "INSERT INTO sessions(token_hash,rp_id,expires_at,created_at) VALUES(?,?,?,?)",
  ).run(hash(token), rpID, expiresAt, new Date().toISOString());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearSession() {
  const { rpID } = await relyingParty();
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token)
    await db.prepare("DELETE FROM sessions WHERE token_hash=? AND rp_id=?").run(hash(token), rpID);
  store.delete(SESSION_COOKIE);
}

export async function isAuthenticated() {
  const { rpID } = await relyingParty();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const session = await db
    .prepare("SELECT expires_at FROM sessions WHERE token_hash=? AND rp_id=?")
    .get(hash(token), rpID) as { expires_at: string } | undefined;
  if (!session || session.expires_at < new Date().toISOString()) {
    if (session)
      await db.prepare("DELETE FROM sessions WHERE token_hash=? AND rp_id=?").run(hash(token), rpID);
    return false;
  }
  return true;
}

/**
 * 패스키·복구 코드·텔레그램 수신 대상·세션 같은 인증 수단 변경 전에 호출한다.
 * 로그인(세션 발급) 후 5분이 지났으면 패스키 재인증을 요구한다.
 * 복구 직후처럼 등록된 패스키가 없으면 재인증할 수단이 없으므로 통과시킨다.
 */
export async function requireRecentAuth() {
  const { rpID } = await relyingParty();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token
    ? await db
        .prepare("SELECT created_at FROM sessions WHERE token_hash=? AND rp_id=?")
        .get(hash(token), rpID) as { created_at: string } | undefined
    : undefined;
  if (session && Date.now() - new Date(session.created_at).getTime() < REAUTH_WINDOW_MS) return;
  const passkeys = await db
    .prepare("SELECT COUNT(*) AS count FROM credentials WHERE rp_id=?")
    .get(rpID) as { count: number };
  if (passkeys.count === 0) return;
  throw new HttpError(403, "보안을 위해 패스키로 다시 인증하세요.", "reauth_required");
}

export async function audit(action: string, detail: Record<string, unknown> = {}) {
  await db.prepare(
    "INSERT INTO audit_log(id,action,detail,created_at) VALUES(?,?,?,?)",
  ).run(
    randomBytes(16).toString("hex"),
    action,
    JSON.stringify(detail),
    new Date().toISOString(),
  );
}

export async function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const result = await db.prepare(
    "INSERT INTO rate_limits(bucket_key,attempts,window_started) VALUES(?,1,?) " +
      "ON CONFLICT(bucket_key) DO UPDATE SET " +
      "attempts=CASE WHEN rate_limits.window_started<=? THEN 1 ELSE rate_limits.attempts+1 END, " +
      "window_started=CASE WHEN rate_limits.window_started<=? THEN excluded.window_started ELSE rate_limits.window_started END " +
      "RETURNING attempts",
  ).get(key, new Date(now).toISOString(), new Date(now - windowMs).toISOString(), new Date(now - windowMs).toISOString()) as { attempts: number };
  return result.attempts <= limit;
}

export function requestAddress(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  );
}
