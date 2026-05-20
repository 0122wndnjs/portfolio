import Link from "next/link";
import { FiArrowLeft, FiCalendar, FiClock } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import { type ResearchDoc } from "@/lib/research";

export default function ResearchPost({ post }: { post: ResearchDoc }) {
  return (
    <div className="relative overflow-hidden pt-28 pb-20">
      <div className="pointer-events-none absolute left-0 top-10 h-[340px] w-[340px] rounded-full bg-cyan-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-24 h-[320px] w-[320px] rounded-full bg-blue-600/20 blur-[120px]" />

      <section className="relative mx-auto w-[92%] pt-8 md:max-w-3xl lg:max-w-4xl">
        <Link
          href="/research"
          className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to Research
        </Link>

        <header className="mb-14 md:mb-20">
          <p className="mb-4 text-sm font-semibold tracking-wide text-cyan-300">{post.topic}</p>
          <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[56px] lg:leading-[1.1]">
            {post.title}
          </h1>
          {post.subtitle ? (
            <p className="mt-4 text-xl font-medium leading-relaxed text-white/75 md:text-2xl">
              {post.subtitle}
            </p>
          ) : null}
          <p className="mt-6 text-lg leading-relaxed text-white/60 md:text-xl">{post.summary}</p>

          <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6 text-[13px] font-medium text-white/50 md:text-sm">
            <span className="flex items-center gap-1.5">
              <FiCalendar className="text-white/40" />
              {post.publishedAt || post.updatedAt || "N/A"}
            </span>
            <span className="flex items-center gap-1.5">
              <FiClock className="text-white/40" />
              {post.readingTime}
            </span>
            <span className="flex items-center gap-1.5">
              <span>By</span>
              <span className="text-white/80">{post.author}</span>
            </span>
            <span className="ml-auto hidden rounded-full border border-white/20 bg-white/5 px-3 py-1 uppercase tracking-wider text-white/80 md:inline-flex">
              {post.status}
            </span>
          </div>
        </header>

        <article className="research-markdown text-[17px] leading-[1.8] text-white/80 md:text-lg">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
            {post.body}
          </ReactMarkdown>
        </article>

        {post.tags.length > 0 && (
          <footer className="mt-20 border-t border-white/10 pb-12 pt-10">
            <p className="mb-4 text-sm font-medium text-white/40">Tagged with</p>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          </footer>
        )}
      </section>
    </div>
  );
}
