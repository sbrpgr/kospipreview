# 코스피 예측 알고리즘 고도화 기획안

기존의 단순 OLS(다중 선형 회귀) 롤링 모델은 직관적이고 변수의 p-value와 VIF(다중공선성)를 해석하기 좋지만, 비선형적인 금융 시장의 패턴을 학습하기에는 한계가 뚜렷하며 신뢰도(Confidence) 산출이 경직되어 있습니다.
현재보다 **예측 확률과 안정성을 높이기 위한 신규 알고리즘 도입 및 파이프라인 구상안**을 제안합니다.

## 1. 앙상블(Ensemble) 머신러닝 도입 (XGBoost / LightGBM)
주식 데이터는 전형적으로 노이즈가 많고 비선형적인 특징을 가집니다. 특정 지수(예: VIX 30 이상)일 때 타 지수와의 상관관계가 붕괴되는 등의 복합 조건 로직은 선형회귀 모델이 캡처할 수 없으나, 의사결정나무 기반의 앙상블 모델은 이를 효과적으로 잡아냅니다.

- **장점**: 결측치(NaN)나 이상치(Outlier)에 매우 강건하며, 선행 지표 간의 교차작용(Interaction)을 추론합니다.
- **적용 방안**: `scikit-learn` 기반 파이프라인을 유지하면서, 학습 시 `LightGBM` 모델의 `Feature Importance`를 바탕으로 주도적 지표를 매일 자동 스위칭(Daily Rotation)합니다. 예측 범위(오차 밴드)는 Quantile Regression(분위수 회귀)를 사용하여 `low(10%)`와 `high(90%)` 라인을 동적으로 뽑아냅니다.

## 2. 딥러닝 기반 시계열 분석 (LSTM)
수치 시계열(Time-series) 데이터의 맥락을 잡아내기 위해, 단순히 직전 1일의 종가가 아닌 최신 5~10일 윈도우(Window)의 추세(Momentum)를 통째로 모델에 입력합니다.

- **장점**: 며칠 연속으로 발생한 '추세적 하락'이나 '점진적 반등'의 맥락적 패턴(Sequence)을 인식하여, 방향성 맞춤률(Direction Hit Rate)을 극대화합니다.
- **적용 방안**: `TensorFlow`나 `PyTorch`를 이용해 시계열 텐서를 만들고, 야간선물의 변동성과 10일 치 이동평균 이격을 Input으로 활용합니다.

## 3. 확률론적 신뢰도 산출 (Probabilistic Confidence)
현재의 `신뢰도(Confidence)`는 VIX 지수와 상승/하락 일치 개수를 수기로 매핑하는 Rule-based 방식이므로 단조롭습니다.
- **가우시안 혼합 모델(GMM) / 칼만 필터(Kalman Filter) 추가**:
예측한 결과가 과거 데이터 안에서 '얼마나 자주 발생했던 평범한 패턴인지(In-distribution)' 아니면 '이례적인 급등락 패턴인지(Out-of-distribution)'를 수학적으로 계산해, 모델 스스로 **"오늘 예측은 85% 확률로 밴드 안에 들어온다"**는 통계적 Confidence Score를 계산하게 만듭니다. 

---

### 💡 다음 스텝 구현 추천 가이드
가장 즉각적으로 예측률을 5~10% 이상 높이면서 서버 인프라에 큰 격변을 주지 않는 베스트 옵션은 **[LightGBM 기반의 앙상블 모델 적용 + Quantile 회귀를 통한 밴드 동적 생성]**입니다.

사용자님께서 검토 후 OK하시면, 다음 작업에서 데이터 파이프라인(`backtest_and_generate.py`) 전체를 LightGBM 앙상블 구조로 개조하는 작업을 바로 진행할 준비가 되어있습니다.
# Archived Algorithm Proposal

> Archive note: this proposal predates the current production model. It is retained for historical context only. For the live operating spec, read `docs/ALGORITHM.md`, `docs/DATA_SOURCES.md`, and `docs/MODEL_EWY_SYNTHETIC_K200_2026-04-10.md`.
