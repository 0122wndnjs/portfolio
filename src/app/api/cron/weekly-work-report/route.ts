import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/admin/auth";
import { getSetting, sendTelegram } from "@/lib/admin/settings";
import { seoulDate } from "@/lib/admin/validation";
import { generateReport, reportTargets } from "@/lib/admin/weekly-report/generate";
import { lastWeekStart, weekLabel } from "@/lib/admin/weekly-report/naming";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** 매주 월 00:00 KST(일 15:00 UTC). 보고서 켜진 외주·개인 프로젝트의 지난주 보고서를 만든다. */
function authorized(request: Request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return [process.env.CRON_SECRET, process.env.ADMIN_CRON_SECRET].some((s) => !!s && safeEqual(token, s));
}

async function run() {
  const started = Date.now();
  const week = lastWeekStart(seoulDate());
  const targets = await reportTargets();
  const made: string[] = [], failed: string[] = [], deferred: string[] = [];
  for (const p of targets) {
    // 한 번 실행 제한(300초) 안에서 끝나지 않을 것 같으면 남은 건 다음 수동 실행으로 미룬다
    if (Date.now() - started > 200_000) { deferred.push(p.name); continue; }
    try {
      const r = await generateReport(p.id, week);
      if (!r.skipped) made.push(r.name ?? p.name);
    } catch {
      failed.push(p.name);
    }
  }
  const chat = await getSetting("telegram_chat_id");
  if (chat && process.env.TELEGRAM_BOT_TOKEN && (made.length || failed.length || deferred.length)) {
    const base = process.env.ADMIN_ORIGIN?.replace(/\/$/, "") || "";
    const lines = [`📝 ${weekLabel(week)} 주간 보고서`, made.length ? `검토 대기 ${made.length}개\n${made.map((n) => `· ${n}`).join("\n")}` : "", failed.length ? `실패: ${failed.join(", ")}` : "", deferred.length ? `시간 부족으로 미룸: ${deferred.join(", ")} (작업실에서 다시 만들기)` : ""].filter(Boolean);
    await sendTelegram(chat, lines.join("\n\n"), /^https:\/\//.test(base) ? { button: { text: "보고서 검토", url: `${base}/admin/reports` } } : {}).catch(() => {});
  }
  return NextResponse.json({ week, made, failed, deferred });
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return run();
}
export const POST = GET;
