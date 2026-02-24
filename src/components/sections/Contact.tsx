import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { FaTelegramPlane } from "react-icons/fa";
import { SiGmail } from "react-icons/si";
import { FiCreditCard } from "react-icons/fi";
import BusinessCard from "./BusinessCard";

/* =========================
   Contact Data
========================= */
const contacts = [
  {
    name: "Gmail",
    icon: <SiGmail />,
    value: "0122wndnjs@gmail.com",
    link: "mailto:0122wndnjs@gmail.com",
    color: "#ea4335",
    gradient: "from-red-500/20 to-orange-500/20",
    glow: "rgba(234, 67, 53, 0.4)",
  },
  {
    name: "Telegram",
    icon: <FaTelegramPlane />,
    value: "@wndnjs0122",
    link: "https://t.me/wndnjs0122",
    color: "#229ED9",
    gradient: "from-cyan-500/20 to-blue-500/20",
    glow: "rgba(34, 158, 217, 0.4)",
  },
];

/* =========================
   Interactive Contact Card
========================= */
function ContactCard({ item, index }: { item: typeof contacts[0]; index: number }) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // 3D Parallax logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["100%", "0%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["100%", "0%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
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
      transition={{ duration: 0.6, delay: index * 0.2, ease: "easeOut" }}
      style={{ perspective: 1000 }}
    >
      <motion.a
        ref={cardRef}
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="group relative flex flex-col items-center justify-center p-10 h-64 rounded-3xl cursor-crosshair border border-white/5 bg-gradient-to-br from-white/[0.03] to-white/[0.01] backdrop-blur-xl overflow-hidden"
      >
        {/* Dynamic Glare Background */}
        <motion.div
          className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glareX} ${glareY}, ${item.glow}, transparent 50%)`,
            mixBlendMode: "screen",
          }}
        />

        {/* Dynamic Fill on Hover */}
        <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} blur-xl`} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center transform-gpu" style={{ transform: "translateZ(30px)" }}>
          
          <motion.div 
            className="text-6xl mb-6 relative"
            style={{ color: item.color }}
            animate={{ scale: isHovered ? 1.15 : 1, y: isHovered ? -5 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            {/* Icon Inner Glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} blur-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
            <span className="relative z-10">{item.icon}</span>
          </motion.div>
          
          <h3 className="text-2xl font-bold text-white mb-2 tracking-wide group-hover:text-transparent group-hover:bg-clip-text transition-all duration-300" 
              style={{ backgroundImage: isHovered ? `linear-gradient(to right, #fff, ${item.color})` : 'none' }}>
            {item.name}
          </h3>
          <p className="text-sm font-mono text-slate-400 group-hover:text-slate-200 transition-colors">
            {item.value}
          </p>
          
        </div>

        {/* Decorative corner borders */}
        <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 rounded-tr-3xl opacity-0 xl:group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" style={{ borderColor: item.color }} />
        <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 rounded-bl-3xl opacity-0 xl:group-hover:opacity-40 transition-opacity duration-500 pointer-events-none" style={{ borderColor: item.color }} />
      </motion.a>
    </motion.div>
  );
}

/* =========================
   Connecting Particle Grid
========================= */
function GridOverlay() {
  return (
    <div
      className="absolute inset-0 opacity-[0.02] pointer-events-none"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)`,
        backgroundSize: "60px 60px"
      }}
    />
  );
}

/* =========================
   Main Contact Component
========================= */
export default function Contact() {
  const [cardOpen, setCardOpen] = useState(false);

  return (
    <section id="contact" className="relative w-full bg-black py-32 overflow-hidden selection:bg-blue-500/30">
      
      {/* Immersive Backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-900/10 to-black z-0" />
      <GridOverlay />

      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[180px] pointer-events-none" 
      />
      <motion.div 
        animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[150px] pointer-events-none" 
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8">
        
        {/* Headings */}
        <div className="text-center mb-24 cursor-default">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-bold text-blue-300 tracking-[0.2em] uppercase">CONNECT</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl sm:text-7xl font-black tracking-tight mb-8"
          >
            <span className="bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
              Let's build something
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              extraordinary.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed"
          >
            I'm currently <span className="text-white font-medium">open to new opportunities</span>. Whether you have a visionary project or just want to chat tech, my inbox is always open.
          </motion.p>
        </div>

        {/* Contacts Grid */}
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto mb-20">
          {contacts.map((item, index) => (
            <ContactCard key={item.name} item={item} index={index} />
          ))}
        </div>

        {/* Business Card Button Action */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <motion.button
            onClick={() => setCardOpen(true)}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="group relative inline-flex items-center gap-3 rounded-full bg-white/5 border border-white/20 px-8 py-4 text-white font-semibold text-lg overflow-hidden shadow-2xl"
          >
            {/* Neon Button Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-20 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Shimmer Effect */}
            <div className="absolute -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />

            <FiCreditCard className="relative z-10 text-2xl group-hover:text-white transition-colors" />
            <span className="relative z-10 tracking-wide text-white/90 group-hover:text-white transition-colors">
              Digital Business Card
            </span>
          </motion.button>
          
          <p className="mt-6 text-sm text-slate-500 font-light tracking-wide">
            Designed & Built by <span className="text-white">Joowon Kim</span> © 2026
          </p>
        </motion.div>
      </div>

      {/* Business Card Modal */}
      <BusinessCard isOpen={cardOpen} onClose={() => setCardOpen(false)} />
      
      {/* Styles for Shimmer */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-200%) skewX(-15deg); }
          100% { transform: translateX(400%) skewX(-15deg); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </section>
  );
}
