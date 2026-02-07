import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

export default function CategoryBox({
  category,
  isActive,
  onClick,
}: any) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!boxRef.current) return;

    gsap.fromTo(
      boxRef.current,
      { opacity: 0, y: 30, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power3.out",
      }
    );
  }, []);

  return (
    <motion.div
      ref={boxRef}
      onClick={onClick}
      className={`relative cursor-pointer rounded-3xl p-8 transition-all duration-500 ${
        isActive ? "ring-2 ring-blue-500/50" : ""
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${category.color} opacity-10`}
      />
      <div className="absolute inset-0 rounded-3xl border border-white/10 bg-white/5" />

      <div className="relative z-10">
        <div
          className={`text-5xl mb-4 bg-gradient-to-br ${category.color} bg-clip-text text-transparent`}
        >
          {category.icon}
        </div>

        <h3 className="text-2xl font-semibold text-white mb-2">
          {category.name}
        </h3>

        <p className="text-sm text-white/50">
          {category.count} project
          {category.count > 1 ? "s" : ""}
        </p>
      </div>
    </motion.div>
  );
}
