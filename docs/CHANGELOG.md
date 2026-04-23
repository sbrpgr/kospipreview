# Changelog

## 2026-04-23

- YouTube news archive added
  - Added top navigation link `유튜브 뉴스`.
  - Added `/youtube-news` archive page for generated economic YouTube news reports.
  - Added homepage `최근 유튜브 뉴스` section below the hero forecast and above `예측 추이`.
  - Homepage shows the latest five news items by video publish time.
  - News items link to the static daily report HTML.

- Static news sync pipeline
  - Added `frontend/scripts/sync-news.mjs`.
  - Source reports live under root `news/YYYY-MM-DD/HHMMSS/`.
  - Build sync copies source reports into `frontend/public/news/`.
  - Build sync generates `frontend/public/data/youtube-news.json` from each `digest_db.json`.
  - `npm run dev` and `npm run build` run news sync automatically through `predev` and `prebuild`.
  - Generated public copies are ignored by git; root `news/` remains the source archive.

- Deployment verification note
  - Root cause for the temporary disappearance:
    - GitHub Actions `retrain-model` deploys Firebase Hosting every 5 minutes on weekdays from `main`.
    - A manual local deploy can be overwritten if the same frontend changes are not pushed to `main`.
  - Fix applied:
    - committed and pushed YouTube news changes to `main` (`d3b03e2`).
    - Firebase Hosting was redeployed with release message `Restore YouTube news tab after rebase`.
    - release id: `projects/303729438868/sites/kospipreview/channels/live/releases/1776933697045000`.
  - Release verification timestamps:
    - `last-modified: Thu, 23 Apr 2026 08:41:36 GMT` on both `kospipreview.com` and `kospipreview.web.app`.
  - Verified `https://kospipreview.com/` includes the nav link and homepage news section.
  - Verified `https://kospipreview.web.app/` includes the same content.
  - Verified `https://kospipreview.com/youtube-news`.
  - Verified report clean URL `/news/2026-04-23/042441`.
  - Because `kospipreview.com` is proxied through Cloudflare, future deploy checks must verify both the Firebase default host and the Cloudflare-backed custom domain.

## 2026-04-15

- EWY bridge sampling window fix
  - During U.S. daylight time, the bridge now treats both the `17:00 KST` U.S. premarket window and the `18:00 KST` night-futures-open window as scheduled sampling windows.
  - If the `17:00 KST` window cannot provide a valid night-futures quote, `18:00~18:08 KST` is still sampled as five scheduled two-minute slots instead of being marked as a single late fallback.
  - Existing late-fallback samples that were actually observed inside a scheduled window are normalized to the matching scheduled slot on the next refresh.

- Medium EWY + FX trend floor
  - The live model now guards against medium EWY + USD/KRW moves being compressed to a near-flat KOSPI prediction by the K200-to-KOSPI mapping layer.
  - The medium floor starts at a `0.45%` EWY + USD/KRW log-return signal and requires at least `70%` signal participation; the existing `2.0%` high-move floor keeps its `78%` participation rule.

## 2026-04-14

- EWY premarket bridge correction
  - EWY + FX conversion and live model prediction now stay blank after `15:30 KST` until the U.S. premarket bridge is ready.
  - The bridge starts at `17:00 KST` during U.S. daylight time and `18:00 KST` during U.S. standard time.
  - The bridge samples KOSPI 200 night-futures movement every 2 minutes for 5 slots, then uses the latest bridge sample as the one-time `15:30 -> EWY premarket` synchronization anchor.
  - After the bridge anchor, EWY + FX and live model movement are measured from the bridge timestamp so the missing EWY no-trade gap is not ignored.
  - `model.nightFuturesBridgeApplied` and `model.nightFuturesBridgePct` document the one-time bridge; the card label remains simply `모델 예측`.

- Recent actual futures close guard
  - Recent actual rows no longer let the next target night's live `nightFuturesClose` overwrite the completed actual date.
  - `dayFuturesClose` in recent actual rows now accepts only final eSignal socket settlement for the same actual date.
  - Prediction-target placeholder rows in the frontend no longer display day/night futures close values as if they were actual-record settlements.

- Strong trend-follow model floor
  - The EWY Synthetic K200 model now applies an EWY + USD/KRW trend-follow floor when the EWY + USD/KRW signal is at least `2.0%`.
  - The floor requires the final model log return to reach at least `78%` of the EWY + USD/KRW signal, capped to a `1.75%` per-update adjustment.
  - This addresses the `2026-04-14` open miss where the model predicted `5874.72` against an actual open of `5960.00` while EWY + FX and night-futures conversions were near `5995~5998`.
  - Superseded by the one-time EWY premarket bridge rule above; after the bridge point, live movement still comes from EWY + USD/KRW.

- Night futures simple conversion carry-forward
  - `nightFuturesSimplePoint`, `nightFuturesSimpleChangePct`, and `nightFuturesClose` now remain populated after the night futures session closes when the quote belongs to the active target night session.
  - The guard checks the actual target night-session observation window, preventing the previous session's stale quote from being reused during the next day's `15:30~18:00 KST` gap.
  - This preserves the value that recent actual records should fix at the operating-date boundary.

- Live refresh performance fix
  - Yahoo quote/display fetches now use per-run snapshot reuse plus bounded parallel fetching.
  - Local refresh runtime improved from about `61.8s` before optimization to about `9.2s` after optimization.
  - Production Cloud Run refresh latency improved from roughly `65s~69s` to `12.1s~14.9s`.
  - Effective weekday minute cadence was restored while keeping model math and live conversion formulas unchanged.
  - Deployed commit: `81ee130`; Cloud Run revision: `kospi-live-data-00026-nf2`; GitHub Actions run: `24364299502`.

- Security hardening
  - Cloud Run refresh auth now fails closed when `REFRESH_BEARER_TOKEN` is missing.
  - Live JSON reads use a short server-side cache to absorb burst traffic while keeping client no-store headers.
  - Refresh request bodies are size-limited and refresh failures no longer expose subprocess details to callers.
  - Production deploy now requires the refresh bearer token secret.
  - `www.kospipreview.com` now also runs through the Cloudflare proxy.

## 2026-04-13

- Live operating schedule and settlement rules finalized
  - Prediction target rolls to the next business day at `09:00 KST`.
  - Live prediction operation logic opens at `15:30 KST`; the displayed operation-hours label is `17:00~09:00(변동 가능)`.
  - Live prediction trend observations were recorded only during `18:00~09:00 KST`; this was later superseded by the U.S. premarket-open rule.
  - KOSPI close after `15:30 KST` is used as the prediction `prevClose`.
  - KOSPI 200 day futures close is treated as final only from eSignal socket settlement at or after `15:45 KST`.

- EWY live model input basis corrected
  - Model inputs now prefer the KRX `15:30 KST` sync basis.
  - Yahoo EWY premarket displayed change versus prior U.S. close is now fallback only.
  - This prevents the model from reading a large U.S.-session EWY display decline as Korean-close decline.

- Recent actual record tracking expanded
  - `history.json` tracks `actualClose`.
  - `history.json` tracks fixed pre-open `ewyFxSimpleOpen`.
  - `history.json` tracks `dayFuturesClose` from `2026-04-14` rows onward.
  - `history.json` tracks `nightFuturesClose` from `2026-04-14` rows onward.
  - The `2026-04-13` recent actual row keeps both futures close fields blank.
  - Frontend accuracy table displays actual close, EWY + FX conversion, day futures close, and night futures close.

- EWY + FX simple conversion added
  - `prediction.json` publishes `ewyFxSimplePoint` and `ewyFxSimpleChangePct`.
  - The dashboard shows night futures simple conversion, EWY + FX conversion, and model prediction as three separate indicators.
  - The EWY + FX conversion uses EWY and USD/KRW only, with no residual model, K200 mapping, or night-futures value.

- Day futures provisional close guard added
  - Same-day socket close around `15:30 KST` is provisional.
  - `scripts/refresh_night_futures.py` and `scripts/backtest_and_generate.py` both require final settlement after `15:45 KST`.
  - Regression tests cover provisional `874.05` being replaced by final `872.0`.

- Production deployment verified
  - Git commit: `524ec64`.
  - GitHub Actions `deploy-production`: success.
  - Cloud Run latest revision: `kospi-live-data-00019-tg2`.
  - Cloud Scheduler: enabled, weekday every minute.
  - Live API: bucket source with no-store headers.

- KOSPI mapping diagnostics added
  - Small EWY/KRW core moves can be outweighed by the learned K200-to-KOSPI mapping intercept.
  - The model is not forced to match EWY direction when the statistical mapping produces a valid different result.
  - Diagnostics added: `model.mappingInterceptPct`, `model.mappingBetaContributionPct`, `model.mappingDirectionFlip`.

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
  - Home hero label then stated `모델 예측 (야간 선물 지표 완전 미사용)`; this was later superseded by the bridge label.
  - Current model spec documented in `docs/MODEL_EWY_SYNTHETIC_K200_2026-04-10.md`.

- Prediction refresh cadence update
  - `refresh-night-futures` workflow schedule changed from every 5 minutes to every 1 minute (`* * * * 1-5`).
  - `scripts/refresh_night_futures.py` now updates `pointPrediction` / `predictedChangePct` every refresh cycle using EWY-core auxiliary signals (night futures excluded from model path).
  - Live EWY/aux returns are calculated from the KRX sync baseline (`15:30 KST`) instead of Yahoo U.S. session previous close.
  - Indicator card `changePct` display is computed from the market standard previous close baseline.
  - Internal KRX-sync correction is limited to model prediction calculations and is not mixed into dashboard indicator display.
- Model logic realignment
  - `scripts/backtest_and_generate.py` keeps model prediction on no-night-futures path (`night_futures_change=None` in core blending).
  - Metadata then reported `EWYCore+AuxSignals+NoNightFutures(KRXCloseSync)` and `nightFuturesExcluded=true`; live refresh now reports the one-time bridge fields when active.
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
