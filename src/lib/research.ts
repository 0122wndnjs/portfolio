import fs from "fs";
import path from "path";

export type ResearchStatus = "planned" | "draft" | "published";

export type ResearchDoc = {
  lang: string;
  slug: string;
  canonicalSlug: string;
  title: string;
  subtitle: string;
  summary: string;
  topic: string;
  tags: string[];
  author: string;
  readingTime: string;
  status: ResearchStatus;
  publishedAt: string | null;
  updatedAt: string | null;
  coverGradient: string;
  cover?: string;
  body: string;
};

type Frontmatter = {
  title?: string;
  subtitle?: string;
  slug?: string;
  canonicalSlug?: string;
  lang?: string;
  date?: string;
  updatedAt?: string;
  category?: string;
  tags?: string[] | string;
  description?: string;
  author?: string;
  readingTime?: string;
  status?: ResearchStatus;
  cover?: string;
};

const gradients = [
  "linear-gradient(135deg, #0ea5e9 0%, #2563eb 45%, #312e81 100%)",
  "linear-gradient(135deg, #22d3ee 0%, #0891b2 40%, #0f172a 100%)",
  "linear-gradient(135deg, #14b8a6 0%, #0f766e 50%, #0b1120 100%)",
  "linear-gradient(135deg, #06b6d4 0%, #0369a1 50%, #1e293b 100%)",
  "linear-gradient(135deg, #38bdf8 0%, #1d4ed8 48%, #111827 100%)",
  "linear-gradient(135deg, #22c55e 0%, #0ea5e9 52%, #1e1b4b 100%)",
];

function parseFrontmatter(raw: string): { frontmatter: Frontmatter; body: string } {
  if (!raw.startsWith("---\n")) return { frontmatter: {}, body: raw.trim() };
  const end = raw.indexOf("\n---", 4);
  if (end < 0) return { frontmatter: {}, body: raw.trim() };

  const frontmatterRaw = raw.slice(4, end).trim();
  const body = raw.slice(end + 4).trim();
  const frontmatter: Frontmatter = {};

  frontmatterRaw.split("\n").forEach((line) => {
    const sep = line.indexOf(":");
    if (sep < 0) return;
    const key = line.slice(0, sep).trim();
    const value = line.slice(sep + 1).trim();
    if (!key) return;
    if (value.startsWith("[") && value.endsWith("]")) {
      (frontmatter as Record<string, unknown>)[key] = value
        .slice(1, -1)
        .split(",")
        .map((i) => i.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
      return;
    }
    (frontmatter as Record<string, unknown>)[key] = value.replace(/^['"]|['"]$/g, "");
  });

  return { frontmatter, body };
}

function slugFromName(name: string): string {
  return name.replace(/\.md$/, "");
}

function normalizeDate(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value.trim());
  if (Number.isNaN(date.getTime())) return null;
  return value.trim();
}

function firstParagraph(markdown: string): string {
  return markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/`{1,3}.*?`{1,3}/g, "")
    .replace(/[*_>#-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function estimateReadingTime(markdown: string): string {
  const words = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/[#>*_\-[\]()]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 230))} min`;
}

function normalizeTags(tags: Frontmatter["tags"]): string[] {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string" && tags.length > 0)
    return tags.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

function pickGradient(slug: string): string {
  const total = slug.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return gradients[total % gradients.length];
}

function stripLeadingTitle(markdown: string, title: string, subtitle: string): string {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let result = markdown.trim();
  result = result.replace(new RegExp(`^#\\s+${esc(title)}\\s*\\n+`, "i"), "");
  if (subtitle)
    result = result.replace(new RegExp(`^##\\s+${esc(subtitle)}\\s*\\n+`, "i"), "");
  return result.replace(/\s+\{#[^}]+\}/g, "").trim();
}

function loadResearchDocs(): ResearchDoc[] {
  const postsDir = path.join(process.cwd(), "content", "posts");

  if (!fs.existsSync(postsDir)) return [];

  // Each subfolder is a post: content/posts/<slug>/index.md
  const entries = fs.readdirSync(postsDir, { withFileTypes: true });
  const postDirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !name.startsWith("_") && !name.startsWith("."));

  return postDirs
    .map((dirName) => {
      const indexPath = path.join(postsDir, dirName, "index.md");
      if (!fs.existsSync(indexPath)) return null;

      const baseName = dirName;
      const raw = fs.readFileSync(indexPath, "utf-8");
      const { frontmatter, body } = parseFrontmatter(raw);

      const slug = frontmatter.slug || baseName;
      const canonicalSlug = frontmatter.canonicalSlug || slug;
      const lang = frontmatter.lang || "ko";
      const date = normalizeDate(frontmatter.date);
      const updatedAt = normalizeDate(frontmatter.updatedAt) || date;
      const title = frontmatter.title ?? slug.replace(/-/g, " ");
      const subtitle = frontmatter.subtitle ?? "";
      const summary = frontmatter.description ?? firstParagraph(body);
      const topic = frontmatter.category ?? "Blockchain Research";
      const tags = normalizeTags(frontmatter.tags);
      const status: ResearchStatus = frontmatter.status ?? "published";
      const author = frontmatter.author ?? "Joowon Kim";
      const readingTime = frontmatter.readingTime ?? estimateReadingTime(body);

      return {
        lang,
        slug,
        canonicalSlug,
        title,
        subtitle,
        summary,
        topic,
        tags,
        author,
        readingTime,
        status,
        publishedAt: date,
        updatedAt,
        coverGradient: pickGradient(slug),
        cover: frontmatter.cover,
        body: stripLeadingTitle(body, title, subtitle),
      };
    })
    .filter((doc): doc is NonNullable<typeof doc> => doc !== null)
    .sort((a, b) => {
      const aDate = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bDate = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bDate - aDate;
    });
}

export const researchDocs: ResearchDoc[] = loadResearchDocs();
