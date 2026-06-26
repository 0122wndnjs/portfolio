"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTelegramPlane, FaGithub, FaPhone } from "react-icons/fa";
import { SiGmail } from "react-icons/si";
import { FiDownload, FiShare2, FiX, FiMapPin } from "react-icons/fi";
import StyledQR from "../common/StyledQR";

interface BusinessCardProps {
  isOpen: boolean;
  onClose: () => void;
}

const cardData = {
  name: "Joowon Kim",
  title: "Full-Stack Developer & Web3 Builder",
  email: "0122wndnjs@gmail.com",
  telegram: "@wndnjs0122",
  github: "github.com/0122wndnjs",
  phone: "+82 10 6661 4589",
  website: "https://joowonkim.me",
  location: "Seoul, South Korea",
  photo: "/images/profile.jpg",
};

const contacts = [
  { icon: <FaPhone />, label: "Phone", value: cardData.phone, link: `tel:${cardData.phone.replace(/\s+/g, "")}`, color: "#16a34a" },
  { icon: <SiGmail />, label: "Email", value: cardData.email, link: `mailto:${cardData.email}`, color: "#ea4335" },
  { icon: <FaTelegramPlane />, label: "Telegram", value: cardData.telegram, link: `https://t.me/${cardData.telegram.replace("@", "")}`, color: "#229ED9" },
  { icon: <FaGithub />, label: "GitHub", value: "@0122wndnjs", link: `https://${cardData.github}`, color: "#1a1a1a" },
];

export default function BusinessCard({ isOpen, onClose }: BusinessCardProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleSaveContact = () => {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${cardData.name}\nTITLE:${cardData.title}\nTEL:${cardData.phone}\nEMAIL:${cardData.email}\nURL:${cardData.website}\nEND:VCARD`;
    const blob = new Blob([vcard], { type: "text/vcard" });
    const a = document.createElement("a");
    a.href = window.URL.createObjectURL(blob);
    a.download = "JoowonKim.vcf";
    a.click();
  };

  const shareOrDownload = async () => {
    try {
      setIsSharing(true);
      const res = await fetch("/og-image.png");
      const blob = await res.blob();
      const file = new File([blob], "joowonkim.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: cardData.name, text: cardData.title });
      } else {
        const a = document.createElement("a");
        a.href = "/og-image.png";
        a.download = "joowonkim.png";
        a.click();
      }
    } catch { /* noop */ }
    finally { setIsSharing(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100]"
            style={{ background: "rgba(10,9,8,0.88)", backdropFilter: "blur(10px)" }}
          />

          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 32, stiffness: 280 }}
            className="fixed bottom-0 left-0 right-0 z-[101] mx-auto"
            style={{ maxWidth: 420, maxHeight: "92vh" }}
          >
            <div
              className="rounded-t-3xl overflow-hidden flex flex-col"
              style={{ background: "#F5F0E8" }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-0 shrink-0">
                <div className="w-9 h-1 rounded-full" style={{ background: "rgba(15,14,12,0.12)" }} />
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-200"
                style={{ background: "rgba(15,14,12,0.07)", color: "rgba(15,14,12,0.4)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(15,14,12,0.13)";
                  (e.currentTarget as HTMLElement).style.color = "#0F0E0C";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(15,14,12,0.07)";
                  (e.currentTarget as HTMLElement).style.color = "rgba(15,14,12,0.4)";
                }}
              >
                <FiX size={13} />
              </button>

              <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden">

                {/* Card face */}
                <div className="px-6 pt-5 pb-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className="w-16 h-16 rounded-2xl overflow-hidden shrink-0"
                      style={{ border: "1px solid rgba(15,14,12,0.1)" }}
                    >
                      <img src={cardData.photo} alt="Joowon Kim" className="w-full h-full object-cover" />
                    </div>
                    <div className="pt-1">
                      <h2
                        className="font-bold leading-tight tracking-tight mb-1"
                        style={{ fontSize: "1.3rem", color: "#0F0E0C" }}
                      >
                        {cardData.name}
                      </h2>
                      <p className="text-xs font-light leading-snug" style={{ color: "rgba(15,14,12,0.5)" }}>
                        {cardData.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <FiMapPin size={10} style={{ color: "rgba(15,14,12,0.3)" }} />
                        <span className="text-[10px] font-mono" style={{ color: "rgba(15,14,12,0.3)" }}>
                          {cardData.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="mb-5" style={{ height: "1px", background: "rgba(15,14,12,0.08)" }} />

                  {/* Contacts */}
                  <div className="flex flex-col gap-1 mb-5">
                    {contacts.map((c, i) => (
                      <motion.a
                        key={c.label}
                        href={c.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.3 }}
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
                        style={{ background: "transparent" }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(15,14,12,0.05)"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white text-sm"
                          style={{ background: c.color }}
                        >
                          {c.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-mono uppercase tracking-widest mb-0.5" style={{ color: "rgba(15,14,12,0.3)" }}>
                            {c.label}
                          </p>
                          <p className="text-sm font-medium truncate" style={{ color: "#0F0E0C" }}>
                            {c.value}
                          </p>
                        </div>
                        <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "rgba(15,14,12,0.3)" }}>↗</span>
                      </motion.a>
                    ))}
                  </div>

                  {/* QR */}
                  <div
                    className="flex justify-center py-5 rounded-2xl mb-5"
                    style={{ background: "rgba(15,14,12,0.04)", border: "1px solid rgba(15,14,12,0.07)" }}
                  >
                    <StyledQR url={cardData.website} />
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={handleSaveContact}
                      className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={{
                        background: "rgba(15,14,12,0.06)",
                        color: "rgba(15,14,12,0.6)",
                        border: "1px solid rgba(15,14,12,0.1)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(15,14,12,0.1)";
                        (e.currentTarget as HTMLElement).style.color = "#0F0E0C";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(15,14,12,0.06)";
                        (e.currentTarget as HTMLElement).style.color = "rgba(15,14,12,0.6)";
                      }}
                    >
                      <FiDownload size={14} />
                      Save Contact
                    </button>

                    <button
                      onClick={shareOrDownload}
                      disabled={isSharing}
                      className="flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={{ background: "#0F0E0C", color: "#F5F0E8" }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "#2a2724"}
                      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "#0F0E0C"}
                    >
                      <FiShare2 size={14} />
                      {isSharing ? "Sharing…" : "Share"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
