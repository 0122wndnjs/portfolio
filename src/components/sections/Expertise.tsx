"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";
import { motion } from "framer-motion";
import {
  SiEthereum, SiReact, SiSolidity, SiWeb3Dotjs,
  SiTypescript, SiNestjs, SiPostgresql, SiMongodb,
  SiTailwindcss, SiNextdotjs, SiPython, SiDocker,
  SiNodedotjs, SiFramer, SiRedis, SiMysql,
} from "react-icons/si";
import { FaFileAlt, FaWallet, FaJava, FaAws, FaJs } from "react-icons/fa";

const ease = [0.16, 1, 0.3, 1] as const;

const itemsBase = [
  { num: "01", title: "Web\nDevelopment",   kpi: "20+", tags: ["React", "Next.js", "TypeScript", "Tailwind"] },
  { num: "02", title: "Platforms &\nBackend", kpi: "10+", tags: ["Node.js", "NestJS", "PostgreSQL", "AWS"] },
  { num: "03", title: "Web3 &\nBlockchain",  kpi: "20+", tags: ["Solidity", "Ethers.js", "AA", "EVM"] },
  { num: "04", title: "Planning\n& PM",       kpi: "30+", tags: ["Roadmapping", "Proposals", "Agile", "Figma"] },
  { num: "05", title: "SEO / AEO\n/ GEO",    kpi: "10+", tags: ["Technical SEO", "AEO", "GEO", "Schema"] },
];

function Row({ item, index }: { item: (typeof itemsBase)[0] & { desc: string; kpiLabel: string }; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, delay: index * 0.08, ease }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group cursor-default"
      style={{ borderBottom: "1px solid rgba(245,240,232,0.07)" }}
    >
      {/* Amber left accent bar */}
      <motion.div
        animate={{ scaleY: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute left-0 top-0 bottom-0 w-[3px] origin-top rounded-full"
        style={{ background: "#F59E0B" }}
      />

      <div className="pl-6 pr-2 py-10 sm:py-12 flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-10">

        {/* Left: number + title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <motion.span
              animate={{ color: hovered ? "#F59E0B" : "rgba(245,240,232,0.25)" }}
              transition={{ duration: 0.2 }}
              className="text-xs font-mono"
            >
              {item.num}
            </motion.span>
            <motion.div
              animate={{ width: hovered ? 36 : 12, background: hovered ? "#F59E0B" : "rgba(245,240,232,0.2)" }}
              transition={{ duration: 0.25 }}
              className="h-px"
            />
          </div>

          <motion.h3
            animate={{ color: hovered ? "#F5F0E8" : "rgba(245,240,232,0.6)", x: hovered ? 4 : 0 }}
            transition={{ duration: 0.25, ease }}
            className="font-bold tracking-tight leading-[1.05] whitespace-pre-line"
            style={{ fontSize: "clamp(2.4rem, 5.5vw, 5rem)" }}
          >
            {item.title}
          </motion.h3>
        </div>

        {/* Right: KPI + desc + tags */}
        <div className="sm:max-w-xs flex flex-col gap-4 sm:pb-2">
          <div className="flex flex-col gap-1">
            <motion.span
              animate={{ color: hovered ? "#F59E0B" : "rgba(245,158,11,0.55)" }}
              transition={{ duration: 0.2 }}
              className="font-black tracking-tight"
              style={{ fontSize: "clamp(2.8rem, 4vw, 3.8rem)", lineHeight: 1 }}
            >
              {item.kpi}
            </motion.span>
            <motion.span
              animate={{ color: hovered ? "rgba(245,240,232,0.4)" : "rgba(245,240,232,0.18)" }}
              transition={{ duration: 0.2 }}
              className="text-[10px] font-mono uppercase tracking-[0.2em]"
            >
              {item.kpiLabel}
            </motion.span>
          </div>
          <motion.p
            animate={{ color: hovered ? "rgba(245,240,232,0.55)" : "rgba(245,240,232,0.25)" }}
            transition={{ duration: 0.2 }}
            className="text-sm font-light leading-relaxed"
          >
            {item.desc}
          </motion.p>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <motion.span
                key={tag}
                animate={{
                  background: hovered ? "rgba(245,158,11,0.1)" : "rgba(245,240,232,0.04)",
                  color: hovered ? "rgba(245,158,11,0.85)" : "rgba(245,240,232,0.25)",
                  borderColor: hovered ? "rgba(245,158,11,0.2)" : "rgba(245,240,232,0.06)",
                }}
                transition={{ duration: 0.2 }}
                className="px-2.5 py-1 rounded-full text-[11px] font-mono border"
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <motion.div
          animate={{ x: hovered ? 0 : -10, opacity: hovered ? 1 : 0, rotate: hovered ? 0 : -45 }}
          transition={{ duration: 0.25, ease }}
          className="hidden sm:block text-2xl pb-2 shrink-0"
          style={{ color: "#F59E0B" }}
        >
          ↗
        </motion.div>
      </div>
    </motion.div>
  );
}

/* Tech Marquee */
const row1 = [
  { name: "React", icon: <SiReact />, color: "#61dafb" },
  { name: "Next.js", icon: <SiNextdotjs />, color: "#F5F0E8" },
  { name: "TypeScript", icon: <SiTypescript />, color: "#3178c6" },
  { name: "Tailwind", icon: <SiTailwindcss />, color: "#38bdf8" },
  { name: "Framer", icon: <SiFramer />, color: "#f505bb" },
  { name: "JavaScript", icon: <FaJs />, color: "#f7df1e" },
  { name: "Solidity", icon: <SiSolidity />, color: "#9ca3af" },
  { name: "Ethereum", icon: <SiEthereum />, color: "#627eea" },
  { name: "Web3.js", icon: <SiWeb3Dotjs />, color: "#f16822" },
];
const row2 = [
  { name: "Node.js", icon: <SiNodedotjs />, color: "#339933" },
  { name: "NestJS", icon: <SiNestjs />, color: "#e0234e" },
  { name: "Java", icon: <FaJava />, color: "#f89820" },
  { name: "Python", icon: <SiPython />, color: "#3776ab" },
  { name: "PostgreSQL", icon: <SiPostgresql />, color: "#336791" },
  { name: "MongoDB", icon: <SiMongodb />, color: "#47a248" },
  { name: "MySQL", icon: <SiMysql />, color: "#00758f" },
  { name: "Redis", icon: <SiRedis />, color: "#dc382d" },
  { name: "Docker", icon: <SiDocker />, color: "#2496ed" },
  { name: "AWS", icon: <FaAws />, color: "#ff9900" },
];

function TechMarquee() {
  const tile = (t: { name: string; icon: React.ReactNode; color: string }, i: number) => (
    <div key={i} className="flex items-center gap-2.5 px-7 py-2 mx-2 shrink-0 opacity-25 hover:opacity-70 transition-opacity duration-300">
      <span className="text-2xl" style={{ color: t.color }}>{t.icon}</span>
      <span className="text-sm font-medium whitespace-nowrap" style={{ color: "#F5F0E8" }}>{t.name}</span>
    </div>
  );
  const d1 = [...row1, ...row1, ...row1];
  const d2 = [...row2, ...row2, ...row2];

  return (
    <div className="w-full overflow-hidden mt-20 pb-28">
      <p className="text-center text-[10px] font-mono tracking-[0.3em] uppercase mb-10" style={{ color: "rgba(245,240,232,0.18)" }}>
        Tech Stack
      </p>
      <div
        className="space-y-5"
        style={{
          WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
          maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        }}
      >
        <div className="flex w-fit">
          <motion.div animate={{ x: ["0%", "-33.333%"] }} transition={{ repeat: Infinity, duration: 28, ease: "linear" }} className="flex">
            {d1.map((t, i) => tile(t, i))}
          </motion.div>
        </div>
        <div className="flex w-fit">
          <motion.div animate={{ x: ["-33.333%", "0%"] }} transition={{ repeat: Infinity, duration: 34, ease: "linear" }} className="flex">
            {d2.map((t, i) => tile(t, i))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function Expertise() {
  const { lang } = useLanguage();
  const tItems = translations[lang].expertise.items;
  const hint = translations[lang].expertise.hint;
  const items = itemsBase.map((b, i) => ({ ...b, desc: tItems[i].desc, kpiLabel: tItems[i].kpiLabel }));

  return (
    <section id="expertise" className="relative w-full overflow-hidden" style={{ background: "#0F0E0C" }}>
      <div className="w-full" style={{ height: "1px", background: "rgba(245,240,232,0.06)" }} />

      <div className="mx-auto max-w-6xl px-8 lg:px-12 pt-28">

        {/* Header */}
        <div className="mb-16 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
              className="flex items-center gap-3 mb-5"
            >
              <span className="w-6 h-px" style={{ background: "rgba(245,158,11,0.7)" }} />
              <span className="text-xs font-mono tracking-[0.25em] uppercase" style={{ color: "rgba(245,158,11,0.8)" }}>
                Expertise
              </span>
            </motion.div>

            <div className="overflow-hidden">
              <motion.h2
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.85, delay: 0.05, ease }}
                className="font-bold tracking-tight leading-[1.0]"
                style={{ fontSize: "clamp(3rem, 7vw, 6rem)", color: "#F5F0E8" }}
              >
                What I<br />
                <span style={{ color: "rgba(245,240,232,0.35)" }}>build.</span>
              </motion.h2>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25, ease }}
            className="text-sm font-light sm:text-right sm:max-w-[200px] pb-2"
            style={{ color: "rgba(245,240,232,0.3)" }}
          >
            {hint}
          </motion.p>
        </div>

        {/* List */}
        <div style={{ borderTop: "1px solid rgba(245,240,232,0.07)" }}>
          {items.map((item, i) => (
            <Row key={i} item={item} index={i} />
          ))}
        </div>
      </div>

      <TechMarquee />
    </section>
  );
}
