import ResearchPost from "@/components/research/ResearchPost";
import { researchDocs } from "@/lib/research";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return researchDocs.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = researchDocs.find((doc) => doc.slug === slug);
  if (!post) return {};
  return {
    title: `${post.title} | Joowon Kim`,
    description: post.summary,
  };
}

export default async function ResearchPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = researchDocs.find((doc) => doc.slug === slug);
  if (!post) notFound();
  return <ResearchPost post={post} />;
}
