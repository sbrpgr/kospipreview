"""
Research content writing agent for KOSPI Dawn.

Usage:
    python scripts/write_research_content.py 4          # write article #4
    python scripts/write_research_content.py 4 5 6 7   # write articles 4-7
    python scripts/write_research_content.py all        # write all pending articles

Requires: pip install anthropic
ANTHROPIC_API_KEY must be set in environment.
"""

import json
import os
import sys
import textwrap
from pathlib import Path

import anthropic

ROOT = Path(__file__).parent.parent
FRONTEND_ROOT = ROOT / "frontend"
RESEARCH_DIR = FRONTEND_ROOT / "src" / "app" / "research"
DATA_DIR = FRONTEND_ROOT / "public" / "data"

ARTICLES = {
    4: {
        "slug": "direction-accuracy-vs-coin-flip",
        "title": "방향 적중률 76%의 의미 — 동전 던지기와 무엇이 다른가",
        "description": "무작위 50% 대비 76.53%가 통계적으로 유의미한 이유를 설명하고, 방향 적중이 실전에서 어떤 의미를 가지는지 분석합니다.",
        "category": "모델 분석",
        "data_context": """
백테스트 결과 (1,462거래일):
- 방향 적중률: 76.53%
- 밴드 적중률: 75.26%
- RMSE(OLS): 21.82
- MAE(OLS): 12.24
- 평가 피처 조합: 2~5개 변수

최근 실측 (17개):
- 밴드 적중: 4건 (23.5%) — 4월 충격 구간 포함
- 4/27~5/4 구간: 5거래일 중 4적중 (80%)
""",
        "outline": """
1. 동전 던지기와 예측 모델의 차이
   - 50% 기준선의 의미
   - 76.53%가 통계적으로 유의미한 이유 (1,462번의 시도)

2. 방향 적중이 만들어지는 구조
   - EWY+환율 코어가 방향성을 잡는 방법
   - 방향 적중률이 band 적중률과 비슷한 이유

3. 방향 정보만으로 할 수 있는 것과 없는 것
   - 방향을 알면 생기는 정보
   - 크기(포인트)를 모르면 생기는 한계

4. 충격 구간에서 방향 적중률도 떨어지는 이유
   - 4월 충격 기간 방향 오차 사례

5. 76%를 올바르게 해석하는 방법
""",
    },
    5: {
        "slug": "residual-model-auto-disable",
        "title": "잔차 모델이 자동으로 꺼지는 조건 — weight 0.0의 의미",
        "description": "SOX, S&P 등 보조 신호로 구성된 잔차 보정 레이어가 자동 비활성화되는 로직과, 현재 비활성 상태인 이유를 설명합니다.",
        "category": "모델 분석",
        "data_context": """
prediction.json 잔차 모델 상태 (2026-05-04 기준):
- residualModel.weight: 0.0 (비활성)
- residualModel.coreMae: 1.835876
- residualModel.fullMae: 1.578647
- residualModel.mae: 1.578647
- mlResidualAdjPct: 0.0
- auxResidualAdjPct: null

보조 계수:
- semi_factor: -0.197388 (반도체 초과 강도)
- broad_factor: -0.066748 (광의 미국지수)
- tech_factor: -0.088462 (기술주 초과 강도)
- wti_z: 0.459666
- gold_z: -0.233099
- us10y_z: 0.36152
""",
        "outline": """
1. 잔차 보정 레이어란 무엇인가
   - EWY+환율 코어가 설명하지 못하는 부분
   - SOX, 미국지수, VIX, 원자재로 구성된 보조 신호

2. 활성화 기준: coreMae vs fullMae 비교
   - fullMae < coreMae이면 보조 신호가 도움이 되는 것
   - 현재: coreMae 1.835 > fullMae 1.578 → 보조 신호가 오차를 줄임
   - 그런데 weight가 0.0인 이유 — 최근 검증에서 성능 기여 없음

3. 현재 비활성 상태의 의미
   - 보조 신호들이 현재 시장 레짐에서 잡음에 가까움
   - 자동 비활성화로 과적합 방지

4. 비활성이 예측에 미치는 실질적 영향
   - EWY+환율 코어만 작동하는 상태
   - 모델 단순화가 오히려 안정성을 줄 수 있는 이유

5. 언제 다시 켜질 수 있는가
""",
    },
    6: {
        "slug": "rolling-ridge-reestimation",
        "title": "롤링 180일 재추정 — 왜 어제의 계수와 오늘이 다른가",
        "description": "EWY 계수와 환율 계수를 매일 롤링 윈도우로 재추정하는 이유와 Ridge 정규화의 역할을 설명합니다.",
        "category": "모델 분석",
        "data_context": """
prediction.json 모델 파라미터 (2026-05-04 기준):
- ewyFxSampleSize: 180 (롤링 윈도우 크기)
- ewyFxFitR2: 0.2349
- ewyFxFitMae: 1.0802
- ewyFxEwyCoef: 0.3535
- ewyFxKrwCoef: 0.20
- ewyFxIntercept: 0.2628

k200Mapping:
- sampleSize: 240
- beta: 0.317698
- intercept: 0.255767
""",
        "outline": """
1. 고정 계수 모델의 한계
   - 한 번 학습하고 끝나는 모델의 문제
   - 시장 레짐 변화를 따라가지 못하는 이유

2. 롤링 윈도우 방식: 최근 180거래일의 의미
   - 약 9개월치 데이터
   - 오래된 데이터를 버리고 최근 데이터로 재추정

3. Ridge 정규화: 과적합 없이 재추정하는 방법
   - 단순 OLS와 Ridge의 차이
   - 계수 크기에 패널티를 주는 방식

4. K200 매핑 레이어의 별도 240일 윈도우
   - 코어 레이어와 매핑 레이어의 샘플 크기가 다른 이유

5. 실제로 계수가 얼마나 변하는가
   - 레짐 변화 사례: 관세 충격 전후 계수 변화 가능성
""",
    },
    7: {
        "slug": "trend-follow-floor-explained",
        "title": "트렌드팔로우 플로어가 작동할 때 — 모델이 신호를 강제 반영하는 조건",
        "description": "EWY+환율 신호가 크게 움직일 때 모델이 과소반응하지 않도록 강제하는 trendFollowFloor 로직을 실제 수치로 설명합니다.",
        "category": "모델 분석",
        "data_context": """
prediction.json 트렌드팔로우 상태 (2026-05-04 기준):
- trendFollowApplied: true
- trendFollowSignalPct: -0.69 (EWY+환율 신호)
- trendFollowMinPct: -0.48 (최소 반영 하한)
- trendFollowAdjustmentPct: -0.59 (실제 조정값)
- predictedChangePct: -0.48

트리거 기준 (알고리즘):
- medium 트리거: 절대값 0.45% 이상
- medium 플로어: 신호의 70% 이상
- high 트리거: 절대값 2.0% 이상
- high 플로어: 신호의 78% 이상
- 1회 조정 상한: 1.75% 로그수익률
""",
        "outline": """
1. K200 매핑이 과소반응하는 문제
   - K200 매핑 beta 0.317698의 의미
   - EWY가 크게 움직여도 모델이 덜 따라가는 이유

2. 트렌드팔로우 플로어의 작동 조건
   - medium 트리거(0.45%) vs high 트리거(2.0%)
   - 플로어란 무엇인가 — 최소 반영 하한

3. 현재 예측에 적용된 사례
   - EWY+환율 신호 -0.69% → 트리거 조건 충족
   - 70% 플로어 적용 → 최소 반영 -0.48%
   - 실제 조정 -0.59%

4. 왜 100% 반영이 아닌가
   - 노이즈 필터링의 필요성
   - 부분 추종의 안정성

5. high 트리거(2.0%)가 켜지면 무슨 일이 생기는가
   - 78% 플로어: 더 강한 반영
   - 4월 충격 구간 같은 대형 이벤트 시
""",
    },
    8: {
        "slug": "april-10-tariff-pause-case",
        "title": "4월 10일 케이스 — 관세 유예 발표에 모델이 188포인트 아래를 본 이유",
        "description": "트럼프 90일 관세 유예 발표 당일, 모델이 실제 시초가보다 188포인트 낮게 예측한 구조적 이유를 분석합니다.",
        "category": "사례 분석",
        "data_context": """
history.json 실측 데이터:
- 2026-04-09: modelPrediction 6090.26, actualOpen 5826.45, 오차 -263.81, hit false
  - ewyFxSimpleOpen: 6429.61
  - band: low 6053.79, high 6126.73
- 2026-04-10: modelPrediction 5688.35, actualOpen 5876.12, 오차 +187.77, hit false
  - ewyFxSimpleOpen: 5663.31
  - band: low 5660.30, high 5716.40
- 2026-04-13: modelPrediction 5830.41, actualOpen 5737.28, 오차 -93.13, hit false
  - band: low 5802.36, high 5858.46
""",
        "outline": """
1. 4월 9일 충격 이후 모델의 상태
   - 전날 코스피 급락을 반영한 낮은 기준선
   - 모델이 5,688로 예측한 이유

2. 관세 유예 발표의 정보 도달 경로
   - 미국 시간 새벽 발표 → EWY 급등 → 모델 입력값 변화
   - 그러나 모델의 반영 한계

3. EWY가 반영한 것과 모델이 못 잡은 것
   - ewyFxSimpleOpen 5663 vs actualOpen 5876
   - 단순환산도 실제보다 낮았던 이유

4. 이틀 연속 반대 방향으로 틀린 구조
   - 9일: 모델 과대(6090 vs 5826)
   - 10일: 모델 과소(5688 vs 5876)
   - 연속 정책 반전이 만든 이중 오차

5. 이런 이벤트 전후 예측을 대하는 방법
""",
    },
    9: {
        "slug": "april-recovery-underestimation",
        "title": "4월 21~24일: 회복 구간에서 모델이 과소추정을 반복한 이유",
        "description": "충격 이후 반등 구간에서 나흘 연속 실제 시초가가 예측 밴드 위에서 열린 패턴을 분석합니다.",
        "category": "사례 분석",
        "data_context": """
history.json 실측 데이터:
- 2026-04-21: model 6106.17, ewyFxSimple 6074.69, actual 6302.54, 오차 +196.37
  - band: low 6078.12, high 6134.22, hit false
- 2026-04-22: model 6302.16, ewyFxSimple 6265.53, actual 6387.57, 오차 +85.41
  - band: low 6274.11, high 6330.22, hit false
- 2026-04-23: model 6632.08, ewyFxSimple 6888.55, actual 6488.83, 오차 -143.25
  - band: low 6604.03, high 6660.13, hit false
- 2026-04-24: model 6315.70, ewyFxSimple 6226.23, actual 6496.10, 오차 +180.40
  - band: low 6287.65, high 6343.76, hit false
""",
        "outline": """
1. 충격 이후 회복 국면의 특성
   - 변동성이 여전히 높은 상태에서 시작되는 반등
   - 모델 계수가 아직 충격 이전 데이터 비중이 높은 시기

2. 3거래일 하방 오차 → 1일 상방 오차 → 다시 하방 오차
   - 21, 22, 24일: 모델 과소추정 (+196, +85, +180)
   - 23일: 모델 과대추정 (-143) — EWY 급등 대비 실제 하락

3. 4월 23일의 역전 현상
   - ewyFxSimpleOpen 6888.55 (큰 양수 신호) vs actualOpen 6488.83
   - EWY 신호와 실제 시장의 괴리가 최대치에 도달한 날

4. 국내 수급과 외국인 차익실현 영향
   - 회복 구간에서 차익실현 매물이 나오는 구조
   - 모델이 수급 정보를 반영하지 못하는 한계

5. 회복 구간에서 예측 밴드를 읽는 방법
""",
    },
    10: {
        "slug": "april-27-may-4-consecutive-hit",
        "title": "4월 27일~5월 4일: 연속 적중 구간은 무엇이 달랐나",
        "description": "13일 연속 이탈 이후 5거래일 중 4적중으로 성능이 회복된 구간의 시장 조건을 분석합니다.",
        "category": "사례 분석",
        "data_context": """
history.json 실측 데이터:
- 2026-04-27: model 6503.13, band 6472.38~6533.88, actual 6533.60, hit true
- 2026-04-28: model 6644.35, band 6613.61~6675.09, actual 6646.80, hit true
- 2026-04-29: model 6589.76, band 6558.94~6620.59, actual 6619.00, hit true
- 2026-04-30: model 6700.03, band 6669.23~6730.83, actual 6739.39, hit false
  - 밴드 상단 초과 +8.56포인트
- 2026-05-04: model 6770.60, band 6739.82~6801.39, actual 6782.93, hit true

summary.mae30d: 31.17
""",
        "outline": """
1. 충격 레짐 → 안정 레짐 전환의 신호
   - 4/27부터 새로운 안정 구간 진입 조건
   - 외부 정치 변수가 잠잠해진 구간

2. 5거래일 중 4적중 — 무엇이 바뀌었나
   - EWY와 환율이 다시 예측 가능한 범위에서 움직이기 시작
   - 모델 계수가 충격 이후 데이터를 충분히 흡수한 시점

3. 4/30 이탈: 밴드 상단 +8.56포인트 근접 미스
   - 밴드가 틀린 것이 아니라 실제값이 밴드 경계 바로 위
   - 이 정도의 미스는 통계적 정상 범위

4. 레짐 안정화가 신호 정확도에 미치는 영향
   - 정상 레짐에서 EWY 0.35 계수가 다시 작동하는 구조

5. 앞으로 비슷한 안정기에서 기대할 수 있는 것
   - 백테스트 75% 적중률이 의미하는 기대값
""",
    },
    11: {
        "slug": "ewy-up-kospi-down-divergence",
        "title": "EWY가 올랐는데 코스피가 내린 날 — 달러-원화 괴리의 조건",
        "description": "EWY 신호는 상승이었지만 코스피 시초가가 하락한 날의 구조를 환율 역전과 수급 관점에서 설명합니다.",
        "category": "사례 분석",
        "data_context": """
history.json 실측 데이터:
- 2026-04-23: model 6632.08, ewyFxSimpleOpen 6888.55 (큰 양수 신호), actualOpen 6488.83
  - EWY 신호 vs 실제: 괴리 약 400포인트
  - band: 6604.03~6660.13, hit false
- 2026-04-20: model 6342.62, ewyFxSimpleOpen 6412.73, actualOpen 6213.92
  - 모델 과대추정 -128.70, EWY+환율도 과대
  - band: 6314.57~6370.67, hit false

EWY 계수: 0.3535
KRW 계수: 0.20
""",
        "outline": """
1. EWY 상승이 코스피 상승을 보장하지 않는 이유
   - EWY는 달러 기준, 코스피는 원화 기준
   - 환율이 동시에 약세면 달러 상승분이 원화로 상쇄됨

2. 환율 역전이 신호를 상쇄하는 메커니즘
   - EWY+KRW 복합 신호에서 두 변수가 서로 다른 방향일 때
   - 계수 0.3535(EWY) vs 0.20(KRW)의 상대적 크기

3. 4/23 케이스 분석
   - ewyFxSimpleOpen 6888 (큰 양의 신호)이었는데 실제 6489
   - EWY 자체가 아니라 동시호가 수급이 결정한 시초가

4. 외국인 선물 포지션 청산이 동시호가에 미치는 영향
   - EWY 매수와 KOSPI 현물 매도를 동시에 하는 헤지 구조

5. 두 신호가 크게 엇갈릴 때 예측을 해석하는 법
   - EWY+환율 신호와 모델 예측이 크게 다를 때 주의 포인트
""",
    },
    12: {
        "slug": "sox-and-kospi-opening",
        "title": "SOX와 코스피 시초가 — 반도체 지수가 핵심 보조신호인 이유",
        "description": "필라델피아 반도체 지수(SOX)가 백테스트 feature importance 1위를 기록한 이유와 코스피에서 반도체 비중이 갖는 의미를 설명합니다.",
        "category": "지표 분석",
        "data_context": """
BACKTEST_RESULTS.md:
- LightGBM feature importance: sox_return 3039 (1위), sp500_return 2961 (2위)
- OLS top feature pair: sp500_return + sox_return → RMSE 21.82, band hit 75.26%, direction 76.53%

prediction.json 잔차 모델:
- semi_factor 계수: -0.197388 (잔차 레이어 최대 절대값)
- soxNdxBeta: 0.856506
- tech_factor: -0.088462
- broad_factor: -0.066748
""",
        "outline": """
1. SOX란 무엇인가
   - 필라델피아 반도체 지수 구성
   - 엔비디아, TSMC, 인텔 등 주요 구성 종목

2. 삼성전자·SK하이닉스가 코스피에서 차지하는 비중
   - KOSPI 시가총액 상위 반도체 비중 약 25~30%
   - SOX 방향이 코스피에 직접 영향을 주는 구조

3. SOX가 백테스트 feature importance 1위를 기록한 이유
   - LightGBM 3039 (sp500 2961보다 높음)
   - EWY가 이미 한국 주식 바스켓을 반영하지만 SOX는 추가 신호를 제공

4. 반도체 초과 강도(semi_factor)의 계산 방식
   - SOX - (sp500 * soxNdxBeta)로 계산하는 초과 강도
   - 잔차 모델에서 가장 큰 계수(-0.197388)

5. SOX와 코스피가 크게 괴리하는 케이스
   - 반도체 실적 발표일, 반도체 수출 규제 이슈
""",
    },
    13: {
        "slug": "vix-thresholds-and-volatility",
        "title": "VIX 임계값과 시초가 변동성 — 18, 25, 30 구간별 패턴",
        "description": "공포지수 VIX 수준에 따라 코스피 시초가 예측의 불확실성이 어떻게 달라지는지 구간별로 분석합니다.",
        "category": "지표 분석",
        "data_context": """
prediction.json:
- 현재 VIX: 18.39
- signalSummary: "EWY 하락 · S&P 500 보합 · VIX 상승(불안) · NASDAQ 100 상승 · USD/KRW 원화 약세"

역사적 맥락:
- VIX 20 이하: 정상 시장
- VIX 25 이상: 경계 구간
- VIX 30 이상: 극단 공포 구간 (4월 충격기 도달)

backtest 맥락:
- 정상 레짐(VIX 20 이하) 구간 band hit 75.26%
- 극단 구간에서 적중률 급락 (4월 사례)
""",
        "outline": """
1. VIX란 무엇이며 왜 시초가 예측에 영향을 주는가
   - S&P 500 옵션 내재 변동성 지수
   - 공포지수라고 불리는 이유

2. VIX 18 이하: 낮은 불확실성 구간
   - 정상 레짐에서 EWY·환율 신호의 설명력이 높아지는 이유
   - 현재 18.39의 위치 — 상대적으로 안정적

3. VIX 25~30: 경계 구간
   - 밴드가 넓어지는 이유
   - 신호 설명력이 떨어지기 시작하는 구간

4. VIX 30 이상: 극단 구간
   - 4월 충격기 VIX 급등과 모델 성능 급락의 연관성
   - 이 구간에서 밴드 적중률이 75%에서 20%대로 떨어진 이유

5. VIX를 예측 해석의 컨텍스트로 사용하는 방법
   - VIX가 높을수록 밴드 외부 시나리오 비중을 높여야 하는 이유
""",
    },
    14: {
        "slug": "night-futures-vs-model-comparison",
        "title": "야간선물 단순환산 vs 모델 예측 — 두 숫자가 다를 때 무엇을 보는가",
        "description": "대시보드에 나란히 표시되는 야간선물 단순환산과 모델 예측이 각각 무엇을 측정하고, 두 값이 크게 다를 때 어떻게 해석해야 하는지 설명합니다.",
        "category": "지표 분석",
        "data_context": """
prediction.json (2026-05-04 기준):
- nightFuturesSimplePoint: 6862.04 (야간선물 단순환산)
- ewyFxSimplePoint: 6889.10 (EWY+환율 단순환산)
- pointPrediction: 6903.43 (모델 예측)
- 세 값의 범위: 41.39포인트 (수렴 상태)

야간선물 단순환산 공식:
- nightFuturesSimplePoint = KOSPI_close × (K200_night / K200_day_close)

history.json:
- nightFuturesSimpleOpen: null인 레코드 다수 (야간선물 데이터 공백)
""",
        "outline": """
1. 야간선물 단순환산의 계산 구조
   - 공식: KOSPI 종가 × (야간선물 / 주간선물 종가)
   - 야간선물이 반영하는 정보의 범위와 한계

2. EWY+환율 단순환산과의 차이
   - 야간선물: 국내 선물 시장 기반
   - EWY+환율: 미국 시장 거래 기반
   - 두 신호가 다른 이유

3. 모델 예측이 두 단순환산과 다른 이유
   - Ridge 매핑, 잔차 보정, 트렌드팔로우 플로어 적용
   - 단순환산보다 복잡하지만 항상 더 맞는 것은 아님

4. 세 값이 수렴할 때와 발산할 때
   - 현재: 41포인트 범위 (수렴 — 비교적 안정 신호)
   - 발산 케이스: 4/23 ewyFxSimple 6888 vs 실제 6489

5. 야간선물 데이터가 없는 날(null)의 해석
""",
    },
    15: {
        "slug": "usdkrw-regime-and-model",
        "title": "달러-원 환율 1,400원대의 의미 — 레짐 변화가 모델 계수에 미치는 영향",
        "description": "환율이 특정 레짐에 있을 때 EWY-코스피 관계가 어떻게 달라지고, 롤링 재추정이 이를 어떻게 포착하는지 설명합니다.",
        "category": "지표 분석",
        "data_context": """
prediction.json:
- ewyFxKrwCoef: 0.20 (현재 환율 계수)
- ewyFxEwyCoef: 0.3535 (현재 EWY 계수)
- ewyFxSampleSize: 180

환율 맥락:
- 2024~2026년 원화 약세 추세 (1,300원대 → 1,400원대)
- 1,400원 이상 = 역사적 고환율 구간
- 환율 레짐이 계수에 미치는 영향
""",
        "outline": """
1. 환율 레짐이란 무엇인가
   - 1,200원대, 1,300원대, 1,400원대의 구조적 차이
   - 레짐 경계에서 시장 참여자 행동이 달라지는 이유

2. 1,400원대에서 외국인 행동이 달라지는 이유
   - 환헤지 비용 급증
   - 원화 자산 매력도 하락
   - 외국인 순매도 압력 증가

3. 환율 계수 0.20이 최근 레짐을 반영한 결과
   - 롤링 180일 재추정이 고환율 구간 데이터를 흡수하는 과정
   - 레짐 초입과 안착 시의 계수 차이

4. 극단적 원화 약세 구간에서의 주의점
   - 환율 계수 과대 반응 가능성
   - 관세 충격기 환율 급변과 모델 오차의 연관성

5. 레짐 전환 구간에서 모델을 읽는 방법
""",
    },
    16: {
        "slug": "kospi-simultaneous-quote-mechanism",
        "title": "코스피 동시호가 8분 — 시초가가 결정되는 구조",
        "description": "KRX 동시호가 제도에서 09:00 시초가가 형성되는 과정을 설명하고, 이 구조가 왜 통계적 예측을 어렵게 만드는지 분석합니다.",
        "category": "메커니즘",
        "data_context": """
KRX 제도:
- 동시호가 주문 접수: 08:30~09:00 (30분)
- 09:00 체결: 가격 우선, 수량 우선 원칙
- 시초가 = 동시호가 체결 가격

KOSPI Dawn 예측 타깃:
- 예측 대상: 09:00 KST 시초가
- 예측 계산: 전날 밤 ~ 당일 09:00 이전
- ALGORITHM.md: 09:00 이후 prediction target rolls
""",
        "outline": """
1. 동시호가란 무엇인가
   - 연속거래(장중)와의 차이
   - 가격 발견 메커니즘으로서의 동시호가

2. 08:30~09:00 주문 접수 구간
   - 전날 밤 쌓인 해외 정보를 반영한 주문이 몰리는 시간
   - 외국인, 기관, 개인 각각의 주문 패턴

3. 09:00 체결 가격이 당일 심리를 반영하는 방식
   - 매수/매도 주문 불균형이 시초가를 결정
   - 갭 형성의 근본 원인

4. 동시호가 구조가 통계 예측을 어렵게 만드는 이유
   - EWY, 환율 신호 → 주문 → 체결 사이의 복잡성
   - 인간의 행동(주문 취소, 조정)이 개입하는 구간

5. 이 구조를 알고 예측 밴드를 해석하는 방법
""",
    },
    17: {
        "slug": "information-timeline-1530-to-0900",
        "title": "한국장 마감 이후 정보 타임라인 — 15:30 KST에서 익일 09:00까지",
        "description": "코스피 마감 이후 다음날 시초가까지 정보가 순서대로 쌓이는 타임라인과, 각 시점에서 KOSPI Dawn이 무엇을 처리하는지 설명합니다.",
        "category": "메커니즘",
        "data_context": """
ALGORITHM.md 타임게이트:
- 15:30 KST: KOSPI close 확정, prevClose 설정, 야간 운영 시작
- 15:45 KST: KOSPI200 day futures close 최종 확정 (eSignal socket)
- 17:00 KST (서머타임): 미국 프리마켓 오픈, EWY 거래 시작, 브릿지 샘플링
- 18:00 KST (겨울시간): 미국 프리마켓 오픈
- 18:00~18:08 KST: 야간선물 오픈 구간 (서머타임 시 보조 브릿지)
- 브릿지 샘플링: 2분 간격 5슬롯
- ~09:00 KST: 분당 1회 갱신, 최대 1,080개 기록
- 09:00: prediction target 다음 거래일로 롤
""",
        "outline": """
1. 왜 시초가 예측은 전날 밤에 만들어지는가
   - 한국장 마감 이후 정보가 계속 쌓이는 구조
   - 09:00 이전 마지막 예측이 '확정 예측'이 되는 이유

2. 15:30~17:00: 한국 시간대 정보 공백 구간
   - KOSPI는 닫혔지만 EWY는 아직 거래 안 됨
   - 야간선물만 거래되는 약 1.5시간

3. 17:00 브릿지: EWY 기준점을 설정하는 한 번의 스냅샷
   - 2분 간격 5슬롯으로 브릿지 기준점 샘플링
   - 이 기준점이 이후 모든 EWY 수익률 계산의 앵커

4. 17:00~09:00: 분당 갱신이 추적하는 것
   - EWY, 환율의 실시간 변화가 예측을 어떻게 움직이는가
   - 분당 1회 기록, 최대 1,080개 데이터포인트

5. 정보 타임라인을 알면 예측값 해석이 달라지는 이유
   - 새벽 2시 예측과 아침 8시 예측이 다른 이유
   - 미국 야간 이벤트가 예측을 바꾸는 시점
""",
    },
    18: {
        "slug": "opening-gap-conditions",
        "title": "개장 갭이 큰 날의 조건 — 전일 종가와 크게 다르게 열리는 패턴",
        "description": "코스피가 전일 종가 대비 큰 갭으로 열리는 날의 공통 조건을 실측 데이터에서 추출합니다.",
        "category": "메커니즘",
        "data_context": """
history.json 대형 갭 사례:
- 2026-04-09: actualOpen 5826.45 (전날 대비 급락 갭)
  - model 6090.26, band 6053~6127
- 2026-04-10: actualOpen 5876.12 (전날 대비 급등 갭)
  - model 5688.35, band 5660~5716
- 2026-04-21: actualOpen 6302.54 (밴드 위 196포인트)
  - model 6106.17, ewyFxSimple 6074.69
- 2026-04-24: actualOpen 6496.10 (밴드 위 180포인트)
  - model 6315.70, ewyFxSimple 6226.23
""",
        "outline": """
1. 개장 갭이란 무엇이며 얼마나 자주 발생하는가
   - 갭의 정의: 전일 종가 대비 시초가의 이격
   - 코스피에서 ±1% 이상 갭의 빈도

2. 갭이 큰 날의 공통 조건
   - EWY 전일 대비 변동폭이 큰 날
   - VIX가 급등한 날
   - 미국 시간 정치·정책 이벤트가 있는 날

3. 상방 갭과 하방 갭의 발생 조건 차이
   - 4/9 하방 갭: 관세 충격 (EWY 급락)
   - 4/10 상방 갭: 관세 유예 (EWY 급등)
   - 비대칭성: 하방 갭이 더 급격한 이유

4. 대형 갭 이후 다음날 예측의 난이도가 높아지는 이유
   - 갭 당일 EWY 변동이 과도하게 반영된 상태에서 재계산
   - 새 레짐 기준선을 모델이 빠르게 흡수해야 하는 문제

5. 갭 리스크를 예측 밴드에 반영하는 방법
""",
    },
    19: {
        "slug": "three-numbers-together",
        "title": "세 가지 예측값을 함께 읽는 방법 — 수렴할 때와 발산할 때",
        "description": "대시보드의 야간선물 단순환산, EWY+환율 환산, 모델 예측 세 값이 수렴·발산하는 경우 각각 어떻게 해석해야 하는지 안내합니다.",
        "category": "사용 가이드",
        "data_context": """
prediction.json (2026-05-04 기준):
- nightFuturesSimplePoint: 6862.04
- nightFuturesSimpleChangePct: -1.08%
- ewyFxSimplePoint: 6889.10
- ewyFxSimpleChangePct: -0.69%
- pointPrediction: 6903.43
- predictedChangePct: -0.48%
- prevClose: 6936.99
- 세 값의 범위: 41.39포인트 (수렴)

발산 사례 (4/23):
- ewyFxSimpleOpen: 6888.55 vs actualOpen: 6488.83 (400포인트 괴리)
""",
        "outline": """
1. 세 숫자가 각각 측정하는 것
   - 야간선물 단순환산: 국내 선물 시장 기반 기계적 환산
   - EWY+환율 단순환산: 미국 시장 기반 기계적 환산
   - 모델 예측: Ridge 통계 모델 + 보정 레이어

2. 세 값이 40~50포인트 이내로 수렴할 때
   - 현재(2026-05-04): 6862~6903, 범위 41포인트
   - 수렴 상태 = 여러 정보 소스가 같은 방향을 가리키는 상황

3. 세 값이 100포인트 이상 벌어질 때
   - 신호 해석 주의 구간
   - 어떤 신호를 더 신뢰해야 하는가

4. 야간선물 단순환산이 없을 때(null)
   - 야간선물 데이터가 없는 상태
   - EWY+환율과 모델 두 값만으로 판단하는 방법

5. 세 숫자를 한 줄로 요약하는 실전 방법
""",
    },
    20: {
        "slug": "five-principles-for-using-forecast",
        "title": "예측 모델을 참고할 때 반드시 알아야 할 다섯 가지",
        "description": "KOSPI Dawn 예측값을 올바르게 활용하고 잘못 사용하지 않기 위한 다섯 가지 원칙을 정리합니다.",
        "category": "사용 가이드",
        "data_context": """
핵심 수치:
- MAE30d: 31.17포인트 (최근 30일 평균 오차)
- backtest band hit: 75.26% (1,462행, 정상 레짐)
- 최근 17개 band hit: 23.5% (충격 구간 포함)
- 방향 적중률: 76.53% (backtest)

세 예측값:
- nightFuturesSimplePoint: 6862.04
- ewyFxSimplePoint: 6889.10
- pointPrediction: 6903.43
""",
        "outline": """
1. 밴드는 보장 구간이 아니다
   - 75%는 "4번 중 1번은 밴드를 벗어난다"는 뜻
   - 충격 구간에서 23%로 떨어진 실측 기록

2. MAE30d를 먼저 확인하라
   - 현재 31.17포인트 = 예측과 실제의 평균 거리
   - MAE30d가 높을수록 현재 예측 불확실성이 크다

3. 정치·정책 이벤트 예정일에는 밴드 외부 시나리오를 준비하라
   - 연준 회의, 무역 협상, 지정학 이벤트
   - 통계 모델이 포착할 수 없는 변수

4. 세 숫자 중 하나만 보지 마라
   - 세 값이 같은 방향을 가리킬 때와 다른 방향일 때의 차이

5. 예측값은 진입 타이밍이 아니라 방향과 범위 참고용이다
   - 투자 결정의 보조 도구로서의 올바른 위치
   - 이 플랫폼이 연구 도구인 이유
""",
    },
}

STYLE_REFERENCE = """
다음은 기존에 작성된 리서치 아티클의 스타일 예시다.
이 스타일을 정확히 따라야 한다.

---
스타일 규칙:
- 한국어 전용. 영어 단어(EWY, VIX, SOX 등)는 그대로 사용.
- 문체: 격식체(~이다, ~한다, ~이다). 구어체 금지.
- 섹션은 h3으로 구분 (1. 제목 형식).
- 각 섹션은 완전한 문단 2~3개 (단순 나열 금지).
- 실제 수치를 반드시 본문에 인용 (소수점 형식 그대로).
- 문단 길이: 3~5문장.
- 전체 분량: 약 1,200~1,800자 (한국어 기준).
- 마지막에 면책 문구와 리서치 목록 링크 포함.
---
"""

PAGE_TEMPLATE = """\
import type {{ Metadata }} from "next";
import {{ SiteHeader }} from "@/components/site-header";
import {{ getDataFreshness }} from "@/lib/data";
import {{ SITE_NAME, toAbsoluteUrl }} from "@/lib/seo";

const PAGE_TITLE = "{title}";
const PAGE_DESCRIPTION =
  "{description}";

export const metadata: Metadata = {{
  title: `${{PAGE_TITLE}} | ${{SITE_NAME}}`,
  description: PAGE_DESCRIPTION,
  alternates: {{ canonical: "/research/{slug}" }},
  openGraph: {{
    title: `${{PAGE_TITLE}} | ${{SITE_NAME}}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/{slug}"),
    type: "article",
    locale: "ko_KR",
    siteName: SITE_NAME,
  }},
}};

export default async function Page() {{
  const freshness = await getDataFreshness();
  const updatedAt = new Intl.DateTimeFormat("ko-KR", {{
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }}).format(new Date(freshness.newestModifiedAt));

  return (
    <div className="pageContainer">
      <SiteHeader lastUpdated={{updatedAt}} status={{freshness.status}} />
      <main className="prose">
        <div className="researchArticleHeader">
          <div className="researchArticleMeta">
            <span className="researchCardTag">{category}</span>
            <span className="researchCardDate">2026-05-15</span>
          </div>
          <h2 className="sectionTitle">{{PAGE_TITLE}}</h2>
          <p className="researchArticleLead">
            {lead}
          </p>
        </div>

{body}

        <div className="researchDisclaimer">
          본 분석은 연구 및 참고 목적이며 특정 종목이나 시장에 대한 투자를 권유하지 않습니다.
          모든 투자 판단과 그에 따른 책임은 투자자 본인에게 있습니다.
        </div>

        <div className="researchNav">
          <a href="/research" className="researchNavBack">← 리서치 목록으로</a>
        </div>
      </main>
    </div>
  );
}}
"""


def load_platform_data() -> dict:
    data = {}
    for name in ("history.json", "prediction.json"):
        path = DATA_DIR / name
        if path.exists():
            with open(path, encoding="utf-8") as f:
                data[name] = json.load(f)
    return data


def build_prompt(article: dict, platform_data: dict) -> str:
    history_summary = ""
    if "history.json" in platform_data:
        records = platform_data["history.json"].get("records", [])[:5]
        history_summary = json.dumps(records, ensure_ascii=False, indent=2)

    return f"""
당신은 KOSPI Dawn 퀀트 리서치 플랫폼의 콘텐츠 작성 에이전트다.
아래 지시에 따라 리서치 아티클을 작성하라.

{STYLE_REFERENCE}

## 작성할 아티클 정보

제목: {article["title"]}
분류: {article["category"]}
설명: {article["description"]}

## 반드시 활용해야 할 데이터

{article["data_context"]}

## 최근 실측 데이터 참고 (history.json 일부)

{history_summary}

## 섹션 구성 지침

{article["outline"]}

## 출력 형식

다음 형식으로 출력하라.

LEAD:
(첫 단락 — 아티클의 핵심을 2~3문장으로 요약. JSX의 <p className="researchArticleLead"> 안에 들어갈 텍스트만. HTML 태그 없이 순수 텍스트.)

BODY:
(섹션별 본문 — 아래 JSX 형식으로 작성. 각 섹션은 <h3>으로 시작하고 <p> 태그로 문단을 구성.
researchDataTable이 필요한 경우 포함. 면책 문구와 리서치 링크는 제외.)

섹션 형식 예시:
        <h3>1. 섹션 제목</h3>
        <p>
          본문 내용...
        </p>
        <p>
          본문 내용...
        </p>

중요:
- LEAD와 BODY 구분자를 정확히 사용하라.
- JSX 형식을 정확히 지켜라 (닫는 태그, 들여쓰기 8칸).
- 실제 수치를 반드시 인용하라.
- 투자 권유나 단정적 예측 표현 사용 금지.
"""


def parse_response(response_text: str) -> tuple[str, str]:
    lead = ""
    body = ""

    if "LEAD:" in response_text and "BODY:" in response_text:
        parts = response_text.split("BODY:", 1)
        lead_part = parts[0].split("LEAD:", 1)[1].strip()
        body_part = parts[1].strip()
        lead = lead_part
        body = body_part
    else:
        body = response_text

    return lead, body


def write_article(article_num: int, client: anthropic.Anthropic, platform_data: dict) -> None:
    if article_num not in ARTICLES:
        print(f"[ERROR] Article #{article_num} not found in plan.")
        return

    article = ARTICLES[article_num]
    slug = article["slug"]
    output_dir = RESEARCH_DIR / slug
    output_path = output_dir / "page.tsx"

    if output_path.exists():
        print(f"[SKIP] #{article_num} {slug} — already exists.")
        return

    print(f"[WRITE] #{article_num} {article['title']} ...")

    prompt = build_prompt(article, platform_data)

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )

    response_text = message.content[0].text
    lead, body = parse_response(response_text)

    # Indent body consistently
    indented_body = "\n".join(
        "        " + line if line.strip() else line
        for line in body.splitlines()
    )

    page_content = PAGE_TEMPLATE.format(
        title=article["title"],
        description=article["description"],
        slug=slug,
        category=article["category"],
        lead=lead.strip(),
        body=indented_body,
    )

    output_dir.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(page_content)

    print(f"[DONE]  #{article_num} → {output_path.relative_to(ROOT)}")


def main() -> None:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("[ERROR] ANTHROPIC_API_KEY not set.")
        sys.exit(1)

    args = sys.argv[1:]
    if not args:
        print("Usage: python scripts/write_research_content.py <number|all> [number ...]")
        print("Example: python scripts/write_research_content.py 4 5 6")
        print("         python scripts/write_research_content.py all")
        sys.exit(1)

    if args == ["all"]:
        targets = sorted(ARTICLES.keys())
    else:
        try:
            targets = [int(a) for a in args]
        except ValueError:
            print("[ERROR] Arguments must be article numbers or 'all'.")
            sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)
    platform_data = load_platform_data()

    print(f"Writing {len(targets)} article(s): {targets}")
    print()

    for num in targets:
        write_article(num, client, platform_data)

    print()
    print("Done. Next steps:")
    print("  1. Update ARTICLES in frontend/src/app/research/page.tsx")
    print("  2. Update sitemap in frontend/src/app/sitemap.ts")
    print("  3. npm run build (from frontend/)")
    print("  4. gh workflow run deploy-hosting.yml --ref main")


if __name__ == "__main__":
    main()
