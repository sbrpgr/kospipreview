# Operations Spec Index

## 2026-04-10 기준 분리 명세

- 예측 보정(내부 계산)은 `KRX 동기화 기준(15:30 KST)`을 유지한다.
- 지표 카드 표시(`changePct`)는 `미국 정규장 개장(09:30 ET)` 기준으로 계산한다.
- `indicators.json`에 `displayChangeBasis`/`displayChangeBasisLabel` 및 각 카드의 `changeBasis`를 포함해 표시 기준을 명시한다.
- 관련 코드:
  - `scripts/backtest_and_generate.py`
  - `scripts/refresh_night_futures.py`

## 최신 운영 명세

- 보안/운영 런북: `SECURITY_OPERATIONS_RUNBOOK.md`
- 인프라/구성 문서: `ARCHITECTURE.md`
- 데이터 소스 문서: `DATA_SOURCES.md`
- 배포/광고/분석 가이드: `FIREBASE_CLOUDFLARE_GA4_ADSENSE_2026.md`

## 운영 원칙

- 배포 전 취약점 점검 결과를 반드시 확인한다.
- 비밀키/서비스계정 정보는 저장소에 절대 커밋하지 않는다.
- 자동화 워크플로 장애 시 루프를 멈추고 단일 경로로 복구한다.
