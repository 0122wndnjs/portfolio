import { randomBytes, timingSafeEqual } from "node:crypto";
import { DEVICE_DAYS, DEVICE_TOKEN_PREFIX, audit, checkRateLimit, hash, requestAddress } from "@/lib/admin/auth";
import { pairCodeHash } from "@/lib/admin/api/devices";
import { db } from "@/lib/admin/db";
import { fail, json } from "@/lib/admin/http";
import { relyingParty } from "@/lib/admin/webauthn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;

/**
 * JKOS 앱이 작업실에서 받은 6자리 코드로 기기 토큰을 교환한다.
 * 쿠키를 쓰지 않으므로 출처 검사는 하지 않고, 코드당 5회·IP당 10분 10회로 제한한다.
 */
export async function POST(request: Request) {
  if (!(await checkRateLimit(`device-pair:${requestAddress(request)}`, 10, 10 * 60_000)))
    return fail("시도가 너무 많습니다. 잠시 후 다시 하세요.", 429);
  const body = (await request.json().catch(() => ({}))) as { code?: unknown; name?: unknown };
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";
  if (!/^\d{6}$/.test(code)) return fail("6자리 숫자 코드를 입력하세요.", 400);
  if (!name) return fail("기기 이름이 필요합니다.", 400);

  const { rpID } = await relyingParty();
  const nowIso = new Date().toISOString();
  // 시도 횟수를 먼저 올리고 확인한다(동시 요청에도 횟수가 새지 않게).
  const pairing = await db
    .prepare("UPDATE admin_device_pairing SET attempts=attempts+1 WHERE rp_id=? AND expires_at>? RETURNING code_hash,attempts")
    .get(rpID, nowIso) as { code_hash: string; attempts: number } | undefined;
  if (!pairing) return fail("연결 코드가 없거나 만료됐습니다. 작업실에서 새 코드를 만드세요.", 400);
  if (pairing.attempts > MAX_ATTEMPTS) {
    await db.prepare("DELETE FROM admin_device_pairing WHERE rp_id=?").run(rpID);
    return fail("코드 입력 횟수를 넘었습니다. 작업실에서 새 코드를 만드세요.", 400);
  }
  const ok = timingSafeEqual(Buffer.from(pairing.code_hash), Buffer.from(pairCodeHash(rpID, code)));
  if (!ok) return fail("코드가 맞지 않습니다.", 400);

  // 코드는 한 번만 쓴다. 동시에 두 요청이 맞혀도 삭제에 성공한 쪽만 토큰을 받는다.
  const consumed = await db
    .prepare("DELETE FROM admin_device_pairing WHERE rp_id=? AND code_hash=? RETURNING rp_id")
    .get(rpID, pairing.code_hash);
  if (!consumed) return fail("연결 코드가 이미 사용됐습니다.", 400);

  const id = randomBytes(16).toString("hex");
  const token = DEVICE_TOKEN_PREFIX + randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + DEVICE_DAYS * 86_400_000).toISOString();
  await db.prepare(
    "INSERT INTO admin_devices(id,rp_id,name,token_hash,created_at,last_used_at,expires_at) VALUES(?,?,?,?,?,?,?)",
  ).run(id, rpID, name, hash(token), nowIso, nowIso, expiresAt);
  await audit("device.paired", { id, name });
  return json({ token, device: { id, name, expires_at: expiresAt } });
}
