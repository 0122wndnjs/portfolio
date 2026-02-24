import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { SiEthereum, SiReact, SiSolidity, SiWeb3Dotjs } from "react-icons/si";
import { FaFileAlt, FaWallet } from "react-icons/fa";

/* =========================
   Data
========================= */
const items = [
  {
    title: "Web3 & Corporate Websites",
    desc: "High-conversion landing pages, token sites, and corporate platforms with interactive 3D elements and modern aesthetics.",
    icon: <SiReact />,
    color: "from-blue-500/20 to-cyan-500/20",
    glowColor: "rgba(6, 182, 212, 0.4)",
    iconColor: "text-cyan-400",
  },
  {
    title: "Token & Smart Contract",
    desc: "Custom token contracts across EVM chains with secure architecture, thoroughly tested and optimized for low gas fees.",
    icon: <SiSolidity />,
    color: "from-purple-500/20 to-pink-500/20",
    glowColor: "rgba(236, 72, 153, 0.4)",
    iconColor: "text-pink-400",
  },
  {
    title: "Tokenomics & Whitepaper",
    desc: "Technical whitepapers and token economic system design, providing clear utility and long-term sustainable models.",
    icon: <FaFileAlt />,
    color: "from-indigo-500/20 to-purple-500/20",
    glowColor: "rgba(168, 85, 247, 0.4)",
    iconColor: "text-purple-400",
  },
  {
    title: "Full-Stack Platforms",
    desc: "Production-ready web platforms from robust scalable backend architectures to dynamic highly-responsive frontend systems.",
    icon: <SiWeb3Dotjs />,
    color: "from-cyan-500/20 to-blue-500/20",
    glowColor: "rgba(59, 130, 246, 0.4)",
    iconColor: "text-blue-400",
  },
  {
    title: "Wallet & Key Management",
    desc: "Custodial and non-custodial wallet architecture, AA (Account Abstraction), and secure external integrations.",
    icon: <FaWallet />,
    color: "from-blue-500/20 to-indigo-500/20",
    glowColor: "rgba(99, 102, 241, 0.4)",
    iconColor: "text-indigo-400",
  },
  {
    title: "Blockchain Integration",
    desc: "Smart contract integration, listening to on-chain data events, and establishing robust Web3 infrastructure.",
    icon: <SiEthereum />,
    color: "from-cyan-500/20 to-teal-500/20",
    glowColor: "rgba(45, 212, 191, 0.4)",
    iconColor: "text-teal-400",
  },
];

/* =========================
   Interactive 3D Card
========================= */
function Card({
  title,
  desc,
  icon,
  color,
  glowColor,
  iconColor,
  index,
}: {
  title: string;
  desc: string;
  icon: React.ReactElement;
  color: string;
  glowColor: string;
  iconColor: string;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Framer Motion values for 3D rotation based on mouse position
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["100%", "0%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["100%", "0%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
      style={{ perspective: 1000 }}
      className="relative z-10"
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={`relative h-full flex flex-col p-8 sm:p-10 rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-xl transition-colors duration-500 overflow-hidden cursor-crosshair group`}
      >
        {/* Dynamic Glare Effect */}
        <motion.div
          className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glareX} ${glareY}, ${glowColor}, transparent 40%)`,
            mixBlendMode: "screen",
          }}
        />

        {/* Dynamic Border Glow */}
        <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-3xl opacity-20`} />
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full transform-gpu" style={{ transform: "translateZ(40px)" }}>
          {/* Top part: Icon and Number */}
          <div className="flex justify-between items-start mb-8">
            <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-500 ease-out`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${color} blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className={`relative text-3xl sm:text-4xl ${iconColor}`}>{icon}</div>
            </div>
            
            <div className="text-5xl font-black text-white/[0.03] group-hover:text-white/[0.1] transition-colors duration-500 group-hover:scale-110 delay-75">
              {String(index + 1).padStart(2, "0")}
            </div>
          </div>

          {/* Bottom part: Text */}
          <div className="mt-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">
              {title}
            </h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed group-hover:text-slate-200 transition-colors duration-300">
              {desc}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* =========================
   Animated Background
========================= */
function GridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();

    const draw = () => {
      time += 0.005;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const cellSize = 60;
      ctx.lineWidth = 1;

      // Draw faint grid base
      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += cellSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      for (let y = 0; y <= canvas.height; y += cellSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.stroke();

      // Draw moving wave grid
      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += cellSize) {
        for (let y = 0; y <= canvas.height; y += cellSize) {
          // Calculate wave based on time and position
          const wave = Math.sin((x * 0.01) + time) * Math.cos((y * 0.01) + time);
          
          if (wave > 0.5) {
            ctx.fillStyle = `rgba(56, 189, 248, ${(wave - 0.5) * 0.15})`; // Sky blue subtle highlight
            ctx.fillRect(x, y, cellSize, cellSize);
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

/* =========================
   Section Component
========================= */
export default function Expertise() {
  return (
    <section id="expertise" className="relative w-full bg-black py-32 overflow-hidden selection:bg-cyan-500/30">
      
      {/* Backgrounds */}
      <GridBackground />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none z-0" />
      
      {/* Ambient Orbs */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        className="absolute top-1/4 -left-[10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none" 
      />
      <motion.div 
        animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 -right-[10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[180px] pointer-events-none" 
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Title Area */}
        <div className="text-center mb-24 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "backOut" }}
            className="mb-6 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-semibold text-cyan-400 tracking-widest uppercase inline-block"
          >
            Capabilities
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight"
          >
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
              Core Expertise
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-8 text-lg sm:text-xl text-slate-400 font-light max-w-3xl mx-auto"
          >
            Delivering robust, end-to-end solutions combining elegant <span className="text-white font-medium">frontend interfaces</span> with powerful <span className="text-white font-medium">Web3 architectures</span>.
          </motion.p>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <Card
              key={i}
              title={item.title}
              desc={item.desc}
              icon={item.icon}
              color={item.color}
              glowColor={item.glowColor}
              iconColor={item.iconColor}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
