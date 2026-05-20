"use client";

import dynamic from "next/dynamic";

import type { ResearchDoc } from "@/lib/research";

type ListDoc = Omit<ResearchDoc, "body">;

const ResearchList = dynamic(() => import("./ResearchList"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <span className="text-white/30 text-sm">Loading...</span>
    </div>
  ),
});

export default function ResearchListClient({ docs }: { docs: ListDoc[] }) {
  return <ResearchList docs={docs} />;
}
