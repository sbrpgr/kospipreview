const FALLBACK_SITE_URL = "https://kospipreview.com";

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

function extractHostname(value: string) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
export const SITE_HOSTNAME = extractHostname(SITE_URL);
export const SITE_NAME = "KOSPI Dawn";
export const SITE_TITLE = "KOSPI Dawn | 코스피 시초가 예측 대시보드";
export const SITE_DESCRIPTION =
  "EWY, 환율, 변동성, 야간선물 등 핵심 시장지표를 바탕으로 다음 거래일 코스피 시초가 범위를 추정하는 인공지능 예측 플랫폼입니다.";
export const CONTACT_EMAIL = "ytbtheguy@gmail.com";
export const ADSENSE_PUBLISHER_ID = "ca-pub-5869520985295558";
export const ADSENSE_DIRECT_SELLER_ID = "f08c47fec0942fa0";

export const SITE_KEYWORDS = [
  "코스피 시초가 예측",
  "KOSPI forecast",
  "코스피 전망",
  "한국 주식시장",
  "야간선물",
  "EWY",
  "USD/KRW",
  "시장 지표",
  "인공지능 예측",
  "KOSPI Dawn",
];

export function toAbsoluteUrl(pathname: string) {
  if (!pathname || pathname === "/") {
    return SITE_URL;
  }

  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

