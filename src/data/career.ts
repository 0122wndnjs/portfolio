export interface ProjectItem {
  date?: string;
  name?: string;
  description: string[];
}

export interface Career {
  company: string;
  logo: string;
  period: string;
  mission: string;
  role: string;
  projects: ProjectItem[];
}

export const career: Career[] = [
  {
    company: "UNIDECA",
    logo: "/images/company/unideca.png",
    period: "2025년 5월 - 재직 중",
    mission: "블록체인 프로젝트 총괄 및 웹개발",
    role: "블록체인 과장",
    projects: [
      {
        date: "2025년 7월 - 진행중",
        name: "UNIDECA 및 Hun&Hyun 웹사이트 개발",
        description: [
          "TypeScript 기반의 반응형 웹사이트 2종을 각각 독립적으로 개발 중",
          "UNIDECA는 블록체인 기술 및 컨설팅 전문 기업의 브랜드 사이트로, 기술 중심의 신뢰감 있는 UI/UX 구성에 중점",
          "Hun&Hyun은 병원 마케팅 전문 회사를 위한 사이트로, 시각적 임팩트와 전환율 향상을 위한 사용자 경험 설계 적용",
          "TailwindCSS와 React를 사용해 성능 최적화 및 SEO 친화적 구조 설계",
        ],
      },
      {
        date: "2025년 6월 - 진행중",
        name: "BSC 토큰 개발 및 전용 비수탁형 지갑 개발",
        description: [
          "BSC (Binance Smart Chain) 네트워크 기반의 커스텀 토큰 설계 및 발행",
          "프로젝트의 토크노믹스와 구조를 설명하는 WHITEPAPER 작성",
          "토큰 기반 생태계 구성 및 관련 웹사이트 개발을 위한 기획안 수립",
          "해당 토큰 전용 비수탁형 지갑(Non-Custodial Wallet) 풀스택 개발 및 트랜잭션 관리 기능 구현",
        ],
      },
    ],
  },
  {
    company: "Trillionslab",
    logo: "/images/company/trillionslab.png",
    period: "2021년 8월 - 2024년 9월",
    mission:
      "블록체인 기반 서비스 기획, 기술 문서 작성, 컨설팅, 개발까지 전 과정 리딩. BaaS 컨설팅 및 일반 웹/플랫폼 구축 병행",
    role: "블록체인 선임연구원 및 프로젝트 매니저 (기획, 기술문서, 프론트·백엔드 개발)",
    projects: [
      {
        date: "2024년 3월 - 2024년 9월",
        name: "글로벌 OTT 플랫폼 초기 개발",
        description: [
          "중동 및 동남아 시장을 타겟으로 한 글로벌 OTT 플랫폼 기획 및 초기 개발 참여",
          "Javascript 기반 데모 버전 OTT 클라이언트 단독 개발",
          "프로젝트 소개용 반응형 홈페이지 기획 및 제작: 팀 소개, 서비스 설명, 핵심 기술 강조 등",
          "관련 기술 문서 작성 및 WHITEPAPER 기술적 검토/수정 참여",
        ],
      },
      {
        date: "2023년 11월 - 2024년 2월",
        name: "PIG (Premium Investment Group) 웹 기반 투자 플랫폼 개발",
        description: [
          "Javascript 기반 웹 투자 플랫폼 기획 및 단독 개발",
          "투자자는 다양한 투자 상품 정보를 확인하고, 관심 표현 기능을 통해 참여 의사 전달 가능",
          "관리자는 어드민 페이지에서 투자 상품 등록, 투자자 관심 내역 열람 및 관리 기능 제공",
          "UX/UI 기획, 전체 디자인, 프론트엔드 개발까지 전 과정 단독 수행",
        ],
      },
      {
        date: "2023년 10월",
        name: "RUIENM 엔터테인먼트 웹사이트 개발 및 유지보수",
        description: [
          "일본 밴드 내한 공연을 주최하는 엔터테인먼트 회사를 위한 포트폴리오 기반 웹사이트 개발",
          "Javascript 기반 원페이지 스크롤 사이트 설계 및 구축",
          "진행 및 예정 공연의 포스터·상세 정보·공연 후 사진 갤러리 등 공연 중심 콘텐츠 구조 설계",
          "공연 종료 후 사진 업데이트 및 유지보수 등 지속 관리 중",
        ],
      },
      {
        date: "2023년 4월 - 2023년 8월",
        name: "NFT dApp 개발",
        description: [
          "Ethereum 기반 NFT 발행 및 관리용 dApp 개발",
          "스마트컨트랙트를 통한 문서 및 트랜잭션 기록의 ERC-721 NFT 자동 발행",
          "IPFS 기반 Metadata 저장 및 Token URI 연동, 이벤트 로그 추적 기능 구현",
          "Metamask 연동을 통해 지갑 내 NFT 확인 및 사용자별 NFT 정보 조회 기능 개발",
          "거래 데이터 정확성을 보장하는 스마트컨트랙트 내 검증 매커니즘 추가",
          "후속 작업으로 ERC-1155 기반 멀티토큰 버전까지 개발 (비공개 내부 프로젝트)",
        ],
      },
      {
        date: "2022년 5월 - 2023년 6월",
        name: "emetalexchange 플랫폼 개발",
        description: [
          "정부지원 디딤돌 사업 과제로 수행된 온라인 비철금속 경매/역경매 플랫폼 개발 프로젝트",
          "Ethereum 기반 스마트컨트랙트를 통한 금속 거래 자동화 및 온체인 기록 시스템 설계 및 구현",
          "Etherscan API 연동 및 프론트엔드와 블록체인 연동 전반을 단독 수행",
          "연구개발노트, 기술 문서, 최종보고서 등 정부사업 관련 공식 문서 작성 전담",
          "국가공인 테스트 기관(ONYCOM)을 통한 기능 및 보안 테스트 의뢰 및 대응 주도",
        ],
      },
      {
        date: "2022년 4월 - 2022년 12월",
        name: "2022 글로벌 창업사관학교 프로그램 참여",
        description: [
          "회사 내 블록체인 지갑 프로젝트를 기반으로 본 창업지원 프로그램에 참여",
          "Ethereum 기반 비수탁형 지갑 서비스 데모 버전 기획 및 개발",
          "AWS 클라우드 인프라 과정 등 다양한 기술 교육 프로그램 수료",
          "스타트업 글로벌 진출 전략, 비즈니스 모델 고도화 관련 워크숍 및 멘토링 참여",
        ],
      },
      {
        date: "2021년 8월 - 2022년 12월",
        name: "BlockApps BaaS 한국 로컬라이징 협업",
        description: [
          "미국 BaaS 솔루션 기업 BlockApps와의 협업을 통해 한국 시장 진출을 위한 기술 컨설팅 및 마케팅 진행",
          "국내 전용 홈페이지 개발 및 서비스 소개 자료 번역/현지화",
          "기술 블로그 콘텐츠 작성 및 발표 자료 제작 (https://blog.naver.com/trillionslab)",
          "세미나 및 기술 회의 참여, 마케팅 및 세일즈를 위한 기술 자료 제작 전반에 참여",
        ],
      },
    ],
  },
  {
    company: "Delta Dental of Michigan",
    logo: "/images/company/deltadental.jpg",
    period: "2020년 2월 - 2021년 2월",
    mission: "Java 백엔드 개발",
    role: "Java 백엔드 개발자",
    projects: [
      {
        date: "2020년 2월 - 2021년 2월",
        name: "치과 보험 관리 시스템 API 개발",
        description: [
          "미국 Delta Dental Michigan 소속 개발팀에서 Java Spring Boot 기반 백엔드 API 개발자로 참여",
          "치과 보험 관리 시스템 관련 내부 API 개발 및 문서화 진행",
          "보험 데이터 기반 통계 분석 및 내부 보고용 지표 처리 기능 구현",
          "Bitbucket을 통한 협업 및 코드 관리, 정기적인 팀 스탠드업 미팅 참여",
        ],
      },
    ],
  },
  {
    company: "Apolis",
    logo: "/images/company/apolis.jpg",
    period: "2019년 8월 - 2020년 1월",
    mission:
      "Spring 기반 마이크로서비스 아키텍처 및 웹 서비스 구조 학습 및 실습",
    role: "Java 백엔드 개발 인턴",
    projects: [
      {
        date: "2019년 8월 - 2020년 1월",
        name: "Hotel Management 시스템 데모 프로젝트",
        description: [
          "Spring 및 Spring Boot 기반 마이크로서비스 아키텍처 학습 및 연습 프로젝트 수행",
          "호텔 예약 관리 시스템 백엔드 API 설계 및 구현",
          "간단한 UI 개발 및 프론트엔드 연동 실습 경험",
          "JUnit을 활용한 유닛 테스트 작성 연습",
          "RESTful 웹 서비스 구축 및 서비스 간 통신에 대한 실습 중심의 학습 진행",
        ],
      },
    ],
  },
];
