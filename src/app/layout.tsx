import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import Header from "@/components/layout/Header";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://joowonkim.me"),
  title: "Joowon Kim — Full-Stack Developer & Web3 Builder",
  description: "Portfolio of Joowon Kim — Full-Stack Developer & Web3 Builder based in Seoul. Smart contracts, wallets, platforms, SEO/AEO/GEO optimization.",
  keywords: ["Joowon Kim", "Full-Stack Developer", "Web3 Builder", "Solidity", "Next.js", "Seoul", "SEO", "AEO", "GEO"],
  authors: [{ name: "Joowon Kim", url: "https://joowonkim.me" }],
  creator: "Joowon Kim",
  openGraph: {
    title: "Joowon Kim — Full-Stack Developer & Web3 Builder",
    description: "Smart contracts to exchange listings — built solo. Based in Seoul.",
    url: "https://joowonkim.me",
    siteName: "Joowon Kim",
    images: [{ url: "/og-image.png", width: 1800, height: 1000, alt: "Joowon Kim — Full-Stack Developer & Web3 Builder" }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Joowon Kim — Full-Stack Developer & Web3 Builder",
    description: "Smart contracts to exchange listings — built solo. Based in Seoul.",
    images: ["/og-image.png"],
    creator: "@wndnjs0122",
  },
  alternates: {
    canonical: "https://joowonkim.me",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Joowon Kim",
  url: "https://joowonkim.me",
  jobTitle: "Full-Stack Developer & Web3 Builder",
  description: "Full-Stack Developer and Web3 Builder based in Seoul, South Korea. Specializes in smart contracts, wallets, DeFi platforms, and SEO/AEO/GEO optimization.",
  email: "0122wndnjs@gmail.com",
  sameAs: [
    "https://github.com/0122wndnjs",
    "https://t.me/wndnjs0122",
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Seoul",
    addressCountry: "KR",
  },
  knowsAbout: [
    "Web3", "Blockchain", "Solidity", "Smart Contracts",
    "Next.js", "React", "TypeScript", "NestJS",
    "SEO", "AEO", "GEO",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
      </head>
      <body className={`${inter.className} min-h-screen selection:bg-amber-500/20`} style={{ background: "#0F0E0C", color: "#F5F0E8" }}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
