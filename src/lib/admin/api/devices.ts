import "server-only";
import { randomInt } from "node:crypto";
import { audit, currentAuth, hash, requireRecentAuth } from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";
import { HttpError, json } from "@/lib/admin/http";
import { now, type Route } from "./common";

export const PAIR_MINUTES = 5;
export const pairCodeHash = (rpID: string, code: string) => hash(`${rpID}:${code}`);

export const deviceRoutes: Route[] = [
  {
    method: "GET",
    path: "devices",
    async handler({ rpID }) {
      const devices = await db
        .prepare("SELECT id,name,created_at,last_used_at,expires_at FROM admin_devices WHERE rp_id=? AND revoked_at IS NULL AND expires_at>? ORDER BY created_at DESC")
        .all(rpID, now());
      const auth = currentAuth();
      return json({ devices, current: auth?.kind === "device" ? auth.deviceId : null });
    },
  },
  {
    // 작업실에서 연결 코드를 만든다. 패스키 재인증이 필요하고, 기기 토큰으로는 호출할 수 없다.
    method: "POST",
    path: "devices/pair",
    async handler({ rpID }) {
      await requireRecentAuth();
      const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
      const expiresAt = new Date(Date.now() + PAIR_MINUTES * 60_000).toISOString();
      await db.prepare(
        "INSERT INTO admin_device_pairing(rp_id,code_hash,expires_at,attempts,created_at) VALUES(?,?,?,0,?) " +
          "ON CONFLICT(rp_id) DO UPDATE SET code_hash=excluded.code_hash, expires_at=excluded.expires_at, attempts=0, created_at=excluded.created_at",
      ).run(rpID, pairCodeHash(rpID, code), expiresAt, now());
      await audit("device.pair.started");
      return json({ code, expires_at: expiresAt });
    },
  },
  {
    method: "DELETE",
    path: "devices/:id",
    async handler({ params, rpID }) {
      await requireRecentAuth();
      const row = await db
        .prepare("UPDATE admin_devices SET revoked_at=? WHERE id=? AND rp_id=? AND revoked_at IS NULL RETURNING name")
        .get(now(), params.id, rpID) as { name: string } | undefined;
      if (!row) throw new HttpError(404, "연결된 기기를 찾을 수 없습니다.");
      await audit("device.revoked", { id: params.id, name: row.name });
      return json({ ok: true });
    },
  },
];
