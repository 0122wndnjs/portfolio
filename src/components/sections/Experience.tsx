"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";

const experiences = [
  {
    company: "UNIDECA",
    role: "Full-Stack Developer & Web3 Project Lead",
    period: "May 2025 – Present",
    current: true,
    logo: "/images/company/unideca.png",
    desc: [
      "Built and shipped 30+ projects spanning Web3 wallets, token platforms, smart contracts, exchange listings, and full-stack SaaS — largely solo.",
      "Developed and operated RankFit, an AI-powered SEO/AEO/GEO analysis SaaS used internally for hospital website optimization across multiple clients.",
      "Ran end-to-end Web3 marketing campaigns, produced multilingual pitch decks and company profiles, and organized 4 private blockchain networking events totaling 400+ attendees.",
    ],
    tags: ["Web3", "Solidity", "Next.js", "NestJS", "SEO/AEO/GEO", "RankFit"],
  },
  {
    company: "Trillionslab",
    role: "Senior Blockchain Researcher & Product Manager",
    period: "Aug 2021 – Sep 2024",
    current: false,
    logo: "/images/company/trillionslab.png",
    desc: [
      "Led comprehensive blockchain platform development, technical consulting, and extensive architectural documentation.",
      "Engineered NFT dApps, tokenized investment platforms, and innovative OTT service prototypes.",
      "Managed government-funded R&D projects and international BaaS collaborations.",
    ],
    tags: ["NFT", "Project Management", "Fullstack", "BaaS"],
  },
  {
    company: "Delta Dental",
    role: "Java Backend Developer",
    period: "Feb 2020 – Feb 2021",
    current: false,
    logo: "/images/company/deltadental.jpg",
    desc: [
      "Architected Spring Boot APIs serving mission-critical enterprise dental insurance systems.",
      "Implemented high-throughput data pipelines and automated internal reporting services.",
      "Collaborated within a large-scale agile environment to optimize a legacy codebase.",
    ],
    tags: ["Spring Boot", "Java", "Enterprise APIs", "Agile"],
  },
  {
    company: "Apolis",
    role: "Java Backend Intern",
    period: "Aug 2019 – Jan 2020",
    current: false,
    logo: "/images/company/apolis.jpg",
    desc: [
      "Built resilient RESTful APIs for a microservice-based hotel management system.",
      "Practiced strict backend architecture patterns and unit testing with Spring Boot.",
      "Gained foundational experience in enterprise-style CI/CD development workflows.",
    ],
    tags: ["Microservices", "Spring Boot", "Unit Testing"],
  },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

/* =========================
   Detail content (shared)
========================= */
function DetailContent({ item, index }: { item: typeof experiences[0]; index: number }) {
  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 40, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Logo + period row */}
      <div className="flex items-center gap-4 mb-7">
        <div
          className="w-11 h-11 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
          style={{ background: "rgba(245,240,232,0.06)", border: "1px solid rgba(245,240,232,0.09)" }}
        >
          <img
            src={item.logo}
            alt={item.company}
            className="w-full h-full object-cover"
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              el.style.display = "none";
              el.parentElement!.innerHTML = `<span style="font-size:1.1rem;font-weight:900;color:rgba(245,158,11,0.4)">${item.company.charAt(0)}</span>`;
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          {item.current && (
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: "rgba(74,222,128,0.75)" }}>
                Current
              </span>
            </div>
          )}
          <p className="text-xs font-mono" style={{ color: "rgba(245,158,11,0.65)" }}>
            {item.period}
          </p>
        </div>
      </div>

      {/* Role */}
      <motion.h3
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="font-bold tracking-tight leading-[1.15] mb-9"
        style={{ fontSize: "clamp(1.2rem, 2.2vw, 1.9rem)", color: "#F5F0E8" }}
      >
        {item.role}
      </motion.h3>

      {/* Bullets */}
      <ul className="flex flex-col gap-5 mb-9">
        {item.desc.map((d, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-start gap-4"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.18 + i * 0.1, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mt-[10px] h-px w-5 origin-left shrink-0"
              style={{ background: "rgba(245,158,11,0.55)" }}
            />
            <span className="text-sm font-light leading-relaxed" style={{ color: "rgba(245,240,232,0.48)" }}>
              {d}
            </span>
          </motion.li>
        ))}
      </ul>

      {/* Tags */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.35 }}
        className="flex flex-wrap gap-2"
      >
        {item.tags.map((t) => (
          <span
            key={t}
            className="text-[11px] font-mono px-3 py-1.5 rounded-lg"
            style={{
              color: "rgba(245,158,11,0.8)",
              background: "rgba(245,158,11,0.07)",
              border: "1px solid rgba(245,158,11,0.15)",
            }}
          >
            {t}
          </span>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* =========================
   Company button (shared)
========================= */
function CompanyButton({
  item, index, isActive, onClick,
}: {
  item: typeof experiences[0];
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.65, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className="group text-left py-6 w-full relative"
      style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}
    >
      <span
        className="text-[10px] font-mono tracking-widest block mb-2 transition-colors duration-300"
        style={{ color: isActive ? "rgba(245,158,11,0.7)" : "rgba(245,240,232,0.15)" }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="flex items-center justify-between gap-4">
        <motion.span
          animate={{ color: isActive ? "#F5F0E8" : "rgba(245,240,232,0.18)" }}
          whileHover={{ color: isActive ? "#F5F0E8" : "rgba(245,240,232,0.45)" }}
          transition={{ duration: 0.22 }}
          className="block font-bold tracking-tight"
          style={{ fontSize: "clamp(1.4rem, 3vw, 2.4rem)" }}
        >
          {item.company}
        </motion.span>

        {/* Mobile chevron */}
        <motion.span
          animate={{ rotate: isActive ? 180 : 0, color: isActive ? "#F59E0B" : "rgba(245,240,232,0.2)" }}
          transition={{ duration: 0.25 }}
          className="lg:hidden text-sm shrink-0"
        >
          ↓
        </motion.span>
      </div>

      <AnimatePresence>
        {isActive && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.25 }}
            className="block text-xs font-mono mt-1.5"
            style={{ color: "rgba(245,240,232,0.28)" }}
          >
            {item.period}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Amber accent line */}
      <motion.div
        animate={{ scaleX: isActive ? 1 : 0, opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-0 bottom-0 h-px w-10 origin-left"
        style={{ background: "#F59E0B" }}
      />
    </motion.button>
  );
}

/* =========================
   Section
========================= */
export default function Experience() {
  const [active, setActive] = useState(0);
  const isMobile = useIsMobile();
  const { lang } = useLanguage();
  const tExp = translations[lang].experience.items;
  const localizedExperiences = experiences.map((exp, i) => ({
    ...exp,
    role: tExp[i]?.role ?? exp.role,
    desc: tExp[i]?.desc ? [...tExp[i].desc] : exp.desc,
  }));

  return (
    <section
      id="experience"
      className="relative w-full overflow-hidden"
      style={{ background: "#0F0E0C" }}
    >
      <div className="w-full" style={{ height: "1px", background: "rgba(245,240,232,0.06)" }} />

      <div className="mx-auto max-w-6xl px-8 lg:px-12 pt-28 pb-28">

        {/* Header */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 mb-5"
          >
            <span className="w-6 h-px" style={{ background: "rgba(245,158,11,0.7)" }} />
            <span className="text-xs font-mono tracking-[0.25em] uppercase" style={{ color: "rgba(245,158,11,0.8)" }}>
              Experience
            </span>
          </motion.div>

          <div className="overflow-hidden">
            <motion.h2
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="font-bold tracking-tight leading-[1.0]"
              style={{ fontSize: "clamp(3rem, 7vw, 6rem)", color: "#F5F0E8" }}
            >
              Where I've<br />
              <span style={{ color: "rgba(245,240,232,0.3)" }}>worked.</span>
            </motion.h2>
          </div>
        </div>

        {/* Body */}
        {isMobile ? (
          /* ── Mobile: accordion ── */
          <div className="flex flex-col">
            {localizedExperiences.map((item, i) => (
              <div key={i}>
                <CompanyButton
                  item={item}
                  index={i}
                  isActive={active === i}
                  onClick={() => setActive(active === i ? i : i)}
                />
                <AnimatePresence>
                  {active === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div
                        className="py-7 px-5 mb-2 rounded-xl"
                        style={{ background: "rgba(245,240,232,0.025)", border: "1px solid rgba(245,240,232,0.06)" }}
                      >
                        <DetailContent item={item} index={i} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        ) : (
          /* ── Desktop: 2-column ── */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            {/* Left — company list */}
            <div className="flex flex-col">
              {localizedExperiences.map((item, i) => (
                <CompanyButton
                  key={i}
                  item={item}
                  index={i}
                  isActive={active === i}
                  onClick={() => setActive(i)}
                />
              ))}
            </div>

            {/* Right — detail */}
            <div className="lg:pt-2">
              <AnimatePresence mode="wait">
                <DetailContent key={active} item={localizedExperiences[active]} index={active} />
              </AnimatePresence>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
