---
title: 개발자의 일하는 방식이 바뀌고 있다 — Claude Code, Codex, 그리고 Skills
description: AI가 코드를 짜주는 게 아니라, 개발자가 AI에게 일을 위임하는 시대. 2026년 7월 현재 실제로 어떤 툴들이 쓰이고, 개발 방식이 어떻게 달라지고 있는지 정리했다.
date: 2026-07-22
tags: [AI, developer-tools, Claude-Code, Codex, MCP, Skills, productivity, engineering]
author: Joowon Kim
---

# 개발자의 일하는 방식이 바뀌고 있다
**Claude Code, Codex, 그리고 Skills**

---

AI 코딩 툴 얘기가 나오면 보통 두 가지 반응이 나온다.

"그거 쓰면 개발자 일자리 없어지는 거 아니야?" 아니면 "Copilot이랑 뭐가 달라? 자동완성 아니야?"

둘 다 지금 일어나고 있는 변화의 핵심을 놓친 얘기다. 2025년 말부터 2026년에 걸쳐 AI 코딩 툴의 성격이 근본적으로 바뀌었다. 자동완성이 아니라 위임이다. 코드 한 줄을 채워주는 게 아니라, 작업 단위를 통째로 맡기는 방식으로.

---

## 달라진 게 뭔가

기존 AI 코딩 어시스턴트는 이런 식이었다. 커서를 두면 다음 줄을 제안해준다. "이 함수 설명해줘"라고 채팅창에 물어본다. 코드 블록을 복사해서 넣는다.

지금 얘기하는 건 다르다. 터미널에 "이 레포의 테스트 커버리지가 낮은 파일 찾아서 테스트 코드 작성하고 PR 열어줘"라고 입력하면, 에이전트가 레포를 읽고, 파일을 수정하고, 테스트를 실행하고, 실패하면 고치고, 커밋하고, PR을 연다. 사람이 할 일은 결과를 리뷰하고 머지하는 것뿐이다.

Andrej Karpathy가 2026년 1월에 쓴 글이 화제가 됐다. 한 달 만에 자신의 코딩 방식이 "80% 직접 → 80% 에이전트"로 뒤집혔다고. 그 글에 4만 개 넘는 좋아요가 달렸고, 댓글은 정확히 반반 갈렸다. Claude Code 쪽과 Codex 쪽.

---

## 주요 툴들 (2026년 7월 기준)

지금 이 판에서 실제로 쓰이는 툴을 정리하면 이렇다.

**Claude Code**

Anthropic이 만든 터미널 기반 에이전트. 현재 v2.1.217(7월 21일 릴리즈)까지 왔다. 코드베이스 전체를 읽고, 파일을 수정하고, 명령어를 실행하고, 커밋까지 한다. 터미널 외에도 VS Code, JetBrains, 데스크탑 앱, 웹에서도 쓸 수 있다.

기본 모델이 Opus 4.8(5월 28일부터 기본값)로 올라갔고, Terminal-Bench 2.1 기준 78.9점. 브라우저를 직접 조작하는 Computer Use가 성숙해서 "스테이징 배포 확인하고 폼 제출 테스트까지 해줘" 같은 요청도 실제로 동작한다. 최근 업데이트에서 퍼블리시된 Artifact에 MCP 커넥터를 연결해 라이브 데이터를 실시간으로 가져오는 기능도 추가됐다.

**Codex (OpenAI)**

7월 9일 OpenAI가 ChatGPT와 Codex 데스크탑 앱을 하나로 통합했다. 동시에 GPT-5.6을 공개했는데 Sol, Terra, Luna 세 티어로 나뉘고, 컨텍스트 윈도우는 272,000 토큰. OpenAI는 Sol이 AI 코딩 작업에서 이전 대비 토큰 효율이 54% 개선됐다고 밝혔다. Terminal-Bench 2.1 기준 83.4점으로 현재 1위.

터미널 CLI와 클라우드 에이전트를 모두 지원한다. 클라우드 에이전트는 격리된 샌드박스에서 비동기로 작업한다. 레포 URL을 넘기면 알아서 클론하고, 작업하고, PR을 올린다. 노트북 닫아도 계속 돌아간다. GitHub 이슈를 할당하면 알아서 해결하는 방식도 지원한다.

**Cursor — 그리고 진행 중인 인수**

Cursor는 2026년 상반기 기준 AI 코딩 툴 시장에서 가장 빠르게 성장한 독립 플레이어였다. 연간 매출 26억 달러 수준까지 성장했고, IDE를 AI 네이티브로 처음부터 재설계한 접근이 차별점이었다.

6월 16일, SpaceX가 Cursor를 600억 달러 전액 주식 거래로 인수한다고 발표했다. SpaceX가 xAI와 합병한 직후 나온 움직임으로, AI 코딩 분야에서 Anthropic·OpenAI와 본격 경쟁하겠다는 선언이다. 인수 종결은 2026년 3분기 예정. 현재 Cursor는 기존과 동일하게 운영되고 있고, Claude 및 GPT 모델 지원도 유지 중이다. SpaceXAI는 7월 초 Cursor와 공동 개발한 첫 모델을 곧 공개할 것이라고 밝혔다.

이 인수는 역대 벤처 스타트업 최대 규모 인수 기록이다. AI 개발 툴이 더 이상 "있으면 좋은 것"이 아니라 인프라로 분류되고 있다는 신호다.

**그 외**

GitHub Copilot CLI는 6월 1일부터 AI 크레딧 기반 종량제로 전환했다. Google은 Gemini CLI를 유료화하고 Antigravity CLI로 대체했다. 오픈소스 쪽에서는 opencode가 17만 GitHub 스타를 넘겼다.

요즘 많은 팀이 Claude Code와 Codex를 병행해 쓴다. Claude Code는 시니어 개발자가 실제 코드베이스 깊은 작업에 쓰고, Codex는 코드리뷰·반복 수정·비동기 위임에 쓰는 방식이다.

---

## Skills — 가장 조용하고 중요한 변화

툴 자체보다 더 흥미로운 건 Skills라는 개념이다.

2025년 10월 Anthropic이 Skills를 공개했고, 같은 해 12월 오픈 스탠다드로 공개했다. 몇 주 만에 OpenAI가 Codex에 같은 SKILL.md 포맷을 채택했다. 지금은 Claude Code, Codex, Cursor, Gemini CLI 모두 같은 포맷을 쓴다. 2026년 Q1에 실행 가능한 스크립트를 포함하는 Skills 2.0이 나왔고, 공식 플러그인 마켓플레이스도 5월부터 운영 중이다.

개념은 단순하다. `SKILL.md` 파일이 들어있는 폴더를 에이전트의 skills 디렉토리에 넣으면, 에이전트가 관련 작업을 할 때 그 파일을 읽고 따른다.

예를 들어 `frontend-design` 스킬을 설치해두면, UI 컴포넌트 작업을 할 때 에이전트가 "이 팀은 이런 디자인 시스템을 쓰고, 이런 컬러 토큰을 쓰고, 버튼은 이렇게 만든다"를 알고 작업한다. 매 세션마다 같은 맥락을 설명할 필요가 없다.

한 번 만든 스킬은 팀 전체가 쓴다. 팀의 스킬은 조직 전체로 퍼진다. PR 리뷰 기준, 배포 체크리스트, 코드 컨벤션 — 이걸 CLAUDE.md에 수천 줄로 써넣는 게 아니라, 스킬로 모듈화해서 필요할 때만 로드한다.

현재 anthropics/skills 리포는 14만 GitHub 스타, obra/superpowers는 20만 스타를 넘겼다. 커뮤니티가 만든 스킬만 수천 개다.

---

## 실제로 뭐가 달라지나

이 변화가 개발자한테 무슨 의미인지를 정리하면 세 가지다.

**반복 작업이 위임된다.** 테스트 코드 작성, 의존성 업데이트, 린트 수정, 문서화 — 지금까지 "해야 하는데 귀찮아서 미루던" 작업들이 에이전트에게 넘어간다.

**컨텍스트가 쌓인다.** 스킬과 CLAUDE.md가 팀의 암묵지를 코드로 만든다. 신규 입사자가 온보딩할 때 에이전트가 팀 컨벤션을 이미 알고 있다.

**개발자의 역할이 바뀐다.** 코드를 직접 타이핑하는 시간이 줄고, 에이전트가 만든 결과물을 리뷰하고 방향을 정하는 시간이 늘어난다. 아키텍처 판단, 트레이드오프 결정, 코드리뷰 — 이게 오히려 더 중요해진다.

비유하자면 솔로 연주자에서 지휘자로의 전환에 가깝다. 직접 연주하는 시간이 줄었지만, 전체 사운드를 만드는 사람은 여전히 개발자다.

---

## 아직 해결 안 된 것들

장밋빛 얘기만 하면 공정하지 않다.

컨텍스트 로트(context rot) 문제가 있다. 세션이 길어질수록 초반 맥락이 희석된다. Claude Code v2.1.216에서 긴 세션 성능 개선이 있었지만 근본적인 해결은 아직이다.

비용이 만만치 않다. 시니어 개발자 한 명이 Claude Code와 Codex를 모두 제대로 쓰면 월 100~200달러. 팀 단위로 도입하면 연간 수천만 원 수준의 툴링 비용이 생긴다.

신뢰 문제도 있다. 에이전트가 만든 코드를 얼마나 믿을 수 있나. 특히 복잡한 비즈니스 로직이 들어간 부분에서는 여전히 꼼꼼한 리뷰가 필요하다.

그리고 생태계 변동성. SpaceX의 Cursor 600억 달러 인수, OpenAI의 Windsurf 30억 달러 인수, Google의 Gemini CLI 유료화 — 상반기에만 판이 몇 번 뒤집혔다. 지금 쓰는 툴이 6개월 후에도 같은 형태로 존재할지 장담하기 어렵다.

---

## 정리

AI 코딩 툴이 자동완성에서 에이전트 위임으로 바뀌는 중이다. Claude Code와 Codex가 그 전선에 있고, Skills라는 개념이 팀의 지식을 에이전트에게 전달하는 방식을 바꾸고 있다. Cursor의 600억 달러 인수는 이 시장이 얼마나 진지하게 받아들여지고 있는지를 보여주는 숫자다.

개발자가 필요 없어지는 게 아니라, 무엇을 직접 하고 무엇을 위임할지 판단하는 능력이 더 중요해지는 방향이다. 어떻게 보면 시니어 개발자가 주니어를 다루는 방식과 비슷하다 — 명확한 컨텍스트를 주고, 결과물을 리뷰하고, 방향을 잡아준다.

다만 이 주니어는 잠도 안 자고, 불평도 없고, 매달 구독료만 낸다.

---

## References

- [Claude Code Changelog July 2026 — gradually.ai](https://www.gradually.ai/en/changelogs/claude-code/)
- [Claude Updates July 2026 — Releasebot](https://releasebot.io/updates/anthropic/claude)
- [Codex + ChatGPT + GPT-5.6: OpenAI's July 9 Release — kie.ai](https://kie.ai/blog/codex-chatgpt-work-gpt-5-6-analysis)
- [OpenAI launches GPT-5.6 — TechCrunch](https://techcrunch.com/2026/07/09/openai-launches-its-new-family-of-models-with-gpt-5-6/)
- [SpaceX to acquire Cursor for $60 billion — TechCrunch](https://techcrunch.com/2026/06/16/spacex-to-acquire-cursor-for-60b-in-stock-days-after-blockbuster-ipo/)
- [SpaceX Acquires Cursor: What the $60B Deal Means for Developers — Developers Digest](https://www.developersdigest.tech/blog/spacex-cursor-acquisition-developer-guide-2026)
- [Best Claude Code Skills to Try in 2026 — Firecrawl](https://www.firecrawl.dev/blog/best-claude-code-skills)
- [Claude Code Skills Complete Guide — Duet](https://duet.so/guides/claude-code-skills-complete-guide)
- [Best CLI AI Coding Agents in 2026 — DevToolLab](https://devtoollab.com/blog/top-cli-ai-coding-agents)
- [Claude Code vs Codex — Builder.io](https://www.builder.io/blog/codex-vs-claude-code)

---

*이전 글: [AI 에이전트가 직접 결제하는 시대 — 스테이블코인이 없으면 불가능한 이유](/research/ai-agent-stablecoin-payments-2026)*

---

> 본 글은 Joowon Kim의 개인 리서치 기록입니다.
