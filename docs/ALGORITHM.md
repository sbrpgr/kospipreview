# Algorithm

## Current Operating Model

Baseline date: 2026-04-13

The production prediction engine is `EWY Synthetic K200 Ridge`.

The main live model prediction uses a one-time KOSPI 200 night-futures bridge only to cover the EWY no-trade gap between the KRX close and the U.S. premarket open. After that bridge point is set, live movement comes from EWY, USD/KRW, and the auxiliary U.S. signals. Night futures are still published separately as a comparison benchmark.

Primary output:

- next KOSPI opening point prediction: `pointPrediction`
- prediction band: `rangeLow`, `rangeHigh`
- predicted change from the latest KOSPI close: `predictedChangePct`
- comparison-only night futures simple conversion: `nightFuturesSimplePoint`
- comparison-only EWY + USD/KRW simple conversion: `ewyFxSimplePoint`

## Time Anchors

All production time gates use Asia/Seoul time.

- `09:00`: roll prediction target to the next business day and set pending state until the next operating window.
- `15:30`: start live prediction operation for the next trading day.
- `15:30`: use the completed KOSPI close as `prevClose`.
- `15:45`: accept KOSPI 200 day futures close as final settlement only after this time.
- U.S. premarket open through `09:00`: append live prediction trend observations.
  - During U.S. daylight time this starts at `17:00 KST`.
  - During U.S. standard time this starts at `18:00 KST`.

## Model Input Basis

Live model returns are anchored to the KRX close sync basis, then bridged to the first usable EWY premarket basis while EWY cannot be traded at `15:30 KST`.

For each live symbol, the refresh process uses:

1. before the U.S. premarket bridge is ready, keep `ewyFxSimplePoint` and `pointPrediction` blank;
2. from the U.S. premarket open, sample the KOSPI 200 night-futures return every 2 minutes for 5 slots;
   during U.S. daylight time, also sample the `18:00~18:08 KST` night-futures-open window if the `17:00 KST` window did not provide a complete scheduled bridge;
3. use the latest bridge sample as the one-time `15:30 -> EWY premarket` anchor;
4. after the bridge anchor, calculate EWY, USD/KRW, and auxiliary returns from that bridge timestamp;
5. Yahoo standard displayed change is used only as a fallback when no synchronized intraday basis is available.

This is important for EWY. Yahoo may display EWY premarket change versus the previous U.S. regular close, but the model must not treat that display value as the Korean close-to-current return.

Indicator cards may still display standard market-session change values. That display basis must not be confused with model input basis.

## Prediction Calculation

1. Core signal
   - EWY and USD/KRW are the core signals.
   - The core layer estimates a synthetic KOSPI 200 overnight return.
   - EWY and KRW coefficients are calibrated from recent data and blended with structural weights.

2. Residual correction
   - SOX, S&P 500, NASDAQ 100, Dow, WTI, Gold, and US 10Y are residual or auxiliary signals.
   - Residual correction is capped.
   - If recent validation does not improve accuracy, residual weight is reduced or disabled.

3. KOSPI mapping
   - Synthetic K200 return is mapped to KOSPI opening return through a Ridge mapping layer.
   - The mapping intercept is allowed to represent learned opening drift.
   - Strong EWY + USD/KRW trend moves must not be compressed below the configured trend-follow floor.

4. Stabilization
   - Prediction changes are guard-banded.
   - Live refresh applies a small smoothing weight to reduce one-minute jump noise.
   - The model must not force the live night-futures path into `pointPrediction` after the one-time EWY bridge has been set.
   - The model must not force EWY direction matching when the full statistical mapping produces a different valid result.
   - The strong trend-follow floor uses EWY + USD/KRW after the bridge point.

## Night Futures Simple Conversion

Night futures simple conversion is separate from the model.

Formula:

```text
nightFuturesSimplePoint = KOSPI_close(D) * (K200_night(t) / K200_day_close(D))
nightFuturesSimpleChangePct = K200_night(t) / K200_day_close(D) - 1
```

Required basis:

- `KOSPI_close(D)` is the current completed KOSPI close after `15:30 KST`.
- `K200_day_close(D)` is the final KOSPI 200 day futures close.
- Final day futures close is trusted only when the source is the eSignal socket close at or after `15:45 KST`.

## EWY + FX Simple Conversion

EWY + FX simple conversion is separate from the statistical model. Until EWY can be
collected at `15:30 KST`, it uses the same one-time night-futures bridge as the live
model, then applies only EWY and USD/KRW movement after that bridge timestamp.

Formula:

```text
ewyFxSimpleChangePct = exp((bridge_log_return + EWY_log_return_after_bridge + USDKRW_log_return_after_bridge) / 100) - 1
ewyFxSimplePoint = KOSPI_close(D) * (1 + ewyFxSimpleChangePct)
```

Required basis:

- `KOSPI_close(D)` is the current completed KOSPI close after `15:30 KST`.
- The bridge log return is sampled from KOSPI 200 night futures at U.S. premarket open.
- EWY and USD/KRW returns are measured from the bridge timestamp onward.
- No residual model or K200 mapping is used in the EWY + FX simple conversion.

## EWY + FX Trend Follow Floor

The K200-to-KOSPI mapping can under-react when EWY + USD/KRW makes a large
overnight move. The model therefore applies a trend-follow floor when the
EWY + USD/KRW move is large enough to make near-flat model output unreliable.

Current production rule:

- medium trigger: absolute EWY + USD/KRW log-return signal at or above `0.70%`;
- medium floor: final model log return should reach at least `62%` of that EWY + USD/KRW signal;
- high trigger: absolute EWY + USD/KRW log-return signal at or above `2.0%`;
- high floor: final model log return should reach at least `78%` of that EWY + USD/KRW signal;
- per-update adjustment cap: `1.75%` log-return;
- inputs: EWY and USD/KRW after the one-time bridge point;
- the night-futures bridge is used only for the premarket synchronization gap.

Diagnostics:

- `model.trendFollowApplied`
- `model.trendFollowSignalPct`
- `model.trendFollowMinPct`
- `model.trendFollowAdjustmentPct`

## Recent Actual Records

`history.json` stores actual verification rows.

Tracked fields:

- `actualOpen`
- `actualClose`
- `dayFuturesClose`, final same-date day futures settlement only
- `nightFuturesClose`, the pre-open night session close for that actual date
- fixed pre-open `modelPrediction`
- fixed pre-open `nightFuturesSimpleOpen`
- fixed pre-open `ewyFxSimpleOpen`

Night futures simple values must be fixed from the last valid observation for
the target night session. The value should not disappear just because the
night futures market has closed before `09:00 KST`; only quotes outside the
target night-session window should be rejected.

The `nightFuturesClose` stored in an actual row must come from the same
pre-open fixed prediction snapshot. It must not be overwritten by the next
night session that starts after the actual date's domestic close.

Day/night futures close fields are tracked only for recent actual rows dated
`2026-04-14` or later. The `2026-04-13` row remains blank for both fields.

For a trading day, the fixed model prediction should come from the last valid pre-open series row before `09:00 KST`, or from the archive fallback.
