# Security & Operations Runbook (2026-04-11)

## Scope

This runbook covers:

- secret handling
- deploy safety
- Cloudflare + Firebase + Cloud Run operations
- workflow failure recovery
- routine security checks

## Current Security Baseline

### Secrets

- never commit service-account JSON or private keys
- never paste long-lived keys into issues, PRs, or chat
- GitHub secret in use:
  - `FIREBASE_SERVICE_ACCOUNT`

### Frontend dependency posture

- `next` pinned to `15.5.15`
- latest recorded checks:
  - `npm audit --omit=dev`: no known issues at the time of the last audit
  - `python -m pip_audit -r requirements.txt`: no known issues at the time of the last audit

### Hosting headers

`firebase.json` applies:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`
- `Strict-Transport-Security: max-age=31536000`

## Current Production Topology

- domain edge: Cloudflare
- static site: Firebase Hosting
- live JSON refresh: Cloud Run + Cloud Scheduler + Cloud Storage
- full retrain and static deploy: GitHub Actions

## Deployment Roles That Matter

### Firebase deploy service account

Service account:

- `firebase-adminsdk-fbsvc@kospipreview.iam.gserviceaccount.com`

Critical project roles:

- `roles/firebase.sdkAdminServiceAgent`
- `roles/iam.serviceAccountTokenCreator`
- `roles/firebasehosting.admin`
- `roles/run.developer`

The last two became necessary after Hosting rewrites started pinning a Cloud Run service revision.

## Incident Note: Hosting Deploy Failure

Production incident:

- failing runs:
  - `24246079902`
  - `24248400402`
- failing step:
  - `Deploy to Firebase Hosting`

Root cause:

- `firebase.json` introduced a Cloud Run rewrite with `pinTag: true`
- deploy service account did not have enough Hosting / Cloud Run IAM permissions

Fix applied:

- added:
  - `roles/firebasehosting.admin`
  - `roles/run.developer`

Verification:

- next scheduled `retrain-model` run `24250747384` completed successfully
- `Deploy to Firebase Hosting` step passed

## Standard Deploy Procedure

### Before deploy

1. confirm no secrets are in the diff
2. confirm the repo is in the expected branch/state
3. run targeted build/test as appropriate
4. if infra-related changes are included, verify docs are updated too

### Main deploy paths

#### Static / full rebuild

- push to `main`
- allow `retrain-model` to run
- if needed, run manual Firebase Hosting deploy:
  - `npx firebase-tools@latest deploy --project kospipreview --only hosting --non-interactive`

#### Live refresh path

- Cloud Scheduler should call Cloud Run every minute
- no full Hosting redeploy required for normal live data updates

### After deploy

1. confirm homepage loads
2. confirm `/api/live/prediction.json` freshness
3. confirm `/api/live/indicators.json` freshness
4. confirm `/api/live/live_prediction_series.json` returns records for the active `predictionDateIso`
5. confirm `/data/*.json` still serves valid fallback payloads
6. confirm Cloudflare proxy / DNS is still correct

## Failure Triage

### A. Dashboard values look stale

Check:

1. `/api/live/prediction.json`
2. `/api/live/indicators.json`
3. `/api/live/live_prediction_series.json`
4. Cloud Scheduler last run
5. Cloud Run logs
6. source symbol freshness

Likely causes:

- Cloud Scheduler auth issue
- Cloud Run refresh failure
- source market data lag

### A-1. Prediction trend chart is empty or stale

Check:

1. `/api/live/live_prediction_series.json`
2. latest `records[-1].observedAt`
3. Cloud Storage object `live_prediction_series.json`
4. Cloud Run revision includes `cloudrun/live_data_service.py` with `live_prediction_series.json` in `SERVE_FILE_NAMES`
5. `scripts/refresh_night_futures.py` can write `live_prediction_series.json`

Likely causes:

- Cloud Run was not redeployed after adding a new live JSON file
- Firebase Hosting rewrite still pins an older Cloud Run revision
- refresh job is running but prediction payload is missing valid `pointPrediction`
- current prediction date rolled and the new series has only just started accumulating

### B. Static pages are behind

Check:

1. latest `retrain-model` run status
2. build step success
3. Firebase Hosting deploy step success

Likely causes:

- GitHub Actions failure
- Firebase deploy failure
- stale static export cache edge case

### C. Hosting deploy fails after infra rewrite changes

Check:

1. `firebase.json` rewrites / `pinTag`
2. deploy service account IAM
3. secret validity for `FIREBASE_SERVICE_ACCOUNT`

## Secret Rotation Procedure

If a service-account key is exposed or suspected to be exposed:

1. disable or delete the leaked key immediately
2. create a new key only if key-based auth is still required
3. update GitHub secret `FIREBASE_SERVICE_ACCOUNT`
4. rerun deploy verification
5. note the incident in docs/changelog

Important:

- previous chat leakage already established the need to keep key rotation discipline strict

## Cloudflare Policy

- root A record stays proxied
- WAF / bot protection stays enabled
- `kospipreview.com` is the primary host
- Hosting remains behind Cloudflare for real traffic

## Routine Checklist

### Daily

- inspect failed GitHub Actions runs
- inspect Cloud Scheduler / Cloud Run freshness
- spot-check `prediction.json` and `indicators.json`

### Weekly

- run or review dependency audit
- inspect source-data anomalies
- inspect Cloudflare security events

### Monthly

- re-check IAM minimum required roles
- re-check secrets posture
- test recovery path:
  - Cloud Run degraded
  - Hosting-only fallback
  - manual refresh workflow fallback
