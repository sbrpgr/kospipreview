# Working Paper Index

Last updated: 2026-06-04

## 발행 현황

- 총 발행: 23편
- 최신 번호: No. 23
- 경로: `/papers/<slug>`
- 양식: KCI 표준 (요약·핵심어·Abstract·Keywords·Ⅰ~Ⅴ절·참고문헌)
- 분량: 5,000자 내외

## 전체 목록 (최신순)

| No. | slug | 제목 | 발행일 |
|-----|------|------|--------|
| 23 | ewy-signal-reversal-error-pattern | 예측 오차의 연속 방향 역전 패턴과 EWY 신호 진동 메커니즘 | 2026-06-04 |
| 22 | holiday-ewy-direct-prediction-model | 공휴일 시나리오 코스피 시초가 예측 모델의 설계 원리와 성능 경계 | 2026-06-04 |
| 18 | intraday-pattern-impact-on-next-opening | 코스피 당일 장중 패턴이 익일 시초가에 미치는 영향 | 2026-05-16 |
| 17 | additional-indices-for-kospi-prediction | 코스피 시초가 예측력 향상을 위한 추가 획득 가능 지수와 신호 체계 | 2026-05-16 |
| 16 | (별도 발행) | — | 2026-05-16 |
| 15 | dynamic-band-width-mae30d-adjustment | MAE30d 연동 동적 예측 밴드 너비 조정 체계 | 2026-05-16 |
| 14 | us10y-nonlinear-impact-on-kospi | 미국 10년물 금리가 코스피 시초가에 미치는 영향의 비선형성 | 2026-05-16 |
| 13 | simultaneous-quote-information-asymmetry | 동시호가 8분이 만드는 정보 비대칭 | 2026-05-16 |
| 12 | krw-regime-ewy-coefficient-shift | 달러-원 환율 1,400원대 진입 이후 EWY 전달 계수의 구조 변화 | 2026-05-16 |
| 11 | opening-gap-mean-reversion | 코스피 시초가 갭의 평균 회귀 경향 | 2026-05-16 |
| 10 | prediction-alert-score-design | 예측 신뢰도 붕괴 사전 감지와 동적 경보 점수 설계 | 2026-05-16 |
| 9  | kospi-24h-tracking-indicators | 코스피 24시간 추적을 위한 다중 실시간 프록시 지표 체계 | 2026-05-16 |
| 8  | night-futures-signal-limitations | 야간 K200 선물 신호의 구조적 공백과 EWY 대체 신호의 한계 | 2026-05-16 |
| 7  | multilayer-prediction-architecture | 코스피 시초가 예측 모델의 계층적 설계 체계 | 2026-05-16 |
| 6  | total-signal-failure-days | 전신호 동시 이탈日의 구조적 조건 | 2026-05-16 |
| 5  | ewy-time-varying-coefficient | EWY-코스피 가격 전달 계수의 시변성과 투자 의사결정 함의 | 2026-05-15 |
| 4  | opening-gap-asymmetry | 코스피 개장 갭 형성의 비대칭성과 통계 모델의 하방 리스크 과소추정 문제 | 2026-05-15 |
| 3  | signal-convergence-index | 다중 예측 신호 수렴도 지수(CSI)의 시초가 예측 불확실성 대용변수 활용 연구 | 2026-05-15 |
| 2  | regime-dependent-accuracy | 시장 레짐 전환이 코스피 시초가 예측 정확도에 미치는 구조적 영향 | 2026-05-15 |
| 1  | oil-fx-ewy-kospi-model | 유가·환율·EWY 복합 신호를 활용한 코스피 시초가 예측모델 개발 연구 | 2026-05-15 |

## 논문 페이지 관련 파일

- `frontend/src/app/papers/page.tsx` — 목록 페이지 (PAPERS 배열, 최신순)
- `frontend/src/components/live-dashboard.tsx` — 홈 노출 (PAPERS_HOME 배열, 최신 3편 slice)
- `frontend/src/app/sitemap.ts` — 검색엔진 등록 경로

## 신규 논문 추가 절차

1. `frontend/src/app/papers/<slug>/page.tsx` 작성 (기존 논문 구조 동일)
2. `frontend/src/app/papers/page.tsx`의 PAPERS 배열 맨 앞에 추가 (최신순 유지)
3. `frontend/src/components/live-dashboard.tsx`의 PAPERS_HOME 배열 맨 앞에 추가
4. `frontend/src/app/sitemap.ts`에 경로 추가
5. 이 파일(PAPERS_INDEX.md) 목록 업데이트
6. `git add` → `git commit` → `git push` → `deploy-hosting` 워크플로우 트리거
