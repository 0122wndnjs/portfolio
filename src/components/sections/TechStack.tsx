import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

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
  SiTailwindcss,
  SiNextdotjs,
  SiPython,
  SiDocker,
  SiNodedotjs, 
  SiWeb3Dotjs,
  SiGreensock,
  SiFramer
} from "react-icons/si";
import { FaJava, FaAws, FaJs } from "react-icons/fa";

/* =========================
   Data (Enriched)
========================= */
export const TEAMS = [
  {
    category: "Frontend & UI",
    gradient: "from-cyan-400 to-blue-600",
    skills: [
      { name: "React", icon: <SiReact />, color: "#61dafb" },
      { name: "Next.js", icon: <SiNextdotjs />, color: "#ffffff" },
      { name: "TypeScript", icon: <SiTypescript />, color: "#3178c6" },
      { name: "Tailwind CSS", icon: <SiTailwindcss />, color: "#38bdf8" },
      { name: "Framer Motion", icon: <SiFramer />, color: "#f505bb" },
      { name: "GSAP", icon: <SiGreensock />, color: "#88ce02" },
      { name: "JavaScript", icon: <FaJs />, color: "#f7df1e" },
    ],
  },
  {
    category: "Web3 & Blockchain",
    gradient: "from-purple-400 to-pink-600",
    skills: [
      { name: "Solidity", icon: <SiSolidity />, color: "#656565" },
      { name: "Ethereum", icon: <SiEthereum />, color: "#627eea" },
      { name: "Web3.js", icon: <SiWeb3Dotjs />, color: "#f16822" },
      { name: "Smart Contracts", icon: <SiSolidity />, color: "#a1a1aa" },
    ],
  },
  {
    category: "Backend & Systems",
    gradient: "from-emerald-400 to-teal-600",
    skills: [
      { name: "Node.js", icon: <SiNodedotjs />, color: "#339933" },
      { name: "NestJS", icon: <SiNestjs />, color: "#e0234e" },
      { name: "Java", icon: <FaJava />, color: "#f89820" },
      { name: "Python", icon: <SiPython />, color: "#3776ab" },
      { name: "PostgreSQL", icon: <SiPostgresql />, color: "#336791" },
      { name: "MongoDB", icon: <SiMongodb />, color: "#47a248" },
      { name: "MySQL", icon: <SiMysql />, color: "#00758f" },
      { name: "Docker", icon: <SiDocker />, color: "#2496ed" },
      { name: "AWS", icon: <FaAws />, color: "#ff9900" },
      { name: "Firebase", icon: <SiFirebase />, color: "#ffca28" },
    ],
  },
];

/* =========================
   Skill Badge Component
========================= */
function SkillBadge({ name, icon, color }: { name: string; icon: React.ReactNode; color: string }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="relative group cursor-pointer"
    >
      {/* Dynamic Glow Background */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl z-0"
        style={{ background: color, filter: 'blur(20px)' }}
        animate={{ opacity: isHovered ? 0.4 : 0 }}
      />
      
      {/* Badge Container */}
      <div className="relative z-10 flex items-center gap-3 px-5 py-3 sm:px-6 sm:py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden">
        {/* Subtle gradient fill on hover */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
          style={{ background: `linear-gradient(135deg, ${color}, transparent)` }}
        />
        
        {/* Icon */}
        <motion.div 
          className="text-2xl sm:text-3xl"
          style={{ color }}
          animate={{ rotate: isHovered ? [0, -10, 10, -10, 0] : 0 }}
          transition={{ duration: 0.5 }}
        >
          {icon}
        </motion.div>
        
        {/* Text */}
        <span className="font-medium text-sm sm:text-base text-slate-300 group-hover:text-white transition-colors duration-300">
          {name}
        </span>
      </div>
    </motion.div>
  );
}

/* =========================
   Category Section Component
========================= */
function CategorySection({ 
  category, 
  skills, 
  gradient, 
  index 
}: { 
  category: string; 
  skills: typeof TEAMS[0]['skills']; 
  gradient: string;
  index: number;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay: index * 0.15 }}
      className="w-full mb-16 sm:mb-24 last:mb-0"
    >
      {/* Category Title */}
      <div className="flex items-center gap-4 mb-8 sm:mb-12">
        <h3 className={`text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
          {category}
        </h3>
        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
      </div>

      {/* Skills Flex Wrap */}
      <div className="flex flex-wrap gap-4 sm:gap-6">
        {skills.map((skill, i) => (
          <SkillBadge 
            key={`${category}-${skill.name}`}
            name={skill.name}
            icon={skill.icon}
            color={skill.color}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* =========================
   Infinite Marquee
========================= */
function InfiniteMarquee() {
  const allIcons = TEAMS.flatMap(t => t.skills.map(s => ({ icon: s.icon, color: s.color })));
  // Double the array to make seamless loop
  const duplicatedIcons = [...allIcons, ...allIcons, ...allIcons];

  return (
    <div className="absolute top-1/2 left-0 w-full overflow-hidden -translate-y-1/2 opacity-5 pointer-events-none select-none z-0">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
        className="flex gap-16 whitespace-nowrap"
      >
        {duplicatedIcons.map((item, i) => (
          <div key={i} className="text-[120px] grayscale" style={{ filter: `drop-shadow(0 0 30px ${item.color})` }}>
            {item.icon}
          </div>
        ))}
      </motion.div>
    </div>
  );
}


/* =========================
   Main TechStack Component
========================= */
export default function TechStack() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parallax background elements
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [-100, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [150, -150]);

  return (
    <section id="tech" ref={containerRef} className="relative w-full bg-black py-32 overflow-hidden selection:bg-purple-500/30">
      
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black" />
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 z-0 mix-blend-screen opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Parallax Floating Orbs */}
      <motion.div 
        style={{ y: y1 }}
        className="absolute top-0 right-[10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0"
      />
      <motion.div 
        style={{ y: y2 }}
        className="absolute bottom-0 left-[5%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none z-0"
      />

      {/* Subtle Marquee Background */}
      <InfiniteMarquee />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Title Section */}
        <div className="text-center mb-24 md:mb-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-500/30 bg-purple-500/10 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-sm font-semibold text-purple-300 tracking-wider uppercase">Arsenal</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-8"
          >
            Technical <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Arsenal</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto font-light"
          >
            A carefully curated stack of modern technologies empowering scalable <span className="text-white font-medium">Web3 architectures</span> and immersive <span className="text-white font-medium">frontend experiences</span>.
          </motion.p>
        </div>

        {/* Tech Stack Categories */}
        <div className="relative">
          {TEAMS.map((team, index) => (
            <CategorySection 
              key={team.category}
              category={team.category}
              skills={team.skills}
              gradient={team.gradient}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
