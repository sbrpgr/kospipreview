# Security & Operations Runbook (2026-04-09)

## 1) 점검 범위

- 코드/설정 내 비밀정보 노출 여부
- 프론트엔드/백엔드(파이썬) 의존성 취약점
- Firebase Hosting 보안 헤더
- 배포/자동화 워크플로 운영 리스크

## 2) 이번 점검 결과

- 저장소 내 서비스계정 개인키/일반 비밀키 패턴 재검: **미검출**
- `frontend` 의존성 감사(`npm audit --omit=dev`):
  - 기존 `next@15.3.0`에서 보안 권고 탐지
  - `next@15.5.15`로 상향 후 **취약점 0건**
- Python 의존성 감사(`python -m pip_audit -r requirements.txt`):
  - **취약점 0건**

## 3) 적용한 보안 조치

### 3.1 의존성 보안 패치

- `frontend/package.json`
  - `next` 버전 고정: `15.5.15`

### 3.2 Hosting 보안 헤더 강화

- `firebase.json`에 전역 보안 헤더 적용:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Resource-Policy: same-origin`
  - `Strict-Transport-Security: max-age=31536000`

### 3.3 정기 보안 감사 자동화

- 신규 워크플로: `.github/workflows/security-audit.yml`
  - 매일 1회 + 수동 실행
  - 비밀정보 패턴 스캔
  - `npm audit --omit=dev`
  - `pip-audit -r requirements.txt`

## 4) 배포/서버 운영 표준 절차

### 4.1 배포 전 체크

1. `frontend` 빌드 성공 확인
2. `npm audit --omit=dev` 결과 0건 확인
3. `python -m pip_audit -r requirements.txt` 결과 0건 확인
4. 변경사항에 비밀정보 포함 여부 확인

### 4.2 배포 실행

1. `git push origin main`
2. 필요 시 수동 배포:
   - `npx firebase-tools deploy --project kospipreview --only hosting --non-interactive`

### 4.3 배포 후 검증

1. 메인 페이지 정상 렌더 확인
2. `/data/prediction.json`, `/data/indicators.json` 최신 시각 갱신 확인
3. 응답 헤더 보안값 확인(브라우저 DevTools 또는 curl)
4. Cloudflare WAF/Bot 이벤트 급증 여부 확인

## 5) 자동화 워크플로 운영 가이드

- 데이터 갱신 워크플로:
  - `retrain-model`
  - `refresh-night-futures`
- 상시 루프 운영 시 주의:
  - 두 워크플로를 동시에 수동 루프로 과도하게 돌리지 않는다.
  - 장애/드리프트 의심 시 우선 루프 중단 후 단일 워크플로만 재시작한다.
  - 배포 결과가 꼬이면 `main` 최신 커밋 기준으로 재빌드/재배포한다.

## 6) 비밀키/계정 보안 정책

- 원칙:
  - 서비스 계정 JSON/개인키를 저장소, 이슈, 채팅에 남기지 않는다.
  - GitHub Secrets만 사용한다 (`FIREBASE_SERVICE_ACCOUNT`).
- 키 노출 의심 시 즉시:
  1. 기존 키 폐기(Disable/Delete)
  2. 신규 키 발급
  3. GitHub Secrets 교체
  4. 배포 재검증

## 7) Cloudflare + Firebase 운영 정책

- Cloudflare DNS `A(@)` 레코드는 `Proxied`(주황 구름) 유지
- WAF/Bot Fight Mode 활성 유지
- Firebase 기본 도메인(`*.web.app`)은 canonical 리다이렉트 정책 유지
- 대규모 이상 트래픽 시 Cloudflare Rate Limit 임시 상향

## 8) 정기 점검 체크리스트

### 매일

- Actions 실패 런/지연 런 확인
- 지표 JSON 갱신 시각 확인
- Cloudflare 보안 이벤트 확인

### 매주

- `security-audit` 결과 확인
- 의존성 업데이트 후보 검토
- 데이터 품질(이상치/고정값) 샘플 점검

### 매월

- 비밀키/권한 최소화 점검(IAM)
- 배포/복구 리허설(롤백 테스트)

