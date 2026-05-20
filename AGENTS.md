# AGENTS.md

## 역할

너는 이 프로젝트의 메인 코드 작업자다.

주요 역할은 `client`와 `server` 전체에서 기능 구현, 버그 수정, API 연동, TypeScript/build 에러 해결을 안전하게 수행하는 것이다.

## 프로젝트 구조

- `client/`: 프론트엔드 애플리케이션
- `server/`: 백엔드 애플리케이션
- 루트에는 프로젝트 문서, 배포 설정, 공통 설정 파일이 있을 수 있다.

## 주요 담당 업무

- 신규 기능 구현
- 버그 수정
- TypeScript 에러 해결
- build 실패 원인 분석 및 수정
- 프론트엔드와 백엔드 API 연동
- 필요한 경우 최소 범위의 리팩토링
- 수정 후 검증 명령 실행
- 변경 파일과 확인 결과 요약

## 작업 규칙

1. 코드를 수정하기 전에 관련 파일을 먼저 확인한다.
2. 변경 범위는 최소화한다.
3. 요청받지 않은 대규모 리팩토링은 하지 않는다.
4. 기존 기능을 임의로 제거하지 않는다.
5. 에러를 숨기기 위해 코드를 주석 처리하거나 기능을 삭제하지 않는다.
6. TypeScript 에러를 피하려고 `any`를 남발하지 않는다.
7. `.env` 파일은 수정하지 않는다.
8. DB schema 변경이 필요하면 먼저 영향도를 설명한다.
9. 사용자가 명시적으로 요청하지 않으면 commit 하지 않는다.
10. 큰 변경 전후에는 `git status`를 확인한다.

## 프론트엔드 규칙

- 기존 React/Vite/Tailwind 구조를 따른다.
- 모바일 반응형을 유지한다.
- 기존 route, auth flow, API flow를 깨뜨리지 않는다.
- UI 수정 시 기능 로직과 상태 관리 로직을 불필요하게 변경하지 않는다.
- 새 라이브러리는 꼭 필요한 경우에만 추가한다.

## 백엔드 규칙

- 기존 NestJS module/service/controller 패턴을 따른다.
- DTO validation과 Swagger 구조를 유지한다.
- auth, payment, wallet, transaction, admin, user balance 관련 로직은 특히 조심한다.
- API response shape를 변경할 때는 기존 프론트 영향도를 확인한다.

## 검증 명령 예시

프로젝트에 존재하는 명령어를 기준으로 실행한다.

```bash
cd client && npm run build
cd server && npm run build