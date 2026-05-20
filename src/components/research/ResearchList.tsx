"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { FiArrowUpRight, FiClock } from "react-icons/fi";
import { type ResearchStatus } from "@/lib/research";
import type { ResearchDoc } from "@/lib/research";

type ListDoc = Omit<ResearchDoc, "body">;

const statusStyle: Record<ResearchStatus, string> = {
  planned: "bg-white/10 text-white/70 border-white/15",
  draft: "bg-cyan-400/10 text-cyan-200 border-cyan-300/20",
  published: "bg-emerald-400/10 text-emerald-200 border-emerald-300/20",
};

export default function ResearchList({ docs }: { docs: ListDoc[] }) {
  const topics = useMemo(
    () => ["All", ...Array.from(new Set(docs.map((post) => post.topic)))],
    [docs]
  );
  const [activeTopic, setActiveTopic] = useState("All");

  const filteredPosts = useMemo(() => {
    if (activeTopic === "All") return docs;
    return docs.filter((post) => post.topic === activeTopic);
  }, [activeTopic, docs]);

  return (
    <div className="relative overflow-hidden">
      <section
        id="research-overview"
        className="relative mx-auto w-[92%] max-w-6xl pt-32 pb-10 md:pt-40 md:pb-16"
      >
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-xs font-semibold uppercase tracking-[0.25em] text-white/40"
        >
          시장 흐름 리서치
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="max-w-4xl text-[36px] font-semibold leading-[1.1] tracking-tight text-white md:text-[64px]"
        >
          디지털 자산의 새로운 질서를 읽다
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-white/50 md:mt-8 md:text-xl"
        >
          온체인 생태계의 비즈니스 모델과 기술적 진화를 추적하는 실무 리서치
        </motion.p>
      </section>

      <section id="research-pipeline" className="relative mx-auto w-[92%] max-w-6xl pb-20">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => setActiveTopic(topic)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                activeTopic === topic
                  ? "border-cyan-200/40 bg-cyan-300/15 text-white"
                  : "border-white/15 bg-white/[0.03] text-white/70 hover:border-white/30 hover:text-white"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

        <div className="flex flex-col border-t border-white/10">
          {filteredPosts.map((post, index) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group relative flex flex-col items-start gap-4 border-b border-white/10 px-4 py-8 transition-colors hover:bg-white/[0.02] md:flex-row md:items-center md:gap-8 md:px-6 md:py-10"
            >
              <Link
                href={`/research/${post.slug}`}
                className="absolute inset-0 z-10"
                aria-label={`Read ${post.title}`}
              />

              <div className="flex-1 pt-1">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-cyan-200">{post.topic}</span>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span className="text-sm text-white/50">
                    {post.publishedAt || post.updatedAt || "N/A"}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span className="inline-flex items-center gap-1.5 text-sm text-white/50">
                    <FiClock />
                    {post.readingTime}
                  </span>
                </div>

                <h2 className="text-2xl font-semibold leading-snug text-white transition-colors group-hover:text-cyan-100 md:text-[28px] md:leading-tight">
                  {post.title}
                </h2>

                <p className="mt-3 line-clamp-2 text-base leading-relaxed text-white/60 md:max-w-3xl">
                  {post.summary}
                </p>
              </div>

              <div className="relative z-20 mt-2 shrink-0 pointer-events-none md:mt-0 md:pointer-events-auto">
                <span
                  className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider ${statusStyle[post.status]}`}
                >
                  {post.status}
                </span>
                <FiArrowUpRight className="ml-4 hidden h-6 w-6 text-white/30 transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-cyan-300 md:inline-block" />
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
}
