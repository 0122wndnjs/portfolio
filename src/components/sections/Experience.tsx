import { useRef, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

/* =========================
   Data
========================= */
const experiences = [
  {
    company: "UNIDECA",
    role: "Blockchain Project Lead / Full-Stack Developer",
    period: "May 2025 – Present",
    desc: [
      "Leading end-to-end Web3 projects including scalable infrastructure, token ecosystems, and non-custodial wallet development.",
      "Developed high-conversion corporate and client websites leveraging React, Next.js, and TailwindCSS.",
      "Ensuring robust smart contract security and maintaining highly available platform backends.",
    ],
    color: "from-cyan-400 to-blue-600",
    glowColor: "rgba(6, 182, 212, 0.5)",
    logo: "/images/company/unideca.png", /* Make sure to add this image or handle missing gracefully */
    tags: ["Web3", "Solidity", "React", "NestJS"],
  },
  {
    company: "Trillionslab",
    role: "Senior Blockchain Researcher / Product Manager",
    period: "Aug 2021 – Sep 2024",
    desc: [
      "Led comprehensive blockchain platform development, technical consulting, and extensive architectural documentation.",
      "Engineered NFT dApps, tokenized investment platforms, and innovative OTT service prototypes.",
      "Managed specialized government-funded R&D projects and international BaaS collaborations.",
    ],
    color: "from-purple-400 to-pink-600",
    glowColor: "rgba(217, 70, 239, 0.5)",
    logo: "/images/company/trillionslab.png",
    tags: ["NFT", "Project Management", "Fullstack", "BaaS"],
  },
  {
    company: "Delta Dental of Michigan",
    role: "Java Backend Developer",
    period: "Feb 2020 – Feb 2021",
    desc: [
      "Architected and developed Spring Boot APIs serving mission-critical enterprise dental insurance systems.",
      "Implemented high-throughput data processing pipelines and automated internal reporting services.",
      "Collaborated within a large-scale agile backend environment to optimize legacy codebase.",
    ],
    color: "from-blue-400 to-indigo-600",
    glowColor: "rgba(59, 130, 246, 0.5)",
    logo: "/images/company/deltadental.jpg",
    tags: ["Spring Boot", "Java", "Enterprise APIs", "Agile"],
  },
  {
    company: "Apolis",
    role: "Java Backend Intern",
    period: "Aug 2019 – Jan 2020",
    desc: [
      "Built resilient RESTful APIs for a microservice-based hotel management system.",
      "Practiced strict backend architecture patterns and extensive unit testing methodologies with Spring Boot.",
      "Gained foundational hands-on experience in enterprise-style CI/CD development workflows.",
    ],
    color: "from-indigo-400 to-purple-600",
    glowColor: "rgba(99, 102, 241, 0.5)",
    logo: "/images/company/apolis.jpg",
    tags: ["Microservices", "Spring Boot", "Unit Testing"],
  },
];

/* =========================
   Interactive Experience Card
========================= */
function ExperienceCard({ item, index }: { item: typeof experiences[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [_isHovered, setIsHovered] = useState(false);
  const isEven = index % 2 === 0;

  return (
    <div ref={cardRef} className="relative w-full flex justify-center pb-24 lg:pb-32 last:pb-0">
      
      {/* Central Timeline Node (Desktop) */}
      <div className="absolute left-1/2 top-0 hidden lg:flex -translate-x-1/2 h-full flex-col items-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative z-20 mt-8"
        >
          {/* Outer Ripple */}
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${item.color} animate-ping opacity-40`} />
          {/* Inner Node */}
          <div className={`w-5 h-5 rounded-full bg-gradient-to-br border-2 border-black ${item.color} shadow-[0_0_20px_${item.glowColor}] z-20`} />
        </motion.div>
      </div>

      {/* Card Content */}
      <div className={`relative w-full lg:w-[calc(50%-4rem)] ${isEven ? 'lg:mr-auto lg:text-right lg:pr-8' : 'lg:ml-auto lg:text-left lg:pl-8'}`}>
        
        {/* Mobile Node (Visible only on small screens) */}
        <div className="lg:hidden absolute left-0 top-8 w-4 h-4 rounded-full bg-gradient-to-br border-2 border-black shadow-[0_0_15px_rgba(255,255,255,0.3)] z-20" style={{ background: 'linear-gradient(to right, #00f2fe, #4facfe)' }} />

        <motion.div
          initial={{ opacity: 0, x: isEven ? -50 : 50, y: 20 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`relative group rounded-3xl p-[1px] pl-10 lg:pl-[1px] transition-transform duration-500 hover:-translate-y-2`}
        >
          {/* Card Border Gradient */}
          <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${item.color} opacity-20 group-hover:opacity-100 transition-opacity duration-500`} style={{ filter: 'blur(2px)' }} />
          
          {/* Inner Card Box */}
          <div className="relative h-full bg-black/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 overflow-hidden">
            
            {/* Hover Glow Background */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none"
              style={{ background: `radial-gradient(circle at center, ${item.glowColor}, transparent 70%)` }}
            />

            {/* Header: Logo, Company & Role */}
            <div className={`flex flex-col ${isEven ? 'lg:items-end' : 'lg:items-start'} items-start mb-6`}>
              <div className="flex items-center gap-4 mb-4">
                {/* Logo fallback or image */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} p-[1px] shrink-0`}>
                  <div className="w-full h-full bg-black rounded-xl overflow-hidden flex items-center justify-center">
                    {item.logo ? (
                      <img src={item.logo} alt={item.company} className="w-full h-full object-cover opacity-80" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <span className="text-white font-bold text-xl">{item.company.charAt(0)}</span>
                    )}
                  </div>
                </div>
                <div className={`flex flex-col ${isEven ? 'lg:items-end' : 'lg:items-start'} items-start`}>
                  <h3 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-300">
                    {item.company}
                  </h3>
                  <p className="text-sm font-medium text-cyan-400">
                    {item.role}
                  </p>
                </div>
              </div>
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {item.period}
              </div>
            </div>

            {/* Description Points */}
            <ul className={`space-y-3 mb-8 text-sm text-slate-400 group-hover:text-slate-300 transition-colors ${isEven ? 'lg:text-right' : 'lg:text-left'} text-left`}>
              {item.desc.map((d, i) => (
                <li key={i} className={`flex ${isEven ? 'lg:flex-row-reverse' : 'lg:flex-row'} flex-row items-start gap-3`}>
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${item.color} shrink-0 shadow-[0_0_8px_${item.glowColor}]`} />
                  <span className="leading-relaxed">{d}</span>
                </li>
              ))}
            </ul>

            {/* Tags */}
            <div className={`flex flex-wrap gap-2 ${isEven ? 'lg:justify-end' : 'lg:justify-start'} justify-start`}>
              {item.tags.map((tag, i) => (
                <span 
                  key={i} 
                  className={`px-3 py-1 text-xs font-medium rounded-md bg-white/5 border border-white/10 text-slate-300 transition-all duration-300 hover:bg-white/10 hover:text-white hover:border-white/30`}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Background Big Number Watermark */}
            <div className={`absolute -bottom-4 ${isEven ? '-left-4' : '-right-4'} text-[120px] font-black text-white/[0.02] group-hover:text-white/[0.05] transition-colors duration-500 pointer-events-none select-none`}>
              0{index + 1}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* =========================
   Main Section
========================= */
export default function Experience() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Custom scroll progress tail for a dynamic timeline line
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });
  
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <section id="experience" ref={containerRef} className="relative w-full bg-black py-32 overflow-hidden">
      
      {/* Immersive Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-black to-black pointer-events-none" />
      
      <motion.div 
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none"
      />
      <motion.div 
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ repeat: Infinity, duration: 7, delay: 2, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center mb-24 md:mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-sm font-semibold text-blue-300 tracking-wider uppercase">Journey</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-6"
          >
            Professional <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Experience</span>
          </motion.h2>

          <motion.p
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8, delay: 0.2 }}
             className="text-lg text-slate-400 max-w-2xl mx-auto"
          >
            A timeline of building scalable systems, from foundational enterprise Java backends to cutting-edge Web3 platforms.
          </motion.p>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Main animated scroll line (Desktop) */}
          <div className="absolute left-1/2 top-0 bottom-0 hidden lg:block -translate-x-1/2 w-px bg-white/5">
            <motion.div 
              className="absolute top-0 w-full bg-gradient-to-b from-cyan-400 via-blue-500 to-purple-600 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
              style={{ scaleY, transformOrigin: "top" }}
              initial={{ bottom: "100%" }}
              animate={{ bottom: 0 }}
            />
          </div>

          {/* Mobile partial line */}
          <div className="absolute left-[7px] top-8 bottom-0 lg:hidden w-px bg-gradient-to-b from-cyan-500/50 to-transparent" />

          {/* Mapping Experiences */}
          <div className="relative z-10 pt-10">
            {experiences.map((item, i) => (
              <ExperienceCard key={i} item={item} index={i} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
