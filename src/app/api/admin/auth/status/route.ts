import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configured =
    (
      db.prepare("SELECT COUNT(*) AS count FROM credentials").get() as {
        count: number;
      }
    ).count > 0;
  return NextResponse.json(
    { configured, authenticated: await isAuthenticated() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
