# Backtest Results

> Archive note: this file preserves an older experiment snapshot. It is not the current production model spec. For current operating rules, read `docs/ALGORITHM.md`, `docs/DATA_SOURCES.md`, and `docs/MODEL_EWY_SYNTHETIC_K200_2026-04-10.md`.

## Dataset

- rows: 1462
- rolling window: 120
- evaluated feature subsets: 2~5 variables

## 모델 엔진 성능 비교

| 지표 | OLS (선형회귀) | LightGBM | 개선율 |
| --- | ---: | ---: | ---: |
| RMSE | 21.82 | 29.04 | -33.1% |
| MAE | 12.24 | 15.30 | -25.0% |
| 밴드 적중률 | 75.26% | 50.53% | -24.7%p |
| 방향 적중률 | 76.53% | 74.40% | -2.1%p |

## Selected Model (OLS 피처 선택 기준)

| const | 0.171393 | 0.105949 |
| sp500_return | 0.872325 | 7.6e-05 |
| sox_return | 0.308865 | 0.000123 |

## LightGBM Feature Importance

| Feature | Importance |
| --- | ---: |
| sox_return | 3039 |
| sp500_return | 2961 |

## Top OLS Candidates

| Rank | Features | RMSE | Band Hit | Dir Hit |
| --- | --- | ---: | ---: | ---: |
| 1 | sp500_return, sox_return | 21.82 | 75.26% | 76.53% |
| 2 | sp500_return, sox_return, koru_return | 22.17 | 74.81% | 76.30% |
| 3 | ewy_return, sp500_return, sox_return | 22.18 | 74.81% | 76.23% |
| 4 | nasdaq_return, sox_return | 22.46 | 76.15% | 75.11% |
| 5 | sp500_return, koru_return | 22.60 | 77.20% | 76.45% |

## Data Source Notes

- **데이터 출처**: Yahoo Finance 일봉 종가 기준 (yfinance 라이브러리)
- **야간선물 실시간 데이터**: 현재 파이프라인 미연결. EWY, KORU, KRW=X 등 미국장 후행 프록시 사용
- **환율(KRW=X)**: USD 1 = KRW x원 기준. 수치 상승 = 원화 약세 = 코스피 하방 압력
- **밴드 폭(LightGBM)**: Quantile Regression (10th ~ 90th percentile) 기반 동적 산출
