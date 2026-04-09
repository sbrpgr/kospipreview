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
