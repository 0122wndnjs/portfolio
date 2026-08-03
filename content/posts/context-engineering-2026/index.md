---
title: Context Engineering — 프롬프트를 잘 쓰는 게 아니라 맥락을 설계하는 시대
description: 프롬프트 엔지니어링이라는 말이 조용히 사라지고 있다. 그 자리를 대신하는 Context Engineering이 뭔지, 왜 지금 중요한지, 실무에서 어떻게 적용하는지 자세히 정리했다.
date: 2026-07-30
tags: [AI, context-engineering, prompt-engineering, Claude-Code, RAG, MCP, LLM, agentic-AI]
author: Joowon Kim
---

# Context Engineering
**프롬프트를 잘 쓰는 게 아니라 맥락을 설계하는 시대**

---

2023년쯤엔 프롬프트를 잘 쓰는 게 진짜 스킬처럼 느껴졌다. "이렇게 물어보면 답이 더 잘 나온다"는 팁들이 돌아다녔고, 프롬프트 엔지니어라는 직함까지 생겼다.

그런데 요즘 AI 코딩 툴을 매일 쓰면서 느끼는 게 있다. 프롬프트를 아무리 정교하게 써도, 결과물의 질을 가르는 건 프롬프트 자체가 아니라 그 순간 AI가 뭘 보고 있느냐다. 같은 질문이라도 AI가 코드베이스 구조를 알고 있을 때와 모를 때, 이전 대화 맥락이 남아있을 때와 없을 때 결과가 완전히 다르다.

이 감각을 업계에서는 Context Engineering이라고 부르기 시작했다. 그리고 이게 단순한 신조어가 아니라 실제로 일하는 방식을 바꾸고 있다는 걸 최근 몇 달간 체감하고 있다.

---

## 프롬프트 엔지니어링과 뭐가 다른가

가장 명쾌한 정의는 Andrej Karpathy가 내린 것이다. 사람들이 프롬프트라고 하면 보통 일상적으로 LLM에게 던지는 짧은 작업 지시를 떠올린다. Context Engineering은 그보다 훨씬 넓다 — 모델이 작업을 제대로 수행하는 데 필요한 모든 것을, 올바른 형식으로, 올바른 시점에 제공하는 동적 시스템을 설계하는 일이다.

비유하자면 이렇다. 프롬프트 엔지니어링이 컨텍스트 창(context window) *안에서* 뭘 하느냐의 문제라면, Context Engineering은 그 창에 *무엇을 채울지 결정하는* 문제다.

Neo4j의 정리도 비슷하다. 프롬프트 엔지니어링은 LLM에게 주는 일회성 텍스트 지시에 집중하고, Context Engineering은 모델과의 지속적인 상호작용을 위한 정보 아키텍처 전체에 집중한다. 프롬프트가 "어떻게 물을 것인가"의 문제라면, 컨텍스트는 "에이전트가 행동하는 순간 무엇을 알고, 보고, 기억하고 있는가"의 문제다.

DataHub가 실시한 2026년 설문에서 IT·데이터 리더의 82%가 "프롬프트 엔지니어링만으로는 AI를 스케일에 맞게 운용하기에 더 이상 충분하지 않다"고 답했다. 95%는 2026년 안에 Context Engineering 트레이닝에 투자할 계획이라고 밝혔다. 버즈워드 수준을 넘어섰다는 뜻이다.

---

## 왜 지금 이게 중요해졌나

이유는 단순하다. AI가 한 번의 질문-답변으로 끝나는 도구에서, 여러 단계를 거쳐 작업을 수행하는 에이전트로 바뀌었기 때문이다.

2023년의 전형적인 LLM 사용 패턴은 단일 턴이었다. 질문을 하나 던지고, 답을 하나 받는다. 필요한 정보를 프롬프트 하나에 다 욱여넣으면 됐다. 지금은 다르다. Claude Code 같은 에이전트는 파일을 읽고, 코드를 수정하고, 명령어를 실행하고, 결과를 확인하고, 다시 수정하는 걸 수십 번 반복한다. Anthropic의 2026년 데이터에 따르면 에이전트가 사람 개입 없이 평균 20번의 자율적인 행동을 연속으로 수행한다. 이 긴 흐름 전체에서 AI가 뭘 기억하고 뭘 잊는지가 결과를 좌우한다.

여기서 나오는 게 "컨텍스트 로트(context rot)"라는 개념이다. 컨텍스트 창에 정보가 많이 쌓일수록 모델의 정확도가 떨어지는 현상이다. 놀라운 건 이게 컨텍스트 창의 물리적 한계보다 훨씬 일찍 시작된다는 점이다. Databricks의 연구에 따르면 정확도 저하가 3만 2천 토큰 부근에서부터 시작된다. 100만 토큰짜리 컨텍스트 창을 지원하는 모델도 있는데, 실제로 안정적으로 쓸 수 있는 유효 범위는 그보다 훨씬 작다는 뜻이다. 2026년 1월 발표된 Norman Paulsen의 연구는 이 "최대 유효 컨텍스트 창(MECW)"이 광고되는 스펙과 크게 다르다는 걸 보여줬다. 일부 최상위권 모델도 단 1,000토큰만에 심각한 성능 저하를 보였다.

즉 "컨텍스트 창이 크니까 다 집어넣으면 되지 않나"라는 생각은 틀렸다. 오히려 뭘 넣지 않을지를 설계하는 게 더 중요해졌다.

---

## 컨텍스트가 망가지는 네 가지 방식

Firecrawl의 정리에 따르면 컨텍스트는 크게 네 가지 방식으로 실패한다. 이 구분이 실무에서 문제를 진단할 때 꽤 유용하다.

**포이즈닝(Poisoning)**. 컨텍스트 안에 잘못된 정보나 환각(hallucination)이 한 번 들어가면, 이후 모든 응답이 그 오류를 사실인 것처럼 참조한다. 에이전트가 초반에 존재하지 않는 함수를 "발견했다"고 잘못 판단하면, 그 뒤 작업 전체가 그 가정 위에서 진행된다.

**주의 분산(Distraction)**. 컨텍스트에 관련 없는 정보가 너무 많으면 모델이 정말 중요한 신호를 놓친다. 긴 세션에서 여러 파일을 계속 읽다 보면, 정작 지금 풀어야 할 문제와 상관없는 내용이 컨텍스트 대부분을 차지하게 된다.

**혼동(Confusion)**. 서로 관련 없는 정보가 뒤섞이면 모델이 잘못된 연결을 만든다. 두 가지 다른 작업의 맥락이 한 세션에 섞이면, 한쪽 작업의 논리를 다른 쪽에 잘못 적용하는 일이 생긴다.

**충돌(Clash)**. 컨텍스트 안에 서로 모순되는 지시나 정보가 있으면 모델이 어느 쪽을 따라야 할지 판단하지 못한다. CLAUDE.md에 "TypeScript strict 모드를 쓴다"고 써놨는데 실제 코드베이스는 그렇지 않은 경우가 대표적이다.

이 네 가지를 알고 나면, "왜 갑자기 에이전트가 이상한 소리를 하지"라는 순간을 진단하기가 훨씬 쉬워진다.

---

## 실패 사례로 보면 더 명확하다

Gartner의 2026년 전망은 꽤 냉정하다. 에이전트 배포의 50%가 거버넌스 부족으로 실패할 것이라고 예측했다. The Context Graph의 조사에 따르면 주요 프레임워크에서 멀티 에이전트 시스템의 실패율이 41~87%에 달한다. 그리고 이 실패들이 프로토타입 단계가 아니라 실제 프로덕션 인시던트라는 게 핵심이다.

더 흥미로운 지적은 이거다. "에이전트가 실패하는 건 추론을 잘못해서가 아니다. 망가진 컨텍스트 위에서 정확하게 추론했기 때문이다." 모델 자체는 잘못이 없는데, 애초에 모델에게 잘못된 혹은 불충분한 정보가 주어졌다는 뜻이다. 2025년에 에이전트를 배포한 팀들이 2026년 내내 눈에 보이지도 않는 컨텍스트 문제를 디버깅하는 데 시간을 썼다는 관찰도 있다.

반대로 잘 설계했을 때의 사례도 있다. 공공안전 분야 문서 처리를 하는 DroneSense는 컨텍스트 엔지니어링을 도입한 뒤 문서 한 건당 처리 시간을 30분 이상에서 2분으로 줄였다. 93% 감소다. 핵심은 모델을 바꾼 게 아니라 모델에게 주는 입력·출력 구조를 스키마 기반으로 엄격하게 통제한 것이었다.

Workday 사례도 참고할 만하다. Workday는 여러 AI 에이전트(ChatGPT, Claude, Vertex AI 등)가 매출 분석 작업을 할 때 서로 다른 답을 내놓는 문제를 겪었다. 같은 질문에 에이전트마다 다른 답을 하니 신뢰도가 떨어졌다. 해결책은 각 에이전트가 개별적으로 데이터를 해석하게 두는 대신, MCP 서버를 통해 모든 에이전트가 동일한 거버넌스된 컨텍스트 계층을 참조하게 만드는 것이었다. 어떤 AI 툴을 쓰든 같은 "의미 언어"를 공유하게 한 셈이다.

기업 내부 검색 툴을 멀티 에이전트 어시스턴트로 전환한 한 프로젝트 사례도 이 차이를 잘 보여준다. 건설 작업 지시서처럼 수백 개 속성과 중첩 구조를 가진 복잡한 운영 데이터를 다루는 시스템이었는데, 컨텍스트 없이 질문하면 모델은 "네트워크를 확인해보세요" 같은 일반적인 답만 내놓았다. 반면 오후 3시 45분의 데이터베이스 에러, 그 직후의 CPU 스파이크, 몇 분 전의 배포 기록을 시간순으로 정리해서 함께 제공하자, 모델은 "배포 직후 발생한 데이터베이스 데드락이 API 스레드 풀을 고갈시켜 서비스가 다운됐다"는 정확한 인과관계를 설명해냈다. 같은 모델, 같은 질문인데 컨텍스트의 유무가 답의 질을 완전히 갈랐다.

이 사례들을 보면 공통된 결론이 나온다. 지금 프로덕션에서 발생하는 AI 실패의 대부분은 모델의 실패가 아니라 컨텍스트의 실패라는 것이다.

---

## 실제로 어떻게 하는 건가

이론은 여기까지 하고, 실제 기법들을 정리해봤다. Claude Code를 기준으로 설명하면 감이 더 잘 잡힌다.

**CLAUDE.md — 프로젝트 단위 지식 파일**

프로젝트 루트에 CLAUDE.md 파일을 두면 에이전트가 세션마다 이걸 먼저 읽는다. 코드 컨벤션, 아키텍처 결정, 자주 하는 실수 같은 걸 여기에 정리해두면, 매번 설명할 필요가 없어진다.

의외로 중요한 게 "하지 말아야 할 것"을 명시하는 부분이다. Bind AI의 분석에 따르면 CLAUDE.md에서 가장 가치 있는 섹션이 "DO NOT" 부분이다. "콜백을 쓰지 마라"고 명시적으로 써두면, 모델의 학습 데이터가 콜백 패턴에 편향돼 있어도 그 방향으로 제안하는 빈도가 확 줄어든다. 단순히 예시를 안 주는 것보다, 금지 패턴을 명확히 이름 붙이는 게 훨씬 효과적이다.

좋은 CLAUDE.md 하나를 작성하는 데 30~60분 정도 걸리는데, 이 투자가 웬만한 프로젝트에서는 세션 한 번만 진행해도 회수된다는 게 업계의 공통된 의견이다.

**압축(Compaction) — 대화가 길어질 때**

세션이 길어지면 컨텍스트가 한계에 가까워진다. Claude Code는 컨텍스트 창 사용량이 일정 수준(약 95~98%)에 도달하면 자동으로 압축을 실행한다. 지금까지의 대화를 요약하고, 그 요약으로 세션을 이어간다.

수동으로 `/compact` 명령을 실행할 수도 있다. 실무 팁으로는, 세션이 한 시간을 넘어가면 자동 압축을 기다리지 말고 직접 압축하는 게 낫다는 조언이 많다. 다만 압축이 만능은 아니다. Cognition 같은 팀은 일반적인 요약 모델이 핵심 결정 사항을 제대로 보존하지 못한다고 판단해서, 압축 전용으로 파인튜닝한 모델을 따로 쓴다.

**서브에이전트 — 컨텍스트 격리**

큰 작업을 할 때 메인 에이전트가 모든 걸 다 처리하면 컨텍스트가 금방 오염된다. Claude Code의 서브에이전트 시스템은 이 문제를 구조적으로 해결한다. 특정 작업을 전문 서브에이전트에게 위임하면, 그 서브에이전트는 자기만의 독립된 컨텍스트 창과 제한된 도구 권한을 가지고 작업한다. 작업이 끝나면 1,000~2,000 토큰 정도로 압축된 요약만 메인 에이전트에게 돌려준다.

Anthropic이 자체적으로 운영하는 멀티 에이전트 리서치 시스템도 이 구조를 쓴다. 메인 에이전트는 오케스트레이션에만 집중하고, 탐색이나 조사 같은 무거운 작업은 서브에이전트가 처리해서 결과만 요약해 돌려주는 방식이다.

**RAG — 코드베이스에 적용할 때는 신중해야 한다**

RAG(검색 증강 생성)는 컨텍스트 엔지니어링에서 가장 널리 쓰이는 기법 중 하나지만, 코드에 적용할 때는 잘못 구현되는 경우가 많다. 텍스트를 고정 크기로 잘라서 임베딩하고 코사인 유사도로 상위 K개를 가져오는 방식(naive RAG)은 코드에서는 결과가 별로다. 코드는 일반 텍스트와 다른 구조적 특성이 있다 — 함수에는 진입점과 의존성이 있고, 클래스는 계층 구조를 가지며, 타입은 여러 파일에 걸쳐 서로를 참조한다. 함수 중간을 토큰 경계에서 잘라버리면 맥락이 깨진다.

Claude Code가 실제로 쓰는 방식은 다르다. RAG로 전체 코드베이스를 미리 임베딩해두는 대신, glob과 grep으로 필요한 시점에 필요한 파일만 즉석에서 찾아 읽는다. 이걸 "just-in-time 컨텍스트 로딩"이라고 부른다. 심지어 도구 정의(tool definition) 자체도 이 원칙이 적용된다. 모든 MCP 툴의 정의를 세션 시작부터 다 로드하는 대신, 필요할 때만 발견하고 로드해서 컨텍스트 사용량을 95% 줄인다.

---

## MCP는 이 전체 그림에서 어디에 들어가나

Model Context Protocol(MCP)을 Context Engineering의 하위 개념으로 오해하기 쉬운데, 정확히는 인프라 레이어에 가깝다. MCP는 에이전트가 외부 데이터소스나 툴에 접근하는 표준화된 방식을 정의한다. Context Engineering이 "에이전트가 지금 이 순간 무엇을 알아야 하는가"를 설계하는 일이라면, MCP는 그 정보를 실제로 가져오는 배관(pipe) 역할을 한다.

IntuitionLabs의 분석에 따르면 앞으로 LLM API들이 거대한 텍스트 프롬프트에 모든 걸 욱여넣는 대신, 메모리나 툴 같은 컨텍스트 채널을 프롬프트와 별개로 네이티브하게 지원하는 방향으로 갈 거라고 본다. MCP와 이런 표준화 노력들이 그 과도기 단계에 있다.

---

## 실무에서 느낀 것

병원 사이트 여러 개를 관리하면서 CLAUDE.md를 프로젝트마다 다르게 써봤는데, 확실히 차이가 난다. 클리닉 A는 Next.js 15 App Router를 쓰고, 클리닉 B는 아직 Pages Router 기반이다. 이걸 CLAUDE.md에 명확히 안 써두면, 에이전트가 최신 문서 기준으로 코드를 짜서 실제 프로젝트와 안 맞는 코드를 내놓는 경우가 종종 있었다.

그리고 확실히 체감한 게 있다. 세션이 길어질수록 결과물의 질이 떨어지는 순간이 온다. 예전엔 "AI가 지쳤나" 싶었는데, 지금 보니 컨텍스트 로트였다. 복잡한 작업을 할 땐 중간중간 `/compact`를 직접 실행하거나, 아예 세션을 새로 시작해서 필요한 맥락만 다시 주는 게 결과물이 더 안정적이다.

블록체인 프로젝트에서는 서브에이전트 개념을 명시적으로 안 쓰더라도, 작업을 쪼개서 별도 세션으로 진행하는 게 비슷한 효과를 낸다는 걸 경험적으로 알게 됐다. 스마트 컨트랙트 로직 검토와 프론트엔드 UI 작업을 한 세션에서 계속 왔다갔다 하면, 어느 순간 에이전트가 두 맥락을 섞어서 이상한 제안을 하기 시작한다.

---

## 결국 뭐가 달라지는가

프롬프트 잘 쓰는 사람과, 컨텍스트를 설계할 줄 아는 사람의 차이가 점점 벌어지고 있다.

전자는 "이렇게 물어보면 답이 더 잘 나온다"는 요령의 영역이다. 후자는 시스템을 만드는 일이다. 어떤 정보를 언제, 어떤 형식으로 에이전트에게 줄지, 무엇을 잘라내고 무엇을 남길지, 작업을 언제 분리하고 언제 압축할지 — 이걸 설계하는 능력이 지금 AI 툴에서 좋은 결과를 뽑아내는 사람과 그렇지 못한 사람을 가르는 진짜 기준이 되어가고 있다.

프롬프트 엔지니어링이 죽었다는 말은 좀 과한 것 같다. 여전히 명확하게 질문하는 건 중요하다. 다만 그것만으로는 부족해졌다는 게 맞는 말인 것 같다. 지금 AI 툴을 매일 쓰는 사람이라면, 다음번엔 "뭐라고 물어볼까"보다 "지금 이 에이전트가 뭘 알고 있어야 하지"를 먼저 생각해보는 게 결과물의 질을 바꾸는 더 빠른 길일 수 있다.

---

## References

- [Context Engineering vs Prompt Engineering for AI Agents — Firecrawl (2026.02)](https://www.firecrawl.dev/blog/context-engineering)
- [Why AI teams are moving from prompt engineering to context engineering — Neo4j (2026.06)](https://neo4j.com/blog/agentic-ai/context-engineering-vs-prompt-engineering/)
- [Context Engineering vs Prompt Engineering — DataHub (2026.04)](https://datahub.com/blog/context-engineering-vs-prompt-engineering/)
- [Context Engineering vs. Prompt Engineering Explained — IntuitionLabs (2026.04)](https://intuitionlabs.ai/articles/context-engineering-vs-prompt-engineering-ai)
- [Context Engineering 2026: Complete Developer Guide — Bind AI (2026.06)](https://blog.getbind.co/context-engineering-in-2026-the-complete-developers-guide/)
- [Context Engineering: Agent Reliability Playbook 2026 — Digital Applied (2026.05)](https://www.digitalapplied.com/blog/context-engineering-agent-reliability-playbook-2026)
- [Context Engineering Beyond CLAUDE.md: The 5-Layer Hierarchy — Pixelmojo (2026.02)](https://www.pixelmojo.io/blogs/context-engineering-ai-coding-agents-beyond-claude-md)
- [Context Engineering: Why More Tokens Makes Agents Worse — MorphLLM (2026.02)](https://www.morphllm.com/context-engineering)
- [Context Engineering in 2026: From Karpathy's Tweet to Production Infrastructure — The Context Graph (2026.04)](https://thecontextgraph.co/memos/context-engineering-2026-from-tweet-to-infrastructure)
- [Context Engineering for Production LLM Applications — Logic (2026.05)](https://logic.inc/resources/context-engineering-for-production-llm-applications)
- [Top Context Engineering Platforms Compared — Atlan (2026.04)](https://atlan.com/know/context-engineering-platforms-comparison/)
- [AI Context Engineering in 2026: Why Prompt Engineering Is No Longer Enough — Sombra (2026.02)](https://sombrainc.com/blog/ai-context-engineering-guide)
- [Context Engineering: memory, compaction, and tool clearing — Claude Cookbook](https://platform.claude.com/cookbook/tool-use-context-engineering-context-engineering-tools)

---

*이전 글: [AI가 SEO를 죽이고 있다 — AEO 시대가 온다는 게 사실일까](/research/ai-seo-aeo-2026)*

---

> 본 글은 Joowon Kim의 개인 리서치 기록입니다.
