import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SiEthereum, SiReact, SiSolidity, SiWeb3Dotjs } from "react-icons/si";
import { FaFileAlt, FaWallet } from "react-icons/fa";

gsap.registerPlugin(ScrollTrigger);

/* =========================
   Data
========================= */
const items = [
  {
    title: "Web3 & Corporate Websites",
    desc: "High-conversion landing pages, token sites, and corporate platforms.",
    icon: <SiReact />,
    color: "from-blue-500 to-cyan-500",
    iconColor: "text-cyan-400",
  },
  {
    title: "Token & Smart Contract Development",
    desc: "Custom token contracts across EVM chains with secure architecture.",
    icon: <SiSolidity />,
    color: "from-purple-500 to-pink-500",
    iconColor: "text-pink-400",
  },
  {
    title: "Tokenomics & Whitepaper",
    desc: "Technical whitepapers and token economic system design.",
    icon: <FaFileAlt />,
    color: "from-indigo-500 to-purple-500",
    iconColor: "text-purple-400",
  },
  {
    title: "Full-Stack Platform Development",
    desc: "Production-ready web platforms from frontend to backend systems.",
    icon: <SiWeb3Dotjs />,
    color: "from-cyan-500 to-blue-500",
    iconColor: "text-blue-400",
  },
  {
    title: "Wallet & Key Management",
    desc: "Custodial and non-custodial wallet architecture and integrations.",
    icon: <FaWallet />,
    color: "from-blue-500 to-indigo-500",
    iconColor: "text-indigo-400",
  },
  {
    title: "Blockchain Integration",
    desc: "Smart contract integration, on-chain data, and Web3 infrastructure.",
    icon: <SiEthereum />,
    color: "from-cyan-500 to-teal-500",
    iconColor: "text-teal-400",
  },
];

/* =========================
   Animated Background Grid
========================= */
function AnimatedGrid() {
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

    const nodes: { x: number; y: number; vx: number; vy: number }[] = [];
    const nodeCount = 50;

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update nodes
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
      });

      // Draw connections
      ctx.strokeStyle = "rgba(59, 130, 246, 0.1)";
      ctx.lineWidth = 1;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.globalAlpha = 1 - dist / 150;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      ctx.globalAlpha = 1;
      nodes.forEach((node) => {
        ctx.fillStyle = "#3b82f6";
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
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
      className="absolute inset-0 w-full h-full opacity-40"
    />
  );
}

/* =========================
   Card
========================= */
function Card({
  title,
  desc,
  icon,
  color,
  iconColor,
  index,
}: {
  title: string;
  desc: string;
  icon: React.ReactElement;
  color: string;
  iconColor: string;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMove = (e: React.MouseEvent) => {
    const el = cardRef.current;
    const glow = glowRef.current;
    if (!el || !glow) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateX = (y / rect.height - 0.5) * -15;
    const rotateY = (x / rect.width - 0.5) * 15;

    gsap.to(el, {
      rotateX,
      rotateY,
      duration: 0.3,
      ease: "power2.out",
    });

    // Move glow to cursor position
    glow.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(59, 130, 246, 0.3), transparent 50%)`;
  };

  const handleLeave = () => {
    const el = cardRef.current;
    if (!el) return;

    gsap.to(el, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: "power2.out",
    });
  };

  useEffect(() => {
    if (!cardRef.current) return;

    gsap.fromTo(
      cardRef.current,
      {
        opacity: 0,
        y: 50,
        scale: 0.9,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        delay: index * 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: cardRef.current,
          start: "top 85%",
        },
      }
    );
  }, [index]);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        handleLeave();
      }}
      className="group relative rounded-2xl overflow-hidden"
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
    >
      {/* Card content */}
      <div className="relative z-10 h-full rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl p-8 transition-all duration-300">
        {/* Icon with gradient */}
        {/* Icon */}
        <div className="relative inline-flex items-center justify-center w-14 h-14 mb-6">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${color} opacity-100 blur-xl rounded-full`}
          />
          <div className={`relative text-3xl ${iconColor}`}>{icon}</div>{" "}
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-white mb-3 transition-colors group-hover:text-blue-300">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-white/60 leading-relaxed group-hover:text-white/80 transition-colors">
          {desc}
        </p>

        {/* Animated corner accents */}
        <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-blue-500/0 group-hover:border-blue-500/50 transition-all duration-500 rounded-tl-2xl" />
        <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-cyan-500/0 group-hover:border-cyan-500/50 transition-all duration-500 rounded-br-2xl" />

        {/* Number indicator */}
        <div className="absolute top-4 right-4 text-6xl font-bold text-white/[0.03] group-hover:text-white/[0.08] transition-all">
          {String(index + 1).padStart(2, "0")}
        </div>
      </div>

      {/* Glow effect */}
      <div
        ref={glowRef}
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
      />

      {/* Border glow */}
      <div
        className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
        style={{
          background: `linear-gradient(45deg, transparent, rgba(59, 130, 246, 0.1), transparent)`,
          animation: isHovered ? "borderRotate 3s linear infinite" : "none",
        }}
      />

      {/* Scanline effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent"
          style={{
            animation: isHovered ? "scanline 2s linear infinite" : "none",
          }}
        />
      </div>
    </div>
  );
}

/* =========================
   Section
========================= */
export default function Expertise() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
      });

      tl.from(titleRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power3.out",
      }).from(
        subtitleRef.current,
        {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: "power3.out",
        },
        "-=0.4"
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="expertise"
      ref={sectionRef}
      className="relative w-full bg-black py-32 text-white overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0">
        <AnimatedGrid />
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />

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
            className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent"
          >
            Core Expertise
          </h2>
          <p
            ref={subtitleRef}
            className="mt-6 text-lg text-blue-100/60 max-w-2xl mx-auto"
          >
            End-to-end Web3 development, from smart contracts to full production
            platforms.
          </p>

          {/* Decorative line */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-blue-500/50" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-blue-500/50" />
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <Card
              key={i}
              title={item.title}
              desc={item.desc}
              icon={item.icon}
              color={item.color}
              iconColor={item.iconColor}
              index={i}
            />
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

        @keyframes scanline {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </section>
  );
}
