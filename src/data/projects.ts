export type ProjectType =
  | "Frontend"
  | "Backend"
  | "Fullstack"
  | "SmartContract"
  | "Others";

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
    image: "/images/projects/hexa_main.png",
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
    image: "/images/projects/rui_main.png",
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
    image: "",
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
      "별도의 관리자 페이지에서 모든 트랜잭션 및 회원 정보 관리",
    ],
  },
  {
    title: "내부 시스템 API 개발 및 관리",
    image: "",
    techStack: ["Java", "Spring Boot"],
    role: "사내 시스템 백엔드 API 개발 및 유지보수 담당",
    type: "Backend",
    description:
      "보험사 내부 운영시스템을 위한 API 서버를 설계 및 구현하고, 신규 요구사항에 따라 지속적으로 개선 및 유지보수",
    demo: "",
    details: [
      "Spring Boot 기반 내부 운영시스템용 RESTful API 설계 및 개발",
      "Swagger를 통한 API 문서 자동화 및 프론트엔드 협업 지원",
      "기존 코드 리팩토링 및 예외 처리, 응답 표준화 수행",
      "CI/CD 파이프라인 구축으로 배포 자동화",
    ],
  },
  {
    title: "BSC (Binance Smart Chain) 토큰 개발",
    image: "",
    techStack: ["Solidity"],
    role: "Solidty 기반 BSC 토큰 스마트 컨트랙트 개발 및 배포",
    type: "SmartContract",
    description:
      "BSC(Binance Smart Chain) 기반의 ERC20 토큰 스마트 컨트랙트를 설계 및 구현하고, 배포 후 dApp과의 연동",
    demo: "",
    details: [
      "Solidity 기반 BSC 토큰 스마트 컨트랙트 개발",
      "토큰 배포 및 초기 유통량 설정",
      "토큰 전송 및 승인 기능 구현",
      "Etherscan을 통한 배포 기록 관리",
    ],
  },
  {
    title: "OTT 플랫폼 프로젝트 MVP 모델 개발",
    image: "/images/projects/ott_main.png",
    techStack: ["Javascript", "React", "Node.js", "MongoDB"],
    role: "풀스택 사이트 개발 (프론트엔드, 백엔드, 데이터베이스)",
    type: "Fullstack",
    description:
      "OTT(Over The Top) 플랫폼의 MVP(Minimum Viable Product) 모델을 개발하여, 콘텐츠 스트리밍 및 사용자 관리 기능을 제공하는 웹 애플리케이션 구축",
    demo: "",
    details: [
      "React 기반 프론트엔드 개발",
      "Node.js와 Express를 이용한 RESTful API 서버 구축",
      "MongoDB를 이용한 사용자 및 콘텐츠 데이터 관리",
      "반응형 UI 설계 및 사용자 경험 최적화",
      "Group Watch 기능을 통한 실시간 스트리밍 및 채팅 기능 구현 (미완성)",
    ],
  },
  {
    title: "PIG (Premium Investors Group) 플랫폼 개발",
    image: "/images/projects/pig_main.png",
    techStack: ["Javascript", "React", "Node.js", "MongoDB"],
    role: "풀스택 사이트 개발 (프론트엔드, 백엔드, 데이터베이스)",
    type: "Fullstack",
    description:
      "PIG (Premium Investors Group) 플랫폼은 투자자들을 위한 커뮤니티 플랫폼으로, 투자 정보 및 투자 의향 공유를 위한 웹 애플리케이션 개발",
    demo: "",
    details: [
      "React 기반 프론트엔드 개발",
      "Node.js와 Express를 이용한 RESTful API 서버 구축",
      "MongoDB를 이용한 사용자 및 투자 정보 데이터 관리",
      "투자 의향 공유 및 커뮤니티 기능 구현",
      "별도의 관리자 페이지에서 사용자 관리 및 투자 정보 모니터링",
      "반응형 UI 설계 및 사용자 경험 최적화",
    ],
  },
  {
    title: "BSC (Binanace Smart Chain) 기반 토큰 백서 작성",
    image: "/images/projects/whitepaper.png",
    techStack: ["Web3", "Blockchain", "Whitepaper"],
    role: "커스텀 토큰 백서 작성",
    type: "Others",
    description:
      "BSC (Binance Smart Chain) 기반의 커스텀 토큰 백서 작성 (프로젝트 소개, 토큰 이코노미, 기술적 세부사항 등 포함)",
    demo: "",
    details: [
      "백서 작성 및 기술적 세부사항 정리",
      "토큰 이코노미 및 유통 계획 수립",
      "듀얼 토큰 모델 및 게임 구조 흐름도 작성",
      "토큰 발행량, 락업 정책, 수익 모델 등 토크노믹스 구성 기획",
      "디자인팀과 협업하여 시각 자료 제작 지원",
    ],
  },
  {
    title: "NFT Document Management System",
    image: "/images/projects/nft_main.png",
    techStack: ["Solidity", "Javascript", "React"],
    role: "NFT dApp 개발 (Smart Contract, Frontend)",
    type: "SmartContract",
    description:
      "NFT 기반의 문서 관리 시스템으로, 문서의 소유권과 변경 이력을 블록체인에 기록하여 투명성과 신뢰성을 제공하는 dApp 개발",
    demo: "",
    details: [
      "Solidity 기반 NFT 스마트 컨트랙트 개발",
      "React를 이용한 사용자 인터페이스 구현",
      "문서 업로드 및 소유권 이전 기능 구현",
      "문서 변경 이력 추적 및 블록체인 기록 관리",
      "Metamask와 연동하여 사용자 인증 및 트랜잭션 처리",
      "IPFS를 이용한 문서 저장 및 메타데이터 관리",
    ],
  },
  {
    title: "eMetalexchange 플랫폼 개발",
    image: "",
    techStack: ["Solidity"],
    role: "eMetalexchange 플랫폼 Smart Contract 개발",
    type: "SmartContract",
    description:
      "eMetalexchange 플랫폼의 스마트 컨트랙트 개발로, 비철금속 경매 및 역경매 기능 제공하는 dApp 개발",
    demo: "/files/emetal_dev.pdf",
    details: [
      "Solidity 기반 스마트 컨트랙트 개발",
      "경매 및 역경매 로직 구현",
      "사용자 인증 및 거래 기록 관리",
      "Metamask와 연동하여 트랜잭션 처리",
      "스마트 컨트랙트 테스트 및 배포",
    ],
  },
];
