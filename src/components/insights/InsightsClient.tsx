"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowRight, FiClock } from "react-icons/fi";

type Post = {
  slug: string;
  title: string;
  summary: string;
  topic?: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
  readingTime?: string;
  status?: string;
};

export default function InsightsClient({ posts }: { posts: Post[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [query, setQuery] = useState("");

  const categories = ["All", ...Array.from(new Set(posts.map((p) => p.topic).filter(Boolean))) as string[]];

  const filtered = posts
    .filter((p) => activeCategory === "All" || p.topic === activeCategory)
    .filter((p) => !query || p.title.toLowerCase().includes(query.toLowerCase()));
  const [featured, ...rest] = filtered;

  return (
    <main className="min-h-screen" style={{ background: "#0F0E0C" }}>

      {/* Masthead */}
      <div className="relative overflow-hidden pt-32 pb-20" style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span
            className="font-black tracking-tighter"
            style={{ fontSize: "clamp(8rem, 22vw, 20rem)", color: "rgba(245,240,232,0.02)", whiteSpace: "nowrap" }}
          >
            INSIGHTS
          </span>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-end justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-6 h-px" style={{ background: "rgba(245,158,11,0.7)" }} />
                <span className="text-xs font-mono tracking-[0.25em] uppercase" style={{ color: "rgba(245,158,11,0.8)" }}>
                  joowonkim.me / insights
                </span>
              </div>
              <h1 className="font-black tracking-tight leading-[0.9]" style={{ fontSize: "clamp(3.5rem, 9vw, 8rem)", color: "#F5F0E8" }}>
                What I've Written.
              </h1>
            </div>
            <div className="hidden md:flex flex-col items-end gap-1 pb-2">
              <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: "rgba(245,240,232,0.2)" }}>Total</span>
              <span className="font-black text-4xl" style={{ color: "rgba(245,240,232,0.12)" }}>
                {String(posts.length).padStart(2, "0")}
              </span>
            </div>
          </motion.div>

          {/* Category filter + search */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center justify-between gap-4 mt-10"
          >
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="relative text-xs font-mono tracking-[0.15em] uppercase px-4 py-2 transition-colors duration-150"
                    style={{
                      color: isActive ? "#F59E0B" : "rgba(245,240,232,0.3)",
                      border: `1px solid ${isActive ? "rgba(245,158,11,0.4)" : "rgba(245,240,232,0.08)"}`,
                      background: isActive ? "rgba(245,158,11,0.06)" : "transparent",
                    }}
                  >
                    {cat}
                    {isActive && (
                      <motion.span
                        layoutId="cat-indicator"
                        className="absolute bottom-0 left-0 right-0 h-px"
                        style={{ background: "#F59E0B" }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="text-xs font-mono bg-transparent outline-none pl-3 pr-8 py-2 w-48 transition-all duration-200"
                style={{
                  color: "rgba(245,240,232,0.6)",
                  border: "1px solid rgba(245,240,232,0.08)",
                  caretColor: "#F59E0B",
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: "rgba(245,240,232,0.3)" }}
                >
                  ✕
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-8 lg:px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Featured */}
            {featured && (
              <div className="py-16" style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}>
                <Link href={`/insights/${featured.slug}`} className="group block">
                  <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 lg:gap-16 items-start">
                    <div className="shrink-0">
                      <span className="font-black leading-none select-none" style={{ fontSize: "clamp(5rem, 10vw, 9rem)", color: "rgba(245,240,232,0.06)", lineHeight: 1 }}>
                        01
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-4 mb-5">
                        <span
                          className="text-[10px] font-mono tracking-[0.25em] uppercase px-2.5 py-1"
                          style={{ color: "rgba(245,158,11,0.8)", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}
                        >
                          {featured.topic || "Featured"}
                        </span>
                        <span className="text-xs font-mono" style={{ color: "rgba(245,240,232,0.2)" }}>
                          {featured.publishedAt || featured.updatedAt}
                        </span>
                      </div>
                      <h2
                        className="font-bold tracking-tight leading-[1.1] mb-5"
                        style={{ fontSize: "clamp(1.8rem, 3.5vw, 3rem)", color: "rgba(245,240,232,0.9)" }}
                      >
                        {featured.title}
                      </h2>
                      <p className="font-light leading-relaxed mb-7" style={{ fontSize: "1.05rem", color: "rgba(245,240,232,0.38)", maxWidth: "55ch" }}>
                        {featured.summary}
                      </p>
                      <div className="flex items-center gap-3" style={{ color: "#F59E0B" }}>
                        <span className="text-sm font-medium">Read Article</span>
                        <FiArrowRight size={15} />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Post list */}
            {rest.length > 0 && (
              <div>
                {rest.map((post, i) => {
                  const idx = i + 1;
                  const isHovered = hoveredIndex === idx;
                  return (
                    <Link
                      key={post.slug}
                      href={`/insights/${post.slug}`}
                      className="group flex items-center gap-6 lg:gap-10 py-7 relative"
                      style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <span
                        className="shrink-0 font-black tabular-nums transition-colors duration-200"
                        style={{
                          fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)",
                          color: isHovered ? "rgba(245,158,11,0.6)" : "rgba(245,240,232,0.07)",
                          lineHeight: 1,
                          minWidth: "3rem",
                        }}
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-semibold truncate mb-1.5 transition-colors duration-200"
                          style={{ fontSize: "clamp(1rem, 1.5vw, 1.2rem)", color: isHovered ? "#F5F0E8" : "rgba(245,240,232,0.7)" }}
                        >
                          {post.title}
                        </p>
                        <div className="flex items-center gap-4 text-xs font-mono" style={{ color: "rgba(245,240,232,0.2)" }}>
                          {post.topic && <span>{post.topic}</span>}
                          <span>{post.publishedAt || post.updatedAt}</span>
                          {post.readingTime && (
                            <span className="hidden md:flex items-center gap-1">
                              <FiClock size={10} />
                              {post.readingTime}
                            </span>
                          )}
                        </div>
                      </div>
                      <motion.div
                        animate={{ x: isHovered ? 0 : -6, opacity: isHovered ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="shrink-0"
                        style={{ color: "#F59E0B" }}
                      >
                        <FiArrowRight size={18} />
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            )}

            {filtered.length === 0 && (
              <div className="py-32 text-center">
                <p className="text-sm font-mono" style={{ color: "rgba(245,240,232,0.2)" }}>No posts in this category.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
