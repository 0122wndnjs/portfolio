import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import {
  checkRateLimit,
  requestAddress,
  saveChallenge,
} from "@/lib/admin/auth";
import { credentials, relyingParty } from "@/lib/admin/webauthn";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!checkRateLimit(`login:${requestAddress(request)}`, 10, 15 * 60_000))
    return NextResponse.json(
      { error: "로그인 시도가 많습니다. 잠시 후 다시 시도하세요." },
      { status: 429 },
    );
  const saved = credentials();
  if (!saved.length)
    return NextResponse.json(
      { error: "관리자 패스키가 등록되지 않았습니다." },
      { status: 409 },
    );
  const rp = await relyingParty();
  const options = await generateAuthenticationOptions({
    rpID: rp.rpID,
    userVerification: "required",
    allowCredentials: saved.map((item) => ({
      id: item.id,
      transports: JSON.parse(item.transports),
    })),
  });
  const challengeId = saveChallenge(options.challenge, "login");
  return NextResponse.json({ options, challengeId });
}
