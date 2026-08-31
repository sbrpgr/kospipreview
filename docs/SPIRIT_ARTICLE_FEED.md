# Three-topic Insight Spirit banner

Updated 2026-08-31 at owner request. Existing ad slots are reused; no new banner region, server, paid service, admin credential or publication hook.

- Desktop: fixed Market / Money tips / Health slots, each showing one of its latest three public posts every 7 seconds.
- Mobile (up to 1000px): Market1 → Money1 → Health1 → Market2…; skip empty/failed topics. Shorter nonempty buckets wrap so each topic gets equal exposure.
- Market source: insightspiritmarket.com, excluding category 9.
- Money tips: same site, category 9 (money-information), including posts assigned additional categories. This topic is excluded from the general Market slot.
- Health: insightspirithealth.com. Origin validation is per topic; WordPress IDs can overlap across sites without conflating articles or impressions.
- Each query asks for 12 recent posts, chooses the latest three publish/non-protected/non-demo/non-preview posts, rejects future timestamps and duplicates. Titles are escaped/text-only; images and links must be HTTPS on that topic's exact origin without credentials.
- Load on entry and every five minutes while visible; recheck on return if due. Three independent, anonymous requests with 8-second timeouts and omitted credentials/referrers. No editor text, input files, filenames or user identifiers sent.
- A failed/empty desktop topic displays its own category/home link; no misleading borrowed article. On mobile it is skipped and re-enters automatically after eligible posts appear. No persistent cache; successful refresh removes withdrawn posts. Failure clears only the affected topic.
- Controls: previous/next, play/pause. Mouse hover, keyboard focus/manual interaction, touch, hidden/offscreen state or reduced-motion preference suppress autoplay. Manual navigation remains possible with reduced motion. Motion uses a subtle 0.4-second fade-in, not flashes. No automatic link opening.
- Images use half the card, uncropped contain, with space reserved for the thumbnail. Missing/broken images retain a brand placeholder and readable headline.
- Outbound UTM campaign spirit_latest identifies the source platform. Article links include public post ID only; no custom user data. Ko uses source ko-workspace; Kospi uses kospipreview.
- Current empty money-information category is deliberate: do not publish, relabel, invent or duplicate articles to populate it.

## Maintenance

No deployment is needed for newly published articles. If WordPress category IDs/domains change, update channel configuration and origin tests. Test topic disjointness, health origin/media, matching IDs across sites, unequal/empty buckets, future/private/demo exclusion, request failure, controls, reduced motion and small screens.

Ko Workspace: assets/spirit-market.mjs, styles.css, scripts/spirit-market.test.mjs. Cache version 20260831-02. Run npm.cmd run check and git diff --check; deploy existing main → Cloudflare Pages. EN/JA/ZH labels identify Korean content.

Kospi Preview: frontend/src/lib/spirit-articles.ts and frontend/src/components/spirit-article-banner.tsx. Run test, typecheck, lint and build in frontend. CI must pass before merging; use deploy-hosting only. Do not deploy Cloud Run/Cloud Build, change model refresh, YouTube workflow, DNS or WordPress settings for this feature.

After deployment verify both sites' real article titles/images and controls, then reset temporary viewport overrides and close only task-created browser tabs.
