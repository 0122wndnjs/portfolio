import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE, audit, hash, isAuthenticated, requireRecentAuth } from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";
import { HttpError, json } from "@/lib/admin/http";
import { normalizePreferences } from "@/lib/admin/reminders";
import { getPreferences, getSetting, sendTelegram, setSetting } from "@/lib/admin/settings";
import { addDays, seoulDate } from "@/lib/admin/validation";
import { invoicesWithPayments } from "./billing";
import { type Route, type Row, now } from "./common";

/** 내보내기에 포함할 업무 데이터. 인증 수단(패스키·세션·복구 코드)과 연결 코드는 제외한다. */
const EXPORT_TABLES = [
  "projects",
  "tasks",
  "invoices",
  "payments",
  "quotes",
  "quote_task_links",
  "meetings",
  "meeting_task_links",
] as const;

async function requireTelegram() {
  const chatId = await getSetting("telegram_chat_id");
  if (!chatId || !process.env.TELEGRAM_BOT_TOKEN) throw new HttpError(409, "텔레그램 봇을 먼저 연결하세요.");
  return chatId;
}

async function countPasskeys(rpID: string) {
  const row = await db.prepare("SELECT COUNT(*) AS count FROM credentials WHERE rp_id=?").get(rpID) as { count: number };
  return row.count;
}

export const workspaceRoutes: Route[] = [
  {
    method: "GET",
    path: "dashboard",
    async handler() {
      const today = seoulDate();
      const nextWeek = addDays(today, 7);
      const [projects, taskRows, invoices] = await Promise.all([
        db.prepare("SELECT COUNT(*) AS count FROM projects WHERE status IN ('준비 중','진행 중')").get() as Promise<Row>,
        db
          .prepare(
            `SELECT t.*,p.name AS project_name FROM tasks t JOIN projects p ON p.id=t.project_id WHERE t.archived=0 AND t.status<>'완료' AND p.status IN ('준비 중','진행 중')`,
          )
          .all() as Promise<Row[]>,
        invoicesWithPayments(),
      ]);
      return json({
        project_count: projects.count,
        overdue_tasks: taskRows.filter((task) => task.due_date && String(task.due_date) < today).length,
        waiting_tasks: taskRows.filter((task) => task.status === "확인 대기"),
        due_tasks: taskRows
          .filter((task) => task.due_date && String(task.due_date) <= nextWeek)
          .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date))),
        unpaid_total: invoices.reduce((sum, invoice) => sum + invoice.balance, 0),
        upcoming_invoices: invoices.filter(
          (invoice) => invoice.balance > 0 && invoice.due_date && String(invoice.due_date) <= nextWeek,
        ),
        overdue_invoices: invoices.filter((invoice) => invoice.overdue),
      });
    },
  },
  {
    method: "GET",
    path: "auth/status",
    async handler({ rpID }) {
      return json({ authenticated: await isAuthenticated(), configured: (await countPasskeys(rpID)) > 0 });
    },
  },
  {
    method: "GET",
    path: "export",
    async handler() {
      await requireRecentAuth();
      const data: Record<string, unknown> = {};
      for (const table of EXPORT_TABLES) data[table] = await db.prepare(`SELECT * FROM ${table}`).all();
      data.settings = await db
        .prepare("SELECT key,value FROM settings WHERE key NOT IN ('telegram_connect_hash','telegram_connect_expires')")
        .all();
      await audit("workspace.exported", { tables: EXPORT_TABLES.length });
      const exportedAt = now();
      return new Response(JSON.stringify({ version: 1, exported_at: exportedAt, data }, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="workspace-${seoulDate()}.json"`,
          "Cache-Control": "no-store",
        },
      });
    },
  },
  {
    method: "GET",
    path: "settings",
    async handler({ rpID }) {
      const [passkeys, logs, recovery, preferences, chatId] = await Promise.all([
        db
          .prepare("SELECT id,device_name,created_at,last_used_at FROM credentials WHERE rp_id=? ORDER BY created_at")
          .all(rpID),
        db.prepare("SELECT id,message,sent_at,result FROM notification_log ORDER BY sent_at DESC LIMIT 12").all(),
        db
          .prepare("SELECT COUNT(*) AS count FROM recovery_codes WHERE rp_id=? AND used_at IS NULL")
          .get(rpID) as Promise<{ count: number }>,
        getPreferences(),
        getSetting("telegram_chat_id"),
      ]);
      const username = process.env.TELEGRAM_BOT_USERNAME || "";
      return json({
        passkeys,
        telegram_connected: !!chatId,
        telegram_username: username,
        telegram_link: chatId ? null : username ? `https://t.me/${username}` : null,
        preferences,
        logs,
        recovery_count: recovery.count,
      });
    },
  },
  {
    method: "POST",
    path: "settings",
    async handler({ body }) {
      if (!body.preferences || typeof body.preferences !== "object") throw new HttpError(400, "설정 데이터가 없습니다.");
      await setSetting("preferences", JSON.stringify(normalizePreferences(body.preferences)));
      await audit("settings.updated");
      return json({ ok: true });
    },
  },
  {
    method: "POST",
    path: "settings/connect-telegram",
    async handler() {
      await requireRecentAuth();
      if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_BOT_USERNAME)
        throw new HttpError(503, "서버의 TELEGRAM_BOT_TOKEN과 TELEGRAM_BOT_USERNAME 설정이 필요합니다.");
      const code = randomBytes(18).toString("base64url");
      await db.transaction(async () => {
        await setSetting("telegram_connect_hash", hash(code));
        await setSetting("telegram_connect_expires", new Date(Date.now() + 10 * 60_000).toISOString());
      });
      await audit("telegram.connect.started");
      return json({
        code,
        url: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${code}`,
        expires_in_seconds: 600,
      });
    },
  },
  {
    method: "DELETE",
    path: "settings/telegram",
    async handler() {
      await requireRecentAuth();
      await setSetting("telegram_chat_id", "");
      await audit("telegram.disconnected");
      return json({ ok: true });
    },
  },
  {
    method: "POST",
    path: "settings/test-telegram",
    async handler() {
      const response = await sendTelegram(await requireTelegram(), "Joowon Workspace 테스트 알림입니다.");
      if (!response.ok) throw new HttpError(502, "텔레그램 발송 실패. 봇 연결과 webhook 설정을 확인하세요.");
      return json({ ok: true });
    },
  },
  {
    method: "POST",
    path: "settings/retry-notifications",
    async handler() {
      const chatId = await requireTelegram();
      const failed = await db
        .prepare("SELECT id,message FROM notification_log WHERE result='failed' ORDER BY sent_at LIMIT 10")
        .all() as Array<{ id: string; message: string }>;
      let sent = 0;
      for (const item of failed) {
        const claim = await db
          .prepare("UPDATE notification_log SET result='sending',sent_at=? WHERE id=? AND result='failed'")
          .run(now(), item.id);
        if (!claim.changes) continue;
        const ok = await sendTelegram(chatId, item.message).then((response) => response.ok, () => false);
        await db
          .prepare("UPDATE notification_log SET result=?,sent_at=? WHERE id=? AND result='sending'")
          .run(ok ? "sent" : "failed", now(), item.id);
        if (ok) sent++;
      }
      await audit("telegram.notifications.retried", { attempted: failed.length, sent });
      return json({ attempted: failed.length, sent });
    },
  },
  {
    method: "POST",
    path: "settings/recovery",
    async handler({ rpID }) {
      await requireRecentAuth();
      const codes = Array.from(
        { length: 10 },
        () => randomBytes(12).toString("hex").toUpperCase().match(/.{1,4}/g)?.join("-") || "",
      );
      const insert = db.prepare("INSERT INTO recovery_codes(code_hash,rp_id,created_at) VALUES(?,?,?)");
      await db.transaction(async () => {
        await db.prepare("DELETE FROM recovery_codes WHERE rp_id=?").run(rpID);
        for (const code of codes) await insert.run(hash(code.replaceAll("-", "")), rpID, now());
      });
      await audit("recovery_codes.regenerated", { count: codes.length });
      return json({ codes });
    },
  },
  {
    method: "DELETE",
    path: "settings/recovery",
    async handler({ rpID }) {
      await requireRecentAuth();
      await db.prepare("DELETE FROM recovery_codes WHERE rp_id=?").run(rpID);
      await audit("recovery_codes.revoked");
      return json({ ok: true });
    },
  },
  {
    method: "PATCH",
    path: "settings/passkeys",
    async handler({ body, rpID }) {
      await requireRecentAuth();
      const credentialId = String(body.id || "");
      if (!credentialId) throw new HttpError(400, "패스키를 지정하세요.");
      await db.transaction(async () => {
        // 동시에 두 패스키를 지워 0개가 되지 않도록 전체 행을 잠근다.
        const rows = await db.prepare("SELECT id FROM credentials WHERE rp_id=? FOR UPDATE").all(rpID) as Array<{ id: string }>;
        if (!rows.some((row) => row.id === credentialId)) throw new HttpError(404, "패스키를 찾을 수 없습니다.");
        if (rows.length <= 1) throw new HttpError(409, "마지막 패스키는 삭제할 수 없습니다.");
        await db.prepare("DELETE FROM credentials WHERE id=? AND rp_id=?").run(credentialId, rpID);
      });
      await audit("passkey.deleted", { credentialId });
      return json({ ok: true });
    },
  },
  {
    method: "DELETE",
    path: "settings/sessions",
    async handler({ rpID }) {
      await requireRecentAuth();
      const token = (await cookies()).get(SESSION_COOKIE)?.value;
      await db.prepare("DELETE FROM sessions WHERE rp_id=? AND token_hash<>?").run(rpID, token ? hash(token) : "");
      await audit("sessions.revoked");
      return json({ ok: true });
    },
  },
];
