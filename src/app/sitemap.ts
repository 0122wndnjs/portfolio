import type { MetadataRoute } from "next";
import { researchDocs } from "@/lib/research";

const BASE = "https://joowonkim.me";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = researchDocs
    .filter((d) => d.status === "published")
    .map((d) => ({
      url: `${BASE}/insights/${d.slug}`,
      lastModified: d.publishedAt ? new Date(d.publishedAt) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "monthly", priority: 1.0 },
    { url: `${BASE}/insights`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    ...posts,
  ];
}
