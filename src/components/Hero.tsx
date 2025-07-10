import { motion } from "framer-motion";
import TypingText from "./TypingText";
import { SiReact, SiTypescript, SiSolidity, SiNestjs } from "react-icons/si";
import { FaJava, FaBirthdayCake, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaGraduationCap, FaUser } from "react-icons/fa";
import { useEffect, useState } from "react";

type Tech = {
  name: string;
  icon: React.ReactElement;
  colorLight: string;
  colorDark: string;
};

const techs: Tech[] = [
  { name: "React", icon: <SiReact />, colorLight: "#61dafb", colorDark: "#0ea5e9" },
  { name: "TypeScript", icon: <SiTypescript />, colorLight: "#3178c6", colorDark: "#2563eb" },
  { name: "Solidity", icon: <SiSolidity />, colorLight: "#363636", colorDark: "#d1d5db" },
  { name: "Java", icon: <FaJava />, colorLight: "#f89820", colorDark: "#fbbf24" },
  { name: "NestJS", icon: <SiNestjs />, colorLight: "#e0234e", colorDark: "#db2777" },
];

const profileData = [
  { icon: <FaUser />, label: "이름", value: "김주원" },
  { icon: <FaBirthdayCake />, label: "생년월일", value: "1993-01-22" },
  { icon: <FaMapMarkerAlt />, label: "위치", value: "서울, 관악구" },
  { icon: <FaPhoneAlt />, label: "전화번호", value: "+82 10-6661-4589" },
  { icon: <FaEnvelope />, label: "이메일", value: "0122wndnjs@gmail.com" },
  { icon: <FaGraduationCap />, label: "학력", value: "University of Minnesota - Twin Cities" },
];

export default function Hero() {
  return (
    <section className="h-screen flex flex-col items-center justify-center px-6 pt-16 bg-white text-black dark:bg-dark-navy dark:text-white">
  <motion.h1
    className="text-4xl sm:text-7xl font-extrabold mb-6 text-center"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1 }}
  >
    Joowon Kim
  </motion.h1>

  <div className="max-w-4xl w-full text-center text-base sm:text-xl mb-12 px-4 leading-relaxed">
    <TypingText
      text="안녕하세요, 다양한 분야에 관심 있는 전문 풀스택 개발자입니다."
      speed={60}
    />
    <br />
    <TypingText
      text="사용자 경험과 성능 최적화에 집중하며 혁신적인 웹과 블록체인 프로젝트를 만듭니다."
      speed={60}
      delay={2000}
    />
  </div>

  <div className="max-w-6xl w-full grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-6 mb-12 text-sm sm:text-base">
    {profileData.map(({ icon, label, value }, idx) => (
      <div key={idx} className="flex items-center space-x-2">
        <div className="text-indigo-500 text-lg sm:text-xl">{icon}</div>
        <div>
          <p className="font-semibold">{label}</p>
          <p className="text-gray-700 dark:text-gray-300">{value}</p>
        </div>
      </div>
    ))}
  </div>

  <div className="flex flex-wrap justify-center w-full max-w-6xl gap-x-6 gap-y-6 mb-12">
    {techs.map(({ name, icon, colorLight, colorDark }) => (
      <TechBadge
        key={name}
        name={name}
        icon={icon}
        colorLight={colorLight}
        colorDark={colorDark}
      />
    ))}
  </div>

  <motion.div
    className="animate-bounce text-4xl"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 1 }}
  >
    ↓
  </motion.div>
</section>

  );
}

function TechBadge({
  name,
  icon,
  colorLight,
  colorDark,
}: {
  name: string;
  icon: React.ReactElement;
  colorLight: string;
  colorDark: string;
}) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => document.documentElement.classList.contains("dark");
    setIsDark(checkDark());

    const observer = new MutationObserver(() => {
      setIsDark(checkDark());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const currentColor = isDark ? colorDark : colorLight;
  const bgColor = `${currentColor}22`;

  return (
    <div
      className="flex items-center space-x-2 px-4 py-2 rounded-lg cursor-default select-none transition-all"
      style={{
        backgroundColor: bgColor,
        color: currentColor,
      }}
      title={name}
    >
      <div className="text-xl">{icon}</div>
      <span className="font-semibold text-sm">{name}</span>
    </div>
  );
}
