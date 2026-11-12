// 로컬 Claude Code·Codex 세션 기록에서 토큰 사용량을 읽어 관리자 DB(ai_usage)에 올린다.
// 사용: npm run sync:ai-usage            (전체 다시 계산 후 upsert — 여러 번 돌려도 안전)
//       npm run sync:ai-usage -- --dry   (DB에 쓰지 않고 폴더별 합계만 출력)
// - 대화 내용은 올리지 않는다. 날짜·폴더 이름·모델·토큰 수·세션 ID만 저장한다.
// - 폴더는 ~/Documents/GitHub/<폴더> 아래에서 작업한 세션만 집계한다.
import { createReadStream, existsSync, readdirSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import readline from "node:readline";
import postgres from "postgres";

const DRY = process.argv.includes("--dry");
const HOME = homedir();
const ORCA = path.join(HOME, "Library", "Application Support", "orca");
const REPO_ROOT = path.join(HOME, "Documents", "GitHub") + path.sep;

const seoulDate = (iso) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
const folderOf = (cwd) => (typeof cwd === "string" && cwd.startsWith(REPO_ROOT) ? cwd.slice(REPO_ROOT.length).split(path.sep)[0] : "");

function jsonlFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const full = path.join(d, name);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (name.endsWith(".jsonl")) out.push(full);
    }
  };
  walk(dir);
  return out;
}

async function* lines(file) {
  const rl = readline.createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      yield JSON.parse(line);
    } catch {
      /* 손상된 줄은 건너뛴다 */
    }
  }
}

/** key → 집계 행 */
const rows = new Map();
function add(tool, account, folder, session, model, date, u) {
  const id = `${tool}:${session}:${date}:${model}`;
  const row = rows.get(id) || { id, tool, account, folder, session_id: session, model, usage_date: date, input_tokens: 0, cache_read_tokens: 0, cache_write_tokens: 0, output_tokens: 0, requests: 0 };
  row.input_tokens += u.input || 0;
  row.cache_read_tokens += u.cacheRead || 0;
  row.cache_write_tokens += u.cacheWrite || 0;
  row.output_tokens += u.output || 0;
  row.requests += 1;
  rows.set(id, row);
}

// ── Claude Code ─────────────────────────────────────────────
// Orca 프로필들은 ~/.claude/projects로 심볼릭 링크라 실제 경로 기준으로 한 번만 읽는다.
// 같은 응답이 스트리밍 중 여러 줄로 남으므로 message.id 기준 마지막 줄만 쓴다.
async function claude() {
  const dirs = new Set([path.join(HOME, ".claude", "projects")]);
  const profiles = path.join(ORCA, "claude-profiles");
  if (existsSync(profiles)) for (const p of readdirSync(profiles)) dirs.add(path.join(profiles, p, "home", "projects"));
  const real = new Set([...dirs].filter(existsSync).map((d) => realpathSync(d)));
  const seen = new Map();
  for (const dir of real) {
    for (const file of jsonlFiles(dir)) {
      for await (const entry of lines(file)) {
        const usage = entry?.message?.usage;
        const id = entry?.message?.id;
        if (!usage || !id || entry.type !== "assistant") continue;
        const folder = folderOf(entry.cwd);
        if (!folder || !entry.timestamp) continue;
        seen.set(id, { folder, session: entry.sessionId || path.basename(file, ".jsonl"), model: entry.message.model || "", date: seoulDate(entry.timestamp), usage });
      }
    }
  }
  for (const { folder, session, model, date, usage } of seen.values()) {
    if (model === "<synthetic>") continue;
    add("claude", "claude", folder, session, model, date, {
      input: usage.input_tokens,
      cacheRead: usage.cache_read_input_tokens,
      cacheWrite: usage.cache_creation_input_tokens,
      output: usage.output_tokens,
    });
  }
  return seen.size;
}

// ── Codex ───────────────────────────────────────────────────
// 같은 세션 파일이 계정 폴더마다 복사돼 있어 session id로 한 번만 센다.
// token_count 이벤트의 last_token_usage(요청 1회분)를 더한다. input에는 cached가 포함돼 있어 뺀다.
async function codex() {
  const dirs = [path.join(HOME, ".codex", "sessions"), path.join(ORCA, "codex-runtime-home", "home", "sessions")];
  const accounts = path.join(ORCA, "codex-accounts");
  if (existsSync(accounts)) for (const a of readdirSync(accounts)) dirs.push(path.join(accounts, a, "home", "sessions"));
  const files = new Map(); // basename → 가장 큰 파일
  for (const dir of dirs) {
    for (const file of jsonlFiles(dir)) {
      const key = path.basename(file);
      const size = statSync(file).size;
      if (!files.has(key) || files.get(key).size < size) files.set(key, { file, size });
    }
  }
  for (const { file } of files.values()) {
    let session = "", account = "", cwd = "", model = "";
    for await (const entry of lines(file)) {
      const p = entry.payload || {};
      if (entry.type === "session_meta") {
        session = p.id || p.session_id || session;
        account = p.creator_account_id || account;
        cwd = p.cwd || cwd;
      } else if (entry.type === "turn_context") {
        cwd = p.cwd || cwd;
        model = p.model || model;
      } else if (entry.type === "event_msg" && p.type === "token_count" && p.info?.last_token_usage) {
        const folder = folderOf(cwd);
        if (!folder || !session || !entry.timestamp) continue;
        const u = p.info.last_token_usage;
        const cached = u.cached_input_tokens || 0;
        add("codex", account, folder, session, model, seoulDate(entry.timestamp), {
          input: Math.max(0, (u.input_tokens || 0) - cached),
          cacheRead: cached,
          cacheWrite: u.cache_write_input_tokens || 0,
          output: u.output_tokens || 0,
        });
      }
    }
  }
  return files.size;
}

const claudeCount = await claude();
const codexCount = await codex();
console.log(`Claude 응답 ${claudeCount}개, Codex 세션 파일 ${codexCount}개 → 집계 ${rows.size}행`);

const byFolder = new Map();
for (const r of rows.values()) {
  const t = byFolder.get(r.folder) || { claude: 0, codex: 0, days: new Set() };
  t[r.tool] += r.input_tokens + r.cache_read_tokens + r.cache_write_tokens + r.output_tokens;
  t.days.add(r.usage_date);
  byFolder.set(r.folder, t);
}
for (const [folder, t] of [...byFolder].sort((a, b) => b[1].claude + b[1].codex - a[1].claude - a[1].codex))
  console.log(`  ${folder.padEnd(28)} claude ${t.claude.toLocaleString().padStart(14)}  codex ${t.codex.toLocaleString().padStart(14)}  ${t.days.size}일`);

if (DRY) process.exit(0);

const url = process.env.ADMIN_DATABASE_URL;
if (!url) throw new Error("ADMIN_DATABASE_URL 환경변수가 필요합니다.");
const sql = postgres(url, { ssl: /[?&]sslmode=disable(&|$)/.test(url) ? false : "require", prepare: false, max: 1 });
const syncedAt = new Date().toISOString();
const all = [...rows.values()].map((r) => ({ ...r, synced_at: syncedAt }));
try {
  for (let i = 0; i < all.length; i += 500) {
    const chunk = all.slice(i, i + 500);
    await sql`
      INSERT INTO ai_usage ${sql(chunk)}
      ON CONFLICT (id) DO UPDATE SET
        account=EXCLUDED.account, folder=EXCLUDED.folder, input_tokens=EXCLUDED.input_tokens,
        cache_read_tokens=EXCLUDED.cache_read_tokens, cache_write_tokens=EXCLUDED.cache_write_tokens,
        output_tokens=EXCLUDED.output_tokens, requests=EXCLUDED.requests, synced_at=EXCLUDED.synced_at`;
  }
  console.log(`DB에 ${all.length}행 저장 완료`);
} finally {
  await sql.end();
}
