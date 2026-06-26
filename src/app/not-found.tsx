import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#0F0E0C", color: "#F5F0E8" }}
    >
      {/* Background watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        aria-hidden
      >
        <span
          className="font-black tracking-tighter"
          style={{ fontSize: "clamp(10rem, 35vw, 32rem)", color: "rgba(245,240,232,0.025)", lineHeight: 1 }}
        >
          404
        </span>
      </div>

      {/* Amber glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(245,158,11,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-8">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-6 h-px" style={{ background: "rgba(245,158,11,0.7)" }} />
          <span className="text-xs font-mono tracking-[0.25em] uppercase" style={{ color: "rgba(245,158,11,0.8)" }}>
            Page Not Found
          </span>
          <span className="w-6 h-px" style={{ background: "rgba(245,158,11,0.7)" }} />
        </div>

        <p className="text-base font-light mb-12" style={{ color: "rgba(245,240,232,0.35)", maxWidth: "28ch" }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link
          href="/"
          className="px-8 py-3.5 rounded-full text-sm font-semibold transition-colors duration-200"
          style={{ background: "#F59E0B", color: "#0F0E0C" }}
        >
          Back to Home
        </Link>
      </div>

      {/* Footer line */}
      <div className="absolute bottom-8 text-xs font-mono" style={{ color: "rgba(245,240,232,0.12)" }}>
        joowonkim.me
      </div>
    </main>
  );
}
