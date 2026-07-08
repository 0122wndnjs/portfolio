"use client";

import { useState, useEffect, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useVelocity,
  useTransform,
} from "framer-motion";
import { projects, type Project } from "../../data/projects";
import { projectTranslationsEn } from "../../data/projectTranslations";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";

const easeOut = [0.16, 1, 0.3, 1] as const;

/* =========================
   Filter config
========================= */
const filters = [
  { id: "featured", label: "Featured" },
  { id: "web3", label: "Web3" },
  { id: "website", label: "Web" },
  { id: "platforms", label: "Platforms" },
  { id: "systems", label: "Ops" },
];

function getFiltered(filterId: string): Project[] {
  if (filterId === "featured") {
    return projects.filter((p) => p.featured);
  }
  return projects
    .filter((p) => p.category === filterId)
    .sort((a, b) => Number(b.featured) - Number(a.featured));
}

function statusStyle(status: string) {
  if (status === "Live") return { color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" };
  if (status === "In Progress") return { color: "#5b4dff", bg: "rgba(91,77,255,0.08)", border: "rgba(91,77,255,0.2)" };
  return { color: "rgba(14,13,31,0.4)", bg: "rgba(14,13,31,0.04)", border: "rgba(14,13,31,0.1)" };
}

const categoryLabel: Record<string, string> = {
  web3: "Web3",
  website: "Web",
  platforms: "Platform",
  systems: "Ops",
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

/* =========================
   Floating cursor preview
========================= */
function FloatingPreview({ project }: { project: Project | null }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 260, damping: 28, mass: 0.6 });
  const y = useSpring(my, { stiffness: 260, damping: 28, mass: 0.6 });
  const vx = useVelocity(x);
  const rotate = useTransform(vx, [-2400, 2400], [-14, 14]);
  const skewX = useTransform(vx, [-2400, 2400], [6, -6]);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      // keep preview inside viewport (preview is 340x215, offset 28 right of cursor)
      mx.set(Math.min(e.clientX, window.innerWidth - 340 - 28 - 16));
      my.set(Math.min(Math.max(e.clientY, 124), window.innerHeight - 124));
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [mx, my]);

  const hasImg = project?.images && project.images.length > 0;

  return (
    <motion.div
      className="fixed top-0 left-0 z-30 pointer-events-none hidden md:block"
      style={{ x, y, rotate, skewX, perspective: 800 }}
    >
      <AnimatePresence mode="popLayout">
        {project && (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, scale: 0.8, rotateX: 18 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.85, rotateX: -12 }}
            transition={{ duration: 0.3, ease: easeOut }}
            className="relative overflow-hidden rounded-xl"
            style={{
              width: 340,
              height: 215,
              marginLeft: 28,
              marginTop: -108,
              border: "1px solid rgba(14,13,31,0.12)",
              background: "#eceaf7",
              boxShadow: "0 24px 60px rgba(45,35,160,0.14), 0 0 0 1px rgba(91,77,255,0.10)",
            }}
          >
            {hasImg ? (
              <img
                src={project.images[0]}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex flex-col items-start justify-end p-5"
                style={{
                  background:
                    "radial-gradient(ellipse 120% 90% at 20% 0%, rgba(91,77,255,0.16) 0%, #eceaf7 65%)",
                }}
              >
                <span
                  className="font-black select-none leading-none"
                  style={{ fontSize: "4.5rem", color: "rgba(91,77,255,0.18)" }}
                >
                  {project.title.charAt(0)}
                </span>
                <span className="mt-3 text-[11px] font-mono tracking-wider" style={{ color: "rgba(14,13,31,0.45)" }}>
                  {project.tech.slice(0, 3).join(" · ")}
                </span>
              </div>
            )}
            {/* bottom gradient + status */}
            <div
              className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 py-2.5"
              style={{ background: "linear-gradient(transparent, rgba(250,250,253,0.85))" }}
            >
              <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: "rgba(14,13,31,0.7)" }}>
                {project.period}
              </span>
              <span className="text-[10px] font-mono" style={{ color: statusStyle(project.status).color }}>
                {project.status}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* =========================
   List row
========================= */
function ListRow({ project, index, onClick, onHover }: {
  project: Project;
  index: number;
  onClick: () => void;
  onHover: (p: Project | null) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.4), ease: easeOut }}
      onMouseEnter={() => { setHovered(true); onHover(project); }}
      onMouseLeave={() => { setHovered(false); onHover(null); }}
      onClick={onClick}
      className="group relative cursor-pointer"
      style={{ borderBottom: "1px solid rgba(14,13,31,0.07)" }}
    >
      {/* hover fill sweep */}
      <motion.div
        animate={{ scaleY: hovered ? 1 : 0 }}
        transition={{ duration: 0.3, ease: easeOut }}
        className="absolute inset-0 origin-bottom pointer-events-none"
        style={{ background: "rgba(91,77,255,0.04)" }}
      />
      {/* amber left bar */}
      <motion.div
        animate={{ scaleY: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute left-0 top-0 bottom-0 w-[3px] origin-top"
        style={{ background: "#5b4dff" }}
      />

      <div className="relative flex items-baseline gap-4 sm:gap-8 py-6 sm:py-8 pl-5 sm:pl-8 pr-2">
        <span
          className="text-xs font-mono shrink-0 transition-colors duration-200"
          style={{ color: hovered ? "#5b4dff" : "rgba(14,13,31,0.22)" }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        <motion.h3
          animate={{ x: hovered ? 10 : 0, skewX: hovered ? -2 : 0 }}
          transition={{ duration: 0.3, ease: easeOut }}
          className="relative flex-1 min-w-0 font-bold tracking-tight leading-[1.1] truncate"
          style={{ fontSize: "clamp(1.5rem, 3.6vw, 3rem)", color: "rgba(14,13,31,0.55)" }}
        >
          {project.title}
          {/* iris fill sweeps left→right on hover */}
          <motion.span
            aria-hidden
            animate={{ clipPath: hovered ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
            transition={{ duration: 0.45, ease: easeOut }}
            className="text-iris absolute inset-0 truncate"
          >
            {project.title}
          </motion.span>
        </motion.h3>

        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <span
            className="text-[10px] font-mono tracking-[0.2em] uppercase px-2.5 py-1 rounded-full transition-all duration-200"
            style={{
              color: hovered ? "rgba(91,77,255,0.9)" : "rgba(14,13,31,0.3)",
              border: `1px solid ${hovered ? "rgba(91,77,255,0.3)" : "rgba(14,13,31,0.1)"}`,
            }}
          >
            {categoryLabel[project.category]}
          </span>
          <span className="text-xs font-mono w-24 text-right" style={{ color: "rgba(14,13,31,0.25)" }}>
            {project.period.split("~")[0].trim()}
          </span>
          <motion.span
            animate={{ x: hovered ? 0 : -8, opacity: hovered ? 1 : 0.15, rotate: hovered ? 0 : -45 }}
            transition={{ duration: 0.25, ease: easeOut }}
            className="text-xl"
            style={{ color: "#5b4dff" }}
          >
            ↗
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}

/* =========================
   Full-screen case-study overlay
========================= */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

function ProjectOverlay({ project, onClose }: { project: Project; onClose: () => void }) {
  const s = statusStyle(project.status);
  const { lang } = useLanguage();
  const tp = translations[lang].projects;
  const tr = lang === "en" ? projectTranslationsEn[project.id] : null;
  const role = tr?.role ?? project.role;
  const desc = tr?.desc ?? project.desc;
  const tasks = tr?.tasks ?? project.tasks;
  const features = tr?.features ?? project.features;
  const impact = tr?.impact ?? project.impact;
  const hasImg = project.images && project.images.length > 0;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.65, ease: easeOut }}
      className="fixed inset-0 z-[1100] overflow-y-auto [&::-webkit-scrollbar]:hidden"
      style={{ background: "#f4f5fb" }}
    >
      {/* faint amber glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh]"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(91,77,255,0.06) 0%, transparent 70%)" }}
      />

      {/* Top bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 md:px-12 py-4"
        style={{ background: "rgba(244,245,251,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(14,13,31,0.06)" }}
      >
        <span className="text-[10px] font-mono tracking-[0.25em] uppercase" style={{ color: "rgba(91,77,255,0.7)" }}>
          {categoryLabel[project.category]} / Case
        </span>
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-xs font-mono px-4 py-2 rounded-full transition-colors duration-200"
          style={{ color: "rgba(14,13,31,0.6)", border: "1px solid rgba(14,13,31,0.12)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(91,77,255,0.5)";
            (e.currentTarget as HTMLElement).style.color = "#0e0d1f";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(14,13,31,0.12)";
            (e.currentTarget as HTMLElement).style.color = "rgba(14,13,31,0.6)";
          }}
        >
          ✕ <span className="hidden sm:inline">ESC</span>
        </button>
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative max-w-6xl mx-auto px-6 md:px-12 pt-14 md:pt-20 pb-28"
      >
        {/* Meta */}
        <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full"
            style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
            {project.status}
          </span>
          <span className="text-xs font-mono" style={{ color: "rgba(14,13,31,0.25)" }}>{project.period}</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={fadeUp}
          className="font-bold tracking-tight leading-[1.02] mb-6"
          style={{ fontSize: "clamp(2.2rem, 6vw, 5rem)", color: "#0e0d1f" }}
        >
          {project.title}
        </motion.h1>

        {/* Role */}
        <motion.p variants={fadeUp} className="text-sm font-mono leading-relaxed mb-5" style={{ color: "rgba(91,77,255,0.7)" }}>
          {role}
        </motion.p>

        {/* Description */}
        <motion.p variants={fadeUp} className="text-base font-light leading-relaxed max-w-2xl" style={{ color: "rgba(14,13,31,0.5)" }}>
          {desc}
        </motion.p>

        {/* Metrics band */}
        {project.metrics && (
          <motion.div
            variants={fadeUp}
            className="mt-8 inline-flex flex-col gap-1 px-5 py-4 rounded-xl"
            style={{ background: "rgba(91,77,255,0.05)", border: "1px solid rgba(91,77,255,0.14)" }}
          >
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color: "rgba(91,77,255,0.5)" }}>{tp.results}</span>
            <span className="text-base font-medium" style={{ color: "rgba(91,77,255,0.9)" }}>{project.metrics}</span>
          </motion.div>
        )}

        {/* Images strip */}
        {hasImg && (
          <motion.div variants={fadeUp} className="mt-14 -mx-6 md:mx-0">
            <div className="flex gap-5 overflow-x-auto px-6 md:px-0 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
              {project.images.map((img, i) => (
                <div
                  key={i}
                  className="shrink-0 snap-center rounded-2xl overflow-hidden flex items-center justify-center"
                  style={{
                    height: "min(52vh, 420px)",
                    maxWidth: "88vw",
                    border: "1px solid rgba(14,13,31,0.09)",
                    background: "rgba(250,250,253,0.5)",
                  }}
                >
                  <img
                    src={img}
                    alt={`${project.title} ${i + 1}`}
                    className="h-full w-auto object-contain"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Body: 2-col */}
        <motion.div variants={fadeUp} className="mt-16 grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-12 md:gap-16">
          {/* Left: stack + CTA (sticky on desktop) */}
          <div className="md:sticky md:top-24 self-start flex flex-col gap-10">
            <div>
              <p className="text-[10px] font-mono tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(14,13,31,0.22)" }}>{tp.stack}</p>
              <div className="flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <span key={t} className="text-xs font-mono px-3 py-1.5 rounded-lg"
                    style={{ color: "rgba(91,77,255,0.85)", background: "rgba(91,77,255,0.07)", border: "1px solid rgba(91,77,255,0.15)" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div>
              {project.url ? (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200"
                  style={{ background: "#5b4dff", color: "#f4f5fb" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FBBF24")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#5b4dff")}
                >
                  {tp.visitProject}
                </a>
              ) : (
                <span className="inline-flex items-center px-6 py-3 rounded-full text-sm font-medium"
                  style={{ color: "rgba(14,13,31,0.25)", border: "1px solid rgba(14,13,31,0.07)" }}>
                  {tp.privateNDA}
                </span>
              )}
            </div>
          </div>

          {/* Right: narrative */}
          <div className="flex flex-col gap-12">
            {tasks && tasks.length > 0 && (
              <div>
                <p className="text-[10px] font-mono tracking-[0.2em] uppercase mb-5" style={{ color: "rgba(14,13,31,0.22)" }}>{tp.whatIDid}</p>
                <ul className="space-y-4">
                  {tasks.map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="mt-[10px] h-px w-5 shrink-0" style={{ background: "rgba(91,77,255,0.4)" }} />
                      <span className="text-sm font-light leading-relaxed" style={{ color: "rgba(14,13,31,0.55)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {features && features.length > 0 && (
              <div>
                <p className="text-[10px] font-mono tracking-[0.2em] uppercase mb-5" style={{ color: "rgba(14,13,31,0.22)" }}>{tp.keyFeatures}</p>
                <ul className="space-y-3">
                  {features.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full" style={{ background: "rgba(91,77,255,0.5)" }} />
                      <span className="text-sm font-light leading-relaxed" style={{ color: "rgba(14,13,31,0.5)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {impact && impact.length > 0 && (
              <div>
                <p className="text-[10px] font-mono tracking-[0.2em] uppercase mb-5" style={{ color: "rgba(14,13,31,0.22)" }}>{tp.impact}</p>
                <ul className="space-y-4">
                  {impact.map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="mt-[10px] h-px w-5 shrink-0" style={{ background: "rgba(16,185,129,0.4)" }} />
                      <span className="text-sm font-light leading-relaxed" style={{ color: "rgba(14,13,31,0.5)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* =========================
   Main Section
========================= */
export default function Projects() {
  const [filter, setFilter] = useState("featured");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);
  const isMobile = useIsMobile();
  const items = getFiltered(filter);

  const handleHover = useCallback((p: Project | null) => setHoveredProject(p), []);

  return (
    <section id="projects" className="relative w-full overflow-hidden">
      <div className="w-full" style={{ height: "1px", background: "rgba(14,13,31,0.06)" }} />

      <div className="mx-auto max-w-6xl px-8 lg:px-12 pt-28 pb-28">
        {/* Header */}
        <div className="mb-10">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-5"
          >
            <span className="w-6 h-px" style={{ background: "rgba(91,77,255,0.7)" }} />
            <span className="text-xs font-mono tracking-[0.25em] uppercase" style={{ color: "rgba(91,77,255,0.8)" }}>
              Selected Work
            </span>
          </motion.div>

          {/* letter-stagger reveal — the only section using per-char motion */}
          <h2
            className="font-bold tracking-tight leading-[1.0]"
            style={{ fontSize: "clamp(3rem, 7vw, 6rem)", color: "#0e0d1f" }}
          >
            {(["Selected", "work."] as const).map((word, line) => (
              <span key={word} className="block overflow-hidden">
                <motion.span
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035, delayChildren: line * 0.18 } } }}
                  className="inline-block"
                >
                  {word.split("").map((ch, i) => (
                    <motion.span
                      key={i}
                      variants={{
                        hidden: { y: "110%", opacity: 0 },
                        show: { y: "0%", opacity: 1, transition: { duration: 0.6, ease: easeOut } },
                      }}
                      className={`inline-block ${line === 1 ? "text-outline font-display" : ""}`}
                      style={line === 1 ? { WebkitTextStroke: "1.5px rgba(14,13,31,0.8)" } : undefined}
                    >
                      {ch}
                    </motion.span>
                  ))}
                </motion.span>
              </span>
            ))}
          </h2>

          {/* mono archive meta line */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 text-[11px] font-mono uppercase tracking-[0.25em]"
            style={{ color: "rgba(14,13,31,0.28)" }}
          >
            [{projects.length} projects — 2019 → 2026]
          </motion.p>
        </div>

        {/* Filter tabs — mono underline style + live status readout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12 flex flex-wrap items-end justify-between gap-x-8 gap-y-4"
        >
          <div className="flex flex-wrap gap-x-7 gap-y-2">
            {filters.map((f) => {
              const active = filter === f.id;
              const count = getFiltered(f.id).length;
              return (
                <button
                  key={f.id}
                  onClick={() => { setFilter(f.id); setHoveredProject(null); }}
                  className="relative pb-2 text-xs font-mono uppercase tracking-[0.18em] transition-colors duration-200"
                  style={{ color: active ? "#0e0d1f" : "rgba(14,13,31,0.35)" }}
                >
                  {f.label}
                  <sup className="ml-1 text-[9px]" style={{ color: active ? "#5b4dff" : "rgba(14,13,31,0.3)" }}>
                    {count}
                  </sup>
                  {active && (
                    <motion.span
                      layoutId="filter-underline"
                      className="absolute bottom-0 left-0 right-0 h-[2px]"
                      style={{ background: "linear-gradient(90deg, #5b4dff, #14c8eb, #59f0c0)" }}
                      transition={{ type: "spring", damping: 30, stiffness: 350 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <span className="hidden sm:block text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: "rgba(14,13,31,0.22)" }}>
            filter: {filters.find((f) => f.id === filter)?.label} / {items.length} items
          </span>
        </motion.div>

        {/* Project list */}
        <div>
          {/* archive column header */}
          <div
            className="flex items-baseline gap-4 sm:gap-8 pb-3 pl-5 sm:pl-8 pr-2 text-[10px] font-mono uppercase tracking-[0.2em]"
            style={{ color: "rgba(14,13,31,0.22)", borderBottom: "1px solid rgba(14,13,31,0.07)" }}
          >
            <span className="shrink-0 w-6">No.</span>
            <span className="flex-1">Project</span>
            <span className="hidden sm:block">Category</span>
            <span className="hidden sm:block w-24 text-right">Year</span>
            <span className="hidden sm:block w-5" />
          </div>

          <AnimatePresence mode="popLayout">
            {items.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: easeOut }}
              >
                <ListRow
                  project={p}
                  index={i}
                  onClick={() => { setSelectedProject(p); setHoveredProject(null); }}
                  onHover={handleHover}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating cursor preview */}
      {!isMobile && <FloatingPreview project={selectedProject ? null : hoveredProject} />}

      {/* Full-screen case-study overlay */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectOverlay
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
