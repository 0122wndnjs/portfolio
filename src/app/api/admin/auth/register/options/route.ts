import { randomBytes } from "node:crypto";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import {
  checkRateLimit,
  isAuthenticated,
  requestAddress,
  saveChallenge,
} from "@/lib/admin/auth";
import { credentials, relyingParty } from "@/lib/admin/webauthn";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!checkRateLimit(`register:${requestAddress(request)}`, 5, 60 * 60_000))
    return NextResponse.json(
      { error: "패스키 등록 시도가 많습니다. 잠시 후 다시 시도하세요." },
      { status: 429 },
    );
  const existing = credentials();
  const authenticated = await isAuthenticated();
  const body = (await request.json().catch(() => ({}))) as {
    bootstrapToken?: string;
  };
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
  const rp = await relyingParty();
  const options = await generateRegistrationOptions({
    rpName: rp.rpName,
    rpID: rp.rpID,
    userName: "owner",
    userDisplayName: "Joowon",
    userID: randomBytes(16),
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
    },
    excludeCredentials: existing.map((item) => ({
      id: item.id,
      transports: JSON.parse(item.transports),
    })),
  });
  const challengeId = saveChallenge(options.challenge, "register");
  return NextResponse.json({ options, challengeId });
}
