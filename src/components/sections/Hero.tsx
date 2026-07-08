"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import HeroCanvas from "./HeroCanvas";
import ChainTicker from "./ChainTicker";

const Hero3D = dynamic(() => import("./Hero3D"), { ssr: false });

const stats = [
  { n: "6+", labelEn: "Years Experience", labelKo: "년 경력" },
  { n: "50+", labelEn: "Projects Shipped", labelKo: "납품 프로젝트" },
  { n: "20+", labelEn: "Web3 Projects", labelKo: "Web3 프로젝트" },
];

const ease = [0.16, 1, 0.3, 1] as const;

export default function Hero() {
  const { lang } = useLanguage();
  const t = translations[lang].hero;
  const paragraphs = [t.line1, t.line2, t.line3];
  const [index, setIndex] = useState(0);
  const [show3d, setShow3d] = useState(false);

  useEffect(() => {
    // 3D only on desktop-class devices with a fine pointer, no reduced-motion
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setShow3d(mq.matches && !rm.matches);
    update();
    mq.addEventListener("change", update);
    rm.addEventListener("change", update);
    return () => {
      mq.removeEventListener("change", update);
      rm.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % paragraphs.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [paragraphs.length]);

  return (
    <section
      className="relative min-h-screen w-full overflow-hidden flex items-center"
    >
      {/* cool iris radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 42% 38%, rgba(91,77,255,0.08) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 82% 30%, rgba(20,200,235,0.09) 0%, transparent 70%)",
        }}
      />

      {/* Cursor-reactive dot grid */}
      <HeroCanvas />

      {/* floating glass gem */}
      {show3d && (
        <div className="absolute inset-0 pointer-events-none z-[1] opacity-80">
          <Hero3D />
        </div>
      )}

      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 lg:px-16 pt-32 pb-20">

        {/* Label + live chain ticker */}
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease }}
          className="flex items-center justify-between gap-3 mb-14"
        >
          <div className="flex items-center gap-3">
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease }}
              className="origin-left block w-8 h-px"
              style={{ background: "rgba(91,77,255,0.7)" }}
            />
            <span
              className="text-xs font-mono tracking-[0.25em] uppercase"
              style={{ color: "rgba(91,77,255,0.8)" }}
            >
              {t.label}
            </span>
          </div>
          <ChainTicker />
        </motion.div>

        {/* Hero Name */}
        <div className="mb-14 overflow-hidden">
          <motion.h1
            initial={{ opacity: 0, y: 120 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.1, ease }}
            className="font-display font-bold leading-[0.9] tracking-tighter"
            style={{ fontSize: "clamp(4.5rem, 13vw, 12rem)", color: "#0e0d1f" }}
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
              className="font-display font-bold leading-[0.9] tracking-tighter text-outline"
              style={{ fontSize: "clamp(4.5rem, 13vw, 12rem)" }}
            >
              KIM
            </h1>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, delay: 0.55, ease }}
              className="origin-left mb-4 flex-1 max-w-xs"
              style={{ height: "3px", background: "linear-gradient(90deg, #5b4dff, #14c8eb, #59f0c0)" }}
            />
          </motion.div>
        </div>

        {/* Description + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease }}
          className="max-w-5xl"
        >
          <div className="flex flex-col gap-4 max-w-lg">
            <div style={{ minHeight: "5rem" }}>
              <AnimatePresence mode="wait">
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-base font-light leading-relaxed"
                  style={{ color: "rgba(14,13,31,0.65)" }}
                >
                  {paragraphs[index]}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="flex gap-1.5">
              {paragraphs.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === index ? 16 : 4,
                    height: 4,
                    background: i === index ? "#5b4dff" : "rgba(14,13,31,0.2)",
                  }}
                />
              ))}
            </div>

            <div className="flex gap-3 pt-3">
              <motion.a
                href="#projects"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-7 py-3 rounded-full text-sm font-semibold"
                style={{ background: "#5b4dff", color: "#f4f5fb" }}
              >
                {t.cta1}
              </motion.a>
              <motion.a
                href="#contact"
                whileHover={{ scale: 1.04, borderColor: "rgba(14,13,31,0.45)" }}
                whileTap={{ scale: 0.97 }}
                className="px-7 py-3 rounded-full text-sm font-semibold border"
                style={{ borderColor: "rgba(14,13,31,0.18)", color: "#0e0d1f" }}
              >
                {t.cta2}
              </motion.a>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mt-16 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.labelEn}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05 + i * 0.08, duration: 0.55, ease }}
              className="rounded-[8px] border px-5 py-4 backdrop-blur-sm"
              style={{
                borderColor: "rgba(91,77,255,0.14)",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.72), rgba(244,245,251,0.46))",
                boxShadow: "0 18px 50px rgba(91,77,255,0.08)",
              }}
            >
              <div className="text-4xl font-bold leading-none tracking-tight" style={{ color: "#5b4dff" }}>{s.n}</div>
              <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "rgba(14,13,31,0.48)" }}>
                {lang === "en" ? s.labelEn : s.labelKo}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

    </section>
  );
}
