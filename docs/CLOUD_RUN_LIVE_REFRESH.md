# Cloud Run Live Refresh

## Purpose

This document describes the production live-refresh path introduced to replace slow and unreliable GitHub schedule driven data refresh.

Primary goal:

- keep Firebase Hosting as the static frontend
- move minute-level live JSON refresh into GCP managed runtime
- avoid introducing a database

## Deployed Resources

- Cloud Run service: `kospi-live-data`
- Cloud Scheduler job: `kospi-live-refresh`
- Cloud Storage bucket: `kospipreview-live-data`
- Firebase Hosting rewrite:
  - `/api/live/**`
  - service `kospi-live-data`
  - region `asia-northeast3`

## What Is Live And What Is Static

### Live path

- `/api/live/prediction.json`
- `/api/live/indicators.json`
- `/api/live/history.json`
- `/api/live/live_prediction_series.json`

These are served through Firebase Hosting rewrite to Cloud Run.

### Static path

- `/data/*.json`
- exported pages in `frontend/out`

These remain important for:

- cold start fallback
- SEO / static rendering
- model rebuild snapshots

## Runtime Flow

1. Cloud Scheduler calls `POST /api/tasks/refresh`
2. Cloud Run validates bearer token
3. Cloud Run seeds a temp workspace from:
   - current Cloud Storage objects when available
   - repo-bundled JSON fallback when live objects are missing
4. `scripts/refresh_night_futures.py` runs in that workspace
5. refreshed JSON is uploaded back to Cloud Storage
6. browser fetches new values through `/api/live/*.json`

## Live Prediction Series

`live_prediction_series.json` is the minute-level observation log used by the homepage `예측 추이` chart.

It stores snapshots for the active prediction date:

- `predictionDateIso`
- `observedAt`
- `kstTime`
- `pointPrediction`
- `nightFuturesSimplePoint`
- `predictedChangePct`
- `nightFuturesSimpleChangePct`

Rules:

- one row per minute-level `observedAt`
- if the same minute is refreshed more than once, the latest row replaces the old one
- when the prediction target rolls to a new date, prior target rows are dropped from the live series
- maximum retained rows: `1080`

The chart is not a historical backtest chart. It is a live nowcast trace for the currently active prediction target.

## Why No Database

The platform intentionally uses JSON object storage instead of a DB.

Reasoning:

- easier operations
- lower cost
- no schema migrations
- easier manual recovery
- fewer failure domains

For this product stage, "latest JSON object state" is enough.

## Current Role Split

### Cloud Run + Cloud Scheduler

Responsible for:

- minute-level live indicator refresh
- minute-level model prediction refresh
- minute-level model-vs-night-futures trend series update
- faster dashboard freshness without full Hosting redeploy

### GitHub Actions `retrain-model`

Still responsible for:

- full model rebuild
- static page regeneration
- baseline JSON rebuild
- Firebase Hosting deploy

### GitHub Actions `refresh-night-futures`

Now treated as:

- manual fallback workflow only
- not primary production refresh

## Security Model

- `GET /api/live/*`
  - public read
- `POST /api/tasks/refresh`
  - protected by bearer token
- token placement
  - Cloud Run environment variable
  - Cloud Scheduler authorization header

Recommended long-term upgrade:

- move refresh token handling into Secret Manager if the current inline env/header setup grows

## Required IAM Notes

The Firebase deploy service account must have enough rights to deploy Hosting when `firebase.json` includes Cloud Run rewrites with `pinTag: true`.

Required project roles for the deploy service account:

- `roles/firebasehosting.admin`
- `roles/run.developer`

This mattered in production after the Hosting deploy failure on:

- GitHub Actions run `24248400402`
- GitHub Actions run `24246079902`

Those failures were resolved by adding the missing roles to:

- `firebase-adminsdk-fbsvc@kospipreview.iam.gserviceaccount.com`

## Health Checks

When live refresh looks stale, check in this order:

1. Cloud Scheduler execution timestamps
2. Cloud Run service health and recent logs
3. Cloud Storage object updated timestamps
4. browser `/api/live/*.json` response timestamps
5. `/api/live/live_prediction_series.json` record count and latest `observedAt`
6. source market data freshness by symbol

## Practical Boundaries

- server-side minimum cadence is 1 minute
- browser polling can be shorter, but source refresh is still 1 minute
- some market symbols update slower than others even when our pipeline is healthy
- live refresh does not replace full retraining or static export updates
- trend chart cadence follows Cloud Scheduler / Cloud Run refresh cadence, not browser polling cadence

## Recovery Notes

If Cloud Run live refresh fails:

1. keep static Hosting online
2. verify Cloud Run token and Scheduler auth
3. verify Cloud Storage read/write
4. if needed, run fallback workflow `refresh-night-futures` manually
5. if live path is unstable, dashboard can still fall back to `/data/*.json`
