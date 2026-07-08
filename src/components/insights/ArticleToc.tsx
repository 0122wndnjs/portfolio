"use client";

import { useEffect, useState } from "react";
import type { TocHeading } from "@/lib/slugify";

export default function ArticleToc({ headings }: { headings: TocHeading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      // active = heading inside the top reading band
      { rootMargin: "-15% 0px -70% 0px" },
    );
    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="flex flex-col gap-0.5">
      <p
        className="mb-4 text-[10px] font-mono uppercase tracking-[0.25em]"
        style={{ color: "rgba(14,13,31,0.25)" }}
      >
        On this page
      </p>
      {headings.map((h) => {
        const active = activeId === h.id;
        return (
          <a
            key={h.id}
            href={`#${h.id}`}
            className="group relative py-1.5 text-[12px] leading-snug transition-colors duration-200"
            style={{
              paddingLeft: h.level === 3 ? "1.9rem" : "1rem",
              color: active ? "#0e0d1f" : "rgba(14,13,31,0.35)",
              fontWeight: active ? 600 : 400,
            }}
          >
            <span
              className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 transition-opacity duration-200"
              style={{
                background: "linear-gradient(180deg, #5b4dff, #14c8eb)",
                opacity: active ? 1 : 0,
              }}
            />
            {h.text}
          </a>
        );
      })}
    </nav>
  );
}
