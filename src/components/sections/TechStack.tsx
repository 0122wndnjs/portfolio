import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

gsap.registerPlugin(ScrollTrigger);

/* =========================
   Data
========================= */
type Skill = {
  name: string;
  icon: React.ReactElement;
  color: string;
  proficiency: number;
};

type SkillGroup = {
  category: string;
  skills: Skill[];
  gradient: string;
  icon: string;
};

const skillGroups: SkillGroup[] = [
  {
    category: "Frontend",
    icon: "◆",
    gradient: "from-blue-500 to-cyan-500",
    skills: [
      { name: "React", icon: <SiReact />, color: "#61dafb", proficiency: 95 },
      {
        name: "TypeScript",
        icon: <SiTypescript />,
        color: "#3178c6",
        proficiency: 90,
      },
      {
        name: "JavaScript",
        icon: <FaJs />,
        color: "#f7df1e",
        proficiency: 95,
      },
    ],
  },
  {
    category: "Backend",
    icon: "◈",
    gradient: "from-purple-500 to-pink-500",
    skills: [
      { name: "NestJS", icon: <SiNestjs />, color: "#e0234e", proficiency: 85 },
      { name: "Java", icon: <FaJava />, color: "#f89820", proficiency: 80 },
      { name: "Spring", icon: <FaJava />, color: "#6db33f", proficiency: 75 },
    ],
  },
  {
    category: "Blockchain",
    icon: "⬡",
    gradient: "from-cyan-500 to-blue-500",
    skills: [
      {
        name: "Solidity",
        icon: <SiSolidity />,
        color: "#a1a1aa",
        proficiency: 90,
      },
      {
        name: "Ethereum",
        icon: <SiEthereum />,
        color: "#627eea",
        proficiency: 85,
      },
    ],
  },
  {
    category: "Database",
    icon: "▣",
    gradient: "from-indigo-500 to-purple-500",
    skills: [
      {
        name: "PostgreSQL",
        icon: <SiPostgresql />,
        color: "#336791",
        proficiency: 85,
      },
      { name: "MySQL", icon: <SiMysql />, color: "#00758f", proficiency: 80 },
      {
        name: "MongoDB",
        icon: <SiMongodb />,
        color: "#47a248",
        proficiency: 85,
      },
    ],
  },
  {
    category: "DevOps",
    icon: "◉",
    gradient: "from-orange-500 to-yellow-500",
    skills: [
      { name: "AWS", icon: <FaAws />, color: "#ff9900", proficiency: 75 },
      {
        name: "Firebase",
        icon: <SiFirebase />,
        color: "#ffca28",
        proficiency: 80,
      },
    ],
  },
];

/* =========================
   Floating Particles
========================= */
function FloatingParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
    }[] = [];

    const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#a855f7"];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-30"
    />
  );
}

/* =========================
   Skill Card
========================= */
function SkillCard({ skill, delay }: { skill: Skill; delay: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, type: "spring" }}
      onHoverStart={() => {
        setIsHovered(true);
        setShowTooltip(true);
      }}
      onHoverEnd={() => {
        setIsHovered(false);
        setShowTooltip(false);
      }}
      className="group relative"
    >
      <motion.div
        whileHover={{ y: -8, scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="relative flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-6 overflow-hidden"
      >
        {/* Hover fill layer */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 0.8,
          }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{
            background: `linear-gradient(135deg, ${skill.color}33, ${skill.color}11)`,
          }}
        />

        {/* Soft glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0.6 : 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: skill.color,
          }}
        />

        {/* Icon */}
        <div className="relative z-10 mb-3">
          <motion.div
            className="text-5xl"
            style={{ color: skill.color }}
            animate={{
              rotate: isHovered ? [0, -10, 10, -10, 0] : 0,
            }}
            transition={{ duration: 0.5 }}
          >
            {skill.icon}
          </motion.div>
        </div>

        {/* Name */}
        <p className="relative z-10 text-sm font-medium text-white/90 group-hover:text-white transition-colors">
          {skill.name}
        </p>

        {/* Proficiency bar */}
        <div className="relative z-10 w-full mt-3">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${skill.color}, ${skill.color}99)`,
              }}
              initial={{ width: 0 }}
              animate={{ width: isHovered ? `${skill.proficiency}%` : "0%" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Corner accents */}
        <div
          className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 rounded-tl-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"
          style={{ borderColor: skill.color }}
        />
        <div
          className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 rounded-br-2xl opacity-0 group-hover:opacity-50 transition-opacity duration-500"
          style={{ borderColor: skill.color }}
        />
      </motion.div>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-black/90 border border-white/20 whitespace-nowrap z-20"
        >
          <p className="text-xs text-white/90">
            {skill.proficiency}% Proficiency
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

/* =========================
   Group Card
========================= */
function SkillGroupCard({
  group,
  index,
}: {
  group: SkillGroup;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 60, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        delay: index * 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          onEnter: () => setIsVisible(true),
        },
      }
    );
  }, [index]);

  return (
    <motion.div
      ref={ref}
      className="group relative rounded-3xl overflow-hidden"
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl" />
      {/* Content */}
      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              className={`text-3xl bg-gradient-to-br ${group.gradient} bg-clip-text text-transparent`}
            >
              {group.icon}
            </div>
            <h3
              className={`text-xl font-bold bg-gradient-to-r ${group.gradient} bg-clip-text text-transparent`}
            >
              {group.category}
            </h3>
          </div>

          {/* Count badge */}
          <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
            {group.skills.length} skills
          </div>
        </div>

        {/* Skills grid */}
        <div className="grid grid-cols-3 gap-4">
          {group.skills.map((skill, i) => (
            <SkillCard
              key={skill.name}
              skill={skill}
              delay={isVisible ? i * 0.1 : 0}
            />
          ))}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

/* =========================
   Main Section
========================= */
export default function TechStack() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!titleRef.current || !subtitleRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: titleRef.current,
        start: "top 80%",
      },
    });

    tl.fromTo(
      titleRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    ).fromTo(
      subtitleRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" },
      "-=0.4"
    );
  }, []);

  return (
    <section
      id="tech"
      className="relative w-full bg-black py-32 text-white overflow-hidden"
    >
      {/* Animated particles */}
      <div className="absolute inset-0">
        <FloatingParticles />
      </div>

      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {/* Title */}
        <div className="text-center mb-20">
          <h2
            ref={titleRef}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-6"
          >
            Tech Stack
          </h2>
          <p
            ref={subtitleRef}
            className="text-lg text-blue-100/60 max-w-2xl mx-auto"
          >
            Technologies I use to build scalable Web3 products and platforms.
          </p>

          {/* Decorative line */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-blue-500/50" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-blue-500/50" />
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group, i) => (
            <SkillGroupCard key={group.category} group={group} index={i} />
          ))}
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes borderRotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </section>
  );
}
