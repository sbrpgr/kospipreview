# Agent Operating Rules

## Cost-Safe Deploy Policy

- Use `deploy-hosting` for frontend, calculator, copy, CSS, and static page changes.
- Use `publish_youtube_news.cmd` or `publish-youtube-news` for routine YouTube news uploads.
- Use Cloud Storage JSON upload paths for generated data refreshes; do not redeploy Firebase Hosting for routine JSON updates.
- Use `cloudrun-deploy` only when Cloud Run code, Cloud Run environment variables, Firebase rewrite pinning, or Cloud Scheduler configuration changes.
- Do not run Cloud Build or Cloud Run deploy as part of routine frontend, calculator, copy, news, or JSON-only work.
- Before any cost-impacting deploy, explicitly confirm the intended workflow and why Cloud Run/Cloud Build is necessary.

## Current Production Workflows

- `.github/workflows/deploy-hosting.yml`: Firebase Hosting only.
- `.github/workflows/cloudrun-deploy.yml`: Cloud Run deploy, Scheduler update, then Hosting deploy to pin the latest Cloud Run revision.
- `.github/workflows/retrain-model.yml`: rebuilds model JSON and uploads JSON to `gs://kospipreview-live-data/`.
- `.github/workflows/refresh-night-futures.yml`: manual fallback JSON refresh and Cloud Storage upload only.
- `.github/workflows/publish-youtube-news.yml`: YouTube news JSON upload only.

## Scheduler And Refresh Guardrails

- Cloud Scheduler live refresh is KST-based and should not run during `09:00~16:59`.
- Current cron: `* 0-8,17-23 * * 1-5` with time zone `Asia/Seoul`.
- Cloud Run refresh overlap should return `202 {"ok": true, "status": "already_running"}` rather than a failure.
- If freshness looks wrong, inspect `/api/live/*.json`, Cloud Scheduler attempts, Cloud Run logs, and Cloud Storage timestamps before redeploying anything.

## Documentation Rule

- Update `YOUTUBE_NEWS_WORK_SPEC.md`, `docs/OPERATIONS_INDEX.md`, and relevant runbooks whenever deploy flow, Scheduler cadence, Cloud Run refresh behavior, or news publishing flow changes.

## Working Paper Rule

- Paper files live at `frontend/src/app/papers/<slug>/page.tsx`.
- Paper index is at `/papers` — maintained in `frontend/src/app/papers/page.tsx` (PAPERS array, newest-first).
- Home page shows latest 3 papers via `PAPERS_HOME.slice(0, 3)` in `frontend/src/components/live-dashboard.tsx`.
- Sitemap entries are in `frontend/src/app/sitemap.ts`.
- Full paper index and add procedure: `docs/PAPERS_INDEX.md`.
- Current total: 15 papers (No.1–No.15). Next paper is No.16.
- Always deploy with `deploy-hosting` workflow after adding papers.

## AdSense Policy Rule

- AdSense status: 재검토 요청 대기 중 (2026-05-16 기준). 상세 내역: `docs/ADSENSE_VALUE_RECOVERY_PLAN.md`.
- `noindex` 적용 페이지: `/contact`, `/operations-policy` — sitemap에서도 제외됨.
- `index` 유지 필수 페이지: `/terms`, `/privacy`, `/disclaimer` (AdSense 정책 필수).
- 신규 페이지 추가 시: 콘텐츠가 충분한지 확인 후 sitemap 등재 여부 결정. 유틸리티·단순 링크 페이지는 noindex 처리.
- 홈 초기 렌더: `hasSyncedOnce` 초기값을 `initialIndicators.primary.length > 0`으로 설정 — 크롤러가 서버 데이터를 즉시 볼 수 있음. 이 동작을 되돌리지 말 것.
