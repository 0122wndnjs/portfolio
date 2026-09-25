import { NextResponse } from "next/server";
import { hash, safeEqual } from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!safeEqual(request.headers.get("x-telegram-bot-api-secret-token"), secret))
    return NextResponse.json({ ok: false }, { status: 403 });
  const update = (await request.json().catch(() => ({}))) as {
    message?: { text?: string; chat?: { id?: number } };
  };
  const text = update.message?.text || "";
  const chatId = update.message?.chat?.id;
  const code = text.match(/^\/start\s+([A-Za-z0-9_-]+)$/)?.[1];
  if (!code || !chatId) return NextResponse.json({ ok: true });
  const savedHash = (
    await db
      .prepare("SELECT value FROM settings WHERE key='telegram_connect_hash'")
      .get() as { value: string } | undefined
  )?.value;
  const expires = (
    await db
      .prepare(
        "SELECT value FROM settings WHERE key='telegram_connect_expires'",
      )
      .get() as { value: string } | undefined
  )?.value;
  if (
    !savedHash ||
    savedHash !== hash(code) ||
    !expires ||
    expires < new Date().toISOString()
  )
    return NextResponse.json({ ok: true });
  const set = db.prepare(
    "INSERT INTO settings(key,value) VALUES('telegram_chat_id',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
  );
  const clearHash = db.prepare(
    "DELETE FROM settings WHERE key IN ('telegram_connect_hash','telegram_connect_expires')",
  );
  await db.transaction(async () => {
    await set.run(String(chatId));
    await clearHash.run();
  });
  if (process.env.TELEGRAM_BOT_TOKEN) {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "작업 관리실 연결 완료. 프로젝트 마감과 입금 알림을 여기로 보내드릴게요.",
        }),
      },
    ).catch(() => undefined);
  }
  return NextResponse.json({ ok: true });
}
