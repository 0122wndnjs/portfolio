import type { ReactNode } from "react";
import { isAuthenticated } from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";
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
  const configured =
    (
      db.prepare("SELECT COUNT(*) AS count FROM credentials").get() as {
        count: number;
      }
    ).count > 0;
  if (!authenticated) return <AdminLogin configured={configured} />;
  return <AdminShell>{children}</AdminShell>;
}
