import { researchDocs } from "@/lib/research";
import InsightsClient from "@/components/insights/InsightsClient";

export const metadata = {
  title: "Insights | Joowon Kim",
  description: "Thoughts on Web3, development, and the internet.",
};

export default function InsightsPage() {
  const posts = researchDocs.filter((doc) => doc.status === "published");

  return <InsightsClient posts={posts} />;
}
