import { NextResponse } from "next/server";
import {
  audit,
  checkRateLimit,
  createSession,
  hash,
  requestAddress,
} from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";
import { assertOrigin } from "@/lib/admin/webauthn";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await assertOrigin(request);
    if (!checkRateLimit(`recover:${requestAddress(request)}`, 5, 60 * 60_000))
      return NextResponse.json(
        { error: "복구 시도가 많습니다. 잠시 후 다시 시도하세요." },
        { status: 429 },
      );
    const body = (await request.json()) as { code?: string };
    const code = String(body.code || "")
      .replace(/[\s-]/g, "")
      .toUpperCase();
    const consumed = db.transaction(() => {
      const result = db
        .prepare(
          "UPDATE recovery_codes SET used_at=? WHERE code_hash=? AND used_at IS NULL",
        )
        .run(new Date().toISOString(), hash(code));
      if (result.changes !== 1) return false;
      db.prepare("DELETE FROM credentials").run();
      db.prepare("DELETE FROM sessions").run();
      return true;
    })();
    if (!consumed)
      return NextResponse.json(
        { error: "복구 코드가 올바르지 않거나 이미 사용됐습니다." },
        { status: 401 },
      );
    await createSession();
    audit("account.recovered");
    return NextResponse.json({ recovered: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "계정을 복구하지 못했습니다.",
      },
      { status: 400 },
    );
  }
}
