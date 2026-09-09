"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiDownload, FiFileText, FiX } from "react-icons/fi";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/i18n/translations";

type ResumeMenuProps = {
  variant?: "header" | "mobile" | "contact";
  onOpen?: () => void;
};

const files = {
  en: {
    product: {
      href: "/files/resumes/joowon-kim-product-resume-en.pdf",
      filename: "Joowon-Kim-Product-Web3-Resume-EN.pdf",
    },
    engineering: {
      href: "/files/resumes/joowon-kim-engineering-resume-en.pdf",
      filename: "Joowon-Kim-Engineering-Resume-EN.pdf",
    },
  },
  ko: {
    product: {
      href: "/files/resumes/joowon-kim-product-resume-ko.pdf",
      filename: "Joowon-Kim-Product-Web3-Resume-KO.pdf",
    },
    engineering: {
      href: "/files/resumes/joowon-kim-engineering-resume-ko.pdf",
      filename: "Joowon-Kim-Engineering-Resume-KO.pdf",
    },
  },
} as const;

export default function ResumeMenu({ variant = "header", onOpen }: ResumeMenuProps) {
  const { lang } = useLanguage();
  const t = translations[lang].resume;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const showMenu = () => {
    onOpen?.();
    setOpen(true);
  };

  const closeMenu = () => setOpen(false);
  const currentFiles = files[lang];
  const options = [
    { key: "product" as const, ...t.product, ...currentFiles.product },
    { key: "engineering" as const, ...t.engineering, ...currentFiles.engineering },
  ];

  const trigger = variant === "contact" ? (
    <button
      type="button"
      onClick={showMenu}
      className="group flex w-full items-center gap-4 rounded-2xl border px-7 py-4 text-left font-medium tracking-wide transition-all duration-200"
      style={{
        fontSize: "clamp(0.85rem, 1.3vw, 1rem)",
        color: "#5b4dff",
        background: "rgba(91,77,255,0.07)",
        borderColor: "rgba(91,77,255,0.18)",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.color = "#ffffff";
        event.currentTarget.style.background = "#5b4dff";
        event.currentTarget.style.borderColor = "#5b4dff";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.color = "#5b4dff";
        event.currentTarget.style.background = "rgba(91,77,255,0.07)";
        event.currentTarget.style.borderColor = "rgba(91,77,255,0.18)";
      }}
    >
      <FiDownload size={16} />
      {t.button}
      <span className="ml-auto text-xs font-mono opacity-60">{t.pdfLabel}</span>
    </button>
  ) : variant === "mobile" ? (
    <button
      type="button"
      onClick={showMenu}
      className="w-full rounded-xl px-4 py-3.5 text-left text-base font-medium flex items-center justify-between transition-colors duration-200"
      style={{ color: "rgba(14,13,31,0.4)" }}
      onMouseEnter={(event) => { event.currentTarget.style.color = "#5b4dff"; }}
      onMouseLeave={(event) => { event.currentTarget.style.color = "rgba(14,13,31,0.4)"; }}
    >
      <span className="flex items-center gap-2.5"><FiFileText size={15} />{t.button}</span>
      <FiDownload size={14} />
    </button>
  ) : (
    <button
      type="button"
      onClick={showMenu}
      className="flex items-center gap-1.5 text-[13px] font-medium transition-colors duration-200"
      style={{ color: "rgba(14,13,31,0.35)" }}
      onMouseEnter={(event) => { event.currentTarget.style.color = "#5b4dff"; }}
      onMouseLeave={(event) => { event.currentTarget.style.color = "rgba(14,13,31,0.35)"; }}
    >
      <FiFileText size={13} />
      {t.button}
    </button>
  );

  return (
    <>
      {trigger}

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
            style={{ background: "rgba(14,13,31,0.38)", backdropFilter: "blur(12px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={closeMenu}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="resume-dialog-title"
              className="w-full max-w-md rounded-3xl p-6 sm:p-7"
              style={{ background: "#f4f5fb", boxShadow: "0 24px 80px rgba(14,13,31,0.24)" }}
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: "rgba(14,13,31,0.35)" }}>
                    {t.eyebrow}
                  </p>
                  <h2 id="resume-dialog-title" className="text-2xl font-semibold tracking-tight" style={{ color: "#0e0d1f" }}>
                    {t.heading}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(14,13,31,0.55)" }}>
                    {t.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeMenu}
                  aria-label={t.close}
                  className="rounded-full p-2 transition-colors duration-150"
                  style={{ color: "rgba(14,13,31,0.38)" }}
                  onMouseEnter={(event) => { event.currentTarget.style.color = "#0e0d1f"; event.currentTarget.style.background = "rgba(14,13,31,0.06)"; }}
                  onMouseLeave={(event) => { event.currentTarget.style.color = "rgba(14,13,31,0.38)"; event.currentTarget.style.background = "transparent"; }}
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="mt-6 grid gap-3">
                {options.map((option) => (
                  <a
                    key={option.key}
                    href={option.href}
                    download={option.filename}
                    onClick={closeMenu}
                    className="group flex items-center gap-4 rounded-2xl border p-4 transition-all duration-200"
                    style={{ background: "rgba(255,255,255,0.72)", borderColor: "rgba(14,13,31,0.1)" }}
                    onMouseEnter={(event) => { event.currentTarget.style.borderColor = "rgba(91,77,255,0.45)"; event.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(event) => { event.currentTarget.style.borderColor = "rgba(14,13,31,0.1)"; event.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ color: "#5b4dff", background: "rgba(91,77,255,0.08)" }}>
                      <FiFileText size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold" style={{ color: "#0e0d1f" }}>{option.title}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed" style={{ color: "rgba(14,13,31,0.5)" }}>{option.description}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-xs font-mono" style={{ color: "#5b4dff" }}>
                      {t.download}
                      <FiDownload className="transition-transform duration-200 group-hover:translate-y-0.5" size={14} />
                    </span>
                  </a>
                ))}
              </div>

              <p className="mt-5 text-center text-[11px] font-mono" style={{ color: "rgba(14,13,31,0.32)" }}>
                {t.languageLabel}: {lang.toUpperCase()} · PDF
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
