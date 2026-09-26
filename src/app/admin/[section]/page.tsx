import { notFound } from "next/navigation";
import AdminView from "@/components/admin/AdminView";
import QuotesPage from "@/components/admin/QuotesPage";
import MeetingsPage from "@/components/admin/MeetingsPage";
import WorkspaceTools from "@/components/admin/WorkspaceTools";
import { isProjectKind } from "@/lib/admin/project-kinds";

const sections = ["projects", "tasks", "meetings", "quotes", "payments", "settings", "tools"];

export default async function AdminSection({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ new?: string; project?: string; kind?: string; meeting?: string; quote?: string }>;
}) {
  const [{ section }, query] = await Promise.all([params, searchParams]);
  if (!sections.includes(section)) notFound();
  if (section === "tools") return <WorkspaceTools />;
  if (section === "meetings") return <MeetingsPage key={`${query.project || "all"}:${query.meeting || "list"}`} initialProjectId={query.project || ""} initialMeetingId={query.meeting || ""} />;
  if (section === "quotes") return <QuotesPage key={`${query.project || "all"}:${query.quote || "list"}`} initialProjectId={query.project || ""} initialQuoteId={query.quote || ""} />;
  return (
    <AdminView
      key={section === "projects" ? `${query.kind || "all"}:${query.new || "list"}` : section}
      section={section as "projects" | "tasks" | "payments" | "settings"}
      initialCreateProject={section === "projects" && query.new === "1"}
      initialProjectKind={query.kind && isProjectKind(query.kind) ? query.kind : ""}
    />
  );
}
