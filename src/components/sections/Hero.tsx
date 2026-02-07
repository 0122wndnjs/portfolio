import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* =========================
   Hero
========================= */
export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalContentRef = useRef<HTMLDivElement>(null);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hasTyped, setHasTyped] = useState(false);

  useEffect(() => {
    let frame = 0;

    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setMousePosition({
          x: (e.clientX / window.innerWidth) * 100,
          y: (e.clientY / window.innerHeight) * 100,
        });
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "+=2000",
          scrub: true,
          pin: true,
        },
      });

      // 이름 커지면서 사라지기
      tl.to(nameRef.current, {
        scale: 1.5,
        opacity: 0,
        duration: 0.5,
      })
        // 터미널 등장
        .to(
          terminalRef.current,
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
          },
          0.3
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // 타이핑 애니메이션
  useEffect(() => {
    if (hasTyped) return;

    const lines = [
      { text: "$ whoami", delay: 0, color: "text-emerald-400" },
      { text: "JOOWON KIM", delay: 500, color: "text-white" },
      { text: "", delay: 800, color: "" },
      { text: "$ cat profile.json", delay: 1000, color: "text-blue-400" },
      { text: "{", delay: 1500, color: "text-slate-300" },
      {
        text: '  "role": "Full-Stack Developer & Web3 Builder",',
        delay: 1700,
        color: "text-slate-300",
      },
      {
        text: '  "experience": "6+ years",',
        delay: 1900,
        color: "text-slate-300",
      },
      { text: '  "specialties": [', delay: 2100, color: "text-slate-300" },
      { text: '    "Smart Contracts",', delay: 2300, color: "text-cyan-400" },
      {
        text: '    "Website Development",',
        delay: 2450,
        color: "text-cyan-400",
      },
      { text: '    "Web3 Products",', delay: 2600, color: "text-cyan-400" },
      { text: '    "DeFi & Wallets"', delay: 2750, color: "text-cyan-400" },
      { text: "  ],", delay: 2900, color: "text-slate-300" },
      { text: '  "stack": {', delay: 3100, color: "text-slate-300" },
      {
        text: '    "frontend": ["React", "TypeScript", "Next.js"],',
        delay: 3300,
        color: "text-purple-400",
      },
      {
        text: '    "backend": ["Node.js", "Python", "Solidity"],',
        delay: 3500,
        color: "text-purple-400",
      },
      {
        text: '    "web3": ["Ethers.js", "Web3.js", "Hardhat"]',
        delay: 3700,
        color: "text-purple-400",
      },
      { text: "  },", delay: 3900, color: "text-slate-300" },
      {
        text: '  "status": "● available"',
        delay: 4100,
        color: "text-green-400",
      },
      { text: "}", delay: 4300, color: "text-slate-300" },
      { text: "", delay: 4500, color: "" },
      { text: "$ _", delay: 4700, color: "text-white", cursor: true },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && terminalContentRef.current && !hasTyped) {
            setHasTyped(true);
            const container = terminalContentRef.current;
            container.innerHTML = "";

            lines.forEach((line) => {
              setTimeout(() => {
                const lineDiv = document.createElement("div");
                lineDiv.className = `${line.color} font-mono text-sm sm:text-base leading-relaxed`;

                if (line.cursor) {
                  lineDiv.innerHTML = line.text.replace(
                    "_",
                    '<span class="animate-pulse">_</span>'
                  );
                } else {
                  lineDiv.textContent = line.text;
                }

                container.appendChild(lineDiv);
                container.scrollTop = container.scrollHeight;
              }, line.delay);
            });
          }
        });
      },
      { threshold: 0.3 }
    );

    if (terminalRef.current) {
      observer.observe(terminalRef.current);
    }

    return () => observer.disconnect();
  }, [hasTyped]);

  return (
    <section
      ref={heroRef}
      className="relative w-full text-white overflow-hidden"
    >
      {/* Deep space cosmic background */}
      <div className="absolute inset-0 bg-black">
        {/* Starfield */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `
              radial-gradient(2px 2px at 20% 30%, white, transparent),
              radial-gradient(2px 2px at 60% 70%, white, transparent),
              radial-gradient(1px 1px at 50% 50%, white, transparent),
              radial-gradient(1px 1px at 80% 10%, white, transparent),
              radial-gradient(2px 2px at 90% 60%, white, transparent),
              radial-gradient(1px 1px at 33% 80%, white, transparent),
              radial-gradient(1px 1px at 15% 55%, white, transparent)
            `,
            backgroundSize:
              "200% 200%, 180% 180%, 220% 220%, 190% 190%, 210% 210%, 170% 170%, 250% 250%",
            backgroundPosition: "0% 0%",
            animation: "twinkle 20s ease-in-out infinite",
          }}
        />

        {/* Nebula clouds */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Purple nebula */}
          <div
            className="absolute -top-1/4 left-0 w-[1000px] h-[1000px] rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle, rgba(147,51,234,0.4) 0%, rgba(168,85,247,0.3) 30%, rgba(59,130,246,0.2) 50%, transparent 70%)",
              filter: "blur(80px)",
              transform: `translate(${mousePosition.x * 0.03}px, ${
                mousePosition.y * 0.03
              }px)`,
              transition: "transform 0.3s ease-out",
            }}
          />

          {/* Blue nebula */}
          <div
            className="absolute top-1/3 right-0 w-[800px] h-[800px] rounded-full opacity-25"
            style={{
              background:
                "radial-gradient(circle, rgba(59,130,246,0.5) 0%, rgba(14,165,233,0.3) 40%, transparent 70%)",
              filter: "blur(90px)",
              transform: `translate(${-mousePosition.x * 0.04}px, ${
                mousePosition.y * 0.02
              }px)`,
              transition: "transform 0.3s ease-out",
            }}
          />

          {/* Cyan accent */}
          <div
            className="absolute bottom-0 left-1/3 w-[600px] h-[600px] rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle, rgba(6,182,212,0.4) 0%, rgba(59,130,246,0.2) 50%, transparent 70%)",
              filter: "blur(70px)",
              transform: `translate(${mousePosition.x * 0.02}px, ${
                -mousePosition.y * 0.03
              }px)`,
              transition: "transform 0.3s ease-out",
            }}
          />
        </div>
      </div>

      {/* Blockchain grid overlay */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(59,130,246,0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(59,130,246,0.3) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
            transform: "perspective(500px) rotateX(60deg)",
            transformOrigin: "center bottom",
          }}
        />
      </div>

      {/* Floating hexagons - blockchain feel */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + i * 12}%`,
              width: "60px",
              height: "70px",
              clipPath:
                "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              border: "1px solid rgba(59,130,246,0.5)",
              animation: `float ${4 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
              transform: `rotate(${i * 15}deg)`,
            }}
          />
        ))}
      </div>

      {/* Animated stars layer */}
      <div className="absolute inset-0 opacity-40">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${
                2 + Math.random() * 3
              }s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(1);
          }
          50% { 
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg);
            opacity: 0.3;
          }
          50% { 
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.6;
          }
        }
      `}</style>

      {/* Content Container */}
      <div className="relative z-10 flex h-screen flex-col items-center justify-center px-6">
        {/* Initial Name */}
        <h1
          ref={nameRef}
          className="text-6xl sm:text-8xl lg:text-[200px] font-semibold tracking-tight text-center cursor-default select-none"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            letterSpacing: "-0.02em",
          }}
        >
          <span
            className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent"
            style={{
              backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
              backgroundSize: "200% 200%",
              transition: "background-position 0.3s ease-out",
            }}
          >
            JOOWON KIM
          </span>
        </h1>

        {/* Terminal Window */}
        <div
          ref={terminalRef}
          className="absolute inset-0 flex items-center justify-center opacity-0 scale-90"
        >
          <div className="w-full max-w-4xl mx-4 backdrop-blur-2xl bg-black/40 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Terminal Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-b from-white/5 to-transparent border-b border-white/10">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors cursor-pointer" />
                <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors cursor-pointer" />
              </div>
              <span className="text-white/40 text-xs font-mono ml-2">
                joowon@portfolio ~ %
              </span>
            </div>

            {/* Terminal Content */}
            <div
              ref={terminalContentRef}
              className="p-6 sm:p-8 min-h-[400px] max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            >
              {/* Content will be dynamically added via typing animation */}
            </div>
          </div>
        </div>

        {/* Scroll indicator - always visible */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-60 z-20">
          <span className="text-xs text-slate-400 font-light tracking-wider">
            SCROLL
          </span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-slate-400 to-transparent animate-pulse" />
        </div>
      </div>
    </section>
  );
}
