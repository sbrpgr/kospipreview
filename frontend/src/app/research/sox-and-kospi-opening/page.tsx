import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "SOX와 코스피 시초가 — 반도체 지수가 핵심 보조신호인 이유";
const PAGE_DESCRIPTION =
  "필라델피아 반도체 지수(SOX)가 백테스트 feature importance 1위를 기록한 이유와 코스피에서 반도체 비중이 갖는 의미를 설명합니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/sox-and-kospi-opening" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/sox-and-kospi-opening"),
    type: "article",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
};

export default async function Page() {
  const freshness = await getDataFreshness();
  const updatedAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(freshness.newestModifiedAt));

  return (
    <div className="pageContainer">
      <SiteHeader lastUpdated={updatedAt} status={freshness.status} />
      <main className="prose">
        <div className="researchArticleHeader">
          <div className="researchArticleMeta">
            <span className="researchCardTag">지표 분석</span>
            <span className="researchCardDate">2026-05-15</span>
          </div>
          <h2 className="sectionTitle">{PAGE_TITLE}</h2>
          <p className="researchArticleLead">
            코스피프리뷰 백테스트에서 LightGBM feature importance 1위는 S&P 500이 아니라 SOX(필라델피아 반도체 지수)였다.
            importance 3,039로 S&P 500(2,961)을 앞섰다. 코스피와 반도체 지수의 연결고리를 데이터로 분석한다.
          </p>
        </div>

        <h3>1. SOX란 무엇인가</h3>
        <p>
          SOX(Philadelphia Semiconductor Index)는 미국 필라델피아 증권거래소가 산출하는
          반도체 섹터 지수다. 엔비디아, TSMC, ASML, 인텔, 퀄컴 등 반도체 설계·제조·장비
          기업들로 구성된다. S&P 500이 미국 전체 대형주 흐름을 나타낸다면,
          SOX는 반도체 섹터만의 방향성을 보여주는 지표다. 일반적으로 SOX는 S&P 500보다
          변동성이 크고, 반도체 업황 사이클에 더 민감하게 반응한다.
        </p>

        <h3>2. 삼성전자·SK하이닉스와 코스피 비중</h3>
        <p>
          코스피에서 반도체 관련 종목의 비중은 구조적으로 높다.
          삼성전자는 코스피 시가총액의 20% 전후를 차지하고,
          SK하이닉스까지 합산하면 반도체 주요 종목만으로 코스피의 25~30% 수준을 구성한다.
          이는 SOX의 방향이 코스피 전체 방향에 직접적인 영향을 줄 수밖에 없는 구조를 만든다.
          미국 시장에서 엔비디아와 반도체 ETF가 강세를 보이는 날,
          다음날 코스피 시초가에서 삼성전자·SK하이닉스 매수 압력이 커지는 것은 자연스러운 흐름이다.
        </p>
        <p>
          EWY 자체도 한국 주식 바스켓이므로 삼성전자 비중이 높다.
          그런데 SOX가 EWY에 추가로 독립적인 설명력을 가지는 이유는,
          EWY는 한국 전체 주식 바스켓이어서 반도체 외 섹터 노이즈도 포함하지만
          SOX는 반도체 섹터만의 순수한 방향성을 담기 때문이다.
        </p>

        <h3>3. 백테스트에서 SOX가 1위를 기록한 의미</h3>
        <div className="researchDataTable">
          <table>
            <thead>
              <tr><th>피처</th><th>LightGBM importance</th><th>OLS top pair</th></tr>
            </thead>
            <tbody>
              <tr><td>sox_return</td><td>3,039 (1위)</td><td>sp500 + sox → RMSE 21.82</td></tr>
              <tr><td>sp500_return</td><td>2,961 (2위)</td><td>band hit 75.26%, dir 76.53%</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          LightGBM feature importance는 의사결정 트리에서 해당 피처가 분기 기준으로
          사용된 횟수와 기여도를 나타낸다. SOX가 3,039로 S&P 500(2,961)보다 높다는 것은,
          코스피 시초가 예측에서 S&P 500보다 SOX가 더 유용한 분기 기준이 된다는 뜻이다.
          OLS 모델에서도 sp500_return과 sox_return의 조합이 RMSE 21.82, 방향 적중률 76.53%로
          가장 좋은 성능을 냈다. 이 두 피처만으로도 6년치 백테스트의 핵심 성능이 구현된다.
        </p>

        <h3>4. 잔차 모델에서 반도체 초과 강도(semi_factor)</h3>
        <p>
          잔차 보정 레이어에서 반도체 초과 강도(semi_factor)의 계수는 -0.197388로,
          보조 신호 중 절대값이 가장 크다. semi_factor는 SOX 수익률에서
          NASDAQ 100 기반의 기대 수익률을 차감해 순수한 반도체 초과 강도를 측정한다.
          soxNdxBeta 0.856506이 이 계산에 사용된다.
          반도체가 시장 대비 이례적으로 강하거나 약한 날, 이 팩터가 잔차를 추가로 설명한다.
        </p>

        <h3>5. SOX와 코스피가 크게 괴리하는 케이스</h3>
        <p>
          SOX가 강해도 코스피가 못 따라가는 날이 있다. 원화가 동시에 크게 약세여서
          달러 기준 반도체 강세가 원화로 희석되는 경우가 대표적이다.
          또한 미국 반도체 장비 기업이 강세여도 삼성전자·SK하이닉스와 직접 관련이 없는 날,
          SOX 신호가 코스피에 예상보다 약하게 전달될 수 있다.
          이런 사례들이 현재 잔차 모델 weight 0.0, 즉 보조 신호 비활성 상태와 연결된다.
          SOX 신호의 유효성이 레짐마다 다를 수 있다는 것이 모델이 자동 판단하는 이유다.
        </p>

        <div className="researchDisclaimer">
          본 분석은 연구 및 참고 목적이며 특정 종목이나 시장에 대한 투자를 권유하지 않습니다.
          모든 투자 판단과 그에 따른 책임은 투자자 본인에게 있습니다.
        </div>
        <div className="researchNav">
          <a href="/research" className="researchNavBack">← 리서치 목록으로</a>
        </div>
      </main>
    </div>
  );
}
