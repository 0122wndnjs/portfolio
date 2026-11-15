import "server-only";
import { db } from "@/lib/admin/db";
import { HttpError, json } from "@/lib/admin/http";
import { getSetting } from "@/lib/admin/settings";
import { now, type Route } from "./common";

const COMMAND_TTL_MS = 60 * 60_000;
const APPROVAL_TTL_MS = 30 * 60_000;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

/** 텔레그램 Bot API 호출(실패해도 흐름은 계속). */
export async function telegram(method: string, payload: Record<string, unknown>) {
  if (!process.env.TELEGRAM_BOT_TOKEN) return null;
  return fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
}

async function chatId() {
  const id = await getSetting("telegram_chat_id");
  if (!id) throw new HttpError(409, "텔레그램 봇을 먼저 연결하세요.");
  return id;
}

async function say(text: string, extra: Record<string, unknown> = {}) {
  const chat = await getSetting("telegram_chat_id");
  if (!chat) return;
  for (let i = 0; i < text.length || i === 0; i += 3900)
    await telegram("sendMessage", { chat_id: chat, text: text.slice(i, i + 3900) || "(빈 응답)", disable_web_page_preview: true, ...(i === 0 ? extra : {}) });
}

/** 오래된 대기 명령·승인을 만료 처리한다. */
async function expireOld() {
  const stale = (await db
    .prepare("UPDATE jkos_commands SET status='expired', updated_at=? WHERE status='queued' AND created_at<? RETURNING text")
    .all(now(), ago(COMMAND_TTL_MS))) as { text: string }[];
  for (const c of stale) await say(`⌛ 만료됨 (맥이 1시간 안에 받지 못했어요): ${c.text.slice(0, 80)}`);
  await db.prepare("UPDATE jkos_approvals SET status='expired' WHERE status='pending' AND created_at<?").run(ago(APPROVAL_TTL_MS));
}

export const jkosRoutes: Route[] = [
  {
    // 맥 앱이 대기 명령을 가져간다. 가져간 명령은 바로 running 으로 바꿔 두 번 실행되지 않게 한다.
    method: "GET",
    path: "jkos/commands",
    async handler() {
      await expireOld();
      const commands = await db
        .prepare(
          "UPDATE jkos_commands SET status='running', updated_at=? WHERE id IN (SELECT id FROM jkos_commands WHERE status='queued' ORDER BY created_at LIMIT 3) RETURNING id,text,created_at",
        )
        .all(now());
      return json({ commands });
    },
  },
  {
    method: "POST",
    path: "jkos/commands/:id/result",
    async handler({ params, body }) {
      const ok = body.ok !== false;
      const text = String(body.text ?? "").slice(0, 20_000);
      const row = await db
        .prepare("UPDATE jkos_commands SET status=?, result=?, updated_at=? WHERE id=? AND status='running' RETURNING id")
        .get(ok ? "done" : "failed", text, now(), params.id);
      if (!row) throw new HttpError(404, "처리 중인 명령이 아닙니다.");
      await say(ok ? text : `✗ ${text}`);
      return json({ ok: true });
    },
  },
  {
    // 비서 확인 카드를 텔레그램 승인 버튼으로 보낸다.
    method: "POST",
    path: "jkos/approvals",
    async handler({ body }) {
      const id = String(body.id ?? "");
      if (!/^[A-Za-z0-9]{6,40}$/.test(id)) throw new HttpError(400, "잘못된 id");
      const summary = String(body.summary ?? "").slice(0, 300);
      const commandId = body.command_id ? String(body.command_id) : null;
      await db.prepare("INSERT INTO jkos_approvals(id,command_id,summary,status,created_at) VALUES(?,?,?,'pending',?) ON CONFLICT(id) DO NOTHING").run(id, commandId, summary, now());
      await telegram("sendMessage", {
        chat_id: await chatId(),
        text: `확인 필요 · ${summary}\n(30분 안에 눌러 주세요)`,
        reply_markup: { inline_keyboard: [[{ text: "승인", callback_data: `ap:${id}:y` }, { text: "거절", callback_data: `ap:${id}:n` }]] },
      });
      return json({ ok: true });
    },
  },
  {
    // 결정된 승인을 맥 앱이 한 번만 가져간다.
    method: "GET",
    path: "jkos/approvals",
    async handler() {
      await expireOld();
      const approvals = await db
        .prepare("UPDATE jkos_approvals SET consumed_at=? WHERE consumed_at IS NULL AND status IN ('approved','rejected','expired') RETURNING id,status")
        .all(now());
      return json({ approvals });
    },
  },
];

/** 웹훅: 내 채팅에서 온 일반 메시지를 명령으로 쌓는다. */
export async function enqueueCommand(text: string) {
  await db.prepare("INSERT INTO jkos_commands(id,text,status,created_at,updated_at) VALUES(?,?,'queued',?,?)").run(
    crypto.randomUUID().replaceAll("-", ""), text.slice(0, 4000), now(), now(),
  );
}

/** 웹훅: 승인 버튼. 30분 안의 대기 건만 바꾼다. */
export async function decideApproval(id: string, approve: boolean) {
  const row = (await db
    .prepare("UPDATE jkos_approvals SET status=?, decided_at=? WHERE id=? AND status='pending' AND created_at>? RETURNING summary")
    .get(approve ? "approved" : "rejected", now(), id, ago(APPROVAL_TTL_MS))) as { summary: string } | undefined;
  return row?.summary ?? null;
}
