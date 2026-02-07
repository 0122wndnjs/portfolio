import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX } from "react-icons/fi";

const navItems = [
  { id: "expertise", label: "Expertise" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "tech", label: "Tech" },
  { id: "contact", label: "Contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);

      navItems.forEach((item) => {
        const el = document.getElementById(item.id);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        if (rect.top <= 120 && rect.bottom >= 120) {
          setActive(item.id);
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-center pointer-events-none">
        <div
          className={`
            mt-3 w-[94%] max-w-5xl rounded-[18px] transition-all duration-500
            ${
              scrolled
                ? "bg-white/[0.08] backdrop-blur-3xl border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
                : "bg-white/[0.03] backdrop-blur-xl border border-white/[0.06]"
            }
          `}
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif'
          }}
        >
          <div className="h-[52px] px-5 flex items-center justify-between pointer-events-auto">
            {/* Logo */}
            <button
              onClick={() =>
                window.scrollTo({ top: 0, behavior: "smooth" })
              }
              className="relative text-base font-semibold tracking-tight hover:opacity-80 transition-opacity"
            >
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                JOOWON KIM
              </span>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 relative bg-white/[0.04] rounded-full px-1 py-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`
                    relative px-4 py-1.5 text-[13px] font-medium rounded-full
                    transition-all duration-200
                    ${
                      active === item.id
                        ? "text-white"
                        : "text-white/60 hover:text-white/90"
                    }
                  `}
                >
                  {active === item.id && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/[0.15] backdrop-blur-xl shadow-lg"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}

                  <span className="relative z-10">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-white/80 hover:text-white text-xl p-2 -mr-2 
                       hover:bg-white/5 rounded-lg transition-all active:scale-95"
              onClick={() => setMenuOpen(true)}
            >
              <FiMenu />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu - iOS style */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xl"
              onClick={() => setMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ 
                duration: 0.25,
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              className="fixed top-20 left-4 right-4 z-[70] 
                       bg-white/[0.1] backdrop-blur-3xl 
                       border border-white/[0.15]
                       rounded-3xl shadow-2xl overflow-hidden"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
              }}
            >
              {/* Close button */}
              <button
                className="absolute top-4 right-4 text-white/60 hover:text-white 
                         w-8 h-8 flex items-center justify-center rounded-full
                         hover:bg-white/10 transition-all active:scale-90"
                onClick={() => setMenuOpen(false)}
              >
                <FiX size={20} />
              </button>

              {/* Menu Items */}
              <div className="p-4 pt-12">
                {navItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => scrollTo(item.id)}
                    className={`
                      w-full text-left px-5 py-4 rounded-2xl
                      text-lg font-medium transition-all
                      ${
                        active === item.id
                          ? "bg-white/[0.15] text-white"
                          : "text-white/70 hover:bg-white/[0.08] hover:text-white active:scale-[0.98]"
                      }
                    `}
                  >
                    {item.label}
                  </motion.button>
                ))}
              </div>

              {/* Bottom gradient accent */}
              <div className="h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 opacity-30" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}