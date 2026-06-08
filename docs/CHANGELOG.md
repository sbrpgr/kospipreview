# Changelog

## 2026-06-09

- Model2 EWY/FX reference-clock sync repair added.
  - Background: Model2 could stay on a KOSPI-close reference after a late manual repair while the primary model had
    already synchronized its EWY+FX display clock.
  - Workflow: added `clock_sync` dispatch input to `refresh-holiday-prediction`.
  - Behavior: `clock_sync=on` anchors Model2 to the primary payload's `ewyFxSimplePoint` for the same prediction
    date, resets Model2 baseline prices to the current EWY/KRW snapshot, and records `clockSyncUsed: true`.
  - Safety: Model2 still keeps `usesOtherModelPrediction: false`, `nightFuturesUsed: false`, and
    `nightFuturesReadThisRun: false`; it does not copy primary `pointPrediction`.
  - Follow-up hardening:
    - forced Model2 reissues now preserve an existing EWY/FX clock-sync baseline instead of silently falling back to
      `kospi_close`;
    - homepage Model2 display now compensates stale clock-synced JSON by applying the latest primary
      `ewyFxSimplePoint` drift since Model2's `ewyFxReferencePoint`.
  - Files changed:
    - `.github/workflows/refresh-holiday-prediction.yml`
    - `scripts/refresh_holiday_prediction.py`
    - `frontend/src/components/live-dashboard.tsx`
    - `frontend/src/lib/data.ts`
    - `tests/test_model2_independence.py`
    - `docs/ALGORITHM.md`
    - `docs/CLOUD_RUN_LIVE_REFRESH.md`
    - `docs/OPERATIONS_INDEX.md`
    - `docs/MODEL2_CLOCK_SYNC_WORK_SPEC_2026-06-09.md`
  - Verification:
    - `python -m py_compile scripts/refresh_holiday_prediction.py scripts/guard_live_json_publish.py` passed.
    - Production Model2 moved from the misaligned `7,718.119` value to `7,862.5118` after clock sync.
    - Live JSON recorded `baselineSource: primary_ewy_fx_simple_clock_sync` and `clockSyncUsed: true`.
  - Deployment:
    - commit: `504ee5fc Add model2 EWY FX clock sync repair`
    - workflow: `refresh-holiday-prediction`
    - run: `27145266257`
    - inputs: `force=on`, `clear_stale=off`, `clock_sync=on`
    - result: success
  - Cost guardrail: Cloud Run, Cloud Build, and Firebase Hosting were not used for the clock-sync JSON repair.
  - Work spec: `docs/MODEL2_CLOCK_SYNC_WORK_SPEC_2026-06-09.md`

## 2026-06-07

- Header support button label changed.
  - UI: changed `커피 한 잔 후원하기` to `연구 후원하기`.
  - Link remains `https://ko-fi.com/sbgkp`, opened in a new tab with `noopener noreferrer`.
  - Files changed:
    - `frontend/src/components/site-header.tsx`
    - `docs/OPERATIONS_INDEX.md`

- Homepage top ad banner added.
  - UI: inserted a three-column `140px`-high banner between the global header and the homepage forecast hero.
  - Left slot: Coupang Partners carousel widget, `id=995011`, `trackingCode=AF1258921`, `320x140`.
  - Center/right slots: reserved ad inquiry blocks with `광고문의 ytbtheguy@gmail.com`.
  - Files changed:
    - `frontend/src/components/home-top-ad-banner.tsx`
    - `frontend/src/components/live-dashboard.tsx`
    - `frontend/src/app/globals.css`
  - Verification:
    - `npm run build` passed.
    - `git diff --check` passed.
    - Production HTML at `https://kospipreview.com/` returned `200 OK` and included `homeTopAdBanner`, `쿠팡 파트너스 광고`, `광고문의`, and `ytbtheguy@gmail.com`.
    - Production live prediction trend API returned `899` records matching `predictionDateIso=2026-06-08`.
  - Deployment:
    - commit: `1a839cb7 Add home top ad banner`
    - workflow: `deploy-hosting`
    - run: `27069768423`
    - result: success
  - Cost guardrail: Cloud Run and Cloud Build were not used; this was a frontend-only Firebase Hosting deployment.
  - Work spec: `docs/HOME_TOP_AD_BANNER_WORK_SPEC_2026-06-07.md`

## 2026-06-04

- Ko-fi support button added to the global header.
  - UI: added a yellow `커피 한 잔 후원하기` button immediately to the right of `문의`.
  - Link: `https://ko-fi.com/sbgkp`, opened in a new tab with `noopener noreferrer`.
  - Files changed:
    - `frontend/src/components/site-header.tsx`
    - `frontend/src/app/globals.css`
  - Verification:
    - `npm.cmd run build` passed.
    - `git diff --check` passed.
    - Production HTML at `https://kospipreview.com/?v=ko-fi-support-84715cbe` returned `200 OK` and included `supportButton`, `https://ko-fi.com/sbgkp`, and `커피 한 잔 후원하기`.
  - Deployment:
    - commit: `84715cbe feat: add ko-fi support button`
    - workflow: `deploy-hosting`
    - run: `26905076868`
    - result: success
  - Cost guardrail: Cloud Run and Cloud Build were not used; this was a frontend-only Firebase Hosting deployment.

## 2026-05-19

- history.json 마켓 데이터 5개 필드 복구 및 자동 누적 구조 완성

  **배경**: `929591d1`, `e0c9b843` 커밋에서 `actualClose`·`dayFuturesClose`·`nightFuturesClose`가
  `write_history_json`에서 제거된 채 누적이 중단됐고, 프론트엔드(`accuracy-table.tsx`)는
  이미 이 필드들을 표시하도록 구현되어 있었음.

  **복구된 필드 (history.json 레코드당)**:
  | JSON 키 | 설명 |
  |---|---|
  | `actualClose` | 당일 KOSPI 종가 (yfinance `^KS11` Close) |
  | `dayFuturesClose` | 당일 K200F 주간선물 종가 (archive 역산) |
  | `prevClose` | 전일 KOSPI 종가 (모델 입력 기준값) |
  | `futuresDayClose` | 전일 K200F 종가 (모델 입력 기준값) |
  | `nightFuturesClose` | 야간선물 종가 (`futuresDayClose × (1 + changePct/100)`) |
  | `nightFuturesSimpleOpen` | 야간선물 환산치 (야간선물→코스피 환산 예측값) |
  | `nightFuturesError` | 야간선물 오차 (`nightFuturesSimpleOpen − actualOpen`) |

  **코드 변경 (`scripts/backtest_and_generate.py`)**:
  - `normalize_prediction_archive_entry`: `prevClose`, `futuresDayClose`,
    `nightFuturesSimpleChangePct` 를 prediction 저장 시 archive에 함께 기록
  - `_extract_kospi_close_by_date`: yfinance KOSPI 데이터에서 날짜별 당일 종가 추출
  - `_build_k200f_close_by_date`: archive의 `futuresDayClose`를 KOSPI 거래일 역산으로
    날짜별 K200F 종가 lookup 생성
  - `_apply_archive_market_data` (신규): `_fill_recent_history_gaps` 이후에 실행,
    archive에 있는 **전체** 날짜에 시장 데이터 일괄 적용 (기존 최근 5일 한계 해소)
  - `write_history_json`: 7개 필드 전부 출력

  **데이터 백필**:
  - `prediction_archive.json`: git 커밋 1,521개 전수 스캔 → 27개 엔트리 전부 복원
  - `history.json`: archive + yfinance로 25개 레코드 직접 백필

  **이후 자동 누적**: retrain 사이클(5분마다)마다 yfinance + archive 역산으로 신규 날짜
  자동 입력. 예측 생성 시 `prevClose`·`futuresDayClose`·`nightFuturesSimpleChangePct`가
  archive에 저장되므로 미래 데이터도 누락 없이 쌓임.

## 2026-05-15

- 리서치 콘텐츠 자동 작성 에이전트 및 계획 수립
  - `docs/RESEARCH_CONTENT_PLAN.md`: 20개 아티클 전체 명세
    - 완료 3개 + 대기 17개 (제목, 데이터 근거, 섹션 구성 포함)
    - 번호 4~20번 각 아티클에 실제 JSON 수치와 섹션 개요 기술
  - `scripts/write_research_content.py`: Claude API 기반 자동 작성 에이전트
    - `python scripts/write_research_content.py <번호|all>` 형식으로 실행
    - history.json, prediction.json 실데이터를 컨텍스트로 주입
    - 아티클당 claude-sonnet-4-6 1회 호출 → Next.js page.tsx 파일 자동 생성
    - 실행 전 `pip install anthropic` 및 `ANTHROPIC_API_KEY` 환경변수 필요
  - 실행 후 수동 처리 항목: `research/page.tsx` ARTICLES 배열 추가, `sitemap.ts` 경로 추가, `deploy-hosting`

- 리서치 콘텐츠 섹션 신설 및 배포
  - `/research` 인덱스 페이지 및 아티클 3개 작성 (실데이터 기반)
    - `model-in-volatile-markets`: 2026년 4월 관세 충격 13연속 밴드 이탈 실측 분석
    - `ewy-krw-core-signals`: EWY 계수 0.3535, 환율 계수 0.2, R² 23.49% 실수치 해설
    - `reading-the-prediction-band`: 17개 실측 기록 전수 표, 백테스트 75% vs 최근 23.5% 비교
  - 내비게이션 "리서치" 링크 추가, 사이트맵 등록
  - `deploy-hosting` 워크플로우로 프로덕션 배포 완료 (run 25887537992, success)

- YouTube 뉴스 기능 전면 제거 (AdSense 재심사 대응)
  - 제거 배경: AdSense 심사 거절(가치 없는 콘텐츠) 원인 분석 결과, Gemini 자동 요약 기반 YouTube 뉴스가
    자동생성 콘텐츠로 분류될 위험이 높고 플랫폼 정체성(퀀트 리서치)과 결이 다르다는 판단으로 제거 결정.
  - 삭제된 파일:
    - `frontend/src/components/youtube-news-summary.tsx`
    - `frontend/src/components/youtube-news-archive.tsx`
    - `frontend/src/components/youtube-news-post-viewer.tsx`
    - `frontend/src/lib/youtube-news.ts`, `youtube-news-types.ts`, `youtube-news-format.ts`,
      `youtube-news-client.ts`, `youtube-news-board.ts`
    - `frontend/src/app/youtube-news/` (board + post 페이지)
    - `frontend/src/app/news/[date]/[run]/` (구 리포트 페이지)
    - `frontend/scripts/sync-news.mjs`
    - `frontend/public/data/youtube-news.json`
    - `.github/workflows/publish-youtube-news.yml`
    - `publish_youtube_news.cmd`
    - `scripts/publish_youtube_news.ps1`, `update_youtube_news_content.ps1`
    - `YOUTUBE_NEWS_WORK_SPEC.md`
  - 수정된 파일:
    - `frontend/src/components/live-dashboard.tsx`: 뉴스 state, 폴링 useEffect, JSX 섹션 제거
    - `frontend/src/components/site-header.tsx`: 유튜브 뉴스 nav 링크 제거
    - `frontend/src/app/page.tsx`: `getYoutubeNewsIndex` 호출 및 prop 제거
    - `frontend/package.json`: `sync-news`, `predev`, `prebuild` 스크립트 제거
    - `firebase.json`: `/news/**` 리다이렉트 및 `/youtube-news/**` 캐시 헤더 제거
  - 빌드 확인: `npm run build` 통과, 에러 없음, 15개 정적 페이지 정상 생성.
  - Cloud Run `/api/news/**` 엔드포인트는 프론트엔드 미사용 상태로 잔존 (제거 시 Cloud Run 재배포 필요,
    AdSense 재심사와 무관하므로 별도 처리).
  - 배포: `deploy-hosting` 워크플로우 사용.

- AdSense 재심사 콘텐츠 전략 수립
  - YouTube 뉴스 제거 + 계산기 유지(격하) + 데이터 기반 인사이트 콘텐츠 신설 방향으로 결정.
  - 인사이트 콘텐츠: 플랫폼 자체 데이터(history.json, 지표 시계열)에서 추출한 원본 분석 글.
    예: "환율 급변 구간 시초가 반응", "EWY 상승인데 시초가가 내린 날의 공통점" 등.
  - 구체적 형식 및 신설 페이지 작업은 미착수.

## 2026-05-04

- YouTube news quality cleanup
  - Removed fallback transcript-summary items from publishable `digest_db.json` files.
  - Quality rule: publish only items with `summary_provider: "gemini"`.
  - Removed `48` non-Gemini items across `9` report digests and updated each report `count`.
  - Republished through `publish_youtube_news.cmd` / `publish-youtube-news` only.
  - Production API verification after cleanup:
    - status `200`
    - source `bucket`
    - latest items `43`
    - reports `19`
    - fallback-summary matches `0`
  - No Cloud Run, Cloud Build, or Firebase Hosting deploy was used.

## 2026-05-02

- Cost-safe deployment split
  - Replaced routine production deploy usage with Hosting-only workflow `deploy-hosting`.
  - Added Cloud Run-only infrastructure workflow `cloudrun-deploy`.
  - Cloud Build and Cloud Run deploy must not run for frontend, calculator, copy, news, or JSON-only work.

- JSON-only scheduled data updates
  - `retrain-model` now rebuilds model JSON and uploads generated JSON to Cloud Storage.
  - `refresh-night-futures` now acts as manual fallback JSON refresh and Cloud Storage upload only.
  - Routine data updates no longer redeploy Firebase Hosting.

- Live refresh cost guardrails
  - Cloud Scheduler refresh is configured for KST weekdays outside `09:00~16:59`.
  - Refresh overlap now returns `202 already_running` instead of a failed `409`.

## 2026-04-23

- YouTube news dynamic API conversion (Cloud Run + Storage)
  - Added Cloud Run news endpoints:
    - `GET /api/news/youtube-news.json`
    - `GET /api/news/reports/**`
  - Firebase Hosting now rewrites `/api/news/**` to `kospi-live-data` (pinned tag).
  - News UI now client-polls dynamic index on both `/` and `/youtube-news`.
  - Prediction/live polling routes (`/api/live/**`) and scheduler refresh path remain unchanged.
  - Added daily operator dynamic publish support in:
    - `scripts/update_youtube_news_content.ps1 -UploadDynamic`
  - Dynamic storage paths:
    - `gs://kospipreview-live-data/youtube-news/youtube-news.json`
    - `gs://kospipreview-live-data/youtube-news/reports/**`

- YouTube news board UX overhaul
  - `/youtube-news` now behaves as a 게시판형 목록 and links each item to an internal post view.
  - Added post detail route: `/youtube-news/post?item=<id>`.
  - Added explicit "목록으로 돌아가기" button in post detail view.
  - Homepage `유튜버 뉴스` links now open internal post detail pages instead of raw report HTML.
  - Duplicate news entries are deduplicated by source URL (or youtuber+title fallback) before display.

- YouTube news editorial UX refinement
  - Board list now renders a structured post-style row format (`번호/제목·리드/채널/게시시각`) instead of raw digest exposure.
  - Duplicate candidate items now choose the best-quality version per source/title (quality score + recency), then sort by recency.
  - Added low-quality transcript/noise guard for board exposure (auto-excerpt style content is deprioritized).
  - Post detail now renders section-based body (`리드/핵심 뉴스/시장 시사점/유의점`) with bullet and paragraph formatting.
  - Post detail now includes stronger escape/navigation UX:
    - top + bottom `게시판으로 돌아가기`
    - `더 최신 글 / 이전 글` pager
    - raw report link opens in a new tab.

- YouTube news archive added
  - Added top navigation link `유튜브 뉴스`.
  - Added `/youtube-news` archive page for generated economic YouTube news reports.
  - Added homepage `유튜버 뉴스` section below the hero forecast and above `예측 추이`.
  - Homepage shows up to 10 items on desktop (`2 x 5`) and 5 items on mobile.
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

- Daily news operations helper and content refresh
  - Added operator script: `scripts/update_youtube_news_content.ps1`.
  - Script flow: source copy (`results/YYYY-MM-DD`) -> `npm run sync-news` -> optional `build` -> optional Firebase deploy.
  - Synced `2026-04-23` source runs and regenerated index:
    - reports: `7`
    - latest items: `23`
    - latest report id: `2026-04-23-180001`
  - Firebase Hosting release:
    - release id: `projects/303729438868/sites/kospipreview/channels/live/releases/1776936297151000`
    - release time: `2026-04-23T09:24:57Z` (`2026-04-23 18:24:57 KST`).

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
