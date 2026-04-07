# Architecture

## 개요

초기 버전은 정적 JSON + SSR 프론트 구조로 시작한다.

1. 크론잡이 시장 데이터를 수집한다.
2. 예측 모델이 결과를 계산한다.
3. `data/*.json`을 갱신한다.
4. 프론트엔드는 API 라우트를 통해 JSON을 읽어 대시보드를 렌더링한다.

## 초기 결정

- 프론트엔드: Next.js App Router
- 데이터 저장: 레포 내 JSON 파일
- 모델 로직: TypeScript 유틸 + 향후 Python 백테스트 병행 가능 구조
- 배포 대상: Vercel 또는 Cloudflare Pages
