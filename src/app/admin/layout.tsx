import type { ReactNode } from "react";
import { isAuthenticated } from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";
import { relyingParty } from "@/lib/admin/webauthn";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return {
    title: "Workspace · Joowon Kim",
    robots: { index: false, follow: false, noarchive: true },
  };
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const authenticated = await isAuthenticated();
  const { rpID } = await relyingParty();
  const configured =
    (
      await db.prepare("SELECT COUNT(*) AS count FROM credentials WHERE rp_id=?").get(rpID) as {
        count: number;
      }
    ).count > 0;
  if (!authenticated) return <AdminLogin configured={configured} />;
  return <AdminShell>{children}</AdminShell>;
}
