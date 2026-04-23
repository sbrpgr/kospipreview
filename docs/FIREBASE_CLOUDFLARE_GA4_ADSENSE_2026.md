# Firebase + Cloudflare + GA4 + AdSense 운영 가이드 (2026)

이 문서는 현재 저장소(`kospipreview`) 기준으로 **보안(DDoS) → 분석(GA4) → 수익화(AdSense)**를 순서대로 연결하는 실무 체크리스트입니다.

## 1. Cloudflare 먼저 연결 (보안)

1. 도메인 구매 후 Cloudflare 사이트 추가
2. 구매처 네임서버를 Cloudflare 네임서버로 변경
3. Cloudflare DNS에 Firebase Hosting 커스텀 도메인용 레코드 추가
4. DNS Proxy 상태를 반드시 `Proxied`(주황 구름) 유지

권장 보안 설정:
- `Security > WAF > Bot Fight Mode`: On
- `Security > Settings > Security Level`: Medium
- 필요 시 `Rate Limiting` 규칙 추가 (예: 초당 과도 요청 제한)

## 2. Firebase + GA4 연결 (분석)

1. Firebase Console > 프로젝트 설정 > 통합 > Google Analytics 연결
2. GA4 웹 스트림 생성 후 `Measurement ID` 확보 (`G-XXXXXXXXXX`)
3. 프로젝트 환경변수 설정:

```bash
# frontend/.env.local
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

코드 반영 상태:
- `frontend/src/components/third-party-scripts.tsx`
- `frontend/src/app/layout.tsx`

설명:
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`가 유효하면 `gtag.js`가 자동 삽입됩니다.
- `anonymize_ip: true`가 기본 적용됩니다.

## 3. AdSense 연결 (자동 광고)

### 3-1. ads.txt 배치

- 파일 경로: `frontend/public/ads.txt`
- 배포 후 확인 URL: `https://<도메인>/ads.txt`

현재 저장소에는 템플릿이 추가되어 있으므로, 실제 발급값으로 교체하면 됩니다:

```txt
google.com, pub-xxxxxxxxxxxxxxxx, DIRECT, f08c47fec0942fa0
```

### 3-2. 자동 광고 스크립트

환경변수 설정:

```bash
# frontend/.env.local
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
```

코드 반영 상태:
- `frontend/src/components/third-party-scripts.tsx`

설명:
- `NEXT_PUBLIC_ADSENSE_CLIENT`가 `ca-pub-` 형식일 때만 스크립트를 로드합니다.
- 자동 광고 on/off 및 오버레이 형식은 AdSense 콘솔에서 제어합니다.

### 3-3. Hosting 헤더

`firebase.json`에 `/ads.txt`용 헤더가 포함되어 있습니다:
- `Content-Type: text/plain; charset=utf-8`
- `Cache-Control: no-cache, no-store, must-revalidate`

## 4. 개인정보/동의 관리 (필수)

- EU 트래픽이 있으면 AdSense의 Privacy & Messaging에서 TCF 배너 구성
- 한국 이용자 대상 개인정보 고지 문구 점검
- 쿠키/광고 식별자 처리 범위를 정책 페이지와 일치시킬 것

## 5. 운영 방어 체크리스트

- Cloudflare WAF + Rate Limiting 적용
- Firebase App Check(웹) 적용 검토
- Cloud Functions/API는 호출 제한 정책 적용
- GA4 실시간 보고서로 비정상 유입 감시

## 6. 배포 전 최종 점검

1. `npm run build` 성공
2. `https://<도메인>/ads.txt` 노출 확인
3. 브라우저 DevTools에서 `googletagmanager` / `adsbygoogle` 로드 확인
4. Firebase 배포:

```bash
npx firebase-tools deploy --project kospipreview --only hosting
```

## 7. 배포 후 운영 도메인 확인

현재 운영 도메인 `kospipreview.com`은 Cloudflare 프록시 뒤에 있고,
Firebase 기본 도메인은 `kospipreview.web.app`입니다. 배포 후에는 두 경로를 모두 확인해야 합니다.

필수 확인 URL:

- `https://kospipreview.web.app/`
- `https://kospipreview.com/`
- `https://kospipreview.web.app/youtube-news`
- `https://kospipreview.com/youtube-news`

확인 기준:

- 응답 헤더의 `last-modified`가 방금 배포 시각에 가깝다.
- `kospipreview.com` 응답 헤더에 `Server: cloudflare`와 `CF-RAY`가 보인다.
- 메인 루트에 최신 네비게이션과 주요 섹션이 실제 HTML로 포함되어 있다.
- YouTube news 배포 시에는 루트에 `유튜버 뉴스`, `/youtube-news`, 최신 뉴스(데스크톱 최대 10개 / 모바일 5개)가 보인다.
- 동적 뉴스 API 확인:
  - `https://kospipreview.com/api/news/youtube-news.json`
  - `https://kospipreview.com/api/news/reports/2026-04-23/173502/index.html`
- Firebase clean URL 설정 때문에 `/news/YYYY-MM-DD/HHMMSS/index.html`은 `/news/YYYY-MM-DD/HHMMSS`로 301 이동할 수 있으며, 최종 clean URL이 `200 OK`이면 정상이다.

Cloudflare 관련 주의:

- Cloudflare가 `cf-cache-status: DYNAMIC`이어도 브라우저/edge 상태가 일시적으로 다르게 보일 수 있다.
- 사용자가 새 섹션을 못 본다고 하면 먼저 `kospipreview.web.app`과 `kospipreview.com`의 루트 HTML을 둘 다 비교한다.
- 필요하면 Cloudflare 캐시 purge 후 다시 확인한다.
- Firebase 배포 직후 다른 자동 배포가 이어지면 live release가 다시 덮일 수 있으므로, 최종 확인은 항상 마지막 배포 이후에 한다.

## 8. 보안 운영 참조 문서

- 취약점 점검/사고대응/키 회전/서버운영 표준:
  - `docs/SECURITY_OPERATIONS_RUNBOOK.md`
- 운영 명세 인덱스:
  - `docs/OPERATIONS_INDEX.md`
