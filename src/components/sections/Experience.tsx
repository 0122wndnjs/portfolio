import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";

gsap.registerPlugin(ScrollTrigger);

/* =========================
   Data
========================= */
const experiences = [
  {
    company: "UNIDECA",
    role: "Blockchain Project Lead / Full-Stack Developer",
    period: "May 2025 – Present",
    desc: [
      "Led end-to-end Web3 project execution including token, wallet, and platform development.",
      "Developing BSC-based token ecosystem and non-custodial wallet.",
      "Designed and built corporate Web3 infrastructure websites.",
    ],
    color: "from-blue-500 to-cyan-500",
    icon: "⬡",
    tags: ["Web3", "Solidity", "React", "Node.js"],
  },
  {
    company: "Trillionslab",
    role: "Senior Blockchain Researcher / PM",
    period: "Aug 2021 – Sep 2024",
    desc: [
      "Led full-cycle blockchain platform development and consulting.",
      "Developed NFT dApps, investment platforms, and Web3 OTT prototypes.",
      "Managed government-funded blockchain R&D projects.",
    ],
    color: "from-purple-500 to-pink-500",
    icon: "◆",
    tags: ["NFT", "DeFi", "Project Management"],
  },
  {
    company: "Delta Dental of Michigan",
    role: "Java Backend Developer",
    period: "Feb 2020 – Feb 2021",
    desc: [
      "Developed Spring Boot APIs for dental insurance systems.",
      "Implemented data processing and reporting services.",
      "Collaborated in an enterprise-scale backend team.",
    ],
    color: "from-cyan-500 to-blue-500",
    icon: "◈",
    tags: ["Spring Boot", "Java", "PostgreSQL"],
  },
  {
    company: "Apolis",
    role: "Java Backend Intern",
    period: "Aug 2019 – Jan 2020",
    desc: [
      "Worked on microservice-based hotel management system.",
      "Built RESTful APIs using Spring Boot.",
      "Practiced unit testing and backend architecture design.",
    ],
    color: "from-indigo-500 to-purple-500",
    icon: "▣",
    tags: ["Microservices", "REST API", "Testing"],
  },
];

/* =========================
   Animated Background
========================= */
function AnimatedBackground() {
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
    }[] = [];

    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 1,
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.fillStyle = "rgba(59, 130, 246, 0.5)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

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
      className="absolute inset-0 w-full h-full opacity-20"
    />
  );
}

/* =========================
   Experience Card
========================= */
function ExperienceCard({ item, index }: { item: any; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!cardRef.current) return;

    gsap.fromTo(
      cardRef.current,
      {
        opacity: 0,
        x: index % 2 === 0 ? -60 : 60,
        scale: 0.95,
      },
      {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.8,
        ease: "power3.out",
        delay: index * 0.15,
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 85%",
        },
      }
    );
  }, [index]);

  return (
    <div ref={cardRef} className="relative">
      {/* Timeline connector */}
      <div className="absolute left-1/2 top-0 hidden lg:block -translate-x-1/2 h-full">
        {/* Vertical line */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-blue-500/50 to-transparent" />

        {/* Animated dot */}
        <motion.div
          className="absolute left-1/2 top-8 -translate-x-1/2"
          initial={{ scale: 0 }}
          animate={{ scale: isHovered ? 1.5 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className={`relative w-4 h-4 rounded-full bg-gradient-to-r ${item.color} shadow-lg`}
          >
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-r ${item.color} animate-ping opacity-75`}
            />
          </div>
        </motion.div>
      </div>

      {/* Card */}
      <div
        className={`relative lg:w-[calc(50%-60px)] ${
          index % 2 === 0 ? "lg:mr-auto" : "lg:ml-auto"
        }`}
      >
        <motion.div
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className="group relative rounded-3xl overflow-hidden"
          whileHover={{ y: -8 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-3xl" />

          {/* Glow effect */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl`}
          />

          {/* Animated border */}
          <div
            className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.3), transparent)`,
              animation: isHovered ? "borderRotate 3s linear infinite" : "none",
            }}
          />

          {/* Content */}
          <div className="relative z-10 p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                {/* Icon */}
                <div
                  className={`inline-block text-4xl mb-3 bg-gradient-to-br ${item.color} bg-clip-text text-transparent`}
                >
                  {item.icon}
                </div>

                {/* Company */}
                <h3
                  className={`text-2xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent mb-2`}
                >
                  {item.company}
                </h3>

                {/* Role */}
                <p className="text-lg text-white font-medium mb-1">
                  {item.role}
                </p>

                {/* Period */}
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{item.period}</span>
                </div>
              </div>

              {/* Number */}
              <div className="text-6xl font-bold text-white/[0.05] group-hover:text-white/[0.08] transition-all">
                {String(index + 1).padStart(2, "0")}
              </div>
            </div>

            {/* Description */}
            <ul className="space-y-3 mb-6">
              {item.desc.map((d: string, i: number) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 text-white/70 text-sm leading-relaxed group-hover:text-white/90 transition-colors"
                >
                  <span
                    className={`mt-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${item.color} flex-shrink-0`}
                  />
                  <span>{d}</span>
                </motion.li>
              ))}
            </ul>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag: string, i: number) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Corner accent */}
            <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-blue-500/0 group-hover:border-blue-500/30 transition-all duration-500 rounded-tr-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-purple-500/0 group-hover:border-purple-500/30 transition-all duration-500 rounded-bl-3xl" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* =========================
   Section
========================= */
export default function Experience() {
  const sectionRef = useRef<HTMLDivElement>(null);
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
      id="experience"
      ref={sectionRef}
      className="relative w-full bg-black py-32 text-white overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0">
        <AnimatedBackground />
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

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        {/* Title */}
        <div className="text-center mb-20">
          <h2
            ref={titleRef}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-6"
          >
            Experience
          </h2>
          <p
            ref={subtitleRef}
            className="text-lg text-blue-100/60 max-w-2xl mx-auto"
          >
            Professional journey across Web3, backend systems, and product
            development.
          </p>

          {/* Decorative line */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-blue-500/50" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-blue-500/50" />
          </div>
        </div>

        {/* Timeline */}
        <div className="relative space-y-20">
          {experiences.map((item, i) => (
            <ExperienceCard key={i} item={item} index={i} />
          ))}
        </div>

        {/* End marker */}
        <div className="mt-20 flex justify-center">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-ping opacity-75" />
          </div>
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
