import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";
import { relyingParty } from "@/lib/admin/webauthn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { rpID } = await relyingParty();
  const configured =
    (
      await db.prepare("SELECT COUNT(*) AS count FROM credentials WHERE rp_id=?").get(rpID) as {
        count: number;
      }
    ).count > 0;
  return NextResponse.json(
    { configured, authenticated: await isAuthenticated() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
