# Backtest Results

## Dataset

- rows: 1462
- rolling window: 120
- evaluated feature subsets: 2~5 variables

## Selected Model

선정 기준은 `rolling RMSE` 최소값입니다. 동률이면 밴드 적중률, 평균 p-value, 평균 VIF 순으로 비교했습니다.

선택된 변수:
- `sp500_return`
- `sox_return`

## Metrics

- RMSE: 21.82
- MAE: 12.24
- Band hit rate: 75.26%
- Direction hit rate: 76.53%
- Average p-value: 0.0000
- Average VIF: 3.0137

## Final Window Coefficients

| term | coefficient | p-value |
| --- | ---: | ---: |
| const | 0.171393 | 0.105949 |
| sp500_return | 0.872325 | 7.6e-05 |
| sox_return | 0.308865 | 0.000123 |

## Top Candidate Ranking

| rank | features | RMSE | Band hit rate | Direction hit rate |
| --- | --- | ---: | ---: | ---: |
| 1 | sp500_return, sox_return | 21.82 | 75.26% | 76.53% |
| 2 | sp500_return, sox_return, koru_return | 22.17 | 74.81% | 76.30% |
| 3 | ewy_return, sp500_return, sox_return | 22.18 | 74.81% | 76.23% |
| 4 | nasdaq_return, sox_return | 22.46 | 76.15% | 75.11% |
| 5 | sp500_return, koru_return | 22.60 | 77.20% | 76.45% |

## Notes

- Yahoo Finance 일별 데이터 기준으로 미국장 종가를 다음 한국장 시초가에 정렬했습니다.
- 야간선물 실시간 데이터는 현재 파이프라인에 연결되지 않아 `KORU`, `EWY`, `KRW=X` 등 미국장 후행 프록시를 우선 사용했습니다.
- 밴드 폭은 롤링 RMSE를 포인트 단위 표준오차로 사용하고 VIX 배수로 확장했습니다.
