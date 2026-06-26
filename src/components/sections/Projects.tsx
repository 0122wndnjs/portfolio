"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { projects, type Project } from "../../data/projects";
import { projectTranslationsEn } from "../../data/projectTranslations";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";

/* =========================
   Category config
========================= */
const categories = [
  {
    id: "web3",
    domain: "DOMAIN / 01",
    name: "Web3 & Blockchain",
    desc: "Smart contracts, token launches, exchange listing support, Web3 dApps and corporate blockchain sites.",
    tags: ["Solidity", "Rust", "Ethers.js"],
    glow: true,
    layout: "featured",
    bg: "#161412",
    bgHover: "#1C1916",
    border: "rgba(245,240,232,0.1)",
    borderHover: "rgba(245,240,232,0.18)",
  },
  {
    id: "website",
    domain: "DOMAIN / 02",
    name: "Web Development",
    desc: "Corporate sites, token project landing pages, and brand websites built with React and Next.js.",
    tags: ["React", "Next.js", "TailwindCSS"],
    glow: false,
    layout: "normal",
    bg: "#161412",
    bgHover: "#1C1916",
    border: "rgba(245,240,232,0.1)",
    borderHover: "rgba(245,240,232,0.18)",
  },
  {
    id: "platforms",
    domain: "DOMAIN / 03",
    name: "Platforms & Products",
    desc: "Web3 wallets, token platforms, SaaS tools, event systems, and full-stack product development.",
    tags: ["NestJS", "Supabase", "Cloudflare"],
    glow: false,
    layout: "normal",
    bg: "#161412",
    bgHover: "#1C1916",
    border: "rgba(245,240,232,0.1)",
    borderHover: "rgba(245,240,232,0.18)",
  },
  {
    id: "systems",
    domain: "DOMAIN / 04",
    name: "Operations & Strategy",
    desc: "SEO/AEO/GEO optimization, Web3 marketing campaigns, pitch deck production, and event operations.",
    tags: ["SEO", "Web3 Marketing", "Pitch Deck"],
    glow: false,
    layout: "wide",
    bg: "#161412",
    bgHover: "#1C1916",
    border: "rgba(245,240,232,0.1)",
    borderHover: "rgba(245,240,232,0.18)",
  },
];

function getCount(catId: string) {
  return projects.filter((p) => p.category === catId).length;
}

function getProjects(catId: string) {
  return projects
    .filter((p) => p.category === catId)
    .sort((a, b) => Number(b.featured) - Number(a.featured));
}

function statusStyle(status: string) {
  if (status === "Live") return { color: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)" };
  if (status === "In Progress") return { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" };
  return { color: "rgba(245,240,232,0.4)", bg: "rgba(245,240,232,0.04)", border: "rgba(245,240,232,0.1)" };
}

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
   Category Card
========================= */
function CategoryCard({ cat, onClick }: { cat: typeof categories[0]; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const count = getCount(cat.id);
  const isWide = cat.layout === "wide";
  const isFeatured = cat.layout === "featured";

  return (
    <motion.div
      initial={{ opacity: 0, y: 56 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className={`relative cursor-pointer overflow-hidden transition-all duration-300 ${
        isWide
          ? "flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10 px-6 sm:px-8 py-7"
          : "flex flex-col p-7"
      } ${isFeatured ? "h-full" : ""}`}
      style={{
        background: hovered ? cat.bgHover : cat.bg,
        borderTop: "1px solid rgba(245,240,232,0.07)",
        borderRight: "1px solid rgba(245,240,232,0.07)",
        borderBottom: "1px solid rgba(245,240,232,0.07)",
        borderLeft: `3px solid ${hovered ? "#F59E0B" : "rgba(245,158,11,0.25)"}`,
        minHeight: isWide ? undefined : isFeatured ? 340 : 200,
        transition: "border-color 0.2s ease, background 0.2s ease",
      }}
    >
      {/* Arrow */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0.2, x: hovered ? 0 : -4 }}
        transition={{ duration: 0.2 }}
        className="absolute top-5 right-5 text-lg"
        style={{ color: "#F59E0B" }}
      >
        ↗
      </motion.div>

      {isWide ? (
        <>
          <div className="shrink-0">
            <p className="text-[10px] font-mono tracking-[0.25em] uppercase mb-3 transition-colors duration-200"
              style={{ color: hovered ? "rgba(245,158,11,0.9)" : "rgba(245,158,11,0.5)" }}>
              {cat.domain}
            </p>
            <div className="flex items-baseline gap-2.5">
              <span className="font-black transition-colors duration-200"
                style={{ fontSize: "4rem", lineHeight: 1, color: hovered ? "#F5F0E8" : "rgba(245,240,232,0.75)" }}>
                {count}
              </span>
              <span className="text-xs font-mono tracking-widest uppercase" style={{ color: "rgba(245,240,232,0.3)" }}>
                Projects
              </span>
            </div>
          </div>
          <div className="hidden sm:block w-px self-stretch shrink-0" style={{ background: "rgba(245,240,232,0.07)" }} />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold mb-2 transition-colors duration-200"
              style={{ fontSize: "1.4rem", color: hovered ? "#F5F0E8" : "rgba(245,240,232,0.85)" }}>
              {cat.name}
            </h3>
            <p className="text-sm font-light leading-relaxed transition-colors duration-200"
              style={{ color: hovered ? "rgba(245,240,232,0.55)" : "rgba(245,240,232,0.35)" }}>
              {cat.desc}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:justify-end">
            {cat.tags.map((t) => (
              <span key={t} className="text-[11px] font-mono px-2.5 py-1 rounded transition-all duration-200"
                style={{
                  color: hovered ? "rgba(245,158,11,0.85)" : "rgba(245,240,232,0.4)",
                  border: `1px solid ${hovered ? "rgba(245,158,11,0.25)" : "rgba(245,240,232,0.1)"}`,
                  background: hovered ? "rgba(245,158,11,0.07)" : "transparent",
                }}>
                {t}
              </span>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mb-auto">
            <p className="text-[10px] font-mono tracking-[0.25em] uppercase transition-colors duration-200"
              style={{ color: hovered ? "rgba(245,158,11,0.9)" : "rgba(245,158,11,0.5)" }}>
              {cat.domain}
            </p>
          </div>
          <div className="mt-auto">
            <div className="flex items-baseline gap-2 mb-4">
              <span className="font-black transition-colors duration-200"
                style={{
                  fontSize: isFeatured ? "clamp(5rem, 8vw, 7rem)" : "4rem",
                  lineHeight: 1,
                  color: hovered ? "#F5F0E8" : "rgba(245,240,232,0.8)",
                }}>
                {count}
              </span>
              <span className="text-xs font-mono tracking-widest uppercase" style={{ color: "rgba(245,240,232,0.3)" }}>
                Projects
              </span>
            </div>
            <h3 className="font-bold mb-3 transition-colors duration-200"
              style={{ fontSize: isFeatured ? "1.5rem" : "1.1rem", color: hovered ? "#F5F0E8" : "rgba(245,240,232,0.85)" }}>
              {cat.name}
            </h3>
            <p className="text-sm font-light leading-relaxed mb-5 transition-colors duration-200"
              style={{ color: hovered ? "rgba(245,240,232,0.55)" : "rgba(245,240,232,0.35)" }}>
              {cat.desc}
            </p>
            <div className="flex flex-wrap gap-2">
              {cat.tags.map((t) => (
                <span key={t} className="text-[11px] font-mono px-2.5 py-1 rounded transition-all duration-200"
                  style={{
                    color: hovered ? "rgba(245,158,11,0.85)" : "rgba(245,240,232,0.4)",
                    border: `1px solid ${hovered ? "rgba(245,158,11,0.25)" : "rgba(245,240,232,0.1)"}`,
                    background: hovered ? "rgba(245,158,11,0.07)" : "transparent",
                  }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

/* =========================
   Detail Content (shared)
========================= */
function DetailContent({ project, onClose, isMobile }: { project: Project; onClose: () => void; isMobile: boolean }) {
  const s = statusStyle(project.status);
  const { lang } = useLanguage();
  const tp = translations[lang].projects;
  const tr = lang === "en" ? projectTranslationsEn[project.id] : null;
  const role = tr?.role ?? project.role;
  const desc = tr?.desc ?? project.desc;
  const tasks = tr?.tasks ?? project.tasks;
  const features = tr?.features ?? project.features;
  const impact = tr?.impact ?? project.impact;

  return (
    <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden pb-12">
      {/* Mobile handle */}
      {isMobile && (
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full" style={{ background: "rgba(245,240,232,0.12)" }} />
        </div>
      )}

      <div className="px-6 md:px-8 pt-6 md:pt-8 pb-6">
        {/* Mobile header with back button */}
        {isMobile && (
          <button
            onClick={onClose}
            className="flex items-center gap-2 mb-5 text-xs font-mono"
            style={{ color: "rgba(245,240,232,0.35)" }}
          >
            {tp.backToList}
          </button>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-mono px-2.5 py-1 rounded-full"
            style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
            {project.status}
          </span>
          <span className="text-xs font-mono" style={{ color: "rgba(245,240,232,0.2)" }}>{project.period}</span>
        </div>

        {/* Title */}
        <h2
          className="font-bold tracking-tight leading-tight mb-4"
          style={{ fontSize: "clamp(1.4rem, 3vw, 2.4rem)", color: "#F5F0E8" }}
        >
          {project.title}
        </h2>

        {/* Role */}
        <p className="text-xs font-mono leading-relaxed mb-5" style={{ color: "rgba(245,158,11,0.65)" }}>
          {role}
        </p>

        {/* Description */}
        <p className="text-sm font-light leading-relaxed" style={{ color: "rgba(245,240,232,0.45)" }}>
          {desc}
        </p>

        {/* Metrics */}
        {project.metrics && (
          <div className="mt-5 px-4 py-3 rounded-lg" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)" }}>
            <p className="text-[10px] font-mono tracking-[0.2em] uppercase mb-1" style={{ color: "rgba(245,158,11,0.5)" }}>{tp.results}</p>
            <p className="text-sm font-medium" style={{ color: "rgba(245,158,11,0.85)" }}>{project.metrics}</p>
          </div>
        )}
      </div>

      {/* Images */}
      {project.images && project.images.length > 0 && (
        <div className="w-full mb-8">
          <div className="flex gap-4 overflow-x-auto px-6 md:px-8 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden">
            {project.images.map((img, i) => (
              <div
                key={i}
                className="shrink-0 snap-center rounded-xl overflow-hidden border border-[rgba(245,240,232,0.08)] bg-[rgba(10,9,8,0.5)] flex items-center justify-center"
                style={{ height: "240px", maxWidth: "85vw" }}
              >
                <img
                  src={img}
                  alt={`${project.title} ${i + 1}`}
                  className="h-full w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {(!project.images || project.images.length === 0) && (
        <div className="mx-6 md:mx-8 mb-8 h-28 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,240,232,0.02)", border: "1px dashed rgba(245,240,232,0.08)" }}>
          <span className="font-black select-none" style={{ fontSize: "3rem", color: "rgba(245,158,11,0.05)", lineHeight: 1 }}>
            {project.title.charAt(0)}
          </span>
        </div>
      )}

      <div className="px-6 md:px-8">
        {/* Tech Stack */}
        <div className="mb-8">
          <p className="text-[10px] font-mono tracking-[0.2em] uppercase mb-3" style={{ color: "rgba(245,240,232,0.2)" }}>{tp.stack}</p>
          <div className="flex flex-wrap gap-2">
            {project.tech.map((t) => (
              <span key={t} className="text-xs font-mono px-3 py-1.5 rounded-lg"
                style={{ color: "rgba(245,158,11,0.85)", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.15)" }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* What I Did */}
        {tasks && tasks.length > 0 && (
          <div className="mb-8">
            <p className="text-[10px] font-mono tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(245,240,232,0.2)" }}>{tp.whatIDid}</p>
            <ul className="space-y-3">
              {tasks.map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="mt-[9px] h-px w-4 shrink-0" style={{ background: "rgba(245,158,11,0.4)" }} />
                  <span className="text-sm font-light leading-relaxed" style={{ color: "rgba(245,240,232,0.5)" }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Features */}
        {features && features.length > 0 && (
          <div className="mb-8">
            <p className="text-[10px] font-mono tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(245,240,232,0.2)" }}>{tp.keyFeatures}</p>
            <ul className="space-y-2">
              {features.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full" style={{ background: "rgba(245,158,11,0.5)" }} />
                  <span className="text-sm font-light leading-relaxed" style={{ color: "rgba(245,240,232,0.45)" }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Impact */}
        {impact && impact.length > 0 && (
          <div className="mb-8">
            <p className="text-[10px] font-mono tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(245,240,232,0.2)" }}>{tp.impact}</p>
            <ul className="space-y-3">
              {impact.map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="mt-[9px] h-px w-4 shrink-0" style={{ background: "rgba(74,222,128,0.4)" }} />
                  <span className="text-sm font-light leading-relaxed" style={{ color: "rgba(245,240,232,0.45)" }}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <div className="pt-6" style={{ borderTop: "1px solid rgba(245,240,232,0.06)" }}>
          {project.url ? (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200"
              style={{ background: "#F59E0B", color: "#0F0E0C" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#FBBF24")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#F59E0B")}
            >
              {tp.visitProject}
            </a>
          ) : (
            <span className="inline-flex items-center px-6 py-3 rounded-full text-sm font-medium"
              style={{ color: "rgba(245,240,232,0.25)", border: "1px solid rgba(245,240,232,0.07)" }}>
              {tp.privateNDA}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Project Detail — Desktop left panel
========================= */
function ProjectDetailPanel({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <motion.div
      initial={{ x: "-100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
      className="fixed left-0 top-16 bottom-0 z-[55] flex flex-col overflow-hidden"
      style={{
        right: 0,
        maxWidth: "calc(100vw - 520px)",
        minWidth: 320,
        background: "#0F0E0C",
        borderRight: "1px solid rgba(245,240,232,0.07)",
      }}
    >
      <DetailContent project={project} onClose={onClose} isMobile={false} />
    </motion.div>
  );
}

/* =========================
   Project Detail — Mobile bottom sheet
========================= */
function ProjectDetailSheet({ project, onClose }: { project: Project; onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[65]"
        style={{ background: "rgba(10,9,8,0.7)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      {/* Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="fixed left-0 right-0 bottom-0 z-[70] flex flex-col rounded-t-2xl overflow-hidden"
        style={{
          height: "75vh",
          background: "#0F0E0C",
          borderTop: "1px solid rgba(245,240,232,0.1)",
        }}
      >
        <DetailContent project={project} onClose={onClose} isMobile={true} />
      </motion.div>
    </>
  );
}

/* =========================
   Project Row inside Drawer
========================= */
function ProjectRow({ project, index, onClick, isActive }: {
  project: Project;
  index: number;
  onClick: () => void;
  isActive: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const hasImg = project.images && project.images.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      className="group cursor-pointer flex items-center gap-4 p-3 rounded-xl transition-colors duration-200"
      style={{
        background: isActive
          ? "rgba(245,158,11,0.07)"
          : hovered ? "rgba(245,240,232,0.05)" : "transparent",
        border: `1px solid ${isActive ? "rgba(245,158,11,0.15)" : "transparent"}`,
      }}
    >
      <div
        className="w-14 h-14 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
        style={{ background: "rgba(245,240,232,0.04)", border: "1px solid rgba(245,240,232,0.07)" }}
      >
        {hasImg ? (
          <img src={project.images![0]} alt={project.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
        ) : (
          <span className="font-black text-xl" style={{ color: "rgba(245,158,11,0.25)" }}>
            {project.title.charAt(0)}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-semibold truncate transition-colors duration-200"
            style={{ color: isActive ? "#F59E0B" : hovered ? "#F5F0E8" : "rgba(245,240,232,0.75)" }}>
            {project.title}
          </p>
          {project.featured && (
            <span
              className="shrink-0 text-[9px] font-mono tracking-[0.15em] uppercase px-1.5 py-0.5"
              style={{ color: "rgba(245,158,11,0.8)", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              Featured
            </span>
          )}
        </div>
        <p className="text-[11px] font-mono" style={{ color: "rgba(245,240,232,0.2)" }}>
          {project.tech.slice(0, 3).join(" · ")}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden sm:block text-xs font-mono" style={{ color: "rgba(245,240,232,0.2)" }}>{project.period}</span>
        <motion.span
          animate={{ opacity: hovered || isActive ? 1 : 0, x: hovered || isActive ? 0 : -6 }}
          transition={{ duration: 0.2 }}
          style={{ color: "#F59E0B" }}
        >
          ↗
        </motion.span>
      </div>
    </motion.div>
  );
}

/* =========================
   Category Drawer
========================= */
function CategoryDrawer({ cat, selectedProject, isMobile, onClose, onProjectClick }: {
  cat: typeof categories[0];
  selectedProject: Project | null;
  isMobile: boolean;
  onClose: () => void;
  onProjectClick: (p: Project | null) => void;
}) {
  const items = getProjects(cat.id);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-40"
          style={{ background: "rgba(10,9,8,0.6)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
        />

        {/* Drawer */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 260 }}
          className="fixed right-0 top-16 bottom-0 z-50 flex flex-col overflow-hidden"
          style={{
            width: isMobile ? "100vw" : "min(520px, 100vw)",
            background: "#141210",
            borderLeft: isMobile ? "none" : "1px solid rgba(245,240,232,0.08)",
            borderTop: isMobile ? "1px solid rgba(245,240,232,0.08)" : "none",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 md:px-8 py-5 shrink-0"
            style={{ borderBottom: "1px solid rgba(245,240,232,0.07)" }}>
            <div>
              <p className="text-[10px] font-mono tracking-widest uppercase mb-1" style={{ color: "rgba(245,158,11,0.7)" }}>
                {cat.domain}
              </p>
              <h3 className="text-lg md:text-xl font-bold" style={{ color: "#F5F0E8" }}>{cat.name}</h3>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full transition-colors duration-200"
              style={{ background: "rgba(245,240,232,0.06)", color: "rgba(245,240,232,0.5)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(245,240,232,0.12)";
                (e.currentTarget as HTMLElement).style.color = "#F5F0E8";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(245,240,232,0.06)";
                (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.5)";
              }}
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 md:px-8 py-5 [&::-webkit-scrollbar]:hidden">
            <div className="flex flex-col gap-2">
              {items.map((p, i) => (
                <ProjectRow
                  key={p.id}
                  project={p}
                  index={i}
                  isActive={!isMobile && selectedProject?.id === p.id}
                  onClick={() => onProjectClick(selectedProject?.id === p.id && !isMobile ? null as any : p)}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}

/* =========================
   Main Section
========================= */
export default function Projects() {
  const [openCat, setOpenCat] = useState<typeof categories[0] | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const isMobile = useIsMobile();
  const { lang } = useLanguage();
  const tCats = translations[lang].projects.categories;
  const localizedCategories = categories.map((cat) => ({
    ...cat,
    desc: tCats[cat.id as keyof typeof tCats] ?? cat.desc,
  }));

  const handleClose = () => {
    setOpenCat(null);
    setSelectedProject(null);
  };

  return (
    <section id="projects" className="relative w-full overflow-hidden" style={{ background: "#0F0E0C" }}>
      <div className="w-full" style={{ height: "1px", background: "rgba(245,240,232,0.06)" }} />

      <div className="mx-auto max-w-6xl px-8 lg:px-12 pt-28 pb-28">
        {/* Header */}
        <div className="mb-14">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-5"
          >
            <span className="w-6 h-px" style={{ background: "rgba(245,158,11,0.7)" }} />
            <span className="text-xs font-mono tracking-[0.25em] uppercase" style={{ color: "rgba(245,158,11,0.8)" }}>
              Selected Work
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-bold tracking-tight leading-[1.0]"
            style={{ fontSize: "clamp(3rem, 7vw, 6rem)", color: "#F5F0E8" }}
          >
            Selected<br />
            <span style={{ color: "rgba(245,240,232,0.3)" }}>work.</span>
          </motion.h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 lg:row-span-2 lg:h-full">
            <CategoryCard cat={localizedCategories[0]} onClick={() => { setOpenCat(localizedCategories[0]); setSelectedProject(null); }} />
          </div>
          <div className="lg:col-span-2">
            <CategoryCard cat={localizedCategories[1]} onClick={() => { setOpenCat(localizedCategories[1]); setSelectedProject(null); }} />
          </div>
          <div className="lg:col-span-2">
            <CategoryCard cat={localizedCategories[2]} onClick={() => { setOpenCat(localizedCategories[2]); setSelectedProject(null); }} />
          </div>
          <div className="lg:col-span-5">
            <CategoryCard cat={localizedCategories[3]} onClick={() => { setOpenCat(localizedCategories[3]); setSelectedProject(null); }} />
          </div>
        </div>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {openCat && (
          <CategoryDrawer
            cat={openCat}
            selectedProject={selectedProject}
            isMobile={isMobile}
            onClose={handleClose}
            onProjectClick={(p) => setSelectedProject(p)}
          />
        )}
      </AnimatePresence>

      {/* Detail — desktop left panel */}
      {!isMobile && (
        <AnimatePresence>
          {selectedProject && (
            <ProjectDetailPanel
              project={selectedProject}
              onClose={() => setSelectedProject(null)}
            />
          )}
        </AnimatePresence>
      )}

      {/* Detail — mobile bottom sheet */}
      {isMobile && (
        <AnimatePresence>
          {selectedProject && (
            <ProjectDetailSheet
              project={selectedProject}
              onClose={() => setSelectedProject(null)}
            />
          )}
        </AnimatePresence>
      )}
    </section>
  );
}
