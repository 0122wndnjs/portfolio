import "server-only";

/** 지난주 레포 변경 수집. 토큰은 읽기 전용(Contents·Pull requests read) fine-grained PAT. */

export type RepoChange = {
  commits: { sha: string; message: string; date: string; url: string }[];
  pulls: { number: number; title: string; body: string; merged_at: string; url: string }[];
  files: { path: string; status: string; additions: number; deletions: number; patch: string }[];
  truncated: boolean;
};

const SKIP = /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb|.*\.min\.(js|css)|.*\.map)$|(^|\/)(dist|build|\.next|node_modules|out|coverage)\/|\.(png|jpe?g|gif|webp|avif|ico|svg|pdf|woff2?|ttf|mp4|zip)$/i;
// 화면·API·DB·SEO 관련 파일을 먼저 읽는다
const PRIORITY = [/(^|\/)(app|pages|routes)\//, /(^|\/)(api|server)\//, /migrations?\/|\.sql$|schema/i, /sitemap|robots|metadata|seo|json-?ld/i, /components?\//];
const MAX_COMMITS = 60;
const PATCH_PER_FILE = 3500;
const PATCH_TOTAL = 90_000;

async function gh<T>(path: string): Promise<T> {
  const token = process.env.GITHUB_REPORT_TOKEN;
  if (!token) throw new Error("GITHUB_REPORT_TOKEN 환경변수가 필요합니다.");
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "workspace-weekly-report" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GitHub ${res.status} ${path.split("?")[0]}`);
  return res.json() as Promise<T>;
}

const rank = (path: string) => { const i = PRIORITY.findIndex((r) => r.test(path)); return i < 0 ? PRIORITY.length : i; };

/** start~end(서울 날짜, 포함) 사이 변경 */
export async function collectRepo(fullName: string, branch: string, start: string, end: string): Promise<RepoChange> {
  if (!/^[\w.-]+\/[\w.-]+$/.test(fullName)) throw new Error("레포 이름 형식이 올바르지 않습니다. owner/repo");
  const since = new Date(`${start}T00:00:00+09:00`).toISOString();
  const until = new Date(`${end}T23:59:59+09:00`).toISOString();
  type C = { sha: string; html_url: string; commit: { message: string; author: { date: string } } };
  const commits: C[] = [];
  for (let page = 1; page <= 3 && commits.length < MAX_COMMITS; page++) {
    const batch = await gh<C[]>(`/repos/${fullName}/commits?sha=${encodeURIComponent(branch)}&since=${since}&until=${until}&per_page=100&page=${page}`);
    commits.push(...batch);
    if (batch.length < 100) break;
  }
  type P = { number: number; title: string; body: string | null; merged_at: string | null; html_url: string };
  const closed = await gh<P[]>(`/repos/${fullName}/pulls?state=closed&base=${encodeURIComponent(branch)}&sort=updated&direction=desc&per_page=50`);
  const pulls = closed.filter((p) => p.merged_at && p.merged_at >= since && p.merged_at <= until)
    .map((p) => ({ number: p.number, title: p.title, body: (p.body || "").slice(0, 1500), merged_at: p.merged_at!, url: p.html_url }));

  type F = { filename: string; status: string; additions: number; deletions: number; patch?: string };
  const byPath = new Map<string, RepoChange["files"][number]>();
  for (const c of commits.slice(0, MAX_COMMITS)) {
    if (c.commit.message.startsWith("Merge ")) continue;
    const detail = await gh<{ files?: F[] }>(`/repos/${fullName}/commits/${c.sha}`);
    for (const f of detail.files ?? []) {
      if (SKIP.test(f.filename)) continue;
      const prev = byPath.get(f.filename);
      const patch = ((prev?.patch ?? "") + "\n" + (f.patch ?? "")).trim();
      byPath.set(f.filename, { path: f.filename, status: prev?.status ?? f.status, additions: (prev?.additions ?? 0) + f.additions, deletions: (prev?.deletions ?? 0) + f.deletions, patch });
    }
  }
  const files = [...byPath.values()].sort((a, b) => rank(a.path) - rank(b.path) || (b.additions + b.deletions) - (a.additions + a.deletions));
  let budget = PATCH_TOTAL, truncated = commits.length > MAX_COMMITS;
  for (const f of files) {
    let p = f.patch.length > PATCH_PER_FILE ? (truncated = true, f.patch.slice(0, PATCH_PER_FILE) + "\n…(생략)") : f.patch;
    if (p.length > budget) { p = budget > 200 ? p.slice(0, budget) + "\n…(생략)" : ""; truncated = true; }
    budget -= p.length;
    f.patch = p;
  }
  return {
    commits: commits.slice(0, MAX_COMMITS).map((c) => ({ sha: c.sha.slice(0, 7), message: c.commit.message.split("\n")[0].slice(0, 200), date: c.commit.author.date, url: c.html_url })),
    pulls, files, truncated,
  };
}
