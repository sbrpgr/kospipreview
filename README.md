# KOSPI Dawn

코스피 시초가 예측 대시보드 초기 구축 레포지토리입니다.

## 현재 범위

- 기획안 기반 폴더 구조 초기화
- Next.js 기반 SSR/SSG 프론트엔드 골격
- 샘플 `prediction.json`, `indicators.json`, `history.json`
- 메인 대시보드 초안
- 예측 계산 유틸 초안

## 구조

- `frontend/`: 웹 애플리케이션
- `data/`: 프론트가 읽는 정적 JSON
- `model/`: 예측 계산 로직 및 계수
- `docs/`: 아키텍처/알고리즘/데이터 소스 문서

## 실행

```bash
cd frontend
npm install
npm run dev
```

## 백테스트 / 데이터 재생성

```bash
python -m pip install -r requirements.txt
python scripts/backtest_and_generate.py
python -m unittest discover -s tests -v
```

## 다음 단계

1. 백테스트 스크립트와 실제 회귀계수 도출
2. 데이터 수집기 구축
3. GitHub Actions 크론 및 배포 자동화
