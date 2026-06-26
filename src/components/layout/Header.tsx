"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiArrowUpRight, FiMenu, FiX } from "react-icons/fi";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

type NavItem = {
  id: string;
  label: string;
  type: "section" | "route";
  path?: string;
};

const homeItems: NavItem[] = [
  { id: "expertise", label: "Expertise", type: "section" },
  { id: "projects", label: "Projects", type: "section" },
  { id: "experience", label: "Experience", type: "section" },
  { id: "contact", label: "Contact", type: "section" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { lang, toggle } = useLanguage();

  const isHome = pathname === "/";
  const isResearchPost = pathname.startsWith("/insights/");

  const navItems = useMemo(() => (isHome ? homeItems : []), [isHome]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      if (!navItems.length) return;
      navItems.forEach((item) => {
        const el = document.getElementById(item.id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 140 && rect.bottom >= 140) setActive(item.id);
      });
    };
    setActive(navItems[0]?.id ?? "");
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, navItems]);

  const goHome = () => {
    if (isHome) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    router.push("/");
    setMenuOpen(false);
  };

  const handleNavClick = (item: NavItem) => {
    if (item.type === "route" && item.path) {
      router.push(item.path);
      setMenuOpen(false);
      return;
    }
    const target = document.getElementById(item.id);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(item.id);
    setMenuOpen(false);
  };

  const contextualAction: NavItem = isHome
    ? { id: "go-insights", label: "Insights", type: "route", path: "/insights" }
    : { id: "go-home", label: "Portfolio", type: "route", path: "/" };

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-[1000]"
        style={{
          background: scrolled ? "rgba(15,14,12,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(245,240,232,0.06)" : "1px solid transparent",
          transition: "background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease",
        }}
      >
        <div className="mx-auto max-w-6xl px-8 lg:px-12 h-16 flex items-center justify-between">

          {/* Logo */}
          <button onClick={goHome} className="group flex items-center gap-0.5 shrink-0">
            <span
              className="font-mono text-sm font-medium tracking-tight transition-colors duration-200"
              style={{ color: "rgba(245,240,232,0.6)" }}
            >
              joowonkim
            </span>
            <span
              className="font-mono text-sm font-medium tracking-tight transition-colors duration-200"
              style={{ color: "#F59E0B" }}
            >
              .me
            </span>
          </button>

          {/* Desktop nav */}
          {navItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-7">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className="relative text-[13px] font-medium transition-colors duration-200 py-1"
                  style={{ color: active === item.id ? "#F5F0E8" : "rgba(245,240,232,0.35)" }}
                  onMouseEnter={(e) => {
                    if (active !== item.id)
                      (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.7)";
                  }}
                  onMouseLeave={(e) => {
                    if (active !== item.id)
                      (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.35)";
                  }}
                >
                  {item.label}
                  {/* Amber underline for active */}
                  {active === item.id && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute -bottom-0.5 left-0 right-0 h-px"
                      style={{ background: "#F59E0B" }}
                      transition={{ duration: 0.25 }}
                    />
                  )}
                </button>
              ))}
            </nav>
          )}

          {/* Right action */}
          <div className="hidden md:flex items-center gap-5">
            {/* Language toggle */}
            <button
              onClick={toggle}
              className="flex items-center gap-1 text-[12px] font-mono tracking-widest transition-colors duration-200"
              style={{ color: "rgba(245,240,232,0.3)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F59E0B")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,240,232,0.3)")}
            >
              <span style={{ color: lang === "en" ? "#F59E0B" : "rgba(245,240,232,0.3)" }}>EN</span>
              <span style={{ color: "rgba(245,240,232,0.15)" }}>/</span>
              <span style={{ color: lang === "ko" ? "#F59E0B" : "rgba(245,240,232,0.3)" }}>KO</span>
            </button>

            <button
              onClick={() => handleNavClick(contextualAction)}
              className="flex items-center gap-1.5 text-[13px] font-medium transition-all duration-200 group"
              style={{ color: "rgba(245,240,232,0.35)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F59E0B")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,240,232,0.35)")}
            >
              {contextualAction.label}
              <FiArrowUpRight
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                size={13}
              />
            </button>
          </div>

          {/* Mobile hamburger */}
          {!isResearchPost && (
            <button
              className="md:hidden p-1.5 transition-colors duration-200"
              style={{ color: "rgba(245,240,232,0.5)" }}
              onClick={() => setMenuOpen((v) => !v)}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#F5F0E8")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,240,232,0.5)")}
            >
              {menuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
            </button>
          )}
        </div>
      </motion.header>

      {/* Mobile menu */}
      {mounted && !isResearchPost && (
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[900]"
                style={{ background: "rgba(10,9,8,0.8)", backdropFilter: "blur(12px)" }}
                onClick={() => setMenuOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="fixed left-4 right-4 top-20 z-[950] rounded-2xl overflow-hidden"
                style={{
                  background: "#141210",
                  border: "1px solid rgba(245,240,232,0.08)",
                }}
              >
                <div className="p-3">
                  {navItems.map((item, i) => (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleNavClick(item)}
                      className="w-full text-left px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200 flex items-center justify-between"
                      style={{
                        color: active === item.id ? "#F5F0E8" : "rgba(245,240,232,0.45)",
                        background: active === item.id ? "rgba(245,240,232,0.05)" : "transparent",
                      }}
                    >
                      {item.label}
                      {active === item.id && (
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#F59E0B" }} />
                      )}
                    </motion.button>
                  ))}

                  <div className="mt-1 pt-2 space-y-0.5" style={{ borderTop: "1px solid rgba(245,240,232,0.06)" }}>
                    <button
                      onClick={() => handleNavClick(contextualAction)}
                      className="w-full text-left px-4 py-3.5 rounded-xl text-base font-medium flex items-center justify-between transition-colors duration-200"
                      style={{ color: "rgba(245,240,232,0.4)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#F59E0B")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,240,232,0.4)")}
                    >
                      {contextualAction.label}
                      <FiArrowUpRight size={14} />
                    </button>

                    {/* Language toggle */}
                    <button
                      onClick={toggle}
                      className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-mono flex items-center justify-between transition-colors duration-200"
                      style={{ color: "rgba(245,240,232,0.4)" }}
                    >
                      <span>Language</span>
                      <div className="flex items-center gap-1 text-xs tracking-widest">
                        <span style={{ color: lang === "en" ? "#F59E0B" : "rgba(245,240,232,0.3)" }}>EN</span>
                        <span style={{ color: "rgba(245,240,232,0.15)" }}>/</span>
                        <span style={{ color: lang === "ko" ? "#F59E0B" : "rgba(245,240,232,0.3)" }}>KO</span>
                      </div>
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
