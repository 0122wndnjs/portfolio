"use client";

import { useState, useRef, useEffect } from "react";
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
  cover?: string;
  coverGradient?: string;
};

const easeOut = [0.16, 1, 0.3, 1] as const;

function IrisFillTitle({
  text,
  hovered,
  className,
  style,
}: {
  text: string;
  hovered: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span className={`relative block ${className ?? ""}`} style={style}>
      {text}
      <motion.span
        aria-hidden
        animate={{ clipPath: hovered ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
        transition={{ duration: 0.45, ease: easeOut }}
        className="text-iris absolute inset-0"
      >
        {text}
      </motion.span>
    </span>
  );
}

export default function InsightsClient({ posts }: { posts: Post[] }) {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement | null>(null);

  // "/" focuses search — dev-tool muscle memory
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") searchRef.current?.blur();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const categories = ["All", ...Array.from(new Set(posts.map((p) => p.topic).filter(Boolean))) as string[]];
  const countFor = (cat: string) =>
    cat === "All" ? posts.length : posts.filter((p) => p.topic === cat).length;

  const filtered = posts
    .filter((p) => activeCategory === "All" || p.topic === activeCategory)
    .filter((p) => !query || p.title.toLowerCase().includes(query.toLowerCase()));
  const [featured, ...rest] = filtered;

  return (
    <main className="min-h-screen overflow-x-clip">

      {/* Masthead */}
      <div className="relative pt-32 pb-16" style={{ borderBottom: "1px solid rgba(14,13,31,0.06)" }}>
        {/* low-contrast infinite marquee backdrop */}
        <div className="absolute inset-x-0 bottom-0 overflow-hidden pointer-events-none select-none" aria-hidden>
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 46, ease: "linear" }}
            className="flex w-fit"
          >
            {[0, 1].map((copy) => (
              <span
                key={copy}
                className="font-display block font-black tracking-tighter leading-none whitespace-nowrap"
                style={{ fontSize: "clamp(6rem, 16vw, 15rem)", color: "rgba(14,13,31,0.025)" }}
              >
                INSIGHTS — RESEARCH — WEB3 — WRITING —&nbsp;
              </span>
            ))}
          </motion.div>
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-5"
          >
            <span className="w-6 h-px" style={{ background: "rgba(91,77,255,0.7)" }} />
            <span className="text-xs font-mono tracking-[0.25em] uppercase" style={{ color: "rgba(91,77,255,0.8)" }}>
              joowonkim.me / insights
            </span>
          </motion.div>

          {/* letter-stagger headline, outline second line */}
          <h1
            className="font-bold tracking-tight leading-[0.95]"
            style={{ fontSize: "clamp(3.5rem, 9vw, 7.5rem)", color: "#0e0d1f" }}
          >
            {(["What I've", "written."] as const).map((word, line) => (
              <span key={word} className="block overflow-hidden">
                <motion.span
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.03, delayChildren: line * 0.16 } } }}
                  className="inline-block"
                >
                  {word.split("").map((ch, i) => (
                    <motion.span
                      key={i}
                      variants={{
                        hidden: { y: "110%", opacity: 0 },
                        show: { y: "0%", opacity: 1, transition: { duration: 0.6, ease: easeOut } },
                      }}
                      className={`inline-block whitespace-pre ${line === 1 ? "text-outline font-display" : ""}`}
                      style={line === 1 ? { WebkitTextStroke: "1.5px rgba(14,13,31,0.8)" } : undefined}
                    >
                      {ch}
                    </motion.span>
                  ))}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 text-[11px] font-mono uppercase tracking-[0.25em]"
            style={{ color: "rgba(14,13,31,0.28)" }}
          >
            [{posts.length} posts — research &amp; notes]
          </motion.p>

          {/* Filter tabs + search */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
            className="mt-12 flex flex-wrap items-end justify-between gap-x-8 gap-y-4"
          >
            <div className="flex flex-wrap gap-x-7 gap-y-2">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="relative pb-2 text-xs font-mono uppercase tracking-[0.18em] transition-colors duration-200"
                    style={{ color: isActive ? "#0e0d1f" : "rgba(14,13,31,0.35)" }}
                  >
                    {cat}
                    <sup className="ml-1 text-[9px]" style={{ color: isActive ? "#5b4dff" : "rgba(14,13,31,0.3)" }}>
                      {countFor(cat)}
                    </sup>
                    {isActive && (
                      <motion.span
                        layoutId="insights-tab"
                        className="absolute bottom-0 left-0 right-0 h-[2px]"
                        style={{ background: "linear-gradient(90deg, #5b4dff, #14c8eb, #59f0c0)" }}
                        transition={{ type: "spring", damping: 30, stiffness: 350 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* minimal underline search */}
            <div className="relative flex items-center gap-2" style={{ borderBottom: "1px solid rgba(14,13,31,0.12)" }}>
              <input
                ref={searchRef}
                type="text"
                placeholder="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-44 bg-transparent pb-2 text-xs font-mono outline-none"
                style={{ color: "rgba(14,13,31,0.6)", caretColor: "#5b4dff" }}
              />
              {query ? (
                <button
                  onClick={() => setQuery("")}
                  className="pb-2 text-xs"
                  style={{ color: "rgba(14,13,31,0.3)" }}
                >
                  ✕
                </button>
              ) : (
                <kbd
                  className="mb-2 rounded px-1.5 py-0.5 text-[9px] font-mono"
                  style={{ color: "rgba(14,13,31,0.25)", border: "1px solid rgba(14,13,31,0.1)" }}
                >
                  /
                </kbd>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-8 lg:px-12">
        {/* Featured */}
        <AnimatePresence mode="popLayout">
          {featured && (
            <motion.div
              key={`featured-${featured.slug}`}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: easeOut }}
              className="py-14"
            >
              <Link
                href={`/insights/${featured.slug}`}
                className="group block"
                onMouseEnter={() => setHoveredSlug(featured.slug)}
                onMouseLeave={() => setHoveredSlug(null)}
              >
                <div className="card-iris relative overflow-hidden">
                  {/* giant outline index in the card's backdrop — no cover, type only */}
                  <span
                    aria-hidden
                    className="font-display pointer-events-none absolute -right-2 -top-8 select-none font-black leading-none"
                    style={{
                      fontSize: "clamp(8rem, 16vw, 14rem)",
                      color: "transparent",
                      WebkitTextStroke: "1.5px rgba(91,77,255,0.14)",
                    }}
                  >
                    01
                  </span>
                  <div className="relative p-8 lg:p-12">
                    <div className="mb-6 flex items-center gap-4">
                      <span className="text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: "#5b4dff" }}>
                        featured — {featured.topic || "post"}
                      </span>
                      <span className="text-xs font-mono" style={{ color: "rgba(14,13,31,0.22)" }}>
                        {featured.publishedAt || featured.updatedAt}
                      </span>
                    </div>

                    <h2
                      className="mb-5 font-bold tracking-tight leading-[1.08]"
                      style={{ fontSize: "clamp(1.7rem, 3.2vw, 2.7rem)", color: "rgba(14,13,31,0.85)" }}
                    >
                      <IrisFillTitle text={featured.title} hovered={hoveredSlug === featured.slug} />
                    </h2>

                    <p className="mb-8 font-light leading-relaxed" style={{ fontSize: "1.02rem", color: "rgba(14,13,31,0.4)", maxWidth: "52ch" }}>
                      {featured.summary}
                    </p>

                    <div className="flex items-center gap-3 text-sm font-medium" style={{ color: "#5b4dff" }}>
                      Read article
                      <motion.span animate={{ x: hoveredSlug === featured.slug ? 4 : 0 }} transition={{ duration: 0.2 }}>
                        <FiArrowRight size={15} />
                      </motion.span>
                      {featured.readingTime && (
                        <span className="ml-4 flex items-center gap-1.5 text-xs font-mono" style={{ color: "rgba(14,13,31,0.25)" }}>
                          <FiClock size={10} />
                          {featured.readingTime}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Archive list */}
        {rest.length > 0 && (
          <div className="pb-24">
            <div
              className="flex items-baseline gap-6 pb-3 text-[10px] font-mono uppercase tracking-[0.2em] lg:gap-10"
              style={{ color: "rgba(14,13,31,0.22)", borderBottom: "1px solid rgba(14,13,31,0.07)" }}
            >
              <span className="w-12 shrink-0">No.</span>
              <span className="flex-1">Title</span>
              <span className="hidden md:block">Topic</span>
              <span className="hidden md:block w-24 text-right">Date</span>
              <span className="hidden md:block w-16 text-right">Read</span>
              <span className="w-5" />
            </div>

            <AnimatePresence mode="popLayout">
              {rest.map((post, i) => {
                const isHovered = hoveredSlug === post.slug;
                return (
                  <motion.div
                    key={post.slug}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: easeOut }}
                  >
                    <Link
                      href={`/insights/${post.slug}`}
                      className="group relative flex items-center gap-6 py-7 lg:gap-10"
                      style={{ borderBottom: "1px solid rgba(14,13,31,0.06)" }}
                      onMouseEnter={() => setHoveredSlug(post.slug)}
                      onMouseLeave={() => setHoveredSlug(null)}
                    >
                      <span
                        className="w-12 shrink-0 font-mono text-xs transition-colors duration-200"
                        style={{ color: isHovered ? "#5b4dff" : "rgba(14,13,31,0.22)" }}
                      >
                        {String(i + 2).padStart(2, "0")}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate font-semibold transition-colors duration-200"
                          style={{ fontSize: "clamp(1rem, 1.5vw, 1.25rem)", color: "rgba(14,13,31,0.6)" }}
                        >
                          <IrisFillTitle text={post.title} hovered={isHovered} className="truncate" />
                        </p>
                        {/* mobile meta */}
                        <div className="mt-1.5 flex items-center gap-4 text-xs font-mono md:hidden" style={{ color: "rgba(14,13,31,0.2)" }}>
                          {post.topic && <span>{post.topic}</span>}
                          <span>{post.publishedAt || post.updatedAt}</span>
                        </div>
                      </div>

                      <span className="hidden text-[10px] font-mono uppercase tracking-[0.15em] md:block" style={{ color: "rgba(14,13,31,0.3)" }}>
                        {post.topic || "—"}
                      </span>
                      <span className="hidden w-24 text-right text-xs font-mono md:block" style={{ color: "rgba(14,13,31,0.25)" }}>
                        {post.publishedAt || post.updatedAt}
                      </span>
                      <span className="hidden w-16 text-right text-xs font-mono md:block" style={{ color: "rgba(14,13,31,0.25)" }}>
                        {post.readingTime || "—"}
                      </span>

                      <motion.span
                        animate={{ x: isHovered ? 0 : -6, opacity: isHovered ? 1 : 0.15, rotate: isHovered ? 0 : -45 }}
                        transition={{ duration: 0.2 }}
                        className="w-5 shrink-0"
                        style={{ color: "#5b4dff" }}
                      >
                        <FiArrowRight size={17} />
                      </motion.span>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="py-32 text-center">
            <p className="text-sm font-mono" style={{ color: "rgba(14,13,31,0.2)" }}>
              no posts found{query ? ` for "${query}"` : ""}.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
