import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FiArrowLeft, FiArrowRight, FiClock } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { ReactNode } from "react";

import { researchDocs } from "@/lib/research";
import { extractHeadings, slugifyHeading } from "@/lib/slugify";
import ArticleToc from "@/components/insights/ArticleToc";
import CopyLinkButton from "@/components/insights/CopyLinkButton";

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

function childrenToText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(childrenToText).join("");
  if (children && typeof children === "object" && "props" in children) {
    return childrenToText((children as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function headingWithId(Tag: "h2" | "h3") {
  return function Heading({ children }: { children?: ReactNode }) {
    const id = slugifyHeading(childrenToText(children));
    return <Tag id={id}>{children}</Tag>;
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

  const headings = extractHeadings(post.body);

  const published = researchDocs.filter((doc) => doc.status === "published");
  const index = published.findIndex((doc) => doc.slug === slug);
  const prev = index > 0 ? published[index - 1] : null;
  const next = index >= 0 && index < published.length - 1 ? published[index + 1] : null;

  return (
    <div className="min-h-screen">

      {/* Cover image or gradient header */}
      {post.cover ? (
        <div className="relative w-full" style={{ height: "clamp(280px, 45vh, 520px)" }}>
          <Image src={post.cover} alt={post.title} fill className="object-cover" priority />
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, rgba(244,245,251,0.3) 0%, rgba(244,245,251,0.6) 60%, rgba(244,245,251,1) 100%)",
            }}
          />
          <div className="absolute top-8 left-0 right-0 mx-auto max-w-6xl px-8 lg:px-12">
            <Link href="/insights" className="insight-back inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase">
              <FiArrowLeft size={12} />
              Insights
            </Link>
          </div>
        </div>
      ) : (
        <div className="pt-28" />
      )}

      <div className="mx-auto max-w-6xl px-8 lg:px-12">

        {!post.cover && (
          <Link href="/insights" className="insight-back mb-12 inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase">
            <FiArrowLeft size={12} />
            Insights
          </Link>
        )}

        {/* Post header */}
        <header className="pb-12" style={{ borderBottom: "1px solid rgba(14,13,31,0.07)" }}>
          {/* single mono meta line */}
          <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-mono uppercase tracking-[0.2em]">
            <span className="relative pb-1" style={{ color: "#5b4dff" }}>
              {post.topic}
              <span
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ background: "linear-gradient(90deg, #5b4dff, #14c8eb, #59f0c0)" }}
              />
            </span>
            <span style={{ color: "rgba(14,13,31,0.2)" }}>—</span>
            <span style={{ color: "rgba(14,13,31,0.35)" }}>{post.publishedAt || post.updatedAt || "—"}</span>
            <span style={{ color: "rgba(14,13,31,0.2)" }}>—</span>
            <span className="flex items-center gap-1.5" style={{ color: "rgba(14,13,31,0.35)" }}>
              <FiClock size={10} />
              {post.readingTime}
            </span>
          </div>

          <h1
            className="mb-5 font-black tracking-tight leading-[1.08]"
            style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)", color: "#0e0d1f", maxWidth: "22ch" }}
          >
            {post.title}
          </h1>

          {post.subtitle && (
            <p className="mb-4 text-xl font-light leading-relaxed" style={{ color: "rgba(14,13,31,0.5)", maxWidth: "48ch" }}>
              {post.subtitle}
            </p>
          )}

          <p className="text-base font-light leading-relaxed" style={{ color: "rgba(14,13,31,0.35)", maxWidth: "58ch" }}>
            {post.summary}
          </p>

          <div className="mt-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: "rgba(91,77,255,0.15)", color: "#5b4dff" }}
              >
                J
              </div>
              <span className="text-sm font-medium" style={{ color: "rgba(14,13,31,0.45)" }}>
                {post.author}
              </span>
            </div>
            <CopyLinkButton />
          </div>
        </header>

        {/* Body + sticky TOC */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_220px]">
          <article className="research-markdown max-w-3xl py-14">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{ h2: headingWithId("h2"), h3: headingWithId("h3") }}
            >
              {post.body}
            </ReactMarkdown>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-28 py-14">
              <ArticleToc headings={headings} />
            </div>
          </aside>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="pt-2" style={{ borderTop: "1px solid rgba(14,13,31,0.07)" }}>
            <p className="mb-4 mt-8 text-[10px] font-mono uppercase tracking-widest" style={{ color: "rgba(14,13,31,0.2)" }}>
              Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 text-xs font-mono"
                  style={{ color: "rgba(14,13,31,0.4)", background: "rgba(14,13,31,0.04)", border: "1px solid rgba(14,13,31,0.08)" }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Prev / next navigation */}
        <footer className="grid grid-cols-1 gap-4 pb-24 pt-14 sm:grid-cols-2">
          {prev ? (
            <Link href={`/insights/${prev.slug}`} className="card-iris group flex flex-col gap-3 p-6">
              <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: "rgba(14,13,31,0.3)" }}>
                <FiArrowLeft size={11} className="transition-transform duration-200 group-hover:-translate-x-1" />
                Previous
              </span>
              <span className="font-semibold leading-snug transition-colors duration-200 group-hover:text-[#5b4dff]" style={{ color: "rgba(14,13,31,0.7)" }}>
                {prev.title}
              </span>
            </Link>
          ) : (
            <Link href="/insights" className="group flex flex-col justify-center gap-3 rounded-3xl border border-dashed p-6" style={{ borderColor: "rgba(14,13,31,0.12)" }}>
              <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: "rgba(14,13,31,0.3)" }}>
                <FiArrowLeft size={11} className="transition-transform duration-200 group-hover:-translate-x-1" />
                All insights
              </span>
            </Link>
          )}

          {next ? (
            <Link href={`/insights/${next.slug}`} className="card-iris group flex flex-col items-end gap-3 p-6 text-right">
              <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: "rgba(14,13,31,0.3)" }}>
                Next
                <FiArrowRight size={11} className="transition-transform duration-200 group-hover:translate-x-1" />
              </span>
              <span className="font-semibold leading-snug transition-colors duration-200 group-hover:text-[#5b4dff]" style={{ color: "rgba(14,13,31,0.7)" }}>
                {next.title}
              </span>
            </Link>
          ) : (
            <Link href="/insights" className="group flex flex-col items-end justify-center gap-3 rounded-3xl border border-dashed p-6 text-right" style={{ borderColor: "rgba(14,13,31,0.12)" }}>
              <span className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em]" style={{ color: "rgba(14,13,31,0.3)" }}>
                All insights
                <FiArrowRight size={11} className="transition-transform duration-200 group-hover:translate-x-1" />
              </span>
            </Link>
          )}
        </footer>
      </div>
    </div>
  );
}
