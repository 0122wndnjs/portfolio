import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import postgres from "postgres";

const source = process.argv[2];
const destination = process.env.ADMIN_DATABASE_URL;
if (!source || !destination) {
  throw new Error("사용법: ADMIN_DATABASE_URL=... node scripts/migrate-admin-sqlite.mjs .data/workspace.sqlite");
}

const tables = [
  "projects", "tasks", "invoices", "payments", "quotes", "quote_task_links",
  "meetings", "meeting_task_links",
];
const temp = mkdtempSync(path.join(tmpdir(), "admin-sqlite-migration-"));
const snapshot = path.join(temp, "workspace.sqlite");
const sql = postgres(destination, { max: 1, prepare: false, ssl: "require" });

try {
  // SQLite's backup command includes committed WAL data in a consistent snapshot.
  execFileSync("sqlite3", [source, `.backup '${snapshot.replaceAll("'", "''")}'`]);
  const data = tables.map((table) => {
    const output = execFileSync("sqlite3", ["-json", snapshot, `SELECT * FROM ${table}`], {
      encoding: "utf8",
    }).trim();
    return { table, rows: output ? JSON.parse(output) : [] };
  });
  await sql.begin(async (tx) => {
    for (const table of tables) {
      const [{ count }] = await tx.unsafe(`SELECT COUNT(*)::int AS count FROM ${table}`);
      if (count !== 0) throw new Error(`대상 ${table} 테이블에 이미 데이터가 있어 이전을 중단했습니다.`);
    }
    for (const { table, rows } of data) {
      for (const row of rows) {
        const columns = Object.keys(row);
        const names = columns.map((name) => `"${name.replaceAll('"', '""')}"`).join(",");
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(",");
        await tx.unsafe(`INSERT INTO ${table} (${names}) VALUES (${placeholders})`, Object.values(row));
      }
      process.stdout.write(`${table}: ${rows.length}건 이전\n`);
    }
  });
  process.stdout.write("업무 데이터 이전 완료. 운영 도메인에서 패스키를 새로 등록하세요.\n");
} finally {
  await sql.end();
  rmSync(temp, { recursive: true, force: true });
}
