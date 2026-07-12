# Stability Hardening Work Spec

Date: 2026-07-12 KST

## Objective

Improve production reliability without changing prediction mathematics, losing
history, removing legacy recovery paths, or increasing Cloud Run cost without
an explicit deployment decision.

## Release Boundaries

1. Hosting and workflow release
   - active-target Model2 chart filtering;
   - live `/history` hydration;
   - SEO and brand cleanup;
   - CI, dependency locking, and JSON publisher ownership.
2. Cloud Run release
   - distributed refresh lease;
   - atomic dashboard bundle objects;
   - reliable Model2 runtime ownership;
   - public operational health endpoint and structured freshness checks.

The first release uses `deploy-hosting` only. The second release requires
`cloudrun-deploy` because it changes Cloud Run code and runtime behavior.

## Implemented State

- Phase 1 merged through PR #12 after the shared CI passed and was deployed with `deploy-hosting` run `29193541690`.
- `/history` live hydration, active-target Model2 chart filtering, SEO policy, dependency locks, and publisher allowlists are active.
- Phase 2 adds a generation-guarded Storage lease, atomic primary/Model2 snapshots, a Cloud Run-owned five-minute Model2 lane, a `2.5%` same-target synchronized jump circuit breaker, and `/api/healthz`.
- Cloud Run remains scale-to-zero and is capped at one instance. Legacy per-file and manual repair paths remain intact.

## Production Verification

- Phase 2 merged through PR #13; the `/api/livez` edge-route correction merged through PR #14.
- First deploy run `29194110904` created revision `kospi-live-data-00081-xzj` but intentionally stopped before Hosting pin when the unprefixed liveness route returned an edge 404.
- Successful deploy run `29194326340` created revision `kospi-live-data-00082-6kv`, passed `/api/livez` and `/api/healthz`, served 100% of Cloud Run traffic, and completed the Firebase Hosting rewrite pin.
- Storage-only seed runs `29194460165` and `29194460996` created the first atomic primary and Model2 snapshots without another Cloud Build or Hosting deploy.
- Verified snapshot IDs: primary `11d3c348bd6ce2be41b4`, Model2 `7213b465cd06998a581f`.
- Both `https://kospipreview.com` and `https://kospipreview.web.app` returned health `ok`, all health checks true, and `X-Kospi-Live-Source: bucket-snapshot` for both dashboard endpoints.
- Verified target `2026-07-13`: primary `7,561.25`, Model2 `7,562.92`, absolute gap `1.67` points. Model2 remained independent with both night-futures flags false.
- Browser verification showed the current target, Model2 value, 199 observations, and four rendered chart paths; `/history` showed the same current primary and Model2 values.
- Unauthenticated `POST /api/tasks/refresh` returned `401`.
- Scheduler update was deliberately skipped; production cadence remains `*/2 0-8,17-23 * * 1-5` in `Asia/Seoul`.

## Invariants

- Model2 never reads or uses night-futures input.
- Primary publishers never upload Model2 JSON.
- Same-target live series cannot shrink.
- Existing per-file APIs and manual fallback workflows remain available.
- `hasSyncedOnce` keeps its server-data initial behavior.
- Scheduler remains disabled during `09:00~16:59 KST`.

## Verification Gates

- Python regression suite passes from the locked environment.
- ESLint, frontend unit tests, TypeScript, static build, and dependency audits pass.
- Desktop and mobile browser checks show current-target values and a nonblank chart.
- `/history` latest date matches `/api/live/history.json` after hydration.
- Production primary and Model2 target dates match and Model2 invariants remain false for night-futures fields.
- Every deployment has a previous Firebase release or Cloud Run revision available for rollback.
