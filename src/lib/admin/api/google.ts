import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { audit, requireRecentAuth } from "@/lib/admin/auth";
import { authUrl, disconnectGoogle, googleConfigured } from "@/lib/admin/google";
import { HttpError, json } from "@/lib/admin/http";
import { getSetting, setSetting } from "@/lib/admin/settings";
import { relyingParty } from "@/lib/admin/webauthn";
import { db } from "@/lib/admin/db";
import { googleConnected } from "@/lib/admin/google";
import type { Route } from "./common";
import { syncMeeting } from "./documents";

export const stateHash = (state: string) => createHash("sha256").update(state).digest("hex");

export const googleRoutes: Route[] = [
  {
    method: "GET",
    path: "google/status",
    async handler() {
      const [token, email] = await Promise.all([getSetting("google_refresh_token"), getSetting("google_email")]);
      return json({ configured: googleConfigured(), connected: googleConfigured() && Boolean(token), email });
    },
  },
  {
    method: "GET",
    path: "google/connect",
    async handler() {
      if (!googleConfigured()) throw new HttpError(409, "서버에 Google OAuth 환경변수가 없습니다.");
      const state = randomBytes(24).toString("base64url");
      await setSetting("google_oauth_state", stateHash(state));
      await setSetting("google_oauth_expires", new Date(Date.now() + 10 * 60_000).toISOString());
      const { origin } = await relyingParty();
      return Response.redirect(authUrl(origin, state), 302);
    },
  },
  {
    // 아직 캘린더에 없는 미팅을 한 번에 올린다. 초대 메일·Meet 링크는 만들지 않는다.
    method: "POST",
    path: "google/sync-meetings",
    async handler({ body }) {
      if (!(await googleConnected())) throw new HttpError(409, "Google 캘린더를 먼저 연결하세요.");
      const from = body.include_past === true ? "0000-01-01" : new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
      const rows = await db.prepare("SELECT id FROM meetings WHERE google_event_id='' AND meeting_date>=? ORDER BY meeting_date LIMIT 200").all(from) as Array<{ id: string }>;
      let synced = 0, failed = 0;
      for (const row of rows) {
        const result = await syncMeeting(row.id, { create_meet: false, send_invites: false });
        if (result.google === "synced") synced++;
        else failed++;
      }
      await audit("google.meetings.synced", { synced, failed });
      return json({ synced, failed, total: rows.length });
    },
  },
  {
    method: "DELETE",
    path: "google",
    async handler() {
      await requireRecentAuth();
      await disconnectGoogle();
      await audit("google.disconnected");
      return json({ ok: true });
    },
  },
];
