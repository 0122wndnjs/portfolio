export type TaskRelation = { id: string; parent_id: string | null; depends_on_id: string | null };

export function hasRelationCycle(rows: TaskRelation[], id: string, target: string, field: "parent_id" | "depends_on_id") {
  const seen = new Set<string>([id]);
  let cursor: string | null = target;
  const links = new Map(rows.map((row) => [row.id, row[field]]));
  while (cursor) {
    if (seen.has(cursor)) return true;
    seen.add(cursor);
    cursor = links.get(cursor) ?? null;
  }
  return false;
}
