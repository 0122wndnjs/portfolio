import { useEffect, useState } from "react";
import { MdLightMode, MdDarkMode } from "react-icons/md";
import { AnimatePresence, motion } from "framer-motion";

export default function DarkModeFloating() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDark = () => {
    const newMode = !dark;
    setDark(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newMode);
  };

  return (
    <button
      onClick={toggleDark}
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-lg transition
                 dark:bg-gray-200 dark:text-black dark:hover:bg-gray-300
                 bg-gray-700 text-white hover:bg-gray-600"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={dark ? "sun" : "moon"}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.25 }}
        >
          {dark ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
