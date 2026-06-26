import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FiArrowLeft, FiClock } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import { researchDocs } from "@/lib/research";

export async function generateStaticParams() {
  return researchDocs.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = researchDocs.find((doc) => doc.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} | Joowon Kim`,
    description: post.summary,
    openGraph: post.cover ? { images: [{ url: post.cover }] } : undefined,
  };
}

export default async function InsightPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = researchDocs.find((doc) => doc.slug === slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen" style={{ background: "#0F0E0C" }}>

      {/* Cover image or gradient header */}
      {post.cover ? (
        <div className="relative w-full" style={{ height: "clamp(280px, 45vh, 520px)" }}>
          <Image
            src={post.cover}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
          {/* Dark overlay gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, rgba(15,14,12,0.3) 0%, rgba(15,14,12,0.6) 60%, rgba(15,14,12,1) 100%)",
            }}
          />
          {/* Back link over image */}
          <div className="absolute top-8 left-0 right-0 mx-auto max-w-4xl px-8 lg:px-12">
            <Link href="/insights" className="insight-back inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase">
              <FiArrowLeft size={12} />
              Insights
            </Link>
          </div>
        </div>
      ) : (
        /* No cover — spacer for header */
        <div className="pt-28" />
      )}

      <div className="mx-auto max-w-4xl px-8 lg:px-12">

        {/* Back link (no cover case) */}
        {!post.cover && (
          <Link href="/insights" className="insight-back inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase mb-12">
            <FiArrowLeft size={12} />
            Insights
          </Link>
        )}

        {/* Post header */}
        <header className={post.cover ? "pt-0 pb-12" : "pb-12"} style={{ borderBottom: "1px solid rgba(245,240,232,0.07)" }}>

          {/* Topic + date row */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span
              className="text-[10px] font-mono tracking-[0.25em] uppercase px-2.5 py-1"
              style={{
                color: "rgba(245,158,11,0.85)",
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.18)",
              }}
            >
              {post.topic}
            </span>
            <span className="text-xs font-mono" style={{ color: "rgba(245,240,232,0.22)" }}>
              {post.publishedAt || post.updatedAt || "—"}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-mono" style={{ color: "rgba(245,240,232,0.22)" }}>
              <FiClock size={10} />
              {post.readingTime}
            </span>
          </div>

          {/* Title */}
          <h1
            className="font-black tracking-tight leading-[1.08] mb-5"
            style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", color: "#F5F0E8" }}
          >
            {post.title}
          </h1>

          {/* Subtitle */}
          {post.subtitle && (
            <p className="text-xl font-light leading-relaxed mb-4" style={{ color: "rgba(245,240,232,0.5)" }}>
              {post.subtitle}
            </p>
          )}

          {/* Summary */}
          <p className="text-base font-light leading-relaxed" style={{ color: "rgba(245,240,232,0.35)", maxWidth: "58ch" }}>
            {post.summary}
          </p>

          {/* Author */}
          <div className="flex items-center gap-3 mt-8">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}
            >
              J
            </div>
            <span className="text-sm font-medium" style={{ color: "rgba(245,240,232,0.45)" }}>
              {post.author}
            </span>
          </div>
        </header>

        {/* Article body */}
        <article className="research-markdown py-14">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
            {post.body}
          </ReactMarkdown>
        </article>

        {/* Tags */}
        {post.tags.length > 0 && (
          <footer className="pb-24 pt-2" style={{ borderTop: "1px solid rgba(245,240,232,0.07)" }}>
            <p className="text-[10px] font-mono tracking-widest uppercase mb-4 mt-8" style={{ color: "rgba(245,240,232,0.2)" }}>
              Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-mono px-3 py-1.5"
                  style={{
                    color: "rgba(245,240,232,0.4)",
                    background: "rgba(245,240,232,0.04)",
                    border: "1px solid rgba(245,240,232,0.08)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Back to list */}
            <div className="mt-14">
              <Link href="/insights" className="insight-back inline-flex items-center gap-2 text-sm font-medium">
                <FiArrowLeft size={13} />
                Back to Insights
              </Link>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
