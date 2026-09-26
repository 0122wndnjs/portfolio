import "server-only";
import { createHash } from "node:crypto";
import { db } from "@/lib/admin/db";
import { HttpError } from "@/lib/admin/http";
import type { Row } from "./api/common";

// These are business tables only. Auth, settings and audit data are intentionally excluded.
export const backupTables = ["projects", "tasks", "invoices", "payments", "quotes", "quote_task_links", "meetings", "meeting_task_links", "admin_trash"] as const;
type Table = typeof backupTables[number];
const keys: Record<Table, string[]> = {
  projects: ["id"], tasks: ["id"], invoices: ["id"], payments: ["id"],
  quotes: ["id"], quote_task_links: ["quote_id", "item_index"], meetings: ["id"],
  meeting_task_links: ["meeting_id", "task_id"], admin_trash: ["id"],
};
const columns: Record<Table, string[]> = {
  projects: ["id", "name", "client", "description", "contact", "email", "kind", "status", "start_date", "due_date", "contract_amount", "memo", "links", "created_at", "updated_at", "next_action", "waiting_reason", "next_check_date"],
  tasks: ["id", "project_id", "title", "description", "status", "priority", "due_date", "position", "checklist", "links", "waiting_since", "completed_at", "archived", "created_at", "updated_at", "parent_id", "depends_on_id"],
  invoices: ["id", "project_id", "title", "amount", "due_date", "memo", "created_at"],
  payments: ["id", "invoice_id", "amount", "paid_at", "memo", "created_at"],
  quotes: ["id", "project_id", "number", "title", "sender", "recipient", "issue_date", "valid_until", "status", "items", "tax_amount", "note", "created_at", "updated_at"],
  quote_task_links: ["quote_id", "item_index", "task_id"],
  meetings: ["id", "project_id", "title", "meeting_date", "start_time", "attendees", "location", "agenda", "decisions", "created_at", "updated_at"],
  meeting_task_links: ["meeting_id", "task_id"],
  admin_trash: ["id", "entity", "title", "payload", "deleted_at"],
};
const required: Record<Table, string[]> = {
  projects: ["id", "name", "client", "created_at", "updated_at"],
  tasks: ["id", "project_id", "title", "created_at", "updated_at"],
  invoices: ["id", "project_id", "title", "amount", "created_at"],
  payments: ["id", "invoice_id", "amount", "paid_at", "created_at"],
  quotes: ["id", "project_id", "number", "title", "recipient", "issue_date", "items", "created_at", "updated_at"],
  quote_task_links: ["quote_id", "item_index", "task_id"],
  meetings: ["id", "project_id", "title", "meeting_date", "start_time", "created_at", "updated_at"],
  meeting_task_links: ["meeting_id", "task_id"],
  admin_trash: ["id", "entity", "title", "payload", "deleted_at"],
};
type Backup = { version: 1; tables: Record<Table, Row[]> };
type Inspection = { added: Record<Table, number>; skipped: Record<Table, number>; conflicts: string[]; conflictCount: number; pending: Record<Table, Row[]> };

function rowKey(table: Table, row: Row) {
  return JSON.stringify(keys[table].map((key) => row[key]));
}
function identical(saved: Row, incoming: Row) {
  return Object.keys(incoming).every((key) => saved[key] === incoming[key]);
}
export function parseBackup(value: unknown): Backup {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new HttpError(400, "백업 파일 형식이 올바르지 않습니다.");
  const backup = value as Record<string, unknown>;
  if (backup.version !== 1 || !backup.tables || typeof backup.tables !== "object" || Array.isArray(backup.tables))
    throw new HttpError(400, "지원하지 않는 백업 버전 또는 파일 형식입니다.");
  const source = backup.tables as Record<string, unknown>;
  for (const table of backupTables) {
    if (!Array.isArray(source[table])) throw new HttpError(400, `${table} 데이터가 없습니다.`);
    const seen = new Set<string>();
    for (const row of source[table]) {
      if (!row || typeof row !== "object" || Array.isArray(row)) throw new HttpError(400, `${table} 행 형식이 올바르지 않습니다.`);
      const record = row as Row;
      if (Object.keys(record).some((key) => !columns[table].includes(key))) throw new HttpError(400, `${table}에 알 수 없는 필드가 있습니다.`);
      if (required[table].some((key) => record[key] === undefined || record[key] === null)) throw new HttpError(400, `${table}에 필수 필드가 없습니다.`);
      if (keys[table].some((key) => record[key] === undefined || record[key] === null)) throw new HttpError(400, `${table} 식별자가 없습니다.`);
      if (keys[table].some((key) => key === "item_index" ? !Number.isSafeInteger(record[key]) || Number(record[key]) < 0 : typeof record[key] !== "string" || !record[key]))
        throw new HttpError(400, `${table} 식별자 형식이 올바르지 않습니다.`);
      if (Object.values(record).some((item) => item !== null && typeof item !== "string" && (typeof item !== "number" || !Number.isSafeInteger(item))))
        throw new HttpError(400, `${table} 값 형식이 올바르지 않습니다.`);
      const id = rowKey(table, record);
      if (seen.has(id)) throw new HttpError(400, `${table}에 중복 식별자가 있습니다.`);
      seen.add(id);
    }
  }
  if (Object.keys(source).some((key) => !backupTables.includes(key as Table))) throw new HttpError(400, "알 수 없는 백업 테이블이 있습니다.");
  return backup as Backup;
}
export function backupFingerprint(backup: Backup) {
  return createHash("sha256").update(JSON.stringify(backup)).digest("hex");
}
export async function inspectBackup(backup: Backup): Promise<Inspection> {
  const added = {} as Record<Table, number>;
  const skipped = {} as Record<Table, number>;
  const pending = {} as Record<Table, Row[]>;
  const conflicts: string[] = [];
  let conflictCount = 0;
  const current = {} as Record<Table, Row[]>;
  for (const table of backupTables) {
    const existing = await db.prepare(`SELECT * FROM ${table}`).all();
    current[table] = existing;
    const byId = new Map(existing.map((row) => [rowKey(table, row), row]));
    pending[table] = [];
    skipped[table] = 0;
    for (const row of backup.tables[table]) {
      const saved = byId.get(rowKey(table, row));
      if (!saved) pending[table].push(row);
      else if (identical(saved, row)) skipped[table]++;
      else {
        conflictCount++;
        if (conflicts.length < 20) conflicts.push(`${table}: ${rowKey(table, row)}`);
      }
    }
    added[table] = pending[table].length;
  }
  const invoiceAmounts = new Map([...current.invoices, ...pending.invoices].map((row) => [String(row.id), Number(row.amount)]));
  const paid = new Map<string, number>();
  for (const row of [...current.payments, ...pending.payments]) {
    const invoiceId = String(row.invoice_id);
    paid.set(invoiceId, (paid.get(invoiceId) || 0) + Number(row.amount));
  }
  for (const [invoiceId, amount] of paid) {
    const limit = invoiceAmounts.get(invoiceId);
    if (limit === undefined || amount > limit) {
      conflictCount++;
      if (conflicts.length < 20) conflicts.push(`payments: 청구 ${invoiceId}의 입금 합계를 확인하세요.`);
    }
  }
  return { added, skipped, conflicts, conflictCount, pending };
}
export async function importBackup(backup: Backup) {
  try { return await db.transaction(async () => {
    const inspection = await inspectBackup(backup);
    if (inspection.conflicts.length) throw new HttpError(409, "같은 ID의 다른 데이터가 있습니다. 기존 기록을 덮어쓰지 않았습니다.");
    // Parent/dependency references can point to tasks later in the same file.
    for (const table of backupTables) {
      for (const row of inspection.pending[table]) {
        const data = table === "tasks" ? { ...row, parent_id: null, depends_on_id: null } : row;
        const names = Object.keys(data);
        if (!names.length) throw new HttpError(400, `${table} 행이 비어 있습니다.`);
        await db.prepare(`INSERT INTO ${table} (${names.join(",")}) VALUES (${names.map(() => "?").join(",")})`).run(...names.map((name) => data[name]));
      }
    }
    for (const row of inspection.pending.tasks) {
      if (row.parent_id || row.depends_on_id)
        await db.prepare("UPDATE tasks SET parent_id=?,depends_on_id=? WHERE id=?")
          .run(row.parent_id ?? null, row.depends_on_id ?? null, row.id);
    }
    return { added: inspection.added, skipped: inspection.skipped };
  }); } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error && typeof error === "object" && "code" in error && String(error.code).startsWith("23"))
      throw new HttpError(400, "백업 기록의 참조 관계 또는 값이 올바르지 않습니다. 기존 기록은 변경되지 않았습니다.");
    throw error;
  }
}
