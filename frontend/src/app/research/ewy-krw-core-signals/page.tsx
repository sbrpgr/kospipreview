import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "EWY와 달러-원 환율이 코어 신호인 이유";
const PAGE_DESCRIPTION =
  "현재 모델에서 EWY 계수 0.3535, 환율 계수 0.2가 어떻게 도출되었고 왜 이 두 신호가 코스피 시초가 예측의 핵심인지 실제 수치로 설명합니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/ewy-krw-core-signals" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/ewy-krw-core-signals"),
    type: "article",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
};

export default async function EwyKrwCoreSignalsPage() {
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
            <span className="researchCardTag">알고리즘</span>
            <span className="researchCardDate">2026-05-15</span>
          </div>
          <h2 className="sectionTitle">{PAGE_TITLE}</h2>
          <p className="researchArticleLead">
            코스피프리뷰의 핵심 모델은 EWY(iShares MSCI South Korea ETF)와 달러-원 환율 두 가지를
            코어 신호로 사용한다. 이 선택이 자의적이지 않다는 것을, 현재 모델에서 실제로
            추정된 계수값과 함께 설명한다.
          </p>
        </div>

        <h3>1. EWY란 무엇인가</h3>
        <p>
          EWY는 미국 뉴욕증권거래소(NYSE)에 상장된 한국 주식 ETF다.
          iShares MSCI South Korea ETF가 정식 명칭이며, 삼성전자, SK하이닉스, 현대차 등
          한국 대형주 바스켓을 달러 단위로 거래한다. 미국 시장이 열리는 시간(한국 기준 야간)에
          실시간으로 거래되기 때문에, 한국 시장이 닫혀 있는 동안 해외 투자자들이
          한국 주식에 대한 포지션을 조정하는 창구 역할을 한다.
        </p>
        <p>
          코스피 시초가 예측에 EWY가 유용한 이유는 여기에 있다.
          한국장 마감(오후 3시 30분) 이후, 코스피 자체는 거래되지 않지만 EWY는 계속 움직인다.
          EWY의 가격 변화는 해외 투자자들이 한국 주식 전반에 대해 어떤 방향 베팅을 하고 있는지를
          실시간으로 반영하며, 이 정보가 다음날 코스피 개장 방향에 녹아드는 것이다.
        </p>

        <h3>2. 달러-원 환율이 함께 필요한 이유</h3>
        <p>
          EWY는 달러로 거래된다. 그런데 코스피는 원화로 표시된다.
          달러 기준으로 한국 주식이 올랐더라도, 그 사이에 원화가 크게 약세가 되었다면
          원화 기준 코스피는 예상보다 덜 오를 수 있다. 반대로 원화가 강세라면
          달러 기준 상승분이 원화 기준으로 증폭되어 나타날 수 있다.
        </p>
        <p>
          이것이 EWY와 환율을 함께 사용하는 이유다.
          달러 기준 한국 주식의 움직임(EWY)을 원화 기준 코스피로 번역하는 과정에서
          환율의 방향과 크기가 반드시 개입된다.
          원화 약세(환율 상승)는 일반적으로 외국인 투자자의 원화 자산 매력을 낮추고,
          그 자체로 코스피 하방 압력으로 작용하는 경향이 있다.
        </p>

        <h3>3. 현재 모델 계수: 실제 추정값</h3>
        <p>
          코스피프리뷰 모델은 최근 180거래일 데이터를 사용해 EWY 계수와 환율 계수를 반복적으로
          재추정한다(Rolling Ridge). 2026년 5월 초 기준 추정된 값은 다음과 같다.
        </p>
        <div className="researchDataTable">
          <table>
            <thead>
              <tr>
                <th>신호</th>
                <th>계수값</th>
                <th>해석</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>EWY 로그수익률</td>
                <td>0.3535</td>
                <td>EWY 1% 상승 → 코스피 시초가 약 0.35% 상승 신호</td>
              </tr>
              <tr>
                <td>USD/KRW 로그수익률</td>
                <td>0.20</td>
                <td>환율 1% 상승(원화 약세) → 코스피 시초가 약 0.20% 하락 신호</td>
              </tr>
              <tr>
                <td>절편(intercept)</td>
                <td>0.2628</td>
                <td>신호가 없을 때의 기본 드리프트 추정값</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          EWY 계수 0.3535는 EWY가 1% 움직일 때 코스피 시초가가 약 0.35% 따라간다는 뜻이다.
          1:1 추종이 아닌 이유는 EWY 자체가 한국 주식만이 아니라 ETF 운용 비용,
          미국 시장 분위기, 헤지펀드 포지션 등의 노이즈를 포함하기 때문이다.
          환율 계수 0.2는 EWY보다 작은데, 이는 환율 변화가 코스피에 미치는 영향이
          EWY 직접 신호보다는 간접적이라는 실증적 결과를 반영한다.
        </p>

        <h3>4. 설명력의 한계: R² 23.49%</h3>
        <p>
          현재 모델의 EWY+환율 레이어 R²(결정계수)는 0.2349, 즉 23.49%다.
          이는 EWY와 환율 두 신호만으로 코스피 시초가 변화의 약 23%를 설명할 수 있다는 뜻이다.
          나머지 77%는 다른 변수들—SOX(반도체), 미국 주요 지수, VIX, 금리, 원자재—이나
          모델이 포착하지 못하는 뉴스와 정책 변수에서 온다.
        </p>
        <p>
          23%라는 숫자가 낮게 느껴질 수 있지만, 금융 시장 예측에서 단일 모델 레이어로
          23% 이상의 분산을 설명하는 것은 작은 성과가 아니다.
          실제로 코스피프리뷰의 전체 백테스트(1,462행)에서 방향 적중률이 76.53%에 달하는 것은
          EWY+환율 코어 레이어가 방향성에서는 상당한 예측력을 가지고 있음을 보여준다.
        </p>

        <h3>5. 계수가 고정되지 않는 이유</h3>
        <p>
          EWY 계수와 환율 계수는 한 번 정해지고 끝나는 값이 아니다.
          모델은 매 예측 사이클마다 최근 180거래일 데이터로 계수를 다시 추정한다.
          이를 롤링 리지(Rolling Ridge) 방식이라고 한다.
        </p>
        <p>
          이 방식을 택한 이유는 시장 레짐이 변하기 때문이다.
          반도체 업황이 좋을 때 EWY-코스피 민감도와 반도체 다운사이클 구간의 민감도는 다르다.
          원-달러 환율이 1,200원대일 때의 환율 계수와 1,400원대일 때의 계수도 달라질 수 있다.
          고정 계수는 이런 레짐 변화를 포착하지 못하지만, 롤링 재추정은 최근 시장 성격을
          반영한 계수를 사용할 수 있게 해준다.
          단, 이 과정에서 최근 이상 구간에 과적합하지 않도록 Ridge 정규화를 적용한다.
        </p>

        <h3>6. 보조 신호들의 역할</h3>
        <p>
          EWY와 환율이 코어라는 것은 다른 신호들이 필요 없다는 뜻이 아니다.
          모델은 SOX(필라델피아 반도체 지수), S&P 500, NASDAQ 100, VIX, WTI, Gold, US 10Y 등을
          잔차 보정 레이어에서 활용한다.
        </p>
        <p>
          이 보조 신호들은 EWY+환율 코어가 놓치는 부분을 미세 조정하는 역할이다.
          예를 들어 SOX가 EWY 대비 이례적으로 강하게 올랐다면, 삼성전자·SK하이닉스 비중이 높은
          코스피에서 추가적인 상승 압력이 있을 수 있다.
          이런 종류의 미세 신호를 별도 레이어로 분리해 처리하는 것이
          단순히 지표를 많이 넣는 것과 다른 설계다.
        </p>
        <p>
          단, 잔차 보정 레이어는 성능 기여가 확인될 때만 활성화된다.
          2026년 5월 초 기준 잔차 모델 가중치는 0.0으로 비활성 상태다.
          이는 최근 구간에서 보조 신호들이 코어 신호 대비 추가 설명력을 제공하지 못했기 때문이며,
          자동으로 판단된 결과다.
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
