import "server-only";
import { db } from "@/lib/admin/db";
import { parsePreferences } from "@/lib/admin/reminders";

export async function getSetting(key: string, fallback = "") {
  const row = await db.prepare("SELECT value FROM settings WHERE key=?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? fallback;
}

export async function setSetting(key: string, value: string) {
  await db.prepare(
    "INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
  ).run(key, value);
}

export async function getPreferences() {
  return parsePreferences(await getSetting("preferences"));
}

export async function sendTelegram(chatId: string, text: string) {
  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10_000),
    },
  );
  return response;
}
