import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Joowon Kim",
  description: "Portfolio of Joowon Kim — Blockchain & Web3 Engineer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-black text-white min-h-screen">
        <Header />
        {children}
      </body>
    </html>
  );
}
