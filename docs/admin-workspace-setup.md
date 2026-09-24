# 관리자 작업실 운영 설정

구현: `/admin` — Next.js Node.js 런타임 + SQLite + WebAuthn 패스키 + Telegram Bot API.

## 로컬 실행

Node.js 22 이상 권장. 루트 `.env.local`에 아래 항목을 설정한다. `.env` 파일은 저장소에 올리지 않는다.

```dotenv
ADMIN_BOOTSTRAP_TOKEN=랜덤한_최초_등록_비밀값
ADMIN_ORIGIN=http://localhost:3000
WEBAUTHN_RP_ID=localhost
ADMIN_DB_PATH=.data/workspace.sqlite
```

```bash
npm run dev
```

`/admin`에 접속해 `ADMIN_BOOTSTRAP_TOKEN`을 입력하고 패스키를 등록한다. 이 토큰은 최초 등록 요청에만 쓰이며 로그인 이후에는 필요하지 않다. 등록 후 토큰은 `.env.local`에서 지워도 된다. 패스키 등록은 localhost 또는 HTTPS에서 동작한다.

## 운영 서버 필수 조건

- 단일 Node.js 인스턴스 또는 SQLite 쓰기 잠금을 공유하는 단일 쓰기 노드.
- `.data` 대신 영속 볼륨에 `ADMIN_DB_PATH` 지정. 서버리스 임시 파일 시스템과 Edge Runtime은 지원하지 않는다.
- 외부에서 접속하는 주소와 일치하도록 `ADMIN_ORIGIN=https://실제-도메인`, `WEBAUTHN_RP_ID=실제-도메인` 설정. 서브도메인 사용 시 RP ID 범위도 확인한다.
- HTTPS 적용. 지문/Face ID 데이터는 기기에 머물며 서버에는 패스키 공개 키만 저장된다.
- 프록시/CDN은 `X-Forwarded-For`를 클라이언트가 임의 지정한 값이 아닌 실제 연결 IP로 덮어써야 한다. 로그인 rate limit이 이 헤더를 사용한다.
- `ADMIN_BOOTSTRAP_TOKEN`은 충분히 긴 임의 값으로 지정한 뒤 첫 관리자 등록 후 폐기.
- DB 볼륨 백업 및 복원 확인. SQLite DB를 실행 중 단순 파일 복사하면 WAL 데이터가 빠질 수 있으니 SQLite 백업 기능을 사용한다.

현재 프로젝트에는 배포 플랫폼, DB 서비스, 예약 실행 설정이 없다. 배포 대상이 서버리스이거나 영속 볼륨을 제공하지 않으면 운영 전에 PostgreSQL 등 관리형 DB로 옮겨야 한다.

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

서버 cron 또는 배포 플랫폼 스케줄러에서 15분마다 아래 요청을 보낸다. 마감·입금 개별 알림은 하루 한 번만 발송하고, 일일 요약은 설정 화면의 시각 이후 첫 호출에서 발송한다. 모든 날짜와 시각은 한국 시간 기준이다.

```bash
curl --request POST \
  --url "https://실제-도메인/api/cron/admin-reminders" \
  --header "Authorization: Bearer ${ADMIN_CRON_SECRET}"
```

작업 마감 전날/당일, 고객 확인 대기 장기화, 입금 예정/연체 알림을 보낸다. 성공한 알림은 중복 발송하지 않는다. 일시 실패는 한 실행에서 최대 3회 시도하고, 계속 실패하면 cron 다음 실행에서 재시도한다. 설정한 요약 시각부터 15분 안에 일일 요약이 도착한다. 알림에는 관리자 화면 링크가 포함되므로 `ADMIN_ORIGIN`은 공개 관리자 주소로 설정한다.

## 구현 범위와 제한

- 데이터는 SQLite에 서버 측 저장. 공개 포트폴리오 데이터와 관리자 API는 분리.
- 세션은 HttpOnly·SameSite Strict 쿠키, 7일 만료. 인증 수단 변경·로그인 시도는 제한 및 기록.
- 설정 화면에서 일회용 복구 코드 10개를 발급할 수 있다. 발급 직후에만 원문이 보이며, 새로 발급하면 기존 코드는 모두 무효화된다. 복구 코드를 사용하면 등록 패스키와 세션을 폐기하고 새 패스키 등록을 요구한다. 코드는 비밀번호 관리자 등 안전한 곳에 보관한다.
- 고객 상세 정보는 Telegram 메시지에 보내지 않는다. 알림에는 프로젝트명과 작업/청구 제목이 포함될 수 있다.
- 현재 알림 API는 외부 cron에 의존한다. 예약 실행이 멈추면 앱 데이터 입력은 되지만 Telegram 알림은 오지 않는다.
- 프로젝트/작업/입금 데이터 내보내기 기능은 아직 없다.
