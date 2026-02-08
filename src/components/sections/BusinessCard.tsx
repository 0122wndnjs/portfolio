import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTelegramPlane, FaGithub, FaPhone } from "react-icons/fa";
import { SiGmail } from "react-icons/si";
import { FiDownload, FiShare2 } from "react-icons/fi";
import StyledQR from "../common/StyledQR";

interface BusinessCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BusinessCard({ isOpen, onClose }: BusinessCardProps) {
  const [isSharing, setIsSharing] = useState(false);

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

  /* =========================
     Save Contact (vCard)
  ========================= */
  const handleSaveContact = () => {
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

  /* =========================
     Save OG Image
  ========================= */
  const downloadOGImage = () => {
    const link = document.createElement("a");
    link.href = "/og-image.png";
    link.download = "joowonkim-business-card.png";
    link.click();
  };

  /* =========================
     Share OG Image
  ========================= */
  const shareOGImage = async () => {
    try {
      setIsSharing(true);

      const response = await fetch("/og-image.png");
      const blob = await response.blob();
      const file = new File([blob], "joowonkim-business-card.png", {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: cardData.name,
          text: cardData.title,
        });
      } else {
        downloadOGImage();
      }
    } catch (err) {
      console.error("Share failed:", err);
      downloadOGImage();
    } finally {
      setIsSharing(false);
    }
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
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            className="fixed bottom-0 left-0 right-0 z-[101] max-w-lg mx-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-gradient-to-b from-slate-900 to-black border-t border-x border-white/10 rounded-t-[32px] shadow-2xl overflow-hidden">
              {/* macOS top bar */}
              <div className="flex items-center gap-2 px-4 pt-4">
                <button
                  onClick={onClose}
                  className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600"
                />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>

              {/* Profile */}
              <div className="flex justify-center mt-6 mb-4 px-6">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 via-cyan-400 to-purple-500 p-1">
                  <div className="w-full h-full rounded-full bg-slate-900 overflow-hidden">
                    <img
                      src={cardData.photo}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pb-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    {cardData.name}
                  </h2>
                  <p className="text-white/80 text-sm font-medium mb-1">
                    {cardData.title}
                  </p>
                  <p className="text-white/50 text-xs">
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
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div
                        className="text-xl"
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

                {/* QR */}
                <div className="mb-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-center">
                    <StyledQR url={cardData.website} />
                  </div>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Save Contact */}
                  <button
                    onClick={handleSaveContact}
                    className="py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium flex items-center justify-center gap-2 hover:bg-white/15 transition-all"
                  >
                    <FiDownload size={16} />
                    Contact
                  </button>


                  {/* Share */}
                  <button
                    onClick={shareOGImage}
                    disabled={isSharing}
                    className="py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    <FiShare2 size={16} />
                    {isSharing ? "..." : "Share"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
