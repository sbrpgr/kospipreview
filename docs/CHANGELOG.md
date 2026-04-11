# Changelog

## 2026-04-11

- Live prediction trend chart
  - Added homepage `예측 추이` chart below the hero forecast area.
  - New live JSON artifact:
    - `live_prediction_series.json`
  - New live endpoint:
    - `/api/live/live_prediction_series.json`
  - The series records the active prediction date only and compares:
    - model prediction
    - night-futures simple conversion
  - `scripts/refresh_night_futures.py` now appends / replaces one minute-level observation on each refresh.
  - `cloudrun/live_data_service.py` now serves and syncs `live_prediction_series.json`.
  - Frontend polling updates the trend chart alongside `prediction.json`, `indicators.json`, and `history.json`.
  - Cloud Run redeployed to revision `kospi-live-data-00009-bdw`.
  - Firebase Hosting redeployed after Cloud Run so `/api/live/**` pins the latest Cloud Run revision.

- Operations documentation refresh
  - Rewrote `docs/ARCHITECTURE.md` to reflect the current split production shape:
    - Firebase Hosting for static frontend
    - Cloud Run + Cloud Scheduler + Cloud Storage for live JSON refresh
    - GitHub Actions `retrain-model` for full rebuild and static publish
  - Rewrote `docs/CLOUD_RUN_LIVE_REFRESH.md` with current live endpoints, role split, IAM requirements, and recovery notes.
  - Rewrote `docs/SECURITY_OPERATIONS_RUNBOOK.md` with updated deploy, secret, IAM, and failure-triage guidance.
  - Updated `docs/OPERATIONS_INDEX.md` to serve as the primary handoff / resume entry point for future sessions.

- Firebase Hosting deploy incident fixed
  - Failing GitHub Actions runs:
    - `24246079902`
    - `24248400402`
  - Failure step:
    - `Deploy to Firebase Hosting`
  - Root cause:
    - after adding Firebase Hosting rewrite to Cloud Run with `pinTag: true`, the Firebase deploy service account lacked required IAM roles
  - Fix applied at project IAM level:
    - `roles/firebasehosting.admin`
    - `roles/run.developer`
  - Verification:
    - next scheduled `retrain-model` run `24250747384` completed successfully
    - `Deploy to Firebase Hosting` step passed again

## 2026-04-10

- EWY synthetic K200 model redesign
  - Prediction engine migrated from legacy LightGBM-centered flow to `EWY Synthetic K200 Ridge`.
  - New pipeline: `EWY + USD/KRW core -> optional residual correction -> KOSPI mapping`.
  - Night futures were fully removed from the model path and kept as comparison-only data.
  - Residual correction now auto-downweights itself when recent time-series validation does not improve accuracy.
  - Live refresh (`scripts/refresh_night_futures.py`) now recomputes prediction values with the same model metadata used by the training pipeline.
  - Home hero label now explicitly states `모델 예측 (야간 선물 지표 완전 미사용)`.
  - Current model spec documented in `docs/MODEL_EWY_SYNTHETIC_K200_2026-04-10.md`.

- Prediction refresh cadence update
  - `refresh-night-futures` workflow schedule changed from every 5 minutes to every 1 minute (`* * * * 1-5`).
  - `scripts/refresh_night_futures.py` now updates `pointPrediction` / `predictedChangePct` every refresh cycle using EWY-core auxiliary signals (night futures excluded from model path).
  - Live EWY/aux returns are calculated from the KRX sync baseline (`15:30 KST`) instead of Yahoo U.S. session previous close.
  - Indicator card `changePct` display is computed from the market standard previous close baseline.
  - Internal KRX-sync correction is limited to model prediction calculations and is not mixed into dashboard indicator display.
- Model logic realignment
  - `scripts/backtest_and_generate.py` keeps model prediction on no-night-futures path (`night_futures_change=None` in core blending).
  - Metadata now reports `EWYCore+AuxSignals+NoNightFutures(KRXCloseSync)` and `nightFuturesExcluded=true`.
  - Anchor metadata bug fixed: `auxiliaryAnchorPct` now maps to auxiliary anchor instead of main anchor.
  - EWY/FX core anchor revised to `EWY + USD/KRW 변화율` (환율 하락분 차감), while U.S. index signals are blended only as auxiliary correction.
  - KRX sync baseline selection now prioritizes the first same-day quote at/after `15:30 KST` (e.g., EWY premarket 17:00 KST), then falls back to pre-15:30 quote if needed.
  - EWY/FX correction now uses a hybrid of recent calibrated coefficients and structural `EWY + KRW` correction to avoid under-reacting on large overnight moves.

## 2026-04-09 (Security hardening)

- Frontend dependency security patch
  - `next` upgraded to `15.5.15` (from `15.3.0`)
- Firebase Hosting security headers 강화
  - `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`,
    `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `Strict-Transport-Security`
- 정기 취약점 점검 워크플로 추가
  - `.github/workflows/security-audit.yml`
- 운영 명세 문서 추가
  - `docs/SECURITY_OPERATIONS_RUNBOOK.md`
  - `docs/OPERATIONS_INDEX.md`

## 2026-04-09

- 예측 엔진을 `야간선물 중심 + 보조지표 제한 보정` 구조로 개편
  - 야간선물 변동률을 1차 앵커로 사용
  - ML/보조지표 잔차 보정에 상한(cap) 및 가드레일 추가
  - 과도한 상방/하방 예측 억제
- KOSPI200 야간선물 기준값을 주간선물 종가 기준으로 고정
  - 주간선물 종가 캐시(`day_futures_close_cache.json`) 도입
  - 세션 단위 1회 수집 후 재사용
- 갱신 문구 정책 변경
  - 화면에서 `1분 단위/자동 갱신` 고정 표현 제거
  - 지표별 갱신 주기 상이 및 원 출처 직접 확인 안내로 통일
- 파이프라인/배포 최적화
  - `frontend/out` 캐시 활용
  - 데이터 JSON을 정적 산출물 경로로 직접 동기화

## 2026-04-07

- 기획안 기반 초기 레포 구조 생성
- 프론트엔드 기본 대시보드 초안 구현
- 샘플 데이터 및 예측 계산 유틸 추가
