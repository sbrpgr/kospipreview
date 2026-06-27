# Firebase / GCP Cost Reduction Plan

Date: 2026-05-22 KST

Updated: 2026-06-27 KST

Related work spec: `docs/LIVE_DASHBOARD_API_WORK_SPEC_2026-05-22.md`

## Current Finding

- 2026-06-27 billing sample:
  - Cloud Run subtotal: KRW 16,449
  - Cloud Storage subtotal: KRW 2,431
  - Artifact Registry subtotal: KRW 1,362
  - Firebase Hosting subtotal: KRW 790
  - Cloud Run is about 78% of the listed subtotal and is the primary reduction target.
- Billing console could not be read from this workstation because `gcloud` is not installed and the Google Cloud Console URL requires an authenticated browser session.
- Firebase Hosting billing is driven by Hosting storage and data transfer. Local `frontend/out` is about 5.8 MB, so current Hosting cost risk is much more likely transfer/request volume than storage.
- Firebase Hosting rewrites `/api/**` to Cloud Run. Dynamic backend responses are not cached by Firebase Hosting CDN by default unless cache headers allow it.
- The dashboard previously polled four live JSON files every 30 seconds per open tab. Cloud Scheduler produces live refreshes at minute cadence, so 30-second client polling created extra read traffic without matching new data.
- Before the 2026-06-27 reduction pass, the dashboard could still produce one bundled dashboard read plus three separate Model 2 reads per polling cycle.
- Recent `save-market-snapshot` runs failed before uploading snapshots because `google-cloud-storage` was missing from the workflow install step.
- Remote GitHub Actions still has `deploy-production` active. `cloudrun-deploy.yml` is now tracked on `main`, and its Cloud Scheduler update step is opt-in through the `update_scheduler` manual input.

## Immediate Changes Applied

1. `save-market-snapshot` now installs `google-cloud-storage>=2.18.0,<4.0` before running `scripts/save_market_snapshot.py`.
2. Frontend live polling changed from 30 seconds to 60 seconds. This cuts steady-state live API reads from each open dashboard tab by about 50% while matching the production refresh cadence.
3. Cloud Run now serves `/api/live/dashboard.json`, which bundles prediction, indicators, history, and live prediction series. The frontend tries this single endpoint first and falls back to the previous per-file endpoints if needed, cutting steady-state dashboard live reads from four per poll to one per poll.
4. `cloudrun-deploy` no longer updates Cloud Scheduler by default. Use the `update_scheduler` input only when Scheduler cadence, target URI, or auth header must change.
5. 2026-06-27 reduction pass:
   - frontend cache-buster query strings now use fixed time buckets instead of per-request `Date.now()`;
   - hidden browser tabs skip live polling and resync on focus/visibility return;
   - Model 2 reads use `/api/live/holiday-dashboard.json` in the normal path, with the legacy three-file path kept as fallback;
   - Cloud Run live responses use short public cache headers and an instance-local 60 second JSON cache;
   - news index responses use a longer cache because the news index is not a minute-level market signal;
   - Cloud Scheduler live refresh cadence is reduced from every minute to every two minutes outside `09:00~16:59 KST`;
   - Cloud Run also enforces `REFRESH_MIN_INTERVAL_SECONDS=120` so an older every-minute Scheduler configuration still skips the non-window minute cheaply.

## Billing Verification Checklist

Use the Google Cloud Billing report for billing account `013A72-4608CD-FE4F11`.

1. Group by `Service`, then by `SKU`.
2. Check whether the largest cost is:
   - `Firebase Hosting` data transfer;
   - `Cloud Run` request/CPU/memory;
   - `Cloud Storage` storage, operations, or egress;
   - `Cloud Build` or Artifact Registry from deploys.
3. In Firebase Console Hosting usage, check:
   - Hosting storage GB;
   - Hosting data transfer GB/month;
   - retained release count.
4. In Cloud Run metrics, check:
   - request count for `GET /api/live/*`;
   - request count and latency for `POST /api/tasks/refresh`;
   - minimum instances must remain `0` unless explicitly justified.
5. In Cloud Scheduler, verify the live refresh cron is still:
   - `*/2 0-8,17-23 * * 1-5`
   - time zone `Asia/Seoul`
   - If Scheduler IAM blocks cron updates, verify Cloud Run returns `202 throttled` for non-window refresh attempts.

## Cost Reduction Roadmap

### Phase 1 - No Cloud Run deploy required

- Deploy the 60-second polling change with `deploy-hosting`.
- Set Firebase Hosting release retention to a small number such as 5-10 releases.
- Keep using `publish_youtube_news.cmd` / `publish-youtube-news` for routine news uploads.
- Keep routine JSON refreshes on Cloud Storage upload paths, not Firebase Hosting redeploys.
- Do not use `deploy-production` for routine work.

### Phase 2 - Requires Cloud Run / frontend coordination

- Deployed: `/api/live/dashboard.json` returns prediction, indicators, history, and live series together. Keep the legacy per-file endpoints available as a fallback.
- Deployed: `/api/live/holiday-dashboard.json` returns Model 2 prediction, series, and history together. Keep the legacy per-file endpoints available as a fallback.
- Keep Cloud Run `LIVE_JSON_CACHE_SECONDS` at 60 seconds unless production freshness or Billing SKU detail proves a different value is needed.
- Keep `/api/news/youtube-news.json` on the longer news cache path; news does not need the same freshness as live market data.

### Phase 3 - Requires workflow policy decision

- Reduce `retrain-model` schedule from `*/5 * * * 1-5` to a smaller set of market-relevant rebuild times, because Cloud Run is already the primary minute-level live refresh path.
- Disable or remove the old `deploy-production.yml` workflow to prevent accidental Cloud Build / Cloud Run deploys.
- Add a monthly cost review runbook section after real Billing SKU data is captured.

## References

- Firebase Hosting pricing and quotas: https://firebase.google.com/docs/hosting/usage-quotas-pricing
- Firebase Hosting cache behavior: https://firebase.google.com/docs/hosting/manage-cache
- Cloud Run pricing: https://cloud.google.com/run/pricing
- Cloud Billing budgets: https://cloud.google.com/billing/docs/how-to/budgets
