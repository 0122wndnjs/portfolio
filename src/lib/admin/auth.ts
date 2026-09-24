import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/admin/db";

export const SESSION_COOKIE = "admin_session";
const SESSION_DAYS = 7;

export function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function saveChallenge(challenge: string, kind: string) {
  const id = randomBytes(24).toString("hex");
  db.prepare("DELETE FROM challenges WHERE expires_at < ?").run(
    new Date().toISOString(),
  );
  db.prepare(
    "INSERT INTO challenges(id,challenge,kind,expires_at) VALUES(?,?,?,?)",
  ).run(id, challenge, kind, new Date(Date.now() + 5 * 60_000).toISOString());
  return id;
}

export function consumeChallenge(id: string, kind: string) {
  const row = db
    .prepare(
      "SELECT challenge,expires_at FROM challenges WHERE id=? AND kind=?",
    )
    .get(id, kind) as { challenge: string; expires_at: string } | undefined;
  db.prepare("DELETE FROM challenges WHERE id=?").run(id);
  if (!row || row.expires_at < new Date().toISOString()) return null;
  return row.challenge;
}

export async function createSession() {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 86_400_000,
  ).toISOString();
  db.prepare(
    "INSERT INTO sessions(token_hash,expires_at,created_at) VALUES(?,?,?)",
  ).run(hash(token), expiresAt, new Date().toISOString());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function clearSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token)
    db.prepare("DELETE FROM sessions WHERE token_hash=?").run(hash(token));
  store.delete(SESSION_COOKIE);
}

export async function isAuthenticated() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const session = db
    .prepare("SELECT expires_at FROM sessions WHERE token_hash=?")
    .get(hash(token)) as { expires_at: string } | undefined;
  if (!session || session.expires_at < new Date().toISOString()) {
    if (session)
      db.prepare("DELETE FROM sessions WHERE token_hash=?").run(hash(token));
    return false;
  }
  return true;
}

export function audit(action: string, detail: Record<string, unknown> = {}) {
  db.prepare(
    "INSERT INTO audit_log(id,action,detail,created_at) VALUES(?,?,?,?)",
  ).run(
    randomBytes(16).toString("hex"),
    action,
    JSON.stringify(detail),
    new Date().toISOString(),
  );
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const current = db
    .prepare(
      "SELECT attempts,window_started FROM rate_limits WHERE bucket_key=?",
    )
    .get(key) as { attempts: number; window_started: string } | undefined;
  const now = Date.now();
  const started = current ? Date.parse(current.window_started) : 0;
  if (!current || now - started >= windowMs) {
    db.prepare(
      "INSERT INTO rate_limits(bucket_key,attempts,window_started) VALUES(?,1,?) ON CONFLICT(bucket_key) DO UPDATE SET attempts=1,window_started=excluded.window_started",
    ).run(key, new Date(now).toISOString());
    return true;
  }
  if (current.attempts >= limit) return false;
  db.prepare(
    "UPDATE rate_limits SET attempts=attempts+1 WHERE bucket_key=?",
  ).run(key);
  return true;
}

export function requestAddress(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  );
}
