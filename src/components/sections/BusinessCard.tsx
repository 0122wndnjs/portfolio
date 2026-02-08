import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTelegramPlane, FaGithub, FaPhone } from "react-icons/fa";
import { SiGmail } from "react-icons/si";
import { FiX, FiDownload, FiImage } from "react-icons/fi";
import { toPng } from "html-to-image";
import StyledQR from "../common/StyledQR";

interface BusinessCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BusinessCard({ isOpen, onClose }: BusinessCardProps) {
  const [showQR, setShowQR] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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

  const captureAndShareImage = async () => {
    if (!cardRef.current) return;

    try {
      setIsCapturing(true);

      // QR 코드가 안 펼쳐져 있으면 자동으로 펼치기
      const wasQRHidden = !showQR;
      if (wasQRHidden) {
        setShowQR(true);
        // QR 애니메이션이 완료될 때까지 대기
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // 캡처 (html-to-image 사용)
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: "#0f172a",
      });

      // dataUrl을 Blob으로 변환
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], "business-card.png", { type: "image/png" });

      // Web Share API 지원 확인
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: cardData.name,
            text: `${cardData.title} - Contact Card`,
          });
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            // 공유 취소가 아닌 다른 에러인 경우 다운로드
            downloadImage(dataUrl);
          }
        }
      } else {
        // Web Share API 미지원 시 다운로드
        downloadImage(dataUrl);
      }

      setIsCapturing(false);

      // QR이 원래 숨겨져 있었으면 다시 숨기기
      if (wasQRHidden) {
        setShowQR(false);
      }
    } catch (error) {
      console.error("Failed to capture:", error);
      setIsCapturing(false);
      alert("Failed to create image. Please try again.");
    }
  };

  const downloadImage = (dataUrl: string) => {
    const link = document.createElement("a");
    link.download = `${cardData.name.replace(/\s+/g, "_")}_BusinessCard.png`;
    link.href = dataUrl;
    link.click();
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
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            className="fixed bottom-0 left-0 right-0 z-[101] max-w-lg mx-auto"
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            }}
          >
            {/* Capturable Card Content */}
            <div
              ref={cardRef}
              className="bg-gradient-to-b from-slate-900 to-black border-t border-x border-white/10 rounded-t-[32px] shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="relative h-32 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20">
                {/* Close button - will be hidden in capture */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 transition-all capture-hide"
                >
                  <FiX size={18} />
                </button>

                {/* Floating particles effect */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-white/20 rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animation: `float ${
                          3 + Math.random() * 2
                        }s ease-in-out infinite`,
                        animationDelay: `${Math.random() * 2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Profile Photo */}
              <div className="flex justify-center -mt-16 mb-4 px-6">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-400 via-cyan-400 to-purple-500 p-1">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                      <img
                        src={cardData.photo}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement!.innerHTML = `<span class="text-4xl font-bold text-white">${cardData.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}</span>`;
                        }}
                      />
                    </div>
                  </div>
                  {/* Status indicator */}
                  <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-slate-900" />
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pb-8">
                {/* Name & Title */}
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
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
                    >
                      <div
                        className="text-xl group-hover:scale-110 transition-transform"
                        style={{ color: social.color }}
                      >
                        {social.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-white/60 text-xs">{social.label}</p>
                        <p className="text-white text-sm font-medium">
                          {social.value}
                        </p>
                      </div>
                    </motion.a>
                  ))}
                </div>

                {/* QR Code Toggle - hidden in capture */}
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 text-white font-medium hover:from-blue-500/30 hover:to-purple-500/30 transition-all mb-3 capture-hide"
                >
                  {showQR ? "Hide QR Code" : "Show QR Code"}
                </button>

                {/* QR Code */}
                <AnimatePresence>
                  {showQR && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-3"
                    >
                      <div className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 border border-white/10 flex justify-center">
                        <StyledQR url={cardData.website} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons - hidden in capture */}
                <div className="flex gap-2 capture-hide">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium hover:bg-white/15 transition-all flex items-center justify-center gap-2"
                  >
                    <FiDownload size={16} />
                    vCard
                  </button>
                  <button
                    onClick={captureAndShareImage}
                    disabled={isCapturing}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isCapturing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <FiImage size={16} />
                        Share Image
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Bottom gradient accent */}
              <div className="h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400" />
            </div>

            {/* CSS for animations and hiding elements in capture */}
            <style>{`
              @keyframes float {
                0%, 100% { 
                  transform: translateY(0px) translateX(0px);
                  opacity: 0.3;
                }
                50% { 
                  transform: translateY(-20px) translateX(10px);
                  opacity: 0.6;
                }
              }
            `}</style>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
