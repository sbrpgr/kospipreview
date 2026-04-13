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

Direction guard:

- mapping intercept is allowed to express normal opening drift;
- mapping intercept must not single-handedly flip a non-trivial KRX-synced core signal;
- when that happens, the final mapped return uses the beta-only direction-preserving value;
- diagnostics are exposed through `model.mappingDirectionGuardApplied` and `model.mappingDirectionGuardPct`.

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
- `futuresDayClose`
- `futuresDayCloseDate`
- `nightFuturesClose`

`model` important fields:

- `engine`
- `calculationMode`
- `nightFuturesExcluded`
- `liveEwyChangePct`
- `liveKrwChangePct`
- `krxBaselineDate`
- `coreAnchorPct`
- `rawModelPct`
- `mappingDirectionGuardApplied`
- `mappingDirectionGuardPct`
- `liveRefreshUpdatedAt`

## Operating Invariants

- `model.nightFuturesExcluded` must be `true`.
- `pointPrediction` must not be anchored to `nightFuturesSimplePoint`.
- `pointPrediction` must not be flipped upward by mapping intercept alone when the KRX-synced EWY/KRW core is meaningfully negative.
- `nightFuturesSimplePoint` must use current KOSPI close after `15:30 KST`.
- `nightFuturesSimplePoint` must use final KOSPI 200 day futures close after settlement.
- Same-day KOSPI 200 day futures close is final only after `15:45 KST` socket settlement.
- The most recent actual history row must track actual open, actual close, day futures close, and night futures close.
