"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";

const stats = [
  { n: "6+", labelEn: "Years Experience", labelKo: "년 경력" },
  { n: "50+", labelEn: "Projects Shipped", labelKo: "납품 프로젝트" },
  { n: "20+", labelEn: "Web3 Projects", labelKo: "Web3 프로젝트" },
];

const ease = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  const { lang } = useLanguage();
  const t = translations[lang].hero;

  return (
    <section
      className="relative min-h-screen w-full overflow-hidden flex items-center"
      style={{ background: "#0F0E0C" }}
    >
      {/* Warm amber radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(245,158,11,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 lg:px-16 pt-32 pb-20">

        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease }}
          className="flex items-center gap-3 mb-14"
        >
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease }}
            className="origin-left block w-8 h-px"
            style={{ background: "rgba(245,158,11,0.7)" }}
          />
          <span
            className="text-xs font-mono tracking-[0.25em] uppercase"
            style={{ color: "rgba(245,158,11,0.8)" }}
          >
            {t.label}
          </span>
        </motion.div>

        {/* Hero Name */}
        <div className="mb-14 overflow-hidden">
          <motion.h1
            initial={{ opacity: 0, y: 120 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.1, ease }}
            className="font-bold leading-[0.9] tracking-tighter"
            style={{ fontSize: "clamp(4.5rem, 13vw, 12rem)", color: "#F5F0E8" }}
          >
            JOOWON
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 120 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.18, ease }}
            className="flex items-end gap-5"
          >
            <h1
              className="font-bold leading-[0.9] tracking-tighter"
              style={{ fontSize: "clamp(4.5rem, 13vw, 12rem)", color: "#F5F0E8" }}
            >
              KIM
            </h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, delay: 0.55, ease }}
              className="origin-left mb-4 flex-1 max-w-xs"
              style={{ height: "3px", background: "#F59E0B" }}
            />
          </motion.div>
        </div>

        {/* Description + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-10 max-w-5xl"
        >
          <div className="flex flex-col gap-1.5 max-w-lg">
            <p className="text-lg font-semibold tracking-tight" style={{ color: "#F5F0E8" }}>
              {t.line1}
            </p>
            <p className="text-base font-light leading-relaxed" style={{ color: "rgba(245,240,232,0.5)" }}>
              {t.line2}
            </p>
            <p className="text-base font-light leading-relaxed" style={{ color: "rgba(245,240,232,0.28)" }}>
              {t.line3}
            </p>
          </div>

          <div className="flex gap-3">
            <motion.a
              href="#projects"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="px-7 py-3 rounded-full text-sm font-semibold"
              style={{ background: "#F59E0B", color: "#0F0E0C" }}
            >
              {t.cta1}
            </motion.a>
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.04, borderColor: "rgba(245,240,232,0.45)" }}
              whileTap={{ scale: 0.97 }}
              className="px-7 py-3 rounded-full text-sm font-semibold border"
              style={{ borderColor: "rgba(245,240,232,0.18)", color: "#F5F0E8" }}
            >
              {t.cta2}
            </motion.a>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mt-20 pt-8 flex gap-14"
          style={{ borderTop: "1px solid rgba(245,240,232,0.07)" }}
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.labelEn}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05 + i * 0.08, duration: 0.55, ease }}
            >
              <div className="text-3xl font-bold" style={{ color: "#F59E0B" }}>{s.n}</div>
              <div className="text-xs tracking-wider mt-1" style={{ color: "rgba(245,240,232,0.3)" }}>
                {lang === "en" ? s.labelEn : s.labelKo}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div
          className="relative flex justify-center"
          style={{ width: 22, height: 34, borderRadius: 11, border: "1.5px solid rgba(245,240,232,0.2)" }}
        >
          <motion.div
            animate={{ y: [2, 10, 2], opacity: [1, 0, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            style={{ width: 3, height: 3, borderRadius: "50%", background: "#F59E0B", marginTop: 5 }}
          />
        </div>
        <span className="text-[9px] font-mono tracking-[0.2em] uppercase" style={{ color: "rgba(245,240,232,0.18)" }}>
          Scroll
        </span>
      </motion.div>
    </section>
  );
}
