import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono, Noto_Serif_KR } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import Header from "@/components/layout/Header";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600", "700"] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "600"] });
const notoSerifKr = Noto_Serif_KR({ subsets: ["latin"], variable: "--font-serif", weight: ["400", "600"] });

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
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/android-icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon-57x57.png", sizes: "57x57", type: "image/png" },
      { url: "/apple-icon-60x60.png", sizes: "60x60", type: "image/png" },
      { url: "/apple-icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/apple-icon-76x76.png", sizes: "76x76", type: "image/png" },
      { url: "/apple-icon-114x114.png", sizes: "114x114", type: "image/png" },
      { url: "/apple-icon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/apple-icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/apple-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/apple-icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: {
    other: {
      "naver-site-verification": "3a442c67efc36bb5692ed20d0a1957b320af0ac6",
    },
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
      <body className={`${inter.className} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${notoSerifKr.variable} min-h-screen`} style={{ background: "transparent", color: "#0e0d1f" }}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
