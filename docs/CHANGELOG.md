# Changelog

## 2026-04-09 (Security hardening)

- Frontend dependency security patch
  - `next` upgraded to `15.5.15` (from `15.3.0`)
- Firebase Hosting security headers 강화
  - `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`,
    `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `Strict-Transport-Security`
- 정기 취약점 점검 워크플로 추가
  - `.github/workflows/security-audit.yml`
- 운영 명세 문서 추가
  - `docs/SECURITY_OPERATIONS_RUNBOOK.md`
  - `docs/OPERATIONS_INDEX.md`

## 2026-04-09

- 예측 엔진을 `야간선물 중심 + 보조지표 제한 보정` 구조로 개편
  - 야간선물 변동률을 1차 앵커로 사용
  - ML/보조지표 잔차 보정에 상한(cap) 및 가드레일 추가
  - 과도한 상방/하방 예측 억제
- KOSPI200 야간선물 기준값을 주간선물 종가 기준으로 고정
  - 주간선물 종가 캐시(`day_futures_close_cache.json`) 도입
  - 세션 단위 1회 수집 후 재사용
- 갱신 문구 정책 변경
  - 화면에서 `1분 단위/자동 갱신` 고정 표현 제거
  - 지표별 갱신 주기 상이 및 원 출처 직접 확인 안내로 통일
- 파이프라인/배포 최적화
  - `frontend/out` 캐시 활용
  - 데이터 JSON을 정적 산출물 경로로 직접 동기화

## 2026-04-07

- 기획안 기반 초기 레포 구조 생성
- 프론트엔드 기본 대시보드 초안 구현
- 샘플 데이터 및 예측 계산 유틸 추가
