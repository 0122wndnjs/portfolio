import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/admin/db";
import { relyingParty } from "@/lib/admin/webauthn";

export const SESSION_COOKIE = "admin_session";
const SESSION_DAYS = 7;

export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
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

export async function createSession() {
  const { rpID } = await relyingParty();
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
