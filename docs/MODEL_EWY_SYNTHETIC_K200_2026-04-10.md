# EWY Synthetic K200 Model

## 기준일

- 2026-04-10

## 현재 운영 모델 요약

- 메인 예측 엔진: `EWY Synthetic K200 Ridge`
- 야간선물 사용 여부: 예측 모델에서 완전 미사용
- 출력 대상: 다음 거래일 코스피 시초가 중심값과 예측 밴드
- 실시간 갱신 경로:
  - 학습/정적 산출: `scripts/backtest_and_generate.py`
  - 운영 중 재계산: `scripts/refresh_night_futures.py`

## 계산 구조

1. EWY + USD/KRW를 코어 신호로 사용해 합성 KOSPI 200 야간 환산 수익률을 계산한다.
2. SOX, S&P 500, NASDAQ 100, Dow, WTI, Gold, US 10Y는 잔차 보정 후보 신호로만 사용한다.
3. 잔차 보정은 PCA 기반 broad factor와 Ridge 회귀 계수로 계산한다.
4. 잔차 보정이 최근 시계열 검증에서 성능을 개선하지 못하면 자동으로 가중치를 0으로 낮춘다.
5. 합성 KOSPI 200 수익률을 다시 Ridge 매핑으로 코스피 수익률로 변환한다.
6. 최종 코스피 수익률은 로그수익률 기준으로 계산한 뒤, 사용자 화면에는 일반 퍼센트와 지수값으로 표시한다.

## 핵심 원칙

- 지표 카드 표시값은 일반 시세 기준으로만 보여준다.
- 내부 보정 기준(`KRX 15:30 KST`)은 예측 계산에만 사용한다.
- 야간선물은 비교용 참고값으로만 유지한다.
- 보조지표는 코어를 대체하지 않고, 검증된 범위에서만 제한적으로 개입한다.

## 현재 메타데이터 키

- `prediction.json`
  - `model.engine`
  - `model.calculationMode`
  - `model.ewyFx*`
  - `model.residualModel`
  - `model.k200Mapping`
- `backtest_diagnostics.json`
  - `featureImportance`
  - `ewyFxCorrection`
  - `residualModel`
  - `k200Mapping`

## 운영 메모

- 현재 잔차 보정층은 최근 검증 기준으로 자동 축소될 수 있다.
- 실시간 재계산에서도 학습 산출물과 동일한 코어/잔차/매핑 구조를 그대로 사용한다.
- 홈 화면의 `모델 예측` 라벨에는 `야간 선물 지표 완전 미사용` 문구를 함께 표기한다.
