import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FaTelegramPlane } from "react-icons/fa";
import { SiGmail } from "react-icons/si";
import { FiCreditCard } from "react-icons/fi";
import BusinessCard from "./BusinessCard";

gsap.registerPlugin(ScrollTrigger);

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
  },
  {
    name: "Telegram",
    icon: <FaTelegramPlane />,
    value: "@wndnjs0122",
    link: "https://t.me/wndnjs0122",
    color: "#229ED9",
  },
];

/* =========================
   Contact Card with Center Ripple Effect
========================= */
function ContactCard({ item }: { item: any }) {
  return (
    <motion.a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -8, scale: 1.04 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="group relative rounded-2xl overflow-hidden cursor-pointer"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 group-hover:border-white/20 transition-all duration-300" />

      {/* Center ripple effect - spreads from center like curtains opening */}
      <div
        className="absolute top-1/2 left-1/2 w-0 h-0 rounded-full -translate-x-1/2 -translate-y-1/2 
                   group-hover:w-[600px] group-hover:h-[600px] 
                   transition-all duration-700 ease-out pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${item.color} 0%, ${item.color}ee 30%, ${item.color}99 50%, ${item.color}44 70%, transparent 100%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center">
        {/* Icon - changes to white on hover */}
        <div
          className="text-4xl mb-4 transition-all duration-300"
          style={{
            color: item.color,
          }}
        >
          <span className="group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-300">
            {item.icon}
          </span>
        </div>

        {/* Text - brightens on hover */}
        <p className="text-white font-medium group-hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.3)] transition-all duration-300">
          {item.name}
        </p>
        <p className="text-sm text-white/60 group-hover:text-white/95 group-hover:drop-shadow-[0_0_4px_rgba(255,255,255,0.2)] transition-all duration-300 mt-1">
          {item.value}
        </p>
      </div>

      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: `0 0 30px ${item.color}66, inset 0 0 30px ${item.color}22`,
        }}
      />
    </motion.a>
  );
}

/* =========================
   Section
========================= */
export default function Contact() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [cardOpen, setCardOpen] = useState(false);

  useEffect(() => {
    if (!titleRef.current) return;

    gsap.fromTo(
      titleRef.current,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 80%",
        },
      }
    );
  }, []);

  return (
    <section
      id="contact"
      className="relative w-full bg-black py-32 text-white overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        {/* Title */}
        <div className="text-center mb-20">
          <p className="text-xs uppercase tracking-widest text-white/40">
            Contact
          </p>

          <h2
            ref={titleRef}
            className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent"
          >
            Get in Touch
          </h2>

          <p className="mt-6 text-lg text-white/60 max-w-2xl mx-auto">
            Always open to new projects, ideas, and opportunities
            <br />
            Let’s connect and see what we can build together
          </p>

          <p className="mt-3 text-sm text-white/40">
            Open to opportunities, collaborations, and new challenges.
          </p>
        </div>

        {/* Contact Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto">
          {contacts.map((item) => (
            <ContactCard key={item.name} item={item} />
          ))}
        </div>

        {/* Business Card CTA */}
        <div className="mt-20 text-center">
          <motion.button
            onClick={() => setCardOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-8 py-4 text-white font-semibold text-lg hover:opacity-90 transition overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <FiCreditCard className="relative z-10 text-xl" />
            <span className="relative z-10">View Digital Business Card</span>
          </motion.button>

          <p className="mt-4 text-sm text-white/40">
            Scan, save, or share my contact info
          </p>
        </div>
      </div>

      {/* Business Card Modal */}
      <BusinessCard isOpen={cardOpen} onClose={() => setCardOpen(false)} />
    </section>
  );
}
