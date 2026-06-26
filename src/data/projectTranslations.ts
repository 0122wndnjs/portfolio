export type ProjectTranslation = {
  role: string;
  desc: string;
  tasks: string[];
  impact: string[];
  features?: string[];
};

export const projectTranslationsEn: Record<number, ProjectTranslation> = {
  1: {
    role: "Smart contract development and token deployment on ETH / BSC / SOL / XLM",
    desc: "Multi-chain token smart contract development and deployment across EVM, Solana, and Stellar networks.",
    tasks: [
      "Designed gas-optimized ERC-20 smart contracts in Solidity with secure token issuance and custom business logic for EVM environments.",
      "Developed Solana on-chain programs using Rust and Anchor framework with SPL-Token standard for custom token minting and asset management.",
      "Designed and implemented Stellar Soroban smart contracts using Rust SDK for secure balance management and cross-border payment-integrated token logic.",
      "Customized minting, balance management, asset control, and ownership structures per project's specific requirements.",
    ],
    impact: [
      "Applied multi-chain token issuance and smart contract experience across 10+ Web3 projects.",
      "Built token infrastructure tailored to each project's chain environment across EVM, Solana, and Stellar.",
      "Delivered technical documentation for wallets, dApps, exchange listings, and whitepaper/tokenomics after each deployment.",
    ],
  },
  2: {
    role: "Whitepaper structure design, tokenomics documentation, lockup/vesting policy writing, GitBook/PDF production",
    desc: "Planned and documented whitepapers, tokenomics, lockup/vesting schedules, roadmaps, and token utility materials for multiple Web3 projects.",
    tasks: [
      "Designed whitepaper structure and narrative flow based on project vision, service architecture, token utility, ecosystem participants, and revenue model.",
      "Organized core tokenomics — total supply, distribution ratios, lockup, cliff, vesting, initial circulation — to meet exchange and investor submission standards.",
      "Documented allocation structures and release policies for sales, marketing, foundation, team, liquidity, and ecosystem pools.",
      "Reformatted consistent token information across GitBook, PDF, PPTX, and pitch decks for each submission channel.",
      "Prepared source structures and translation standards for multilingual materials in English, Chinese, Japanese, Vietnamese, and Thai.",
    ],
    impact: [
      "Systematized whitepapers, tokenomics, and lockup/vesting data for multiple Web3 projects into formats ready for exchange submissions and investor communication.",
      "Established multilingual documentation infrastructure to improve response speed and consistency with global exchanges, partners, and communities.",
    ],
  },
  3: {
    role: "Exchange listing form preparation, English communication with listing teams, project material coordination, and schedule management",
    desc: "Supported global exchange listing preparation, document submission, review responses, and ongoing communication for multiple Web3 projects.",
    tasks: [
      "Completed global exchange listing application forms and organized required submissions including project overview, token info, team details, roadmap, community links, and technical docs.",
      "Communicated in English with exchange listing teams and partners to coordinate additional requests, clarifications, scheduling, and submission formats.",
      "Collected and organized per-project listing review materials: website, whitepaper, GitBook, tokenomics, logos, community links, and contract information.",
      "Reformatted project introductions, token data, marketing materials, and technical documentation to meet each exchange's specific requirements.",
    ],
    impact: [
      "Supported global exchange listing preparation and document organization for 9+ Web3 projects.",
      "Improved listing review speed and accuracy by systematizing exchange-specific forms, token info, project materials, brand assets, and community data.",
      "Managed the full listing process through English-based exchange communication: additional requests, clarifications, and schedule coordination.",
    ],
  },
  4: {
    role: "NFT smart contract development and dApp frontend implementation",
    desc: "Document management dApp MVP with NFT-based document issuance, ownership transfer, and on-chain history tracking.",
    tasks: [
      "Developed Solidity-based NFT smart contracts for document issuance and ownership management.",
      "Built a React-based user interface with document upload and NFT issuance flow.",
      "Implemented MetaMask wallet connection, transaction requests, and on-chain data queries using Ethers.js.",
      "Designed document file and metadata storage architecture using IPFS.",
      "Implemented document ownership transfer and on-chain document history tracking.",
    ],
    impact: [
      "Extended NFT beyond image assets to document authentication and ownership management in a functional dApp MVP.",
      "Gained full-stack Web3 experience connecting smart contracts, IPFS, wallet integration, and frontend.",
    ],
  },
  5: {
    role: "Smart contract development and Web3 integration",
    desc: "Smart contract-based Web3 platform for non-ferrous metal auction and reverse auction trading.",
    tasks: [
      "Developed Solidity-based smart contracts implementing non-ferrous metal auction and reverse auction trading logic.",
      "Designed auction registration, bidding, settlement, and transaction processing logic within the smart contract architecture.",
      "Connected React frontend with Web3.js for blockchain transaction requests and on-chain result queries.",
      "Configured user authentication and transaction signing flow via MetaMask wallet integration.",
    ],
    impact: [
      "Led smart contract development for a non-ferrous metal trading platform deployed in production.",
      "Gained real-service Web3 development experience connecting smart contracts, React, MetaMask, and Web3.js.",
    ],
  },
  6: {
    role: "Korea market entry support, local page creation, STRATO technical documentation, and overseas partner communication",
    desc: "Website creation, technical documentation, and partner communication support to introduce BlockApps' STRATO BaaS solution to the Korean market.",
    tasks: [
      "Created a Korea-dedicated introduction page and content for US BaaS company BlockApps' Korean market entry.",
      "Organized and localized technical materials introducing BlockApps' STRATO blockchain solution to the Korean market.",
      "Communicated in English with overseas partners to summarize solution architecture, applicability, and business materials.",
    ],
    impact: [
      "Gained practical understanding of BaaS and enterprise blockchain through this first real-world blockchain project.",
      "Built English-based technical communication experience through partner collaboration with a US Web3/BaaS company.",
    ],
  },
  7: {
    role: "Main website and service plan guide site development for a Web3 specialist company",
    desc: "Developed the official website for UNIDECA, a Web3 specialist company, and a client-facing service plan guide site.",
    tasks: [
      "Developed the official main website introducing UNIDECA's brand, business areas, and service structure.",
      "Implemented responsive UI with React and TailwindCSS and applied interactions and animations using Framer Motion.",
      "Set up Cloudflare-based deployment for fast static site delivery and stable service operation.",
      "Separately developed services.unideca.com for clients to explore service plans, marketing products, and Web3 support scope.",
      "Implemented a service recommendation algorithm allowing clients to determine suitable packages based on their project details.",
    ],
    impact: [
      "Built the official digital channel communicating UNIDECA's Web3 expertise, marketing, listing, and technical support services.",
      "Created services.unideca.com as a guided website where clients can directly explore service plans tailored to their project stage.",
    ],
  },
  8: {
    role: "Hospital marketing agency website renewal with SEO/AEO/GEO-focused content architecture improvements",
    desc: "Renewed a PHP-based hospital marketing agency website in React with an SEO/AEO/GEO-optimized service content structure.",
    tasks: [
      "Renewed the existing PHP-based site into a modern responsive website using React and TailwindCSS.",
      "Applied smooth interactions and animations using Framer Motion suited to a hospital marketing agency.",
      "Restructured hospital marketing service pages from SEO, AEO, and GEO perspectives into a search-friendly content architecture.",
      "Organized key keywords, page structure, meta information, and on-page elements per service for better search and AI search readiness.",
    ],
    impact: [
      "Migrated from PHP to React architecture, improving maintainability and scalability.",
      "Achieved near-perfect Technical SEO and On-page SEO scores with strong AEO/GEO performance.",
    ],
  },
  9: {
    role: "Official introduction page development during project preparation phase",
    desc: "Official HexaGroup introduction website built primarily around video content during the Aladdin project preparation phase.",
    tasks: [
      "Developed an official homepage for external introduction during the project preparation phase.",
      "Implemented a responsive introduction page UI using React and TailwindCSS.",
      "Organized page structure around project introduction, brand messaging, and video content.",
    ],
    impact: [
      "Built an official introduction channel for the Aladdin project preparation phase.",
      "Organized visual-heavy project introduction materials into a shareable web format for brand communication.",
    ],
  },
  10: {
    role: "Entertainment company official website development with performance content update structure",
    desc: "Official website for an entertainment company producing Japanese band concerts in Korea, organized around concert posters, videos, and photo content.",
    tasks: [
      "Developed the official website for an entertainment company producing Japanese band concerts in Korea.",
      "Implemented responsive UI with React and TailwindCSS to showcase concert info, posters, videos, and photos.",
      "Designed a content structure to feature posters and concert info pre-show, then update with concert footage and photos post-show.",
    ],
    impact: [
      "Built an entertainment website supporting both concert promotion and post-show content archiving.",
      "Gained experience building visual-heavy brand and concert introduction pages centered on posters, videos, and photos.",
    ],
  },
  11: {
    role: "Official multilingual website development for an education foundation token project",
    desc: "Official multilingual website introducing the whitepaper, key messages, utility, vision, tokenomics, and roadmap of an education foundation token project.",
    tasks: [
      "Developed the official website for an education foundation's token project.",
      "Built key message, vision, utility, tokenomics, and roadmap sections using React and TailwindCSS.",
      "Structured website content from whitepaper and project documents into an investor- and community-friendly introduction.",
      "Implemented multilingual support for global users and overseas partners.",
    ],
    impact: [
      "Built an official digital channel communicating the token project's vision, utility, tokenomics, and roadmap externally.",
      "Established multilingual communication infrastructure for domestic and global users, exchanges, and partners.",
    ],
  },
  12: {
    role: "Official multilingual website development for a beauty industry integrated ecosystem token project",
    desc: "Official multilingual website covering the introduction, distribution structure, utility, architecture, and roadmap of a beauty ecosystem token from a beauty-related foundation.",
    tasks: [
      "Developed the official website for a beauty-related foundation's integrated beauty industry ecosystem token project.",
      "Built project introduction, token info, distribution structure, utility, architecture, and roadmap sections using React and TailwindCSS.",
      "Designed content flow and page structure to make the token ecosystem and beauty industry use cases easy to understand.",
      "Implemented multilingual support for global users and overseas partners.",
    ],
    impact: [
      "Built an official digital channel introducing the beauty token project's vision, utility, token distribution, and roadmap.",
      "Established multilingual communication infrastructure for domestic and global users and partners.",
    ],
  },
  13: {
    role: "Official introduction page development for a bio-sector token project",
    desc: "Official one-page website created to introduce the bio-sector extension token of an already-listed token project.",
    tasks: [
      "Developed an official one-page website for a bio-sector token project.",
      "Organized the page around project overview, token description, vision, and use cases using React and TailwindCSS.",
      "Applied smooth section transitions and content animations using Framer Motion.",
      "Designed a concise introduction page for investors, partners, and community to quickly grasp the project's purpose and token structure.",
    ],
    impact: [
      "Built an official digital channel introducing the bio-sector extension of an existing listed token project.",
      "Presented the bio-sector token's purpose, vision, and use cases in a concise one-page format.",
    ],
  },
  14: {
    role: "Main introduction page development for an RWA investment platform and initial dApp structure design",
    desc: "Official main page built around RWA investment platform introduction, expanding into a dApp platform with wallet connection, DAO, and staking features.",
    tasks: [
      "Developed the official main page introducing the RWA investment platform's project overview, vision, investment structure, and ecosystem direction.",
      "Built responsive website UI suited to an RWA project using React and TailwindCSS.",
      "Designed architecture to allow expansion from an introductory landing page to a full dApp platform.",
      "Planned initial frontend structure considering future wallet connection, DAO, and staking feature expansion.",
    ],
    impact: [
      "Built an official digital channel communicating the RWA investment platform's vision, business structure, and Web3 ecosystem direction.",
      "Laid the foundation for expanding from a simple introduction site to a full dApp platform with wallet, DAO, and staking features.",
    ],
  },
  15: {
    role: "Dedicated digital wallet and admin system development for a beauty foundation token project",
    desc: "Digital wallet platform for a beauty foundation token project featuring token purchase, staking, lockup, promotions, referrals, airdrops, deposits/withdrawals, and admin management.",
    tasks: [
      "Designed the BSC-based token project wallet architecture and developed frontend/backend features.",
      "Implemented core token operations: purchase, staking, lockup, promotions, referrals, and airdrops.",
      "Built a custom admin panel for managing users, balances, purchases, withdrawals, promotions, airdrops, and referral data.",
      "Integrated CMC API for real-time BNB price feeds and TradingView for price chart visualization.",
      "Implemented Google OTP two-factor authentication for withdrawals and other security-sensitive actions.",
    ],
    features: [
      "Wallet: user balance management, BSC-based token operations, internal balance and external withdrawal flows",
      "Deposits/Withdrawals: internal transfers, external wallet withdrawals, withdrawal request/approval flow, Google OTP security",
      "Referrals/Agency: referral-based user acquisition and reward structure",
      "Admin: user, balance, purchase/withdrawal, promotion, airdrop, and referral management",
    ],
    impact: [
      "Built a unified platform combining user wallet, admin system, and token operations for a beauty foundation token project.",
      "Implemented purchase, lockup, staking, promotions, referrals, and airdrops in a digital wallet structure for full token project operations.",
    ],
  },
  16: {
    role: "Dedicated digital wallet, admin system, and token operations for an education foundation token project",
    desc: "Digital wallet platform for an education foundation token project with token purchase, lockup, referrals, internal transfers, external withdrawals, staking, real-time price feeds, and admin management.",
    tasks: [
      "Developed frontend, operation features, and admin panel for an education foundation token project's digital wallet platform.",
      "Implemented core features: token purchase, lockup, referrals, internal transfers, external withdrawals, and staking.",
      "Integrated Ourbit price feeds and TradingView charts for real-time price monitoring and chart viewing.",
      "Integrated BscScan API to display on-chain transaction history directly within the wallet.",
      "Implemented real-time Telegram Bot notifications for deposits, purchases, withdrawals, and operational events.",
      "Enhanced security with Passkey biometric authentication and Google OTP two-factor authentication for key actions.",
      "Built automated cron jobs for price updates, settlement calculations, and status changes.",
      "Developed admin panel features for users, purchases, lockup, withdrawals, referrals, promotion codes, and commission ratios.",
    ],
    features: [
      "Token Purchase: user purchase requests, purchase history, admin approval-based processing",
      "Withdrawals: USDT and project token external withdrawals, request/approval flow",
      "Lockup/Vesting: purchased token lockup structure and release condition management",
      "Staking: token staking feature and yield structure management",
      "Referral Commission: referral structure, binary tree visualization, rewards and commission ratio settings",
      "Security: Passkey biometrics, Google OTP two-factor authentication",
      "Price/Charts: Ourbit real-time price feeds, TradingView charts",
      "Notifications: Telegram Bot real-time alerts, web notifications",
    ],
    impact: [
      "Built a live wallet platform serving ~200 users and ~$50K in cumulative revenue.",
      "Strengthened security for external withdrawals and key actions with Passkey, Google OTP, and admin approval flows.",
      "Enabled admin management of the full referral structure through binary tree visualization and commission ratio settings.",
    ],
  },
  17: {
    role: "UNIDECA demo wallet platform development with on-chain wallet and token operation features",
    desc: "UNIDECA's demo wallet platform generating real EVM wallets and mnemonic keys at signup, supporting purchase, lockup, vesting, staking, internal transfers, external withdrawals, and referrals.",
    tasks: [
      "Developed UNIDECA's demo wallet platform at wallet.unideca.com.",
      "Implemented a wallet creation flow generating real EVM wallet addresses and mnemonic keys at signup.",
      "Implemented token purchase, lockup, vesting, staking, internal transfers, and external withdrawals.",
      "Integrated CMC API and TradingView for real-time price feeds and chart visualization.",
      "Implemented referral structure, commission ratio settings, and binary tree visualization.",
      "Applied dark/light mode, multilingual support, Passkey biometrics, and Google OTP two-factor authentication.",
    ],
    features: [
      "Wallet Creation: real EVM wallet address and mnemonic key generated at signup",
      "On-chain Integration: real EVM wallet creation, external wallet linking, internal transfers and external withdrawals",
      "Price/Charts: CMC API-based price feeds and TradingView charts",
      "Theme: dark/light mode and multilingual UI support",
      "Security: Passkey biometrics, Google OTP two-factor authentication",
    ],
    impact: [
      "Built a UNIDECA-exclusive demo platform for live demonstration of Web3 wallet architecture in sales and client meetings.",
      "Implemented real EVM wallet creation, mnemonic key generation, and on-chain integration — not just a UI demo.",
      "Serves as a reusable Web3 wallet reference throughout token project proposals and sales processes.",
    ],
  },
  18: {
    role: "Non-custodial EVM wallet demo platform development with on-chain transaction history integration",
    desc: "Non-custodial wallet demo platform featuring real EVM wallet creation, asset queries, on-chain transaction tracking, and purchase/swap functionality.",
    tasks: [
      "Developed the user interface for a non-custodial wallet demo platform using React and TailwindCSS.",
      "Implemented wallet creation structure generating real EVM wallets, mnemonic keys, and private keys per user.",
      "Integrated BscScan API for real-time BSC on-chain transaction history display within the wallet.",
      "Implemented token purchase and swap features demonstrating core non-custodial wallet flows similar to MetaMask.",
    ],
    impact: [
      "Built a functional non-custodial wallet demo with real operational architecture as a Web3 wallet reference.",
      "Created real-time on-chain transaction tracking via BscScan API to monitor wallet activity.",
    ],
  },
  19: {
    role: "Stellar network-based digital wallet development for a token project with external wallet integration",
    desc: "Stellar network-integrated digital wallet for XLM-based token projects supporting airdrops, purchases, swaps, price feeds, and external wallet connectivity for early user acquisition.",
    tasks: [
      "Developed a dedicated wallet for XLM-based token projects with real Stellar network integration.",
      "Built user wallet interface and basic dashboard using React and TailwindCSS.",
      "Implemented core features for early user acquisition: airdrops, token purchases, swaps, and price feeds.",
      "Configured wallet service infrastructure using AWS-based hosting.",
    ],
    impact: [
      "Built a dedicated wallet with real Stellar network integration for XLM-based token projects.",
      "Expanded multi-chain wallet development capabilities beyond EVM/BSC by adding Stellar experience.",
    ],
  },
  20: {
    role: "Dedicated RWA wallet, physical asset product trading, point/token payments, and admin/agent system development",
    desc: "RWA wallet and commerce platform generating real EVM wallets at signup where users can purchase agent-registered physical assets using USDT or point-based project tokens.",
    tasks: [
      "Developed the RWA project wallet platform and physical asset product trading architecture.",
      "Implemented product registration and management for agents to list and manage physical asset-based products.",
      "Designed payment structure allowing users to purchase with USDT or project tokens used as a point currency.",
      "Implemented performance-based price changes, root/seed purchase structures, and RWA product operation business logic.",
      "Integrated Smartdelivery API for physical product shipping tracking.",
      "Implemented gift certificate sales and QR issuance features.",
    ],
    features: [
      "RWA: physical asset product registration, root/seed purchases, performance-based price change structure",
      "Wallet: real EVM wallet and mnemonic key generation at signup, USDT and token balance management",
      "Commerce: physical product purchase/sale, gift certificates, shipping tracking, QR-based issuance",
      "Admin: product, agent, user, transaction, and gift certificate management",
      "Security: Google OTP two-factor authentication",
    ],
    impact: [
      "Built an RWA wallet and commerce platform supporting ~180 users and ~$20K in cumulative transactions.",
      "Connected physical asset registration, purchase, payment, shipping, and gift certificate issuance in a single RWA commerce wallet.",
      "Linked physical product trading and token utility by combining USDT and point-based token transactions.",
    ],
  },
  21: {
    role: "Node product purchase, staking, on-chain wallet, swap, and referral/level system development",
    desc: "On-chain wallet platform generating real EVM wallets at signup, supporting node product purchases, USDT payments, staking, lockup, internal transfers, external withdrawals, swaps between 2 ecosystem coins and USDT, and referral/level systems.",
    tasks: [
      "Implemented on-chain wallet structure generating real EVM wallet addresses and mnemonic keys at signup.",
      "Integrated CMC API for real-time price data of issued tokens within the wallet.",
      "Implemented USDT-based node product purchases, token purchases, staking, and lockup features.",
      "Implemented swap functionality between 2 connected ecosystem coins and USDT for in-wallet asset exchange.",
      "Implemented level and referral systems for user activity and referral-based reward structures.",
    ],
    impact: [
      "Built a node-type wallet platform with real EVM wallet generation and on-chain transaction verification.",
      "Extended wallet asset utility by providing swaps between 2 ecosystem coins and USDT.",
      "Gained operational experience with a wallet/node product that generated ~$5K in actual revenue.",
    ],
  },
  22: {
    role: "Closed investment platform MVP development with interest application and admin management system",
    desc: "Closed investment platform accessible only via referral code, featuring investment product browsing, interest application, admin review, and contract management in an MVP.",
    tasks: [
      "Developed user and admin interfaces for the closed investment platform using React and TailwindCSS.",
      "Implemented referral code-only registration for access-restricted signup.",
      "Built an application flow for users to review investment products and submit interest forms.",
      "Implemented contract form generation from submitted data with contract image upload and management.",
    ],
    impact: [
      "Designed as a private investment platform with referral code-based access for a limited user base.",
      "Automated pre-investment lead collection and management, converting manual inquiry-based processes into a platform.",
    ],
  },
  23: {
    role: "OTT platform MVP development and Group Watch core feature implementation",
    desc: "OTT platform MVP with video viewing, subscription plans, content and user management, featuring Group Watch as the key differentiator — allowing friends to watch and chat together in real-time.",
    tasks: [
      "Implemented OTT platform user interface and basic service flows using React and TailwindCSS.",
      "Set up Cloudflare-based video and image resource management structure.",
      "Implemented Group Watch feature allowing users to generate video links and share them to watch together.",
      "Designed shared viewing experience where Group Watch participants watch the same content with real-time chat.",
      "Completed prototype testing and reached demo-ready MVP level for investment review.",
    ],
    impact: [
      "Developed an MVP combining standard OTT features with the Group Watch differentiator over approximately 3 months.",
      "Built a demo-ready MVP that advanced to the final investment review stage.",
    ],
  },
  24: {
    role: "Web3 private event platform development, QR application/check-in system, and KPI admin dashboard",
    desc: "Platform operating UNIDECA's private blockchain networking event series with event applications, QR issuance/check-in, attendee tracking, KPI dashboard, and foundation/project management.",
    tasks: [
      "Implemented a non-member application flow where minimal info (name, phone, email) triggers automatic QR code issuance.",
      "Processed QR issuance, lookup, and check-in serverlessly using Cloudflare Functions.",
      "Implemented an on-site QR check-in system for staff to instantly mark attendance by scanning QR codes.",
      "Built a manual check-in backup system using name, phone, or email lookup for QR issues.",
      "Developed admin tools for managing KPIs, per-event application/attendance stats, cumulative participant data, foundation info, and event details.",
    ],
    features: [
      "Event Registration: non-member quick registration with automatic QR code issuance",
      "QR Check-in: instant attendance processing via QR scan at event venue",
      "KPI: total applicants, attendees, attendance rate, QR check-in rate, per-event stats",
      "Foundation Management: participating token project foundation and project info management",
      "On-site Tools: QR scan check-in, manual check-in backup flow",
    ],
    impact: [
      "Built a dedicated event platform for UNIDECA's private Web3 networking series enabling repeatable operations.",
      "Managed 3 events, 277 users, and 6 participating foundation records, validating the recurring event structure.",
      "Event participation led to follow-up meetings and investment/partnership discussions with attending foundations.",
    ],
  },
  25: {
    role: "Planning/PM for a 3-game platform and development collaboration",
    desc: "Point reward game platform within a token project ecosystem featuring Goldenbell, Matching, and Cube games with external settlement system integration.",
    tasks: [
      "Led overall planning and PM for the point reward game platform within the token project ecosystem.",
      "Defined game rules, user flows, reward structures, and operation scenarios for Goldenbell, Matching, and Cube games.",
      "Coordinated integration architecture between Unity-based game elements, the web platform, and external accounting systems.",
      "Designed external settlement system integration for actual point and reward disbursements through a separate payment system.",
      "Directly participated in development collaboration in the latter project phase, supporting feature implementation, testing, and improvements.",
    ],
    impact: [
      "Designed an operational game structure including Binance API real-time prices, external settlement, reward schedules, and VIP participation conditions — beyond a simple mini-game.",
      "Started as PM but joined direct development collaboration in the latter phase, gaining experience on both planning and implementation sides.",
    ],
  },
  26: {
    role: "Planning and simultaneous web/app development for a global medical beauty platform",
    desc: "Global medical beauty platform connecting overseas patients with Korean dermatology and plastic surgery clinics, including user web/app, hospital admin, platform admin, deposit payments, reviews, rewards, and medical tourism packages.",
    tasks: [
      "Benchmarked existing medical beauty platforms and hospital booking services to plan the global platform service structure.",
      "Designed user web/app, hospital admin, and platform admin architecture connecting overseas patients with Korean clinics.",
      "Planned differentiating features: deposit-based no-show prevention, visit-verified rewards, medical tourism packages, and partner/influencer systems.",
      "Planned payment expansion considering initial overseas PG integration with future domestic PG and coin/reward integration.",
      "Designed Next.js user web, React Native mobile app, NestJS backend, and PostgreSQL data architecture.",
    ],
    impact: [
      "Defined service structure and development direction for a global medical beauty platform connecting overseas patients with Korean medical institutions.",
      "Designed a multi-sided platform architecture including user web/app, hospital admin, and platform admin.",
      "Planned differentiating features including deposit-based no-show prevention, visit-verified rewards, and medical tourism packages.",
    ],
  },
  27: {
    role: "Personal project planning and full-stack development of an SEO/AEO/GEO analysis SaaS",
    desc: "AI-powered search optimization platform analyzing SEO, AEO, GEO, performance, AI visibility, competitor/keyword analysis, Naver Place rankings, and content strategy from a single URL input.",
    tasks: [
      "Designed Next.js frontend and NestJS backend architecture.",
      "Configured BullMQ-based async job queues separating crawling, subpage analysis, Lighthouse, and AI analysis tasks.",
      "Used Playwright to crawl websites and subpages, analyzing meta info, content structure, FAQs, JSON-LD, and link structures.",
      "Integrated Lighthouse for technical metrics analysis: performance, accessibility, SEO, and best practices.",
      "Implemented SEO/AEO/GEO improvement suggestions, content strategy, and AI search visibility simulations using OpenAI and Claude APIs.",
      "Collected data and refined analysis accuracy through testing against actual hospital websites.",
    ],
    features: [
      "SEO Analysis: meta tags, heading structure, content quality, internal links, image ALT, FAQ, JSON-LD",
      "AEO Analysis: question-based content, FAQ structure, answer suitability, AI answer candidate sentences",
      "GEO Analysis: brand/page visibility simulation in generative AI search with improvement suggestions",
      "Naver Place: keyword-based Naver Place ranking analysis and local SEO visibility",
      "Reports: PDF report generation, analysis summaries, improvement task guides",
    ],
    impact: [
      "Completed a personal SaaS MVP automating SEO/AEO/GEO field work.",
      "Used as an internal tool for analyzing and optimizing multiple hospital websites, accumulating improvement case data.",
      "Combined Lighthouse, Playwright, AI APIs, and GSC/GA4 to analyze beyond basic SEO into search/AI visibility and content strategy.",
    ],
  },
  28: {
    role: "Solo development of magician portfolio, shop, lecture library, and admin system",
    desc: "Self-built commerce platform combining a magician brand portfolio with product sales, a buyer-exclusive lecture library, and a full admin system.",
    tasks: [
      "Developed the complete website combining magician portfolio with shop features using Next.js.",
      "Implemented general product sales, lecture sales, and buyer-only lecture library access.",
      "Designed a structure where lecture buyers can access purchased content anytime through the on-site library.",
      "Self-developed an admin panel for managing products, orders, lecture content, and user access permissions.",
      "Configured PayPal payment integration supporting international transactions.",
      "Set up Cloudflare D1 data management and Cloudflare-based image/video management and deployment.",
    ],
    impact: [
      "Built a self-contained commerce platform supporting product sales, lecture sales, and buyer-exclusive content delivery — not just a portfolio site.",
      "Independently designed and built frontend, database, payments, shipping, admin, and content access control without third-party commerce solutions.",
    ],
  },
  29: {
    role: "Solo café startup platform planning and landing page/platform preparation for prospective founder database collection",
    desc: "Franchise startup platform where Openbal and Samlip collaborate to connect prospective café founders with consulting, menu/recipe development, interior design, equipment, and post-launch marketing.",
    tasks: [
      "Planned service direction and operation flow for a solo café startup platform based on Openbal-Samlip collaboration.",
      "Planned a Phase 1 landing page for demand survey and database collection targeting prospective solo café founders.",
      "Defined consultation roadmap distinguishing pre/post-lease stages and Openbal/Samlip role divisions.",
      "Planned full platform expansion covering consultation applications, startup stage management, partner connections, and admin operations.",
    ],
    impact: [
      "Planned a landing page and platform structure for collecting initial demand and consultation leads from prospective café founders.",
      "Planned a franchise platform model expandable to consultation DB, startup stage management, partner connections, and post-launch stabilization packages.",
    ],
  },
  30: {
    role: "Backend API development for a dental insurance service internal intranet",
    desc: "Backend API development project for Delta Dental's dental insurance intranet using Java Spring Boot, with enterprise-scale agile team collaboration experience.",
    tasks: [
      "Developed backend APIs for the dental insurance service's internal intranet using Java Spring Boot.",
      "Implemented insurance-related data processing, query, and management APIs for internal users and business systems.",
      "Developed request/response flows and data processing logic per service module based on REST API architecture.",
      "Managed tasks, issues, and sprint progress using Jira and shared team workflow across the team.",
      "Collaborated in a 5-person development team handling feature development, testing, and feedback iterations.",
    ],
    impact: [
      "Gained enterprise API development experience participating in backend development for a large-scale dental insurance intranet.",
      "Experienced daily standups, issue management, and remote collaboration through agile teamwork in a 5-person dev team.",
    ],
  },
  31: {
    role: "Technical SEO optimization, AEO/GEO content structure improvements, blog/service page setup, and search visibility improvements for hospital websites",
    desc: "Search optimization project conducting Technical SEO, AEO, GEO, blog setup, service pages, structured data, and Search Console configuration for hospital websites, with continuous analysis using RankFit.",
    tasks: [
      "Analyzed hospital websites to identify improvements from Technical SEO, on-page SEO, AEO, and GEO perspectives.",
      "Set up blogs, service pages, meta information, structured data, and content structure for WordPress, Imweb, and GnuBoard hospital sites.",
      "Restructured medical source content provided by hospitals into SEO/AEO/GEO-optimized content architecture.",
      "Completed basic search engine integration: Google Search Console registration, index requests, sitemap verification, and search visibility checks.",
      "Used RankFit to analyze SEO/AEO/GEO scores per hospital site and continuously tracked and resolved identified issues.",
    ],
    impact: [
      "Gained technical improvement and content structure optimization experience from SEO/AEO/GEO perspectives across multiple hospital websites.",
      "Performed technical SEO and content optimization across various hospital CMS environments: WordPress, Imweb, and GnuBoard.",
      "Accumulated SEO/AEO/GEO score improvements, analysis benchmarks, and improvement case data using RankFit on real hospital sites.",
    ],
  },
  32: {
    role: "Technical SEO and on-page SEO optimization for sports content sites",
    desc: "SEO optimization project for GnuBoard-based sports content sites covering indexing, GSC setup, meta tags, sitemaps, structured data, and site structure improvements.",
    tasks: [
      "Conducted Technical SEO and on-page SEO improvements for GnuBoard-based sports content sites.",
      "Set up Google Search Console, submitted sitemaps, requested indexing, and checked search visibility.",
      "Optimized meta tags, heading structures, descriptions, and internal link structures per page for search friendliness.",
      "Checked and configured structured data, robots.txt, sitemap.xml, and other core technical SEO elements.",
    ],
    impact: [
      "Organized the search engine indexing foundation and technical SEO structure for GnuBoard-based sports broadcasting sites.",
      "Gained technical SEO experience in a sports content environment where fast indexing and clean page structure are critical.",
    ],
  },
  33: {
    role: "Web3 project marketing strategy, content planning, and press/KOL/community/viral campaign operations",
    desc: "Integrated marketing campaign project running press coverage, KOL marketing, Meta ads, blog virals, and community marketing for multiple Web3 projects.",
    tasks: [
      "Planned marketing messages and campaign directions tailored to each Web3 project's goals, target users, and token/service characteristics.",
      "Established and operated channel-specific strategies across press coverage, KOL marketing, Meta ads, blog virals, and community marketing.",
      "Collaborated with KOLs and community channels to expand project awareness, drive user acquisition, and activate communities.",
      "Monitored channel responses, user inflow, and community reactions post-campaign to adjust follow-up content and direction.",
    ],
    impact: [
      "Gained integrated marketing campaign experience connecting press, KOL, ads, blog, and community for multiple Web3 projects.",
      "Expanded project awareness and user touchpoints using KOL and community channels ranging from tens of thousands to hundreds of thousands in audience.",
    ],
  },
  34: {
    role: "Foundation marketing/technical materials, investor pitch decks, and event presentation production",
    desc: "Multilingual materials project for B*** Foundation's marketing, technical explanation, investor pitching, and event presentations — including HTML slides with PDF/PPTX export workflows.",
    tasks: [
      "Planned and produced core materials for the foundation's marketing, technical explanation, investor proposals, and event presentations.",
      "Created ~4 types of presentation/proposal materials across 5 languages, with 20+ slides per document.",
      "Built an HTML-based slide production workflow with PDF and PPTX export using Claude Code.",
      "Used Puppeteer to automate HTML slide conversion to PDF/PPTX outputs.",
      "Built web-based presentation slides with main presentation view and full slide preview for live event use.",
    ],
    impact: [
      "Systematized multilingual materials for the foundation's marketing, technical explanation, investor pitching, and event presentations.",
      "Built a self-contained production workflow from planning through PDF/PPTX export using AI tools, Claude Code, HTML, and Puppeteer.",
    ],
  },
  35: {
    role: "Planning and full execution of private Web3 networking events: foundation communication, materials, venue sourcing, and on-site operations",
    desc: "Planned and operated UNIDECA's private blockchain networking event series end-to-end: foundation communication, venue sourcing, material production, attendee recruitment, on-site operations, and KPI analysis.",
    tasks: [
      "Planned and designed the full operation structure for the TheBlockLink private Web3 networking event series.",
      "Directly communicated with participating foundation representatives to align event purpose, presentation materials, criteria, and schedules.",
      "Sourced event venues primarily in Gangnam and designed space layouts and traffic flows for networking goals.",
      "Managed domestic and international attendee recruitment, application handling, QR check-in, on-site attendance, and post-event data organization.",
      "Analyzed post-event KPIs and reflected findings in TheBlockLink platform's application, check-in, and admin feature improvements.",
    ],
    impact: [
      "Planned and operated 4 private Web3 networking events — 3 domestic (~280 attendees) and 1 international (~120 attendees) — accumulating ~400 total participant records.",
      "Handled the entire event operation process: foundation communication, venue sourcing, material production, attendee recruitment, MC coordination, and on-site management.",
      "Created offline touchpoints between participating foundations and investors/community, leading to follow-up meetings and investment/partnership discussions.",
    ],
  },
  36: {
    role: "Planning and production of Web3 company profiles, token project introduction materials, and service brochures",
    desc: "Produced UNIDECA and Web3 client company profiles and token project materials as AI-powered HTML slides with PDF/PPTX export and web presentation pages.",
    tasks: [
      "Updated UNIDECA's company profile and produced Web3 service introduction materials.",
      "Structured company profiles, project introductions, and investor/partner pitch materials for token project clients.",
      "Created HTML-based slide designs and set up PDF and PPTX export workflows using Puppeteer.",
      "Built web-based presentation pages for direct use at in-person meetings, events, and partner proposals.",
      "Organized Web3 expertise — blockchain technology, token ecosystems, listing support, marketing, and development services — into company profile format.",
    ],
    impact: [
      "Built a systematic company profile structure communicating UNIDECA's and Web3 clients' business structures, services, and capabilities to external audiences.",
      "Established a production workflow from planning through PDF/PPTX export using AI tools and Claude Code.",
      "Extended beyond document production to web presentation pages usable at in-person meetings, events, partner proposals, and investor pitching.",
    ],
  },
};
