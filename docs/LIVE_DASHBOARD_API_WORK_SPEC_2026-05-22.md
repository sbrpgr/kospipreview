# Live Dashboard API Work Spec

Date: 2026-05-22 KST

## Purpose

Reduce live dashboard request volume without changing the existing collection pipeline, JSON source files, or user-facing dashboard behavior.

## Scope

- Add one bundled live API for the dashboard.
- Keep all existing `/api/live/*.json` endpoints available.
- Keep Cloud Storage as the live JSON source of truth.
- Keep Firebase Hosting as the frontend host.
- Avoid routine Cloud Run or Cloud Build deploys for JSON-only, news-only, copy, calculator, or static frontend work.

## Implemented Behavior

- New endpoint: `/api/live/dashboard.json`
- Bundled payload keys:
  - `prediction`
  - `indicators`
  - `history`
  - `livePredictionSeries`
  - `sources`
- The frontend tries `/api/live/dashboard.json` first.
- If the bundled endpoint fails or returns an incomplete payload, the frontend falls back to the previous four per-file endpoints:
  - `/api/live/prediction.json`
  - `/api/live/indicators.json`
  - `/api/live/history.json`
  - `/api/live/live_prediction_series.json`

## Request Reduction

Before:

- One dashboard sync used four live API requests.

After:

- One dashboard sync uses one live API request in the normal path.
- The previous four-request path remains only as a fallback.

Expected steady-state reduction:

- 4 requests per poll to 1 request per poll
- 75% fewer live dashboard API requests

This change reduces request count. It does not change the market data refresh cadence or the Cloud Scheduler cadence.

## Files Changed

- `cloudrun/live_data_service.py`
  - Added `DASHBOARD_FILE_NAMES`.
  - Added `load_dashboard_json_bytes()`.
  - Added `GET /api/live/dashboard.json`.
  - Kept individual live JSON endpoints unchanged.
  - Refresh overlap returns `202 {"ok": true, "status": "already_running"}`.
- `frontend/src/lib/data-paths.ts`
  - Added `getLiveDashboardClientUrl()`.
- `frontend/src/components/live-dashboard.tsx`
  - Added bundled API fetch path.
  - Added per-file fallback path.
  - Preserved freshness/version calculation and existing display state.
- `tests/test_live_data_service_security.py`
  - Added coverage for the bundled dashboard endpoint.
- `.github/workflows/cloudrun-deploy.yml`
  - Added the workflow to `main`.
  - Added `update_scheduler` manual input.
  - Cloud Scheduler update is skipped by default.
- `docs/FIREBASE_COST_REDUCTION_PLAN.md`
  - Documented the request reduction and deploy guardrail.

## Commits

- `cad6368c feat: add bundled live dashboard api`
- `707833cb fix: make scheduler update optional in cloudrun deploy`

## Verification

Local verification:

- `python -m unittest tests.test_live_data_service_security`
  - Result: passed, 6 tests.
- `npm.cmd run build`
  - Result: passed.
  - Existing Recharts container-size warning appeared during static generation, but the build succeeded.
- `git diff --check`
  - Result: passed for the touched files.

Production verification:

- `https://kospipreview.com/`
  - Result: `200 OK`
- `https://kospipreview.com/api/live/dashboard.json`
  - Result: `200 OK`
  - Header: `x-kospi-live-source: bucket`
  - Payload contains `prediction`, `indicators`, `history`, `livePredictionSeries`, and `sources`.
- `https://kospipreview.com/api/live/prediction.json`
  - Result: `200 OK`
  - Confirms the legacy per-file API remains available.

## Deployment Record

- `cloudrun-deploy` run:
  - URL: `https://github.com/sbrpgr/kospipreview/actions/runs/26289237935`
  - Result: failed overall.
  - Important detail: `Deploy Cloud Run live data service` succeeded.
  - Failure point: `Configure Cloud Scheduler live refresh window`.
  - Root cause: the GitHub Actions service account lacked `cloudscheduler.jobs.update`.
- `deploy-hosting` run:
  - URL: `https://github.com/sbrpgr/kospipreview/actions/runs/26289411315`
  - Result: success.
  - Purpose: deploy the frontend and pin Firebase Hosting rewrites to the latest Cloud Run revision.

## Cloud Scheduler Guardrail

The failed `cloudrun-deploy` run did not indicate an API or frontend defect. It failed because the workflow tried to update Cloud Scheduler on every Cloud Run deploy.

Current workflow behavior:

- Default `cloudrun-deploy` run skips Scheduler update.
- Set `update_scheduler=true` only when Scheduler cadence, target URI, or auth header must change.
- If `update_scheduler=true` is used, the deployment principal still needs Cloud Scheduler update/create permissions.

## Cost-Safe Operating Rule

- Use `deploy-hosting` for frontend, calculator, copy, CSS, and static page changes.
- Use Cloud Storage JSON upload paths for routine generated data refreshes.
- Use `publish_youtube_news.cmd` or `publish-youtube-news` for routine YouTube news uploads.
- Use `cloudrun-deploy` only for Cloud Run code, Cloud Run environment variables, Firebase rewrite pinning, or intentional Scheduler changes.
- Do not run Cloud Build or Cloud Run deploy for routine frontend, news, or JSON-only work.

## Rollback Plan

The fallback path reduces rollback urgency because the frontend can still use the existing four live JSON endpoints if the bundled endpoint fails.

If a full rollback is required:

1. Revert the frontend use of `getLiveDashboardClientUrl()`.
2. Keep or remove `/api/live/dashboard.json`; keeping it is low risk because it does not replace the legacy endpoints.
3. Deploy frontend-only changes with `deploy-hosting` unless Cloud Run code is changed.

## Remaining Follow-Up

- Review actual Billing SKU data in Google Cloud Billing.
- Consider Firebase Hosting release retention reduction to 5-10 releases.
- Disable or remove the older `deploy-production` workflow after confirming the team no longer uses it.
- Grant Scheduler permissions only if routine deployments must also modify Scheduler settings.
