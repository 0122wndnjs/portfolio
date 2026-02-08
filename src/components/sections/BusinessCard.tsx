import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTelegramPlane, FaGithub, FaPhone } from "react-icons/fa";
import { SiGmail } from "react-icons/si";
import { FiX, FiDownload, FiShare2 } from "react-icons/fi";
import StyledQR from "../common/StyledQR";

interface BusinessCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BusinessCard({ isOpen, onClose }: BusinessCardProps) {
  const [showQR, setShowQR] = useState(false);

  const cardData = {
    name: "JOOWON KIM",
    title: "Full-Stack Developer & Web3 Builder",
    email: "0122wndnjs@gmail.com",
    telegram: "@wndnjs0122",
    github: "github.com/0122wndnjs",
    phone: "+82 10 6661 4589",
    website: "https://joowonkim.pages.dev",
    location: "Seoul, South Korea",
    photo: "/images/profile.jpg",
  };

  const socialLinks = [
    {
      icon: <FaPhone />,
      label: "Phone",
      value: cardData.phone,
      color: "#22c55e",
      link: `tel:${cardData.phone.replace(/\s+/g, "")}`,
    },
    {
      icon: <SiGmail />,
      label: "Email",
      value: cardData.email,
      color: "#EA4335",
      link: `mailto:${cardData.email}`,
    },
    {
      icon: <FaTelegramPlane />,
      label: "Telegram",
      value: cardData.telegram,
      color: "#229ED9",
      link: `https://t.me/${cardData.telegram.replace("@", "")}`,
    },
    {
      icon: <FaGithub />,
      label: "GitHub",
      value: cardData.github.split("/").pop(),
      color: "#fff",
      link: `https://${cardData.github}`,
    },
  ];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: cardData.name,
          text: cardData.title,
          url: cardData.website,
        });
      } catch {}
    } else {
      navigator.clipboard.writeText(cardData.website);
      alert("Link copied to clipboard!");
    }
  };

  const handleDownload = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${cardData.name}
TITLE:${cardData.title}
TEL:${cardData.phone}
EMAIL:${cardData.email}
URL:${cardData.website}
END:VCARD`;

    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cardData.name.replace(/\s+/g, "_")}.vcf`;
    a.click();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />

          {/* Card */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[101] max-w-lg mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gradient-to-b from-slate-900 to-black border-t border-x border-white/10 rounded-t-[32px] shadow-2xl overflow-hidden max-h-screen flex flex-col">

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-all z-10"
              >
                <FiX size={18} />
              </button>

              {/* Scrollable content */}
              <div className="overflow-y-auto px-6 pt-10 pb-8">

                {/* Profile */}
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-cyan-400 to-purple-500 blur-xl opacity-40" />

                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 via-cyan-400 to-purple-500 p-1 shadow-xl">
                      <img
                        src={cardData.photo}
                        alt="profile"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {cardData.name}
                  </h2>
                  <p className="text-white/80 text-sm font-medium">
                    {cardData.title}
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    📍 {cardData.location}
                  </p>
                </div>

                {/* Social Links */}
                <div className="space-y-2 mb-6">
                  {socialLinks.map((social, index) => (
                    <motion.a
                      key={social.label}
                      href={social.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                    >
                      <div
                        className="text-xl group-hover:scale-110 transition-transform"
                        style={{ color: social.color }}
                      >
                        {social.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-white/60 text-xs">
                          {social.label}
                        </p>
                        <p className="text-white text-sm font-medium">
                          {social.value}
                        </p>
                      </div>
                    </motion.a>
                  ))}
                </div>

                {/* QR Toggle */}
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 text-white font-medium hover:from-blue-500/30 hover:to-purple-500/30 transition-all mb-3"
                >
                  {showQR ? "Hide QR Code" : "Show QR Code"}
                </button>

                {/* QR */}
                <AnimatePresence>
                  {showQR && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-4"
                    >
                      <div className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 border border-white/10 flex justify-center">
                        <StyledQR url={cardData.website} />
                      </div>
                      <p className="text-center text-xs text-white/50 mt-3">
                        Scan to open portfolio
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium hover:bg-white/15 transition-all flex items-center justify-center gap-2"
                  >
                    <FiDownload size={16} />
                    Save
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <FiShare2 size={16} />
                    Share
                  </button>
                </div>
              </div>

              {/* Bottom accent */}
              <div className="h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
