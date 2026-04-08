# Architecture

## 현재 운영 구조(2026-04-09 기준)

1. GitHub Actions(`retrain-model`)가 주기적으로 파이프라인을 실행한다.
2. Python 스크립트(`scripts/backtest_and_generate.py`)가 지표 수집 및 예측 계산을 수행한다.
3. 산출 JSON을 `frontend/public/data`와 `frontend/out/data`에 동시 기록한다.
4. Next.js 정적 빌드 산출물(`frontend/out`)을 Firebase Hosting에 배포한다.
5. 클라이언트 대시보드는 `/data/*.json`을 재조회하여 화면을 갱신한다.

## 기술 스택

- 프론트엔드: Next.js App Router (`output: "export"`)
- 모델/파이프라인: Python + LightGBM + yfinance
- 배포: Firebase Hosting
- 자동화: GitHub Actions + workflow dispatch 체인

## 운영 최적화

- `frontend/out` 캐시를 활용해 워크플로에서 불필요한 풀 빌드를 줄인다.
- 최신 데이터 JSON은 정적 산출물 경로에 직접 동기화하여 배포 반영 지연을 최소화한다.
- 정적 호스팅 특성상 지표 갱신 시점은 소스/워크플로 상태에 따라 가변적이다.
