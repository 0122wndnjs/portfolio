"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiArrowUpRight, FiMenu, FiX } from "react-icons/fi";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";

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
  { id: "tech", label: "Tech", type: "section" },
  { id: "contact", label: "Contact", type: "section" }
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isHome = pathname === "/";
  const isResearchIndex = pathname === "/research";
  const isResearchPost = pathname.startsWith("/research/");

  const navItems = useMemo(() => {
    if (isHome) return homeItems;
    if (isResearchIndex) return [];
    return [];
  }, [isHome, isResearchIndex]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);

      if (!navItems.length) return;

      const currentHash = window.location.hash.replace("#", "");
      if (currentHash) {
        setActive(currentHash);
      }

      navItems.forEach((item) => {
        const el = document.getElementById(item.id);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        if (rect.top <= 140 && rect.bottom >= 140) {
          setActive(item.id);
        }
      });
    };

    setActive(navItems[0]?.id ?? "");
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, navItems]);

  const goHome = () => {
    if (isHome) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push("/");
    setMenuOpen(false);
  };

  const handleNavClick = (item: NavItem) => {
    if (item.type === "route" && item.path) {
      router.push(item.path);
      setMenuOpen(false);
      return;
    }

    if (item.type === "section") {
      const target = document.getElementById(item.id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        router.push(`${pathname}#${item.id}`);
      }
      setActive(item.id);
      setMenuOpen(false);
    }
  };

  const contextualAction: NavItem = isHome
    ? { id: "go-research", label: "Research", type: "route", path: "/research" }
    : { id: "go-home", label: "Portfolio", type: "route", path: "/" };

  return (
    <>
      <header className="fixed top-0 left-0 z-[1000] flex w-full justify-center">
        <div
          className={`mt-3 w-[94%] max-w-6xl rounded-[18px] border transition-all duration-500 ${
            scrolled
              ? "border-white/[0.12] bg-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-3xl"
              : "border-white/[0.06] bg-white/[0.03] backdrop-blur-xl"
          }`}
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif'
          }}
        >
          <div className="flex h-[54px] items-center justify-between px-5">
            <button
              onClick={goHome}
              className="relative text-base font-semibold tracking-tight transition-opacity hover:opacity-80"
            >
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                JOOWON KIM
              </span>
            </button>

            {navItems.length > 0 ? (
              <nav className="relative hidden items-center gap-1 rounded-full bg-white/[0.04] px-1 py-1 md:flex">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    className={`relative rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 ${
                      active === item.id
                        ? "text-white"
                        : "text-white/60 hover:text-white/90"
                    }`}
                  >
                    {active === item.id && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full bg-white/[0.15]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                ))}
              </nav>
            ) : (
              <div className="hidden md:block" />
            )}

            <div className="hidden items-center gap-2 md:flex">
              <button
                onClick={() => handleNavClick(contextualAction)}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-1.5 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-300/15"
              >
                {contextualAction.label}
                <FiArrowUpRight />
              </button>
            </div>

            {isResearchPost ? null : (
              <button
                className="rounded-lg p-2 text-xl text-white/80 transition-all hover:bg-white/5 hover:text-white active:scale-95 md:hidden"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                {menuOpen ? <FiX /> : <FiMenu />}
              </button>
            )}
          </div>
        </div>
      </header>

      {mounted &&
        !isResearchPost &&
        createPortal(
          <AnimatePresence>
            {menuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[900] bg-black/60 backdrop-blur-xl"
                  onClick={() => setMenuOpen(false)}
                />

                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.96 }}
                  transition={{ duration: 0.25, type: "spring", stiffness: 300, damping: 30 }}
                  className="fixed left-4 right-4 top-[76px] z-[950] overflow-hidden rounded-3xl border border-white/[0.15] bg-white/[0.1] backdrop-blur-3xl shadow-2xl"
                >
                  <div className="p-4">
                    {navItems.map((item, index) => (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleNavClick(item)}
                        className={`w-full rounded-2xl px-5 py-4 text-left text-lg font-medium transition-all ${
                          active === item.id
                            ? "bg-white/[0.15] text-white"
                            : "text-white/70 hover:bg-white/[0.08] hover:text-white active:scale-[0.98]"
                        }`}
                      >
                        {item.label}
                      </motion.button>
                    ))}

                    <button
                      onClick={() => handleNavClick(contextualAction)}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-base font-semibold text-cyan-100"
                    >
                      {contextualAction.label}
                      <FiArrowUpRight />
                    </button>
                  </div>
                  <div className="h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 opacity-30" />
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
