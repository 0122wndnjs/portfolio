import { motion } from "framer-motion";
import {
  SiReact,
  SiTypescript,
  SiSolidity,
  SiNestjs,
  SiPostgresql,
  SiMongodb,
  SiMysql,
  SiEthereum,
  SiFirebase,
} from "react-icons/si";
import { FaJava, FaAws, FaJs } from "react-icons/fa";

type Skill = {
  name: string;
  icon: React.ReactElement;
  colorLight: string;
  colorDark: string;
};

type SkillGroup = {
  category: string;
  skills: Skill[];
};

const skillGroups: SkillGroup[] = [
  {
    category: "Frontend",
    skills: [
      {
        name: "React",
        icon: <SiReact />,
        colorLight: "#61dafb",
        colorDark: "#0ea5e9",
      },
      {
        name: "TypeScript",
        icon: <SiTypescript />,
        colorLight: "#3178c6",
        colorDark: "#2563eb",
      },
      {
        name: "JavaScript",
        icon: <FaJs />,
        colorLight: "#f7df1e",
        colorDark: "#facc15",
      },
    ],
  },
  {
    category: "Backend",
    skills: [
      {
        name: "NestJS",
        icon: <SiNestjs />,
        colorLight: "#e0234e",
        colorDark: "#db2777",
      },
      {
        name: "Java",
        icon: <FaJava />,
        colorLight: "#f89820",
        colorDark: "#fbbf24",
      },
      {
        name: "Spring Boot",
        icon: <FaJava />,
        colorLight: "#6db33f",
        colorDark: "#86efac",
      },
    ],
  },
  {
    category: "Blockchain",
    skills: [
      {
        name: "Solidity",
        icon: <SiSolidity />,
        colorLight: "#363636",
        colorDark: "#d1d5db",
      },
      {
        name: "Ethereum",
        icon: <SiEthereum />,
        colorLight: "#627eea",
        colorDark: "#a3bffa",
      },
    ],
  },
  {
    category: "Database",
    skills: [
      {
        name: "PostgreSQL",
        icon: <SiPostgresql />,
        colorLight: "#336791",
        colorDark: "#60a5fa",
      },
      {
        name: "MySQL",
        icon: <SiMysql />,
        colorLight: "#00758f",
        colorDark: "#38bdf8",
      },
      {
        name: "MongoDB",
        icon: <SiMongodb />,
        colorLight: "#47a248",
        colorDark: "#4ade80",
      },
    ],
  },
  {
    category: "DevOps",
    skills: [
      {
        name: "AWS",
        icon: <FaAws />,
        colorLight: "#ff9900",
        colorDark: "#facc15",
      },
      {
        name: "Firebase",
        icon: <SiFirebase />,
        colorLight: "#d7ba7d",
        colorDark: "#fbbf24",
      },
    ],
  },
];

export default function SkillsSection() {
  const isDark =
    typeof window !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return (
    <section
      id="skills"
      className="py-20 bg-gray-50 dark:bg-gray-900 text-black dark:text-white px-6"
    >
      <h2 className="text-6xl font-bold mb-16 text-center font-vitroCore">
        SKILLS
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {skillGroups.map(({ category, skills }) => (
          <div
            key={category}
            className="rounded-2xl shadow-md p-6 bg-white dark:bg-dark-navy"
          >
            <h3 className="text-2xl font-semibold mb-6 text-indigo-600 dark:text-indigo-400 text-center">
              {category}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 justify-center">
              {skills.map(({ name, icon, colorLight, colorDark }) => {
                const currentColor = isDark ? colorDark : colorLight;
                const bgColor = `${currentColor}22`;
                return (
                  <motion.div
                    key={name}
                    whileHover={{
                      y: -6,
                      boxShadow: `0 8px 20px ${currentColor}44`,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex flex-col items-center justify-center cursor-default select-none rounded-lg border border-transparent p-5 min-h-[120px] text-center"
                    style={{
                      backgroundColor: bgColor,
                      borderColor: currentColor,
                      color: currentColor,
                    }}
                    title={name}
                  >
                    <div className="text-4xl mb-3">{icon}</div>
                    <span className="font-semibold text-lg whitespace-nowrap">
                      {name}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
