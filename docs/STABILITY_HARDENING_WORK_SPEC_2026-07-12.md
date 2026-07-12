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
