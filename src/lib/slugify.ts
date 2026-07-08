/** Shared between markdown heading ids and the TOC — must stay identical on both sides. */
export function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[*_`~]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

export type TocHeading = { id: string; text: string; level: 2 | 3 };

/** Extract h2/h3 headings from raw markdown (fenced code blocks excluded). */
export function extractHeadings(markdown: string): TocHeading[] {
  const headings: TocHeading[] = [];
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^(#{2,3})\s+(.+)$/.exec(line);
    if (!match) continue;
    const text = match[2].replace(/[*_`~]/g, "").trim();
    headings.push({
      id: slugifyHeading(text),
      text,
      level: match[1].length as 2 | 3,
    });
  }
  return headings;
}
