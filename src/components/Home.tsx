import { motion } from "framer-motion";
import TypingText from "./TypingText";
import { Link as ScrollLink } from "react-scroll";

export default function Hero() {
  return (
    <section
      id="home"
      className="h-screen flex flex-col items-center justify-center px-6 pt-16 bg-gray-200 text-black dark:bg-dark-navy dark:text-white"
    >
      <motion.h1
        className="text-6xl sm:text-7xl font-extrabold mb-6 text-center font-vitroCore"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        Joowon Kim
      </motion.h1>
      <div className="max-w-3xl text-center text-lg sm:text-xl mb-10 px-4 leading-relaxed">
        <TypingText
          text="안녕하세요, 새로운 도전을 즐기는 풀스택 개발자입니다."
          speed={60}
        />
        <br />
        <TypingText
          text="기술의 경계를 넘나들며 이것저것 도전해보는 걸 좋아하고, 웹과 블록체인 등 흥미로운 분야에 늘 관심을 갖고 있습니다."
          speed={60}
          delay={2000}
        />
      </div>

      <ScrollLink
        to="about"
        smooth={true}
        duration={500}
        offset={-64} // 헤더 높이만큼 보정
      >
        <motion.button
          className="px-6 py-3 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
          aria-label="더 알아보기"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          더 알아보기 ↓
        </motion.button>
      </ScrollLink>
    </section>
  );
}
