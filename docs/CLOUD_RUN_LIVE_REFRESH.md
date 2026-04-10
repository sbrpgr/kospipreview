# Cloud Run Live Refresh

## 목적

- GitHub Actions schedule 기반의 느린/불안정한 야간 지표 갱신을 분리한다.
- Firebase Hosting 정적 배포는 유지하고, 빠른 갱신만 Cloud Run + Cloud Scheduler로 옮긴다.
- DB는 도입하지 않고 Cloud Storage의 JSON 객체를 최신 상태 저장소로 사용한다.

## 구성

1. Firebase Hosting
   - 정적 페이지와 기본 `public/data/*.json` 제공
   - `/api/live/**` 요청은 Cloud Run 서비스로 rewrite
2. Cloud Run service: `kospi-live-data`
   - `GET /api/live/prediction.json`
   - `GET /api/live/indicators.json`
   - `GET /api/live/history.json`
   - `POST /api/tasks/refresh`
3. Cloud Storage bucket
   - 최신 JSON 저장
   - DB 대신 파일 기반 최신 상태 저장소 역할
4. Cloud Scheduler
   - 평일 1분 단위로 Cloud Run `refresh` 호출

## 동작 방식

1. Cloud Scheduler가 Cloud Run `POST /api/tasks/refresh` 호출
2. Cloud Run이 현재 bucket JSON + 번들 기본 JSON을 로컬 임시 디렉터리로 seed
3. `scripts/refresh_night_futures.py` 실행
4. 결과 JSON을 Cloud Storage bucket에 업로드
5. 프론트엔드는 `/api/live/*.json`을 통해 최신 JSON 조회

## 현재 남겨둔 배치

- `retrain-model` GitHub Actions는 유지
- 역할:
  - 모델 재산출
  - 정적 페이지/기본 JSON 갱신
  - Firebase Hosting 배포
- Cloud Run live refresh는 빠른 지표/예측 갱신 담당

## 배포

- 배포 스크립트: `scripts/deploy_cloud_run_live_data.ps1`
- 기본값:
  - project: `kospipreview`
  - region: `asia-northeast3`
  - service: `kospi-live-data`
  - bucket: `kospipreview-live-data`
  - scheduler: `kospi-live-refresh`

## 보안

- Cloud Run 서비스는 `GET /api/live/*`는 공개 접근
- `POST /api/tasks/refresh`는 `Authorization: Bearer <token>` 요구
- refresh token은 Cloud Run env / Scheduler header에만 저장
- 저장 후 별도 런북 또는 Secret Manager 이전 고려

## 운영 메모

- GitHub Actions `refresh-night-futures`는 Cloud Run 전환 검증 후 비활성화 권장
- Cloud Scheduler 최소 단위는 1분
- 30초 체감 갱신은 브라우저 폴링으로 만들고, 서버측 원본 갱신은 1분 유지
