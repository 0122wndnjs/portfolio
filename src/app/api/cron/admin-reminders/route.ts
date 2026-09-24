import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/admin/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const todaySeoul = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
const addDay = (date: string, days: number) =>
  new Date(
    new Date(`${date}T00:00:00+09:00`).getTime() + days * 86400000,
  ).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

export async function POST(request: Request) {
  if (
    !process.env.ADMIN_CRON_SECRET ||
    request.headers.get("authorization") !==
      `Bearer ${process.env.ADMIN_CRON_SECRET}`
  )
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const chatId = (
    db
      .prepare("SELECT value FROM settings WHERE key='telegram_chat_id'")
      .get() as { value: string } | undefined
  )?.value;
  if (!chatId || !process.env.TELEGRAM_BOT_TOKEN)
    return NextResponse.json({ sent: 0, skipped: "telegram not connected" });
  const prefs = JSON.parse(
    (
      db.prepare("SELECT value FROM settings WHERE key='preferences'").get() as
        { value: string } | undefined
    )?.value || "{}",
  );
  if (!prefs.notifications)
    return NextResponse.json({ sent: 0, skipped: "notifications disabled" });
  const today = todaySeoul(),
    tomorrow = addDay(today, 1),
    waitingDate = addDay(today, -(Number(prefs.overdueDays) || 3));
  const tasks = db
    .prepare(
      `SELECT t.id,t.title,t.status,t.due_date,t.waiting_since,p.name AS project_name FROM tasks t JOIN projects p ON p.id=t.project_id WHERE t.archived=0 AND t.status!='완료' AND p.status IN ('준비 중','진행 중')`,
    )
    .all() as Array<{
    id: string;
    title: string;
    status: string;
    due_date: string | null;
    waiting_since: string | null;
    project_name: string;
  }>;
  const invoiceRows = db
    .prepare(
      `SELECT i.id,i.title,i.due_date,p.name AS project_name,i.amount,(SELECT COALESCE(SUM(amount),0) FROM payments WHERE invoice_id=i.id) AS paid FROM invoices i JOIN projects p ON p.id=i.project_id`,
    )
    .all() as Array<{
    id: string;
    title: string;
    due_date: string | null;
    project_name: string;
    amount: number;
    paid: number;
  }>;
  const messages: Array<{ key: string; text: string }> = [];
  for (const task of tasks) {
    if (prefs.deadlineAlerts && task.due_date && task.due_date === tomorrow)
      messages.push({
        key: `deadline:${task.id}:${task.due_date}:lead`,
        text: `내일 마감 · ${task.project_name} / ${task.title}`,
      });
    if (prefs.deadlineAlerts && task.due_date && task.due_date <= today)
      messages.push({
        key: `deadline:${task.id}:${task.due_date}:today`,
        text: `마감 확인 · ${task.project_name} / ${task.title} (${task.due_date})`,
      });
    if (
      task.status === "확인 대기" &&
      task.waiting_since &&
      task.waiting_since.slice(0, 10) <= waitingDate
    )
      messages.push({
        key: `waiting:${task.id}:${task.waiting_since}`,
        text: `고객 확인 대기 · ${task.project_name} / ${task.title}`,
      });
  }
  if (prefs.paymentAlerts)
    for (const invoice of invoiceRows) {
      if (Number(invoice.paid) >= Number(invoice.amount) || !invoice.due_date)
        continue;
      if (invoice.due_date === today)
        messages.push({
          key: `payment:${invoice.id}:${invoice.due_date}:due`,
          text: `입금 예정 · ${invoice.project_name} / ${invoice.title}`,
        });
      else if (invoice.due_date < today)
        messages.push({
          key: `payment:${invoice.id}:${invoice.due_date}:overdue`,
          text: `입금 확인 · ${invoice.project_name} / ${invoice.title} (${invoice.due_date})`,
        });
    }
  const seoulTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Seoul",
  }).format(new Date());
  if (messages.length && seoulTime >= String(prefs.digestTime || "09:00"))
    messages.push({
      key: `digest:${today}`,
      text: `오늘 일정 ${messages.length}건 · 마감 작업 ${messages.filter((item) => item.key.startsWith("deadline:")).length}건 · 고객 확인 대기 ${messages.filter((item) => item.key.startsWith("waiting:")).length}건 · 입금 일정 ${messages.filter((item) => item.key.startsWith("payment:")).length}건`,
    });
  const createClaim = db.prepare(
    "INSERT OR IGNORE INTO notification_log(id,dedupe_key,message,sent_at,result) VALUES(?,?,?,?, 'sending')",
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
      createClaim.run(
        randomBytes(16).toString("hex"),
        item.key,
        item.text,
        claimedAt,
      ).changes === 1;
    const staleClaim = new Date(Date.now() - 15 * 60_000).toISOString();
    const reclaimed =
      !claimed &&
      retryClaim.run(item.text, claimedAt, item.key, staleClaim).changes === 1;
    if (!claimed && !reclaimed) continue;
    let response: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await fetch(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: adminUrl ? `${item.text}\n${adminUrl}/admin` : item.text,
              disable_web_page_preview: true,
            }),
          },
        );
        if (response.ok || response.status < 500) break;
      } catch {
        /* retry transient network failures */
      }
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
    const result = response?.ok ? "sent" : "failed";
    finishClaim.run(new Date().toISOString(), result, item.key);
    if (result === "sent") sent++;
  }
  return NextResponse.json({ sent, total: messages.length });
}
