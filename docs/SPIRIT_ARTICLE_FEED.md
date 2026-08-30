# Insight Spirit article strip

Applied 2026-08-31. Replaces the home top Coupang iframe and two advertisement-inquiry placeholders. The site-wide AdSense capability is unchanged.

- Source: public WordPress REST API on `https://insightspiritmarket.com`.
- Displays the latest three published articles, regardless of author. Excludes demo, password-protected, future, invalid and duplicate posts. Titles render as React text; links/images must be HTTPS on the Market origin.
- Queries 12 recent posts to allow filtering. No credentials, WordPress admin token, paid service, scheduler or publishing hook.
- Fetches on each page visit and every five minutes while the page is visible; returning to the page checks again if five minutes elapsed. New WordPress publications require **no Hosting deployment or manual update**.
- Eight-second timeout. On temporary failure, retains the current page's last successful feed for up to one hour, then shows the direct Market link. No disk cache. A successful empty feed immediately clears old cards. The prediction dashboard works independently.
- Desktop: three cards. Up to 720px: one card, seven-second rotation, previous/next, swipe, arrow keys, pause/play. Focus/manual interaction pauses; hover, offscreen, background tabs and reduced-motion preference suppress automatic rotation.
- Medium-size WordPress thumbnails; reserved dimensions prevent layout jumps. Plain article title remains readable if an image fails.
- Outbound links carry `utm_source=kospipreview`, `utm_medium=referral`, `utm_campaign=spirit_latest`, `utm_content=<post ID>`. Existing GA receives `spirit_article_click` and visible `spirit_article_impression`; no personal data is sent. Destination Analytics availability depends on its existing GA configuration.

## Verification and deployment

Run `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build` in `frontend`. Inspect desktop/mobile, pause and next controls, and normal WordPress REST updates. Deploy code changes using **deploy-hosting only**. Do not deploy Cloud Run/Cloud Build, touch model refresh or add a scheduled workflow for this feed.

If no cards appear, check the public WP endpoint, HTTPS, CORS for `https://kospipreview.com` and `https://www.kospipreview.com`, and published/non-demo posts. Never expose admin credentials or globally cache authenticated `/wp-json/` traffic. CORS/fetch failure retains the direct link without breaking the home page.
