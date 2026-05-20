import ResearchListClient from "@/components/research/ResearchListClient";
import { researchDocs } from "@/lib/research";

export const metadata = {
  title: "Research | Joowon Kim",
  description: "온체인 생태계의 비즈니스 모델과 기술적 진화를 추적하는 실무 리서치",
};

export default function ResearchPage() {
  const docs = researchDocs.map(({ body: _body, ...rest }) => rest);
  return <ResearchListClient docs={docs} />;
}
