"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";
import { motion, AnimatePresence } from "framer-motion";
import { SiGithub } from "react-icons/si";
import { FaTelegramPlane } from "react-icons/fa";
import { FiCreditCard, FiMail, FiMessageCircle } from "react-icons/fi";
import BusinessCard from "./BusinessCard";

const socials = [
  {
    icon: <SiGithub />,
    label: "GitHub",
    value: "@0122wndnjs",
    link: "https://github.com/0122wndnjs",
  },
];

const EMAIL = "0122wndnjs@gmail.com";

export default function Contact() {
  const [cardOpen, setCardOpen] = useState(false);
  const [emailHovered, setEmailHovered] = useState(false);
  const [telegramHovered, setTelegramHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { lang } = useLanguage();
  const t = translations[lang].contact;
  const tf = translations[lang].footer;

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  const copyEmail = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  };

  return (
    <section
      id="contact"
      className="relative w-full overflow-hidden flex flex-col"
     
    >
      <div className="w-full" style={{ height: "1px", background: "rgba(14,13,31,0.06)" }} />

      {/* Background: low-contrast infinite marquee */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none select-none overflow-hidden"
        aria-hidden
      >
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          className="flex w-fit"
          style={{ transform: "translateY(12%)" }}
        >
          {[0, 1].map((copy) => (
            <span
              key={copy}
              className="font-display block font-black tracking-tighter leading-none whitespace-nowrap"
              style={{ fontSize: "clamp(6rem, 18vw, 18rem)", color: "rgba(14,13,31,0.03)" }}
            >
              AVAILABLE FOR WORK — SEOUL — REMOTE — JOOWON KIM —&nbsp;
            </span>
          ))}
        </motion.div>
      </div>

      {/* Amber glow — bottom center */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: "700px",
          height: "320px",
          background: "radial-gradient(ellipse at bottom, rgba(91,77,255,0.09), transparent 72%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl w-full px-8 lg:px-12 pt-28 pb-16">

        {/* Open to work badge */}
        <motion.div
          initial={{ opacity: 0, y: -20, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2.5 mb-10 px-4 py-2 rounded-full"
          style={{ border: "1px solid rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.05)" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
          </span>
          <span className="text-xs font-mono tracking-widest" style={{ color: "rgba(16,185,129,0.85)" }}>
            {t.badge}
          </span>
        </motion.div>

        {/* Main heading */}
        <div className="mb-10 overflow-hidden">
          {["Let's", "work", "together."].map((word, i) => (
            <motion.div
              key={word}
              initial={{ y: "120%", opacity: 0 }}
              whileInView={{ y: "0%", opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <span
                className="block font-black tracking-tighter leading-[0.92]"
                style={{
                  fontSize: "clamp(4rem, 11vw, 10rem)",
                  color: i === 2 ? "rgba(14,13,31,0.22)" : "#0e0d1f",
                }}
              >
                {word}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* Left: description + socials */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="font-light leading-relaxed mb-3"
              style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.25rem)", color: "rgba(14,13,31,0.55)", maxWidth: "34ch" }}
            >
              {t.line1}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="font-light leading-relaxed mb-12"
              style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.25rem)", color: "rgba(14,13,31,0.28)", maxWidth: "34ch" }}
            >
              {t.line2}
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center gap-5"
            >
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-mono transition-all duration-150 group"
                  style={{
                    color: "rgba(14,13,31,0.55)",
                    background: "rgba(14,13,31,0.05)",
                    border: "1px solid rgba(14,13,31,0.09)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "#0e0d1f";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(14,13,31,0.2)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(14,13,31,0.09)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "rgba(14,13,31,0.55)";
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(14,13,31,0.09)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(14,13,31,0.05)";
                  }}
                >
                  <span className="text-base">{s.icon}</span>
                  {s.value}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-xs">↗</span>
                </a>
              ))}
              <span className="text-xs font-mono" style={{ color: "rgba(14,13,31,0.1)" }}>·</span>
              <span className="text-sm font-mono" style={{ color: "rgba(14,13,31,0.18)" }}>
                {t.location}
              </span>
            </motion.div>
          </div>

          {/* Right: CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-3"
          >
            <p className="text-[10px] font-mono tracking-[0.25em] uppercase mb-1" style={{ color: "rgba(14,13,31,0.2)" }}>
              {t.getInTouch}
            </p>

            {/* Email — click copies address */}
            <a
              href={`mailto:${EMAIL}`}
              onClick={copyEmail}
              onMouseEnter={() => setEmailHovered(true)}
              onMouseLeave={() => setEmailHovered(false)}
              className="group flex items-center gap-4 transition-all duration-300"
            >
              <motion.div
                animate={{
                  background: emailHovered ? "#5b4dff" : "rgba(91,77,255,0.07)",
                  borderColor: emailHovered ? "#5b4dff" : "rgba(91,77,255,0.18)",
                }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3 px-7 py-4 rounded-2xl border font-medium tracking-wide w-full transition-colors duration-150"
                style={{
                  fontSize: "clamp(0.85rem, 1.3vw, 1rem)",
                  color: emailHovered ? "#f4f5fb" : "#5b4dff",
                }}
              >
                <FiMail size={16} />
                Email Me
                <span className="ml-auto text-xs font-mono opacity-60">
                  {copied ? "copied ✓" : EMAIL}
                </span>
              </motion.div>
            </a>

            {/* Telegram */}
            <a
              href="https://t.me/wndnjs0122"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setTelegramHovered(true)}
              onMouseLeave={() => setTelegramHovered(false)}
              className="group flex items-center gap-4 transition-all duration-300"
            >
              <motion.div
                animate={{
                  background: telegramHovered ? "#229ED9" : "rgba(34,158,217,0.07)",
                  borderColor: telegramHovered ? "#229ED9" : "rgba(34,158,217,0.18)",
                }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-3 px-7 py-4 rounded-2xl border font-medium tracking-wide w-full transition-colors duration-150"
                style={{
                  fontSize: "clamp(0.85rem, 1.3vw, 1rem)",
                  color: telegramHovered ? "#ffffff" : "#229ED9",
                }}
              >
                <FaTelegramPlane size={16} />
                Chat with Me
                <span className="ml-auto text-xs font-mono opacity-60">@wndnjs0122</span>
              </motion.div>
            </a>
          </motion.div>

        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto max-w-6xl w-full px-8 lg:px-12 py-6 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(14,13,31,0.05)" }}
      >
        <p className="text-xs font-mono" style={{ color: "rgba(14,13,31,0.15)" }}>
          {tf.built}{" "}
          <span style={{ color: "rgba(14,13,31,0.32)" }}>Joowon Kim</span> © 2026
        </p>

        <button
          onClick={() => setCardOpen(true)}
          className="flex items-center gap-1.5 text-xs font-mono transition-colors duration-200"
          style={{ color: "rgba(14,13,31,0.18)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(14,13,31,0.5)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(14,13,31,0.18)")}
        >
          <FiCreditCard />
          {tf.businessCard}
        </button>
      </motion.div>

      {/* copy toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-8 left-1/2 z-[120] -translate-x-1/2 rounded-full px-5 py-2.5 text-xs font-mono"
            style={{
              background: "#0e0d1f",
              color: "#f4f5fb",
              boxShadow: "0 16px 40px rgba(14,13,31,0.25)",
            }}
          >
            {EMAIL} <span style={{ color: "#59f0c0" }}>copied ✓</span>
          </motion.div>
        )}
      </AnimatePresence>

      <BusinessCard isOpen={cardOpen} onClose={() => setCardOpen(false)} />
    </section>
  );
}
