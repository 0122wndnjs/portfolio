# Research Markdown Guide

이 폴더의 글은 리서치 페이지에 자동 연동됩니다.

## 파일 규칙

- 글 1개당 md 파일 1개
- 파일명은 영문 slug와 동일하게 유지
- slug는 발행 후 변경하지 않기

## 권장 구조 (다국어 대비)

- 단일 언어(현재): `docs/research/<slug>.md`
- 다국어 전환 시: `docs/research/ko/<slug>.md`, `docs/research/en/<slug>.md`

## 필수 frontmatter

```yaml
---
title: "짧은 제목"
subtitle: "선택: 부제"
lang: ko
slug: stablecoin-payment-economics-2026
canonicalSlug: stablecoin-payment-economics-2026
date: 2026-04-16
updatedAt: 2026-04-17
category: Web3 Infrastructure / PayFi
tags: [stablecoin, PayFi, L2]
description: "요약 1~2문장"
author: Joowon Kim
readingTime: "12 min"
status: published
---
```

## 작성 체크리스트

- `title`은 너무 길지 않게 유지 (권장 25~35자)
- `description`은 1~2문장으로 명확하게
- `date`는 최초 발행일, `updatedAt`은 수정일
- `tags`는 소문자 kebab-case 권장
- 본문 첫 줄에 중복 H1은 생략 가능 (페이지 헤더에서 title 출력됨)
