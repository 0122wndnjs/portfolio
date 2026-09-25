import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";
import {
  type ReminderInvoice,
  type ReminderTask,
  buildReminders,
} from "@/lib/admin/reminders";
import { getPreferences, getSetting, sendTelegram } from "@/lib/admin/settings";
import { seoulDate, seoulTime } from "@/lib/admin/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron은 GET + `Authorization: Bearer ${CRON_SECRET}`으로 호출한다(Hobby: 하루 1회).
 * 외부 cron은 POST + ADMIN_CRON_SECRET으로 15분마다 호출할 수 있다.
 */
function authorized(request: Request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return [process.env.CRON_SECRET, process.env.ADMIN_CRON_SECRET].some(
    (secret) => !!secret && safeEqual(token, secret),
  );
}

async function run(forceDigest: boolean) {
  const chatId = await getSetting("telegram_chat_id");
  if (!chatId || !process.env.TELEGRAM_BOT_TOKEN)
    return NextResponse.json({ sent: 0, skipped: "telegram not connected" });
  const preferences = await getPreferences();
  if (!preferences.notifications)
    return NextResponse.json({ sent: 0, skipped: "notifications disabled" });
  const [tasks, invoices] = await Promise.all([
    db
      .prepare(
        `SELECT t.id,t.title,t.status,t.due_date,t.waiting_since,p.name AS project_name FROM tasks t JOIN projects p ON p.id=t.project_id WHERE t.archived=0 AND t.status<>'완료' AND p.status IN ('준비 중','진행 중')`,
      )
      .all() as Promise<ReminderTask[]>,
    db
      .prepare(
        `SELECT i.id,i.title,i.due_date,p.name AS project_name,i.amount,(SELECT COALESCE(SUM(amount),0) FROM payments WHERE invoice_id=i.id) AS paid FROM invoices i JOIN projects p ON p.id=i.project_id`,
      )
      .all() as Promise<ReminderInvoice[]>,
  ]);
  const messages = buildReminders({
    tasks,
    invoices,
    preferences,
    today: seoulDate(),
    time: seoulTime(),
    forceDigest,
  });

  const createClaim = db.prepare(
    "INSERT INTO notification_log(id,dedupe_key,message,sent_at,result) VALUES(?,?,?,?, 'sending') ON CONFLICT (dedupe_key) DO NOTHING",
  );
  const retryClaim = db.prepare(
    "UPDATE notification_log SET message=?,sent_at=?,result='sending' WHERE dedupe_key=? AND (result='failed' OR (result='sending' AND sent_at<?))",
  );
  const finishClaim = db.prepare(
    "UPDATE notification_log SET sent_at=?,result=? WHERE dedupe_key=? AND result='sending'",
  );
  const adminUrl = process.env.ADMIN_ORIGIN?.replace(/\/$/, "");
  let sent = 0;
  for (const item of messages) {
    const claimedAt = new Date().toISOString();
    const claimed =
      (await createClaim.run(randomBytes(16).toString("hex"), item.key, item.text, claimedAt)).changes === 1;
    const staleClaim = new Date(Date.now() - 15 * 60_000).toISOString();
    const reclaimed =
      !claimed && (await retryClaim.run(item.text, claimedAt, item.key, staleClaim)).changes === 1;
    if (!claimed && !reclaimed) continue;
    let ok = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await sendTelegram(chatId, adminUrl ? `${item.text}\n${adminUrl}/admin` : item.text);
        ok = response.ok;
        // 4xx(차단·잘못된 채팅 등)는 재시도해도 같은 결과이므로 중단한다.
        if (response.ok || response.status < 500) break;
      } catch {
        /* retry transient network failures */
      }
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
    await finishClaim.run(new Date().toISOString(), ok ? "sent" : "failed", item.key);
    if (ok) sent++;
  }
  return NextResponse.json({ sent, total: messages.length });
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return run(true);
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return run(false);
}
