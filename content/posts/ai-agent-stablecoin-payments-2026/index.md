---
title: AI 에이전트가 직접 결제하는 시대 — 스테이블코인이 없으면 불가능한 이유
description: AI가 스스로 돈을 쓰는 시대가 오고 있다. 그런데 신용카드는 AI한테 발급이 안 된다. 왜 스테이블코인이 유일한 답인지, 그리고 지금 어떤 인프라가 만들어지고 있는지 정리했다.
date: 2026-06-25
tags: [AI, stablecoin, agentic-payments, x402, Stripe, Coinbase, USDC, Web3]
author: Joowon Kim
series: stablecoin
---

# AI 에이전트가 직접 결제하는 시대
**스테이블코인이 없으면 불가능한 이유**

---

요즘 AI 에이전트 얘기가 많다. 코드 짜주는 것, 리서치 해주는 것, 이메일 쓰는 것. 이미 일상에서 쓰고 있는 사람도 많다.

그런데 한 가지 막히는 지점이 있다. AI가 뭔가를 하려면 돈이 든다. API를 호출하거나, 데이터를 사거나, 다른 서비스를 쓰거나. 사람이 옆에서 "결제하기" 버튼을 눌러줘야 한다면, 사실 그건 완전한 자율 에이전트가 아니다.

그 문제를 풀기 위해 지금 조용히 새로운 결제 인프라가 만들어지고 있다. 핵심에 스테이블코인이 있다.

---

## 신용카드는 AI한테 발급이 안 된다

당연한 얘기처럼 들리지만, 이게 생각보다 근본적인 문제다.

카드사는 발급 전에 KYC(본인 확인)를 요구한다. 주민등록번호, 신분증, 주소. AI 에이전트에게는 이것들이 없다. 계좌를 만들 수도, 신용 기록을 쌓을 수도 없다.

설령 회사 카드를 연결해준다고 해도 문제가 남는다. 카드 결제는 평일 영업시간 기준으로 정산된다. AI는 주말 새벽 3시에도 일한다. 카드 네트워크에는 고정 수수료가 있다. 0.31달러짜리 API 요청을 처리하면 수수료가 결제액보다 커진다. 그리고 카드에는 차지백이 있다 — 사람이 "이거 내가 한 거 아닌데요"라고 분쟁을 걸 수 있지만, AI가 한 트랜잭션에서 이걸 어떻게 처리할지 아무도 설계해놓지 않았다.

Keyrock, Coinbase, Tempo가 공동으로 낸 2026년 보고서는 이렇게 요약한다: 전통적인 카드 결제 인프라는 "인간 규모의 경제"를 위해 설계됐다. AI 에이전트는 그 가정을 세 가지 방향으로 모두 깬다 — 마이크로 단위 결제, 24/7 운영, 프로그래밍 가능한 조건부 실행.

---

## 스테이블코인이 맞는 이유

AI 에이전트가 돈을 쓰려면 몇 가지 조건이 필요하다.

**계좌 없이 지갑을 가질 수 있어야 한다.** 스테이블코인 지갑은 신분증 없이 만들 수 있다. 코드로 생성된다.

**소액 결제가 경제적으로 가능해야 한다.** Keyrock 보고서에 따르면, 현재 AI 에이전트 결제의 평균 금액은 0.31달러다. Base 네트워크에서 USDC 전송 비용은 약 0.0001달러 — 결제액의 0.03% 수준이다. 카드로는 이 경제학이 성립하지 않는다.

**24시간, 365일 작동해야 한다.** 블록체인은 멈추지 않는다. 주말도 없고, 은행 점심시간도 없다.

**프로그래밍이 가능해야 한다.** 에이전트의 지출 한도를 코드로 설정하고, 특정 조건에서만 결제가 실행되게 하고, 다른 에이전트에게 예산을 위임할 수 있어야 한다. 카드 네트워크의 규칙 엔진은 이렇게 설계돼 있지 않다.

스테이블코인은 이 조건들을 모두 충족한다. 그리고 비트코인이나 이더리움과 달리 가격이 달러에 고정돼 있어서 예산 계산이 가능하다. AI가 100달러 예산으로 작업을 시작했는데, 작업 도중 자산 가치가 30% 빠지면 곤란하다.

---

## 지금 실제로 어떤 일이 일어나고 있나

수치로 먼저 보면: 2025년 5월부터 2026년 4월까지 1년간 AI 에이전트들이 온체인에서 처리한 트랜잭션은 1억 7600만 건, 총 결제액은 7300만 달러다. 그리고 이 중 98.6%가 USDC로 결제됐다.

이 인프라를 만들고 있는 플레이어들을 보면 누가 이 판에 베팅하고 있는지 보인다.

**Coinbase — x402 프로토콜**

2025년 5월, Coinbase는 x402라는 프로토콜을 공개했다. 개념은 단순하다. 인터넷에는 1996년부터 HTTP 402라는 상태 코드가 예약돼 있었다 — "Payment Required". 그런데 30년 동안 아무도 쓰지 않았다. 웹에 결제 레이어가 없었으니까.

x402는 이걸 실제로 구현했다. AI 에이전트가 어떤 API를 호출하면, 서버가 "이건 0.001달러짜리야"라고 응답한다. 에이전트는 USDC로 결제하고, 서버는 데이터를 준다. 계정 없이, 구독 없이, API 키 없이. 하나의 HTTP 요청 안에서 끝난다.

2025년 12월에는 Coinbase와 Cloudflare가 함께 x402 Foundation을 만들었다. 현재 Google, Visa, AWS, Circle, Anthropic, Vercel이 멤버다.

**Stripe + Tempo — Machine Payments Protocol**

2026년 3월 18일, Stripe와 Paradigm이 공동으로 만든 Tempo 블록체인이 메인넷을 런칭하면서 MPP(Machine Payments Protocol)를 함께 공개했다. 출시 첫 주에 OpenAI, Anthropic, Google Gemini, Dune Analytics 등 50개 이상의 서비스가 통합했다. Visa는 카드 결제 방식의 스펙을, Lightspark는 비트코인 라이트닝 방식의 스펙을 기여했다.

x402가 오픈 인터넷 방식이라면, MPP는 엔터프라이즈 방식이다. Stripe의 컴플라이언스 스택(사기 탐지, PCI, 세금 처리)이 내장돼 있고, 에이전트의 지출 한도를 세션 단위로 제어할 수 있다.

**Google — AP2**

Google은 2025년 9월 AP2(Agent Payment Protocol)를 발표했다. PayPal, Coinbase, Mastercard, American Express가 파트너로 참여했다. 카드와 스테이블코인을 모두 지원하는 방향이다.

---

## 왜 이게 중요한가

지금 만들어지는 인프라가 완성되면, AI 에이전트는 다음과 같은 일을 사람 개입 없이 할 수 있게 된다.

리서치 에이전트가 데이터가 필요하면 직접 데이터 API에 0.001달러를 내고 구매한다. 번역이 필요하면 번역 에이전트를 고용하고 결제한다. GPU 연산이 필요하면 컴퓨팅을 초 단위로 빌리고 쓴 만큼만 낸다. 멀티 에이전트 시스템에서는 오케스트레이터 에이전트가 서브 에이전트들에게 예산을 위임하고, 각 에이전트는 독립적으로 결제한다.

Gartner는 AI 에이전트가 2028년까지 중개하는 구매액이 15조 달러에 달할 것으로 전망한다. McKinsey는 리테일 분야만 해도 2030년까지 3~5조 달러 규모가 될 거라고 본다.

물론 과장이 섞여 있을 수 있다. 지금 x402 하루 거래액은 약 28,000달러 수준이고, 테스트성 트랜잭션도 상당수 포함돼 있다. 아직은 실험 단계에 가깝다.

하지만 인프라를 누가 만들고 있는지를 보면 방향이 보인다. Coinbase, Stripe, Visa, Google, Anthropic — 이 조합이 같은 방향을 보고 있다는 건 신호다.

---

## 한 가지 리스크

지금 AI 에이전트 결제의 98.6%가 USDC 하나에 집중돼 있다. Circle이 규제 리스크에 처하거나 기술적 문제가 생기면, 이 생태계 전체가 흔들릴 수 있다. Keyrock 보고서도 이를 현재 가장 큰 구조적 리스크로 지목한다.

분산이 필요하다는 건 업계도 알고 있다. MPP가 처음부터 카드, 라이트닝 네트워크, 스테이블코인을 함께 지원하는 멀티레일 구조로 설계된 이유 중 하나다.

---

## 정리

AI 에이전트가 자율적으로 일하려면 자율적으로 결제할 수 있어야 한다. 카드 네트워크는 그 용도로 설계되지 않았다. 스테이블코인은 — 가격 안정성, 프로그래밍 가능성, 무허가 지갑, 마이크로 수수료라는 속성 덕분에 — 지금 유일하게 작동하는 옵션이다.

1996년부터 예약만 돼 있던 HTTP 402가, 30년 만에 AI 에이전트의 결제 코드가 됐다. 인프라는 이미 깔리고 있다.

---

## References

- [Who Pays the Agent? — Keyrock, Coinbase, Tempo, Virtuals Protocol Report (2026.05)](https://www.coindesk.com/business/2026/05/21/crypto-rails-are-becoming-the-default-payment-layer-for-ai-agents-report-says)
- [Introducing the Machine Payments Protocol — Stripe Blog (2026.03)](https://stripe.com/blog/machine-payments-protocol)
- [Stripe-led payments blockchain Tempo goes live — CoinDesk (2026.03)](https://www.coindesk.com/tech/2026/03/18/stripe-led-payments-blockchain-tempo-goes-live-with-protocol-for-ai-agents)
- [x402 Protocol Explained: How AI Agents Pay Onchain — eco.com](https://eco.com/support/en/articles/12328618-x402-protocol-explained-how-ai-agents-pay-onchain)
- [Why AI Agents Need Stablecoin Payments — eco.com](https://eco.com/support/en/articles/14846271-why-ai-agents-need-stablecoin-payments)
- [The Agentic Web: Inside the Protocol Race for Machine-to-Machine Payments — Emerging Fintech (2026.04)](https://www.emergingfintech.co/p/the-agentic-web-inside-the-protocol)
- [x402 vs. Stripe MPP — WorkOS (2026.03)](https://workos.com/blog/x402-vs-stripe-mpp-how-to-choose-payment-infrastructure-for-ai-agents-and-mcp-tools-in-2026)
- [2025 Crypto Adoption and Stablecoin Usage Report — TRM Labs](https://www.trmlabs.com/reports-and-whitepapers/2025-crypto-adoption-and-stablecoin-usage-report)

---

*이전 글: [스테이블코인이 조용히 주류가 되고 있다 — Stripe와 Visa가 이미 쓰고 있는데 왜 아무도 모를까](/research/stablecoin-mainstream-2026)*

---

> 본 글은 Joowon Kim의 개인 리서치 기록입니다. 특정 자산에 대한 투자 권유가 아닙니다.
