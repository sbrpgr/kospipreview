# EWY Synthetic K200 Model

Baseline date: 2026-04-13

## Summary

- Engine: `EWY Synthetic K200 Ridge`
- Primary live refresh script: `scripts/refresh_night_futures.py`
- Full rebuild script: `scripts/backtest_and_generate.py`
- Night futures in model path: not used
- Night futures in product: comparison and validation benchmark only

## Live Input Contract

The model must use KRX-close-synchronized returns.

For live refresh:

- baseline session date is normally the latest completed KOSPI session date;
- baseline time is `15:30 KST`;
- EWY and USD/KRW must be measured from that basis when intraday data exists;
- Yahoo displayed premarket or after-hours change is only a fallback, not the first choice;
- indicator display can still use standard market-session change.

This prevents EWY premarket display change versus the prior U.S. close from being misread as Korean-close change.

## Core Formula

The core layer estimates synthetic KOSPI 200 movement from EWY and USD/KRW.

Inputs:

- `ewy`
- `krw`

Metadata:

- `model.ewyFxIntercept`
- `model.ewyFxEwyCoef`
- `model.ewyFxKrwCoef`
- `model.ewyFxSampleSize`
- `model.ewyFxFitR2`

Output:

- `model.coreAnchorPct`

## Residual Layer

Residual candidates:

- S&P 500
- NASDAQ 100
- Dow
- SOX
- WTI
- Gold
- US 10Y

Rules:

- residuals are bounded by configured caps;
- residual weight can drop to zero when validation does not improve recent accuracy;
- residuals must not replace the EWY/KRW core signal.

## Mapping Layer

Synthetic KOSPI 200 return is mapped to KOSPI return through:

- `model.k200Mapping.intercept`
- `model.k200Mapping.beta`
- `model.k200Mapping.sampleSize`

The final KOSPI return is converted back to a point value from `prevClose`.

Mapping diagnostics:

- mapping intercept is allowed to express normal opening drift;
- small EWY/KRW core moves can be outweighed by the learned mapping intercept;
- this can produce a valid positive KOSPI prediction even when EWY is slightly negative from the KRX sync baseline;
- diagnostics are exposed through `model.mappingInterceptPct`, `model.mappingBetaContributionPct`, and `model.mappingDirectionFlip`.

## EWY + FX Trend Follow Floor

The mapping layer can over-compress overnight trend moves. When the EWY
+ USD/KRW simple signal is large enough to make near-flat model output
unreliable, the model applies a floor to keep the final prediction responsive.

Production rule:

- medium trigger: absolute EWY + USD/KRW log-return signal at or above `0.70%`;
- medium floor: final model log return should reach at least `62%` of the EWY + USD/KRW signal;
- high trigger: absolute EWY + USD/KRW log-return signal at or above `2.0%`;
- high floor: final model log return should reach at least `78%` of the EWY + USD/KRW signal;
- adjustment cap: `1.75%` log-return per prediction update;
- inputs: EWY and USD/KRW only.

This floor does not use night futures. Night futures remain comparison and
validation data only.

Diagnostics:

- `model.trendFollowApplied`
- `model.trendFollowSignalPct`
- `model.trendFollowMinPct`
- `model.trendFollowAdjustmentPct`

## Output Fields

`prediction.json` important fields:

- `predictionDateIso`
- `prevClose`
- `prevCloseDate`
- `pointPrediction`
- `predictedChangePct`
- `rangeLow`
- `rangeHigh`
- `nightFuturesSimplePoint`
- `nightFuturesSimpleChangePct`
- `ewyFxSimplePoint`
- `ewyFxSimpleChangePct`
- `futuresDayClose`
- `futuresDayCloseDate`
- `nightFuturesClose`

`model` important fields:

- `engine`
- `calculationMode`
- `nightFuturesExcluded`
- `nightFuturesBridgeApplied`
- `nightFuturesBridgePct`
- `ewyFxBridgeBaselineAt`
- `liveEwyChangePct`
- `liveKrwChangePct`
- `krxBaselineDate`
- `coreAnchorPct`
- `rawModelPct`
- `mappingInterceptPct`
- `mappingBetaContributionPct`
- `mappingDirectionFlip`
- `trendFollowApplied`
- `trendFollowSignalPct`
- `trendFollowMinPct`
- `trendFollowAdjustmentPct`
- `liveRefreshUpdatedAt`

## Operating Invariants

- Live payloads use a one-time night-futures bridge only for the EWY no-trade gap between `15:30 KST` and U.S. premarket open.
- `model.nightFuturesBridgeApplied` must be `true` after that bridge is ready.
- `pointPrediction` must not be anchored to the live `nightFuturesSimplePoint` path after the bridge point.
- `pointPrediction` must not be forcibly matched to EWY direction when the statistical mapping supports a different result.
- `nightFuturesSimplePoint` must use current KOSPI close after `15:30 KST`.
- `nightFuturesSimplePoint` must use final KOSPI 200 day futures close after settlement.
- `ewyFxSimplePoint` must use the one-time bridge plus EWY and USD/KRW returns after the bridge timestamp.
- `ewyFxSimplePoint` must not use residuals or K200 mapping.
- Same-day KOSPI 200 day futures close is final only after `15:45 KST` socket settlement.
- The most recent actual history row must track actual open, actual close, EWY + FX conversion, day futures close, and night futures close.
