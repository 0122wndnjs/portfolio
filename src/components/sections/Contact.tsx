import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FaTelegramPlane, FaGithub } from "react-icons/fa";
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
    value: "0122wndnjs@email.com",
    link: "mailto:your@email.com",
    color: "#ea4335",
  },
  {
    name: "Telegram",
    icon: <FaTelegramPlane />,
    value: "@wndnjs0122",
    link: "https://t.me/yourhandle",
    color: "#229ED9",
  },
  {
    name: "GitHub",
    icon: <FaGithub />,
    value: "github.com/yourname",
    link: "https://github.com/0122wndnjs",
    color: "#ffffff",
  }
];

/* =========================
   Contact Card
========================= */
function ContactCard({ item }: { item: any }) {
  return (
    <motion.a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -8, scale: 1.04 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="group relative rounded-2xl overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10" />

      {/* Glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at center, ${item.color}33, transparent 70%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center">
        <div className="text-4xl mb-4" style={{ color: item.color }}>
          {item.icon}
        </div>

        <p className="text-white font-medium">{item.name}</p>
        <p className="text-sm text-white/60 mt-1">{item.value}</p>
      </div>
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
            Let's Build Something in Web3
          </h2>

          <p className="mt-6 text-lg text-white/60 max-w-2xl mx-auto">
            Open to global Web3 projects, technical consulting, and full-stack
            development partnerships.
          </p>

          <p className="mt-3 text-sm text-white/40">
            Available for freelance, contract, and long-term collaborations.
          </p>
        </div>

        {/* Contact Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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