import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { StockQuantCalculator } from "@/components/stock-quant-calculator";
import { getDataFreshness, getIndicatorData } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "주식용 계산기";
const PAGE_DESCRIPTION =
  "본전 계산, 평단 시뮬레이션, 환율 분해, 배당 월급, PER 역산, DCF와 Reverse DCF를 한 번에 계산하는 주식 계산기입니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/quant-calculator",
  },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/quant-calculator"),
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
  },
};

function parseIndicatorNumber(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/,/g, "");
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export default async function QuantCalculatorPage() {
  const [freshness, indicators] = await Promise.all([getDataFreshness(), getIndicatorData()]);
  const updatedAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(freshness.newestModifiedAt));
  const usdKrwIndicator = [...indicators.primary, ...indicators.secondary].find(
    (item) => item.key === "krw" || item.label === "USD/KRW",
  );
  const latestUsdKrw = parseIndicatorNumber(usdKrwIndicator?.value);
  const latestUsdKrwUpdatedAt = usdKrwIndicator?.checkedAt || usdKrwIndicator?.updatedAt || null;

  return (
    <div className="pageContainer">
      <SiteHeader lastUpdated={updatedAt} status={freshness.status} />
      <StockQuantCalculator
        latestUsdKrw={latestUsdKrw}
        latestUsdKrwUpdatedAt={latestUsdKrwUpdatedAt}
        latestUsdKrwChangePct={usdKrwIndicator?.changePct ?? null}
      />
    </div>
  );
}
