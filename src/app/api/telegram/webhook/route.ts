import { NextResponse } from "next/server";
import { hash, safeEqual } from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";
import { decideApproval, enqueueCommand, telegram } from "@/lib/admin/api/jkos";
import { getSetting } from "@/lib/admin/settings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!safeEqual(request.headers.get("x-telegram-bot-api-secret-token"), secret))
    return NextResponse.json({ ok: false }, { status: 403 });
  const update = (await request.json().catch(() => ({}))) as {
    message?: { text?: string; chat?: { id?: number } };
    callback_query?: { id?: string; data?: string; message?: { message_id?: number; chat?: { id?: number }; text?: string } };
  };
  const owner = await getSetting("telegram_chat_id");

  // JKOS 원격 승인 버튼 — 연결된 내 채팅에서 온 것만
  const cb = update.callback_query;
  if (cb) {
    const m = cb.data?.match(/^ap:([A-Za-z0-9]{6,40}):(y|n)$/);
    if (owner && m && String(cb.message?.chat?.id) === owner) {
      const summary = await decideApproval(m[1], m[2] === "y");
      await telegram("answerCallbackQuery", { callback_query_id: cb.id, text: summary ? (m[2] === "y" ? "승인했어요" : "거절했어요") : "이미 처리됐거나 만료됐어요" });
      if (summary && cb.message?.message_id)
        await telegram("editMessageText", { chat_id: owner, message_id: cb.message.message_id, text: `${m[2] === "y" ? "✓ 승인" : "✗ 거절"} · ${summary}` });
    }
    return NextResponse.json({ ok: true });
  }

  const text = update.message?.text || "";
  const chatId = update.message?.chat?.id;
  const code = text.match(/^\/start\s+([A-Za-z0-9_-]+)$/)?.[1];
  // JKOS 원격 명령 — 연결된 내 채팅의 일반 메시지
  if (!code && owner && chatId && String(chatId) === owner && text.trim()) {
    await enqueueCommand(text.trim());
    await telegram("sendMessage", { chat_id: owner, text: "접수 ✓ 맥의 JKOS가 처리해요." });
    return NextResponse.json({ ok: true });
  }
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
