# 관리자 작업실 운영 설정

구현: `/admin` — Next.js Node.js 런타임 + Supabase Postgres + WebAuthn 패스키 + Telegram Bot API.

## 로컬 실행

Node.js 22 이상 권장. 먼저 Supabase 프로젝트의 SQL Editor에서
[`supabase/migrations/20260924000000_admin_workspace.sql`](../supabase/migrations/20260924000000_admin_workspace.sql)을 실행한다.
루트 `.env.local`에 아래 항목을 설정한다. `.env` 파일은 저장소에 올리지 않는다.

```dotenv
ADMIN_BOOTSTRAP_TOKEN=랜덤한_최초_등록_비밀값
ADMIN_ORIGIN=http://localhost:3000
WEBAUTHN_RP_ID=localhost
ADMIN_DATABASE_URL=postgresql://postgres.PROJECT_REF:비밀번호@POOLER_HOST:6543/postgres
```

```bash
npm run dev
```

로컬에서 운영 DB를 연결하면 테스트 입력이 실제 업무 데이터에 섞인다. 로컬 전용 Postgres를 쓰려면 연결 문자열 끝에 `?sslmode=disable`을 붙인다(예: `postgresql://postgres@127.0.0.1:5432/admin?sslmode=disable`). 이 경우 TLS 없이 연결한다.

`/admin`에 접속해 `ADMIN_BOOTSTRAP_TOKEN`을 입력하고 패스키를 등록한다. 이 토큰은 최초 등록 요청에만 쓰이며 로그인 이후에는 필요하지 않다. 등록 후 토큰은 `.env.local`에서 지워도 된다. 패스키 등록은 localhost 또는 HTTPS에서 동작한다.

## Supabase + Vercel 운영 설정

- Supabase 프로젝트의 **Connect → Transaction pooler**에서 연결 문자열을 복사한다. 비밀번호의 `@`, `#`, `/` 등 특수문자는 URL 인코딩된 연결 문자열을 사용한다.
- Vercel 프로젝트의 **Settings → Environment Variables → Production**에 `ADMIN_DATABASE_URL`, `ADMIN_ORIGIN`, `WEBAUTHN_RP_ID`, `ADMIN_BOOTSTRAP_TOKEN`을 설정한 뒤 재배포한다. `NEXT_PUBLIC_` 접두사는 붙이지 않는다.
- DB 클라이언트는 Vercel 서버리스용으로 연결 1개, TLS, prepared statements 비활성화로 설정되어 있다.
- 외부에서 접속하는 주소와 일치하도록 `ADMIN_ORIGIN=https://실제-도메인`, `WEBAUTHN_RP_ID=실제-도메인` 설정. 운영(`NODE_ENV=production`)에서 `ADMIN_ORIGIN`이 없으면 관리자 화면과 API가 오류를 낸다(Host 헤더로 출처를 추정하지 않도록 의도한 동작). 미리보기(Preview) 배포에서는 관리자 영역이 동작하지 않는다. 서브도메인 사용 시 RP ID 범위도 확인한다.
- HTTPS 적용. 지문/Face ID 데이터는 기기에 머물며 서버에는 패스키 공개 키만 저장된다.
- 프록시/CDN은 `X-Forwarded-For`를 클라이언트가 임의 지정한 값이 아닌 실제 연결 IP로 덮어써야 한다. 로그인 rate limit이 이 헤더를 사용한다.
- `ADMIN_BOOTSTRAP_TOKEN`은 충분히 긴 임의 값으로 지정한 뒤 첫 관리자 등록 후 폐기.
- Supabase 프로젝트의 백업 정책을 확인한다. 무료 플랜은 자동 백업이 제공되지 않으므로 업무 데이터는 별도 백업 계획이 필요하다.

`ADMIN_DB_PATH`는 더 이상 사용하지 않는다. 패스키·세션·복구 코드는 RP ID별로 구분하므로 로컬과 운영 도메인에서 각각 패스키를 등록할 수 있다. 다만 로컬 개발에서 운영 DB를 연결하면 프로젝트 등 **업무 데이터는 공유**되므로 테스트 입력도 운영 데이터에 반영된다.

## 기존 로컬 SQLite 데이터 이전

로컬에 입력한 프로젝트·작업·견적·입금·미팅 데이터가 있으면, SQL 스키마 생성 후 **대상 테이블이 비어 있을 때만** 아래 명령으로 이전한다. `sqlite3` CLI가 필요하다. 이전 도중 오류가 나면 Postgres 트랜잭션이 롤백된다. 원본 SQLite는 변경하지 않는다.

```bash
node --env-file=.env.local scripts/migrate-admin-sqlite.mjs .data/workspace.sqlite
```

이전 스크립트는 패스키·세션·복구 코드·텔레그램 연결 설정을 복사하지 않는다. 운영 도메인에서 `ADMIN_BOOTSTRAP_TOKEN`으로 패스키를 새로 등록하고 복구 코드를 다시 발급한다. 이전 완료 후 로컬 DB 파일은 확인 전까지 보관한다.

## Telegram 알림 설정

BotFather에서 봇 생성 후 아래 환경 변수를 서버에 설정한다. 봇 사용자 이름 앞에 `@`를 붙이지 않는다.

```dotenv
TELEGRAM_BOT_TOKEN=봇_토큰
TELEGRAM_BOT_USERNAME=봇_사용자이름
TELEGRAM_WEBHOOK_SECRET=영문_숫자_밑줄_하이픈으로_된_임의_비밀값
ADMIN_CRON_SECRET=별도의_긴_임의_비밀값
```

배포 후 봇 webhook을 한 번 등록한다.

```bash
curl --request POST \
  --url "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  --data-urlencode "url=https://실제-도메인/api/telegram/webhook" \
  --data-urlencode "secret_token=${TELEGRAM_WEBHOOK_SECRET}"
```

관리자 설정에서 **텔레그램 연결**을 누르고 열린 봇 대화에서 Start를 눌러 연결한다. 연결 코드는 10분 후 만료하며 한 번만 쓸 수 있다. 연결 후 설정 화면에서 테스트 알림을 확인한다.

## 예약 알림

`vercel.json`에 Vercel Cron이 등록되어 있다. 매일 00:00 UTC(한국 시간 09시대, Hobby 플랜은 1시간 안에서 실행 시각이 달라질 수 있음)에 `GET /api/cron/admin-reminders`를 호출한다. 이 하루 1회 실행은 설정 화면의 요약 시각과 관계없이 일일 요약을 함께 보낸다.

- Vercel 프로젝트 환경변수에 `CRON_SECRET`(16자 이상 임의 값)을 추가한다. Vercel이 이 값을 `Authorization: Bearer` 헤더로 보낸다. 없으면 cron 호출이 401로 거부된다.
- Hobby 플랜은 하루 1회보다 잦은 cron을 허용하지 않는다. 더 자주 받으려면 외부 cron(예: cron-job.org)에서 아래처럼 15분마다 POST를 보낸다. 이 경우 일일 요약은 설정 시각 이후 첫 호출에서 발송한다.

마감·입금 개별 알림은 하루 한 번만 발송한다. 모든 날짜와 시각은 한국 시간 기준이다. 알림 설정을 한 번도 저장하지 않았으면 기본값(전체 알림 켜짐, 확인 대기 3일, 요약 09:00)을 사용한다.

```bash
curl --request POST \
  --url "https://실제-도메인/api/cron/admin-reminders" \
  --header "Authorization: Bearer ${ADMIN_CRON_SECRET}"
```

작업 마감 전날/당일, 고객 확인 대기 장기화, 입금 예정/연체 알림을 보낸다. 성공한 알림은 중복 발송하지 않는다. 일시 실패는 한 실행에서 최대 3회 시도하고, 계속 실패하면 cron 다음 실행에서 재시도한다. 설정한 요약 시각부터 15분 안에 일일 요약이 도착한다. 알림에는 관리자 화면 링크가 포함되므로 `ADMIN_ORIGIN`은 공개 관리자 주소로 설정한다.

## DB 제약 마이그레이션 (2026-09-25)

상태값·금액·날짜 형식 CHECK 제약과 연결 테이블 ON DELETE CASCADE를 추가한다. 컬럼 변경은 없어 앱은 적용 전후 모두 동작한다.

1. Supabase SQL Editor에서 [`supabase/checks/20260925_admin_constraints_precheck.sql`](../supabase/checks/20260925_admin_constraints_precheck.sql)을 실행해 모든 `bad` 값이 0인지 확인한다. 0이 아닌 항목은 데이터를 먼저 정리한다.
2. 적용 전에 아래 백업을 한 번 받는다.
3. [`supabase/migrations/20260925000000_admin_constraints.sql`](../supabase/migrations/20260925000000_admin_constraints.sql)을 실행한다. 한 트랜잭션이라 실패하면 전체가 롤백된다. 빈 문자열 날짜(`''`)는 NULL로 정리된다. 다시 실행해도 된다.

## 백업과 복원

- **설정 → 데이터 백업 → 내보내기**: 프로젝트·작업·청구·입금·견적·미팅과 알림 설정을 JSON으로 내려받는다. 패스키·세션·복구 코드는 포함하지 않는다.
- **DB 전체 백업**: `npm run backup:admin` (저장 폴더를 바꾸려면 `npm run backup:admin -- ~/경로`). 기본 저장 위치는 `~/Backups/portfolio-admin`이며 저장소 안 경로는 거부한다(공개 저장소에 고객 데이터가 커밋되는 것 방지). 30일 지난 파일은 자동 삭제한다.
  - `pg_dump`가 필요하며 **메이저 버전이 Supabase 서버 이상**이어야 한다. 버전이 낮으면 `server version mismatch`로 실패한다. `brew install postgresql@17` 후 `PG_DUMP=/opt/homebrew/opt/postgresql@17/bin/pg_dump npm run backup:admin`처럼 지정한다.
  - 트랜잭션 풀러(6543)는 pg_dump를 지원하지 않아 스크립트가 세션 풀러(5432)로 바꿔 접속한다. 다른 주소를 쓰려면 `ADMIN_BACKUP_DATABASE_URL`을 지정한다.
  - 정기 실행이 필요하면 macOS `launchd` 또는 `crontab`에 등록한다.
- 복원: `pg_restore --clean --if-exists --no-owner --dbname "$ADMIN_BACKUP_DATABASE_URL" 백업파일.dump`. 운영 DB에 바로 복원하기 전에 빈 DB에서 먼저 확인한다.

## 구현 범위와 제한

- 데이터는 Supabase Postgres에 서버 측 저장. 모든 관리자 테이블에 RLS를 켜고 Data API 정책은 만들지 않았다. DB 연결 문자열은 서버 전용 비밀값이다.
- 세션은 HttpOnly·SameSite Strict 쿠키, 7일 만료. 인증 수단 변경·로그인 시도는 제한 및 기록.
- 패스키 추가·삭제, 복구 코드 발급·폐기, 텔레그램 연결·해제, 다른 세션 종료, 데이터 내보내기는 로그인 후 5분이 지났으면 패스키를 다시 확인한다(화면에서 자동으로 요청). 복구 직후처럼 등록된 패스키가 없으면 재확인 없이 진행한다.
- 프로젝트·작업·견적·미팅 수정 폼은 불러온 시점의 버전을 함께 보낸다. 그 사이 다른 기기나 탭에서 먼저 수정했으면 저장을 거부하고 새로고침을 안내한다.
- 설정 화면에서 일회용 복구 코드 10개를 발급할 수 있다. 발급 직후에만 원문이 보이며, 새로 발급하면 기존 코드는 모두 무효화된다. 복구 코드를 사용하면 등록 패스키와 세션을 폐기하고 새 패스키 등록을 요구한다. 코드는 비밀번호 관리자 등 안전한 곳에 보관한다.
- 고객 상세 정보는 Telegram 메시지에 보내지 않는다. 알림에는 프로젝트명과 작업/청구 제목이 포함될 수 있다.
- 현재 알림 API는 외부 cron에 의존한다. 예약 실행이 멈추면 앱 데이터 입력은 되지만 Telegram 알림은 오지 않는다.
- 테스트: `npm test`(입금 계산, 알림 대상 계산, 날짜·입력 검증, API 라우팅 단위 테스트).
