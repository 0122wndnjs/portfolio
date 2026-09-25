// 관리자 작업실 DB 백업. 사용: npm run backup:admin [-- 저장_폴더]
// - 기본 저장 위치는 저장소 밖(~/Backups/portfolio-admin). 공개 저장소에 고객 데이터가 커밋되지 않도록
//   저장소 안 경로는 거부한다.
// - pg_dump 메이저 버전이 Supabase 서버 버전 이상이어야 한다(예: brew install postgresql@17).
// - 30일이 지난 백업 파일은 삭제한다.
import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const RETENTION_DAYS = 30;
const TABLES = [
  "projects", "tasks", "invoices", "payments", "quotes", "quote_task_links",
  "meetings", "meeting_task_links", "settings", "notification_log", "audit_log",
  "credentials", "sessions", "recovery_codes", "challenges", "rate_limits",
];

// pg_dump는 세션 기능이 필요해 트랜잭션 풀러(6543) 대신 세션 풀러(5432)를 쓴다.
const url =
  process.env.ADMIN_BACKUP_DATABASE_URL ||
  process.env.ADMIN_DATABASE_URL?.replace(/:6543\//, ":5432/");
if (!url) throw new Error("ADMIN_DATABASE_URL 또는 ADMIN_BACKUP_DATABASE_URL 환경변수가 필요합니다.");

const repo = path.resolve(process.cwd());
const target = path.resolve(process.argv[2] || path.join(homedir(), "Backups", "portfolio-admin"));
if (target === repo || target.startsWith(repo + path.sep))
  throw new Error("백업은 저장소 밖에 저장하세요. 고객 데이터가 커밋될 수 있습니다.");

mkdirSync(target, { recursive: true, mode: 0o700 });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const file = path.join(target, `admin-${stamp}.dump`);
const pgDump = process.env.PG_DUMP || "pg_dump";

try {
  execFileSync(
    pgDump,
    [
      "--format=custom",
      "--no-owner",
      "--no-privileges",
      ...TABLES.flatMap((table) => ["--table", `public.${table}`]),
      "--file",
      file,
      url,
    ],
    { stdio: ["ignore", "inherit", "inherit"] },
  );
} catch {
  rmSync(file, { force: true });
  console.error(
    "\n백업 실패. 'server version mismatch'가 보이면 서버 버전 이상의 pg_dump를 설치하고 PG_DUMP=/경로/pg_dump 로 지정하세요.",
  );
  process.exit(1);
}
chmodSync(file, 0o600);

const cutoff = Date.now() - RETENTION_DAYS * 86_400_000;
for (const name of readdirSync(target)) {
  if (!/^admin-.*\.dump$/.test(name)) continue;
  const full = path.join(target, name);
  if (statSync(full).mtimeMs < cutoff) rmSync(full);
}
console.log(`백업 완료: ${file} (${Math.round(statSync(file).size / 1024)} KB)`);
console.log(`복원: pg_restore --clean --if-exists --no-owner --dbname "$ADMIN_BACKUP_DATABASE_URL" "${file}"`);
