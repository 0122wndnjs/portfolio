import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Line = {
  text: string;
  delay: number;
  color: string;
  cursor?: boolean;
};

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const [hasTyped, setHasTyped] = useState(false);
  const [visibleLines, setVisibleLines] = useState<Line[]>([]);

  /* =========================
     Scroll Animation
  ========================= */
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

      tl.to(nameRef.current, {
        scale: 1.5,
        opacity: 0,
        duration: 0.5,
      }).to(
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

  /* =========================
     Typing Animation (React 방식)
  ========================= */
  useEffect(() => {
    if (hasTyped) return;

    const lines: Line[] = [
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
          if (entry.isIntersecting && !hasTyped) {
            setHasTyped(true);

            lines.forEach((line, _i) => {
              setTimeout(() => {
                setVisibleLines((prev) => [...prev, line]);
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

  /* =========================
     JSX
  ========================= */
  return (
    <section
      ref={heroRef}
      className="relative h-screen w-full overflow-hidden text-white"
    >
      {/* Desktop Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover opacity-60 hidden md:block"
      >
        <source src="/videos/desktop.mov" type="video/mp4" />
      </video>

      {/* Mobile Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover opacity-60 md:hidden"
      >
        <source src="/videos/desktop.mov" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/80 to-black/10" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
        {/* Initial Name */}
        <h1
          ref={nameRef}
          className="text-6xl sm:text-8xl lg:text-[200px] font-semibold tracking-tight text-center select-none"
        >
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            JOOWON KIM
          </span>
        </h1>

        {/* Terminal */}
        <div
          ref={terminalRef}
          className="absolute inset-0 flex items-center justify-center opacity-0 scale-90"
        >
          <div className="w-full max-w-4xl mx-4 backdrop-blur-2xl bg-black/80 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-white/40 text-xs font-mono ml-2">
                joowon@portfolio ~ %
              </span>
            </div>

            <div className="p-6 sm:p-8 min-h-[400px] max-h-[500px] overflow-y-auto font-mono text-sm sm:text-base leading-relaxed">
              {visibleLines.map((line, i) => (
                <div key={i} className={line.color}>
                  {line.cursor ? (
                    <>
                      {line.text.replace("_", "")}
                      <span className="animate-pulse">_</span>
                    </>
                  ) : (
                    line.text
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-70">
          <span className="text-xs text-white/60 tracking-widest">
            SCROLL
          </span>
          <div className="w-[1px] h-16 bg-gradient-to-b from-white/60 to-transparent animate-pulse" />
        </div>
      </div>
    </section>
  );
}
