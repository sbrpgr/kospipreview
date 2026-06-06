# Home Top Ad Banner Work Spec

Date: 2026-06-07 KST

## Scope

Add a three-column ad banner between the global navigation header and the homepage hero forecast section.

This is a frontend-only monetization placement. It must not change prediction calculation, live data refresh,
Cloud Run behavior, Cloud Scheduler cadence, model JSON generation, or Firebase rewrite pinning.

## Implemented Layout

- Location: homepage only, directly after `SiteHeader` and before the `heroSection`.
- Grid: three equal columns using `repeat(3, minmax(0, 1fr))`.
- Desktop maximum slot width: about `320px` per column inside the `980px` page container.
- Slot height: `140px`.
- Left slot: Coupang Partners carousel widget.
- Center and right slots: reserved ad inquiry slots with `광고문의 ytbtheguy@gmail.com`.
- Ad label: each slot exposes a small visible `광고` label.

## Coupang Partners Slot

The left slot loads the Coupang Partners script only on the client:

- Script: `https://ads-partners.coupang.com/g.js`
- Widget id: `995011`
- Template: `carousel`
- Tracking code: `AF1258921`
- Width: `320`
- Height: `140`

The component passes a dedicated DOM container to `PartnersCoupang.G` so the generated iframe is mounted only
inside the left ad slot and cannot insert itself around dashboard or forecast content.

## Files

- `frontend/src/components/home-top-ad-banner.tsx`
- `frontend/src/components/live-dashboard.tsx`
- `frontend/src/app/globals.css`

## Safety Constraints

- Do not modify live dashboard prediction state, fetch order, or fallback data behavior for ad placement changes.
- Do not call Cloud Run or Cloud Build for this class of work.
- Deploy through GitHub Actions `deploy-hosting` only.
- Keep third-party ad script execution inside the ad component lifecycle.
- Keep a fixed slot height so late-loading ad iframes do not shift forecast content unexpectedly.
- If the Coupang script fails or is blocked, the dashboard must continue rendering normally.

## Verification

Local verification:

- `npm run build` passed.
- `git diff --check` passed.
- Local dev server returned `200` for `/`.
- Static HTML includes `homeTopAdBanner`, the Coupang mount, and both ad inquiry slots.

Production verification:

- Commit: `1a839cb7 Add home top ad banner`
- Workflow: GitHub Actions `deploy-hosting`
- Run: `https://github.com/sbrpgr/kospipreview/actions/runs/27069768423`
- Result: success
- Production homepage: `https://kospipreview.com/` returned `200`.
- Production HTML includes `homeTopAdBanner`, `쿠팡 파트너스 광고`, `광고문의`, and `ytbtheguy@gmail.com`.
- Production live prediction trend API remained healthy:
  - `predictionDateIso`: `2026-06-08`
  - `live_prediction_series` records: `899`
  - matching records for the current prediction date: `899`

## Cost Guardrail

Only Firebase Hosting was deployed through `deploy-hosting`. Cloud Run, Cloud Build, Cloud Scheduler, and Cloud
Storage JSON refresh workflows were not used.
