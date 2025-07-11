import { motion } from "framer-motion";
import TypingText from "./TypingText";
import { useCallback } from "react";

export default function Hero() {
  const scrollToAbout = useCallback(() => {
    const section = document.getElementById("about-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <section className="h-screen flex flex-col items-center justify-center px-6 pt-16 bg-white text-black dark:bg-dark-navy dark:text-white">
      {/* 이름 */}
      <motion.h1
        className="text-6xl sm:text-7xl font-extrabold mb-6 text-center font-vitroCore"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        Joowon Kim
      </motion.h1>

      {/* 소개말 */}
      <div className="max-w-3xl text-center text-lg sm:text-xl mb-10 px-4 leading-relaxed">
        <TypingText
          text="안녕하세요, 새로운 도전을 즐기는 풀스택 개발자입니다."
          speed={60}
        />
        <br />
        <TypingText
          text="사용자 경험과 성능 최적화에 집중하며 혁신적인 웹과 블록체인 프로젝트를 만듭니다."
          speed={60}
          delay={2000}
        />
      </div>

      <motion.button
        onClick={scrollToAbout}
        className="px-6 py-3 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
        aria-label="더 알아보기"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        더 알아보기 ↓
      </motion.button>
    </section>
  );
}
