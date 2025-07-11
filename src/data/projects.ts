export type ProjectType = "Frontend" | "Backend" | "Fullstack" | "SmartContract";

export interface Project {
  title: string;
  image: string;
  techStack: string[];
  role: string;
  type: ProjectType;
  description: string;
  demo: string;
  details?: string[];
}

export const projects: Project[] = [
  {
    title: "HexaGroup Corporate Website",
    image: "/images/projects/hexagroup.png",
    techStack: ["React", "Javascript", "TailwindCSS"],
    role: "프론트엔드 전체 개발 및 반응형 UI 구성, 유지 보수",
    type: "Frontend",
    description:
      "기업 소개, 팀 구성, 프로젝트 등으로 구성된 정적 웹사이트를 React 기반으로 구축하고, 반응형 디자인과 SEO 최적화 적용.",
    demo: "https://hexagroup.ai",
    details: [
      "React 기반 SSR 및 정적 페이지 병행",
      "SEO 최적화 적용",
      "반응형 웹 디자인 적용",
      "웹 접근성 준수",
    ],
  },
  {
    title: "Ruienm Website",
    image: "/images/projects/ruienm.png",
    techStack: ["React", "Javascript", "TailwindCSS"],
    role: "전체 페이지 설계 및 퍼블리싱, 이미지 최적화 및 반응형 처리",
    type: "Frontend",
    description:
      "일본 밴드 내한 공연을 주최하는 엔터테인먼트 기업 웹사이트로, 공연 정보 및 회사 소개 중심의 정적 페이지를 설계 및 구축. 다양한 디바이스에서 시각적 일관성을 유지하도록 최적화.",
    demo: "https://ruienm.com",
    details: [
      "React SPA 개발",
      "TailwindCSS 기반 커스텀 디자인",
      "이미지 최적화 및 lazy loading 구현",
      "반응형 레이아웃 설계",
    ],
  },
  {
    title: "Non-Custodial Wallet",
    image: "/images/projects/wallet.png",
    techStack: ["Solidity", "React", "TypeScript", "NestJS", "PostgreSQL"],
    role: "풀스택 지갑 개발 (지갑 UI, 스마트 컨트랙트, 백엔드 기록 및 인증 시스템)",
    type: "Fullstack",
    description:
      "EVM(Ethereum Virtual Machin)계열의 비수탁형 지갑으로, 모든 EVM기반 토큰과의 연동 가능한 안전한 토큰 지갑 설계 및 구축. 외부 지갑과의 연동도 지원하며 니모닉키 및 프라이빗 키로 보안 강화",
    demo: "",
    details: [
      "Solidity 스마트 컨트랙트 개발 및 배포",
      "Typescript 기반 지갑 UI 구현",
      "NestJS 백엔드 서버 구축",
      "PostgreSQL 트랜잭션 데이터 관리",
      "Etherscan API 연동으로 투명한 온체인 기록 관리",
      "On/Off-Chain 거래 모두 지원되는 하이브리드형 지갑",
      "모든 EVM 계열의 토큰 및 외부 EVM 지갑과의 연동 가능",
      "별도의 관리자 페이지에서 모든 트랜잭션 및 회원 정보 관리"
    ],
  },
];
