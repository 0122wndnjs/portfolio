import AdminProject from "@/components/admin/AdminProject";

export default async function AdminProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminProject projectId={id} />;
}
