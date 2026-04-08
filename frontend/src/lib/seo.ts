const FALLBACK_SITE_URL = "https://kospipreview.web.app";

function normalizeSiteUrl(value: string | undefined) {
  if (!value) {
    return FALLBACK_SITE_URL;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return FALLBACK_SITE_URL;
  }

  return trimmed.replace(/\/+$/, "");
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const SITE_NAME = "KOSPI Dawn";
export const SITE_TITLE = "KOSPI Dawn | 코스피 시초가 예측 대시보드";
export const SITE_DESCRIPTION =
  "EWY, 환율, VIX 등 해외 선행 지표를 기반으로 다음 거래일 코스피 시초가 밴드를 예측하는 대시보드입니다.";
export const SITE_KEYWORDS = [
  "코스피 시초가 예측",
  "코스피 전망",
  "KOSPI forecast",
  "EWY",
  "USD/KRW",
  "야간선물",
  "시장 지표",
  "한국 주식시장",
  "KOSPI Dawn",
];

export function toAbsoluteUrl(pathname: string) {
  if (!pathname || pathname === "/") {
    return SITE_URL;
  }

  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
