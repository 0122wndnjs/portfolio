import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import {
  audit,
  checkRateLimit,
  consumeChallenge,
  createSession,
  requestAddress,
} from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";
import { assertOrigin, credentials, relyingParty } from "@/lib/admin/webauthn";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await assertOrigin(request);
    if (!await checkRateLimit(`login:${requestAddress(request)}`, 10, 15 * 60_000))
      return NextResponse.json(
        { error: "로그인 시도가 많습니다. 잠시 후 다시 시도하세요." },
        { status: 429 },
      );
    const body = (await request.json()) as {
      response: Parameters<typeof verifyAuthenticationResponse>[0]["response"];
      challengeId: string;
    };
    const expectedChallenge = await consumeChallenge(body.challengeId, "login");
    if (!expectedChallenge)
      return NextResponse.json(
        { error: "로그인 요청이 만료됐습니다. 다시 시도하세요." },
        { status: 400 },
      );
    const saved = (await credentials()).find((item) => item.id === body.response.id);
    if (!saved)
      return NextResponse.json(
        { error: "등록되지 않은 패스키입니다." },
        { status: 401 },
      );
    const rp = await relyingParty();
    const result = await verifyAuthenticationResponse({
      response: body.response,
      expectedChallenge,
      expectedOrigin: rp.origin,
      expectedRPID: rp.rpID,
      requireUserVerification: true,
      credential: {
        id: saved.id,
        publicKey: Buffer.from(saved.public_key, "base64url"),
        counter: saved.counter,
        transports: JSON.parse(saved.transports),
      },
    });
    if (!result.verified)
      return NextResponse.json({ error: "패스키 인증 실패" }, { status: 401 });
    await db.prepare(
      "UPDATE credentials SET counter=?,last_used_at=? WHERE id=?",
    ).run(
      result.authenticationInfo.newCounter,
      new Date().toISOString(),
      saved.id,
    );
    await createSession();
    await audit("passkey.login", { credentialId: saved.id });
    return NextResponse.json({ verified: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "로그인 실패" },
      { status: 400 },
    );
  }
}
