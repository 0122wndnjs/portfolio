import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import {
  audit,
  checkRateLimit,
  consumeChallenge,
  createSession,
  isAuthenticated,
  requestAddress,
} from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";
import { assertOrigin, credentials, relyingParty } from "@/lib/admin/webauthn";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await assertOrigin(request);
    if (!await checkRateLimit(`register:${requestAddress(request)}`, 5, 60 * 60_000))
      return NextResponse.json(
        { error: "패스키 등록 시도가 많습니다. 잠시 후 다시 시도하세요." },
        { status: 429 },
      );
    const body = (await request.json()) as {
      response: Parameters<typeof verifyRegistrationResponse>[0]["response"];
      challengeId: string;
      bootstrapToken?: string;
      deviceName?: string;
    };
    const existing = await credentials();
    const authenticated = await isAuthenticated();
    if (
      existing.length === 0 &&
      !authenticated &&
      (!process.env.ADMIN_BOOTSTRAP_TOKEN ||
        body.bootstrapToken !== process.env.ADMIN_BOOTSTRAP_TOKEN)
    ) {
      return NextResponse.json(
        { error: "최초 관리자 등록 토큰이 올바르지 않습니다." },
        { status: 403 },
      );
    }
    if (existing.length > 0 && !authenticated)
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    const expectedChallenge = await consumeChallenge(body.challengeId, "register");
    if (!expectedChallenge)
      return NextResponse.json(
        { error: "등록 요청이 만료됐습니다. 다시 시도하세요." },
        { status: 400 },
      );
    const rp = await relyingParty();
    const result = await verifyRegistrationResponse({
      response: body.response,
      expectedChallenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.rpID,
      requireUserVerification: true,
    });
    if (!result.verified || !result.registrationInfo)
      return NextResponse.json(
        { error: "패스키 등록을 검증하지 못했습니다." },
        { status: 400 },
      );
    const credential = result.registrationInfo.credential;
    await db.prepare(
      "INSERT INTO credentials(id,rp_id,public_key,counter,transports,device_name,created_at) VALUES(?,?,?,?,?,?,?)",
    ).run(
      credential.id,
      rp.rpID,
      Buffer.from(credential.publicKey).toString("base64url"),
      credential.counter,
      JSON.stringify(credential.transports || []),
      (body.deviceName || "내 기기").slice(0, 60),
      new Date().toISOString(),
    );
    await audit("passkey.registered", { credentialId: credential.id });
    if (existing.length === 0) await createSession();
    return NextResponse.json({ verified: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "패스키 등록 실패" },
      { status: 400 },
    );
  }
}
