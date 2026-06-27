# YouTube News Work Spec

Last updated: 2026-06-27

## Current production behavior

- Home page `/` shows only the latest 10 YouTube news posts.
- Full board `/youtube-news` shows all collected YouTube news posts.
- `/youtube-news` paginates posts by 10 items per page.
- Individual posts open inside the platform via `/youtube-news/post?item=...`.
- The old daily report section has been removed from the bottom of `/youtube-news`.
- Legacy report HTML paths under `/api/news/reports/...` are not used.
- Legacy article/report URLs redirect or fall back to the platform board flow instead of exposing old static report pages.

## Content source

- New content is placed under:

```text
news/YYYY-MM-DD/HHMMSS/digest_db.json
```

- Example:

```text
news/2026-04-23/214757/digest_db.json
```

- Only `digest_db.json` is required for publishing.
- Generated HTML, markdown, logs, summaries, and intermediate files are not required for the platform board.

## Content quality rule

- Publish only items with normal Gemini summaries:

```json
"summary_provider": "gemini"
```

- Items with fallback transcript summaries are not publish-quality content and should be removed from `digest_db.json` before publishing:

```json
"summary_provider": "transcript_extract"
```

- Fallback transcript summaries often contain raw transcript fragments, video metadata, ad text, comment text, or the phrase "Gemini response was unavailable" / "automatic transcript summary".
- When removing bad items, update the parent report `count` to match the remaining `items.length`.
- Do not delete the whole report directory unless the source run itself is invalid. Empty reports may remain with `count: 0` and `items: []`.

## Deduplication rule

- Posts are deduplicated by original YouTube title first.
- If the original title is duplicated, the latest run/post wins.
- Fallback keys are source URL, then headline/youtuber.
- After dedupe, items are sorted by video published time, newest first.

## Publishing workflow

Use this single command from the repository root:

```bat
publish_youtube_news.cmd
```

The command runs:

- `npm run sync-news`
- `git pull --rebase --autostash origin main`
- `git add -- :(glob)news/**/digest_db.json`
- `git commit`
- `git push origin main`
- GitHub Actions workflow `publish-youtube-news.yml`
- Production API verification for `/api/news/youtube-news.json`

If quality cleanup is needed before publishing, remove bad items from root `news/**/digest_db.json` first, then run the publish command. Do not edit generated HTML, markdown, logs, summaries, or diagnostics for board cleanup.

## Publish success criteria

- A publish is only considered valid when:

```text
https://kospipreview.com/api/news/youtube-news.json
```

returns:

- the new `latestItems`
- the new `reports`
- header `X-Kospi-News-Source: bucket`

- `scripts/publish_youtube_news.ps1` now treats `source != bucket` as a failure.
- This is important because a past issue caused Cloud Run to serve stale bundled data even after the upload workflow succeeded.

## No-redeploy content update

- Routine content updates do not require Firebase Hosting deploy.
- Routine content updates must not run Cloud Build or Cloud Run deploy.
- Routine updates use GitHub Actions workflow:

```text
.github/workflows/publish-youtube-news.yml
```

- That workflow generates `frontend/public/data/youtube-news.json`.
- It uploads the JSON to:

```text
gs://kospipreview-live-data/youtube-news/youtube-news.json
```

- Cloud Run serves it through:

```text
https://kospipreview.com/api/news/youtube-news.json
```

- The news index is not a minute-level market signal. It may use a longer short-lived cache than live market JSON:

```text
NEWS_CACHE_SECONDS=300
Cache-Control: public, max-age=300, s-maxage=600, stale-while-revalidate=1800
```

- Do not change the news cache back to per-request `no-store` unless production verification proves stale news is being served after a publish.

## When full deploy is still needed

Use the light Hosting deploy for frontend-only code/UI/page changes.

Examples:

- Changing `/youtube-news` layout
- Changing dedupe logic
- Changing Firebase routing
- Adding/removing pages

Hosting-only workflow:

```text
.github/workflows/deploy-hosting.yml
```

Use Cloud Run deploy only when server/API/refresh behavior changes.

Examples:

- Changing Cloud Run news selection logic
- Changing `/api/live/**` or `/api/news/**` server behavior
- Changing Cloud Scheduler refresh timing
- Changing Cloud Run environment variables
- Changing Cloud Run response cache headers or server-side cache TTLs

Cloud Run workflow:

```text
.github/workflows/cloudrun-deploy.yml
```

## Important files

- `publish_youtube_news.cmd`
- `scripts/publish_youtube_news.ps1`
- `.github/workflows/publish-youtube-news.yml`
- `.github/workflows/deploy-hosting.yml`
- `.github/workflows/cloudrun-deploy.yml`
- `.github/workflows/retrain-model.yml`
- `.github/workflows/refresh-night-futures.yml`
- `scripts/deploy_cloud_run_live_data.ps1`
- `firebase.json`
- `frontend/scripts/sync-news.mjs`
- `frontend/src/components/youtube-news-archive.tsx`
- `frontend/src/components/youtube-news-summary.tsx`
- `frontend/src/components/youtube-news-post-viewer.tsx`
- `frontend/src/lib/youtube-news-board.ts`
- `frontend/src/lib/youtube-news-client.ts`
- `cloudrun/live_data_service.py`
- `YOUTUBE_NEWS_WORK_SPEC.md`

## Operational notes

- Local `gcloud` credentials were unreliable, so the stable publishing path uses GitHub Actions credentials.
- GitHub Actions has the working Google Cloud service account secret.
- Frontend/calculator/copy work should use `deploy-hosting` only.
- Routine data JSON refreshes should upload JSON to Cloud Storage only.
- Cloud Run deploys should be reserved for server/API/Scheduler changes.
- Cloud Run now explicitly runs with the service account:

```text
firebase-adminsdk-fbsvc@kospipreview.iam.gserviceaccount.com
```

- This was added because Cloud Run must be able to read:

```text
gs://kospipreview-live-data/youtube-news/youtube-news.json
```

- The Cloud Run news cache is short, so API updates should appear shortly after the publish workflow succeeds.
- If a page looks stale, verify the API first at `/api/news/youtube-news.json`.
- If needed, force a fresh page request with a query string such as:

```text
/youtube-news?t=timestamp
```

## Expected verification

After publishing:

- `/api/news/youtube-news.json` returns the updated `latestItems`.
- `/api/news/youtube-news.json` should report source `bucket`, not `bundled`.
- `/` still shows exactly 10 YouTube news items.
- `/youtube-news` shows 10 posts on the first page.
- New posts appear in newest-first order.
- Duplicate original titles do not appear twice.
- No visible item should contain fallback transcript-summary language such as `Gemini response was unavailable`, `automatic transcript summary`, or `transcript_extract`-style summary text.

## Recent fixes and lessons learned

- On 2026-05-04, fallback transcript-summary items were removed from publishable digests:
  - removed `48` non-Gemini items from `9` `digest_db.json` files;
  - local source inventory after cleanup: `59` items, `0` non-Gemini items;
  - published API result: `43` deduped latest items, `19` reports, source `bucket`;
  - no Cloud Run, Cloud Build, or Firebase Hosting deploy was used.
- A bug previously caused Cloud Run to prefer stale bundled news over the uploaded bucket JSON.
- That bug was fixed in `cloudrun/live_data_service.py`.
- A second issue occurred when the `/youtube-news` board section was accidentally removed from `frontend/src/components/youtube-news-archive.tsx`.
- That board section has been restored.
- A page-cache symptom also appeared where `/youtube-news` without a query string could look older than `/youtube-news?t=...`.
- When debugging future issues, always separate these three checks:

```text
1. Is the API updated?
2. Is the API source bucket or bundled?
3. Is the page HTML rendering the board section?
```

- If API is correct but page looks wrong, inspect the rendered HTML for:

```text
newsBoardRow
newsBoardPager
newsArchiveSection
```
