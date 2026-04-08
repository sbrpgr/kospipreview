# Data Sources

## 운영 데이터 소스(2026-04-09 기준)

- Yahoo Finance
  - 코스피: `^KS11`
  - 해외/보조 지표: `EWY`, `KORU`, `^GSPC`, `^NDX`, `^DJI`, `^VIX`, `CL=F`, `GC=F`, `^TNX`, `^SOX`, `KRW=X`
- eSignal 캐시 JSON
  - 야간선물: `https://esignal.co.kr/data/cache/kospif_ngt.js`
  - 주간선물: `https://esignal.co.kr/data/cache/kospif_day.js`

## KOSPI200 선물 처리 규칙

- 야간선물 등락률은 반드시 주간선물 종가 대비로 계산한다.
- 주간선물 종가는 세션 단위 캐시(`day_futures_close_cache.json`)로 관리한다.
- 캐시 세션 날짜가 유효하면 재요청하지 않고 재사용한다.
- 소스 장애 시 마지막 성공 캐시 값을 유지한다.

## 사용자 노출 정책

- 지표 카드에는 데이터 출처를 표기한다.
- KOSPI200 야간선물 카드는 내부 정책상 출처 링크를 비활성화한다.
- 지표별 실제 갱신 주기가 다르므로, 최신 수치는 각 원 출처에서 직접 확인하는 것을 원칙으로 한다.
