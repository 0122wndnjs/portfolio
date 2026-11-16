import ReportView from "@/components/admin/ReportView";
import "@/components/admin/reports.css";

export default async function AdminReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReportView id={id} />;
}
