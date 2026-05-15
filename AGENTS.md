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
