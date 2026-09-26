import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { db } from "../db";
import { backupTables, importBackup, inspectBackup, parseBackup } from "../workspace-backup";

const testUrl = process.env.ADMIN_TEST_DATABASE_URL;
const isolated = !!testUrl && /^postgres(?:ql)?:\/\/[^/]*@(?:localhost|127\.0\.0\.1):\d+\//.test(testUrl);
const suite = isolated ? describe : describe.skip;

suite("workspace backup against isolated PostgreSQL", () => {
  beforeAll(() => { process.env.ADMIN_DATABASE_URL = testUrl; });

  it("previews, restores and skips identical rows without changing existing data", async () => {
    const tables = Object.fromEntries(backupTables.map((name) => [name, []])) as Record<string, Array<Record<string, unknown>>>;
    const timestamp = "2026-09-27T00:00:00.000Z";
    tables.projects.push({ id: "backup-project", name: "Sample", client: "Client", created_at: timestamp, updated_at: timestamp });
    tables.tasks.push(
      { id: "backup-parent", project_id: "backup-project", title: "Parent", created_at: timestamp, updated_at: timestamp },
      { id: "backup-child", project_id: "backup-project", title: "Child", parent_id: "backup-parent", created_at: timestamp, updated_at: timestamp },
    );
    tables.invoices.push({ id: "backup-invoice", project_id: "backup-project", title: "Invoice", amount: 100, created_at: timestamp });
    tables.payments.push({ id: "backup-payment", invoice_id: "backup-invoice", amount: 60, paid_at: "2026-09-27", created_at: timestamp });
    const backup = parseBackup({ version: 1, tables });
    expect((await inspectBackup(backup)).added.tasks).toBe(2);
    expect((await importBackup(backup)).added.projects).toBe(1);
    expect((await db.prepare("SELECT parent_id FROM tasks WHERE id=?").get("backup-child"))?.parent_id).toBe("backup-parent");
    expect((await inspectBackup(backup)).skipped.projects).toBe(1);

    const conflicting = structuredClone(tables);
    conflicting.projects[0].name = "Changed";
    expect((await inspectBackup(parseBackup({ version: 1, tables: conflicting }))).conflicts).toHaveLength(1);
    await expect(importBackup(parseBackup({ version: 1, tables: conflicting }))).rejects.toThrow("덮어쓰지 않았습니다");
    expect((await db.prepare("SELECT name FROM projects WHERE id=?").get("backup-project"))?.name).toBe("Sample");

    const overpaid = Object.fromEntries(backupTables.map((name) => [name, []])) as Record<string, Array<Record<string, unknown>>>;
    overpaid.payments.push({ id: "extra-payment", invoice_id: "backup-invoice", amount: 50, paid_at: "2026-09-27", created_at: timestamp });
    expect((await inspectBackup(parseBackup({ version: 1, tables: overpaid }))).conflicts[0]).toContain("입금 합계");
  });
});
