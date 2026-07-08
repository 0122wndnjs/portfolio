"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiLink } from "react-icons/fi";

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable — ignore */ }
  };

  return (
    <>
      <button
        onClick={copy}
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.15em] transition-colors duration-200"
        style={{ color: copied ? "#5b4dff" : "rgba(14,13,31,0.35)" }}
      >
        <FiLink size={12} />
        {copied ? "copied ✓" : "copy link"}
      </button>

      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-8 left-1/2 z-[120] -translate-x-1/2 rounded-full px-5 py-2.5 text-xs font-mono"
            style={{ background: "#0e0d1f", color: "#f4f5fb", boxShadow: "0 16px 40px rgba(14,13,31,0.25)" }}
          >
            link <span style={{ color: "#59f0c0" }}>copied ✓</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
