import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { StockQuantCalculator } from "@/components/stock-quant-calculator";
import { getDataFreshness, getIndicatorData } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "주식용 계산기";
const PAGE_DESCRIPTION =
  "일반 계산기와 수익률, 기회비용, 본전 계산, 물타기 계산, 목표가, 배당 재투자를 원화 또는 달러 기준으로 계산하는 주식 계산기입니다.";

const FAQ_ITEMS = [
  {
    q: "주식용 계산기는 어떤 계산을 할 수 있나요?",
    a: "일반 사칙연산 계산기와 함께 주식 수익률, 기회비용, 본전 필요 상승률, 물타기 후 평단, 목표가, 배당 재투자 결과를 계산할 수 있습니다.",
  },
  {
    q: "기회비용 계산기는 무엇을 비교하나요?",
    a: "같은 예산을 주식 1과 주식 2에 각각 투자했다고 가정하고, 현재 자산가치와 수익금액, 수익률, 선택 간 자산 차이를 비교합니다.",
  },
  {
    q: "달러 주식도 계산할 수 있나요?",
    a: "달러 기준으로 입력한 뒤 당일 기준 환율 또는 직접 입력한 USD/KRW 환율을 적용해 원화 환산 금액을 함께 확인할 수 있습니다.",
  },
  {
    q: "본전 계산기와 물타기 계산기는 어떻게 다르나요?",
    a: "본전 계산기는 손실률 기준으로 원금 회복에 필요한 상승률을 계산하고, 물타기 계산기는 추가 매수 후 새 평단과 본전까지 필요한 상승률을 계산합니다.",
  },
  {
    q: "계산 결과는 투자 추천인가요?",
    a: "아닙니다. 계산 결과는 입력값을 바탕으로 한 단순 계산이며 특정 종목의 매수, 매도, 보유를 권유하지 않습니다.",
  },
] as const;

const USAGE_EXAMPLES = [
  "원래 가격 65,000원, 현재 가격 91,000원, 예산 100만 원을 입력해 현재 환산금액과 수익률을 확인합니다.",
  "같은 100만 원을 주식 1과 주식 2에 넣었다면 각각 얼마의 수익 또는 손실이 났는지 기회비용 계산기로 비교합니다.",
  "손실률 -30%인 종목이 본전까지 회복하려면 몇 퍼센트 상승이 필요한지 본전 계산기로 확인합니다.",
  "현재 평단, 보유 수량, 추가 매수가와 추가 수량을 입력해 물타기 후 새 평단과 본전 필요 상승률을 계산합니다.",
  "달러 주식은 계산 통화를 달러로 바꾼 뒤 환율 기준을 당일 기준가 또는 직접 입력으로 선택해 원화 환산 결과를 함께 봅니다.",
] as const;

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
  const jsonLd = JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: PAGE_TITLE,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      inLanguage: "ko-KR",
      description: PAGE_DESCRIPTION,
      url: toAbsoluteUrl("/quant-calculator"),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
  ]);

  return (
    <div className="pageContainer quantPageContainer">
      <SiteHeader lastUpdated={updatedAt} status={freshness.status} />
      <StockQuantCalculator
        latestUsdKrw={latestUsdKrw}
        latestUsdKrwUpdatedAt={latestUsdKrwUpdatedAt}
        latestUsdKrwChangePct={usdKrwIndicator?.changePct ?? null}
      />
      <section className="quantSeoAccordion" aria-label="주식용 계산기 FAQ 및 사용 예시">
        <details>
          <summary>주식용 계산기 FAQ와 사용 예시</summary>
          <div className="quantSeoAccordionBody">
            <div>
              <h2>주식용 계산기 사용 예시</h2>
              <p>
                이 페이지는 일반 계산기와 주식 전용 계산기를 함께 제공해 수익률, 기회비용, 본전,
                물타기, 목표가, 배당 재투자 계산을 한 화면에서 비교할 수 있도록 구성했습니다.
              </p>
              <ul>
                {USAGE_EXAMPLES.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2>자주 묻는 질문</h2>
              {FAQ_ITEMS.map((item) => (
                <article key={item.q}>
                  <h3>{item.q}</h3>
                  <p>{item.a}</p>
                </article>
              ))}
            </div>
          </div>
        </details>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    </div>
  );
}
