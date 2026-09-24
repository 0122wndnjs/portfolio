import { notFound } from "next/navigation";
import AdminView from "@/components/admin/AdminView";
import QuotesPage from "@/components/admin/QuotesPage";
import MeetingsPage from "@/components/admin/MeetingsPage";

const sections = ["projects", "tasks", "meetings", "quotes", "payments", "settings"];

export default async function AdminSection({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ new?: string; project?: string; kind?: string; meeting?: string }>;
}) {
  const [{ section }, query] = await Promise.all([params, searchParams]);
  if (!sections.includes(section)) notFound();
  if (section === "meetings") return <MeetingsPage key={`${query.project || "all"}:${query.meeting || "list"}`} initialProjectId={query.project || ""} initialMeetingId={query.meeting || ""} />;
  if (section === "quotes") return <QuotesPage key={query.project || "all"} initialProjectId={query.project || ""} />;
  return (
    <AdminView
      key={section === "projects" ? `${query.kind || "all"}:${query.new || "list"}` : section}
      section={section as "projects" | "tasks" | "payments" | "settings"}
      initialCreateProject={section === "projects" && query.new === "1"}
      initialProjectKind={query.kind === "회사" || query.kind === "외주" ? query.kind : ""}
    />
  );
}
