import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";

gsap.registerPlugin(ScrollTrigger);

type Line = {
  text: string;
  delay: number;
  color: string;
  cursor?: boolean;
};

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const [hasTyped, setHasTyped] = useState(false);
  const [visibleLines, setVisibleLines] = useState<Line[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  /* =========================
     Mouse Parallax Effect
  ========================= */
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  /* =========================
     Scroll Animation (GSAP)
  ========================= */
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "+=1500",
          scrub: 1,
          pin: true,
        },
      });

      tl.to(nameRef.current, {
        scale: 1.5,
        opacity: 0,
        filter: "blur(20px)",
        duration: 1,
        ease: "power2.inOut"
      }).fromTo(
        terminalRef.current,
        {
          opacity: 0,
          scale: 0.8,
          y: 100,
          filter: "blur(10px)"
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.2,
          ease: "back.out(1.5)"
        },
        0.2
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  /* =========================
     Typing Animation
  ========================= */
  useEffect(() => {
    if (hasTyped) return;

    const lines: Line[] = [
      { text: "joowon@dev-machine ~ % whoami", delay: 0, color: "text-emerald-400" },
      { text: "JOOWON KIM", delay: 400, color: "text-white font-bold" },
      { text: "", delay: 600, color: "" },
      { text: "joowon@dev-machine ~ % cat profile.json", delay: 1000, color: "text-blue-400" },
      { text: "{", delay: 1400, color: "text-slate-300" },
      { text: '  "role": "Full-Stack Developer & Web3 Builder",', delay: 1600, color: "text-yellow-300" },
      { text: '  "experience": "6+ years",', delay: 1800, color: "text-yellow-300" },
      { text: '  "specialties": [', delay: 2000, color: "text-slate-300" },
      { text: '    "Smart Contracts",', delay: 2150, color: "text-cyan-300" },
      { text: '    "Website Development",', delay: 2300, color: "text-cyan-300" },
      { text: '    "Web3 Products",', delay: 2450, color: "text-cyan-300" },
      { text: '    "DeFi & Wallets"', delay: 2600, color: "text-cyan-300" },
      { text: "  ],", delay: 2700, color: "text-slate-300" },
      { text: '  "stack": {', delay: 2900, color: "text-slate-300" },
      { text: '    "frontend": ["React", "TypeScript", "Next.js", "Tailwind"],', delay: 3100, color: "text-pink-400" },
      { text: '    "backend": ["Node.js", "Python", "Solidity"],', delay: 3300, color: "text-pink-400" },
      { text: '    "web3": ["Ethers.js", "Web3.js", "Hardhat"]', delay: 3500, color: "text-pink-400" },
      { text: "  },", delay: 3700, color: "text-slate-300" },
      { text: '  "status": "● Open to new opportunities"', delay: 3900, color: "text-green-400 font-medium" },
      { text: "}", delay: 4100, color: "text-slate-300" },
      { text: "", delay: 4300, color: "" },
      { text: "joowon@dev-machine ~ % _", delay: 4600, color: "text-white", cursor: true },
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTyped) {
            setHasTyped(true);
            lines.forEach((line) => {
              setTimeout(() => {
                setVisibleLines((prev) => [...prev, line]);
                const termInner = document.getElementById("terminal-inner");
                if (termInner) {
                  termInner.scrollTop = termInner.scrollHeight;
                }
              }, line.delay);
            });
          }
        });
      },
      { threshold: 0.5 }
    );

    if (terminalRef.current) {
      observer.observe(terminalRef.current);
    }

    return () => observer.disconnect();
  }, [hasTyped]);

  /* =========================
     JSX
  ========================= */
  return (
    <section ref={heroRef} className="relative h-screen w-full overflow-hidden text-white bg-black">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-screen"
      >
        <source src="/videos/desktop.mov" type="video/mp4" />
      </video>

      {/* Floating Glowing Orbs (Interactive Setup) */}
      <motion.div 
        animate={{ x: mousePos.x * -3, y: mousePos.y * -3 }}
        transition={{ type: "spring", stiffness: 40, damping: 30 }}
        className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none"
      />
      <motion.div 
        animate={{ x: mousePos.x * 2, y: mousePos.y * 2 }}
        transition={{ type: "spring", stiffness: 30, damping: 20 }}
        className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black z-0 pointer-events-none" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
        {/* Main Title Area */}
        <div ref={nameRef} className="flex flex-col items-center justify-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mb-6 px-5 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs sm:text-sm font-medium text-white/80 tracking-wide"
          >
            👋 Welcome to my universe
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-[12vw] sm:text-8xl md:text-[140px] lg:text-[180px] font-black tracking-tighter text-center select-none leading-none"
          >
            <span className="bg-gradient-to-br from-white via-slate-300 to-slate-600 bg-clip-text text-transparent drop-shadow-2xl">
              JOOWON KIM
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-6 md:mt-8 text-sm sm:text-xl md:text-2xl text-slate-400 font-light tracking-wide text-center max-w-2xl px-4"
          >
            Crafting scalable <span className="text-cyan-400 font-medium">Web3 experiences</span> and modern <span className="text-purple-400 font-medium">frontend applications</span>.
          </motion.p>
        </div>

        {/* Terminal Section */}
        <div
          ref={terminalRef}
          className="absolute inset-0 flex items-center justify-center pointer-events-none px-4 sm:px-8"
        >
          <div className="w-full max-w-5xl backdrop-blur-3xl bg-black/60 border border-white/20 rounded-2xl sm:rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden pointer-events-auto transition-transform hover:scale-[1.02] duration-500 will-change-transform">
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-white/5">
              <div className="flex gap-2 sm:gap-2.5">
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#FF5F56] shadow-[0_0_10px_rgba(255,95,86,0.5)]" />
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#FFBD2E] shadow-[0_0_10px_rgba(255,189,46,0.5)]" />
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#27C93F] shadow-[0_0_10px_rgba(39,201,63,0.5)]" />
              </div>
              <span className="text-white/40 text-[10px] sm:text-sm font-mono font-medium tracking-wider">
                joowon@portfolio ~ zsh
              </span>
              <div className="w-10"></div> {/* Spacer for centering */}
            </div>

            {/* Terminal Body */}
            <div 
              id="terminal-inner"
              className="p-5 sm:p-8 md:p-10 min-h-[300px] sm:min-h-[400px] max-h-[60vh] overflow-y-auto font-mono text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed md:leading-loose [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {visibleLines.map((line, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  key={i} 
                  className={`${line.color} whitespace-pre-wrap`}
                >
                  {line.cursor ? (
                    <span className="flex items-center">
                      {line.text.replace("_", "")}
                      <motion.div 
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="w-2 sm:w-2.5 h-4 sm:h-5 bg-white ml-2 inline-block"
                      />
                    </span>
                  ) : (
                    line.text
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 sm:gap-4 pointer-events-none"
        >
          <span className="text-[10px] sm:text-xs text-white/40 tracking-[0.3em] font-medium uppercase">
            Scroll to explore
          </span>
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-[1px] h-12 sm:h-16 bg-gradient-to-b from-white/60 to-transparent" 
          />
        </motion.div>
      </div>
    </section>
  );
}
