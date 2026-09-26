type RelationTask = { id: string; parent_id: string | null; depends_on_id: string | null; status: string; title: string };

export default function TaskRelationBadges({ task, tasks }: { task: RelationTask; tasks: RelationTask[] }) {
  const children = tasks.filter((item) => item.parent_id === task.id).length;
  const predecessor = task.depends_on_id ? tasks.find((item) => item.id === task.depends_on_id) : null;
  if (!task.parent_id && !task.depends_on_id && !children) return null;
  return <span className="relation-badges">
    {task.parent_id && <span className="relation-chip">하위 작업</span>}
    {children > 0 && <span className="relation-chip">하위 {children}</span>}
    {task.depends_on_id && <span className={`relation-chip ${predecessor?.status === "완료" ? "is-ready" : "is-blocked"}`} title={predecessor?.title || "선행 작업 보관됨"}>
      {predecessor?.status === "완료" ? "선행 완료" : predecessor ? "선행 미완료" : "선행 확인 필요"}
    </span>}
  </span>;
}
