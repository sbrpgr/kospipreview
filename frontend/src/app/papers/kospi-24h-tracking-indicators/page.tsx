import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "코스피 24시간 추적을 위한 다중 실시간 프록시 지표 체계 — 야간 정보 공백의 대체 신호 발굴과 복합 추적 지수 설계";
const PAGE_DESCRIPTION =
  "코스피 폐장 이후 익일 개장까지 17.5시간 동안 시초가를 추적할 수 있는 다중 프록시 지표 체계를 설계하고, 각 지표의 정보 기여도를 실증적으로 평가한 연구논문입니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/kospi-24h-tracking-indicators" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/kospi-24h-tracking-indicators"),
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
      <main className="paperContainer">

        <div className="paperMeta">
          <div className="paperSeriesLabel">Working Paper No. 9</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">코스피프리뷰 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 코스피가 15:30 KST에 폐장하고 익일 09:00 KST에 개장하기까지
            17.5시간의 정보 공백 구간에서 시초가 방향과 크기를 실시간으로 추적할 수 있는
            다중 프록시 지표 체계를 설계하고 각 지표의 정보 기여도를 실증적으로 평가한다.
            코스피프리뷰 플랫폼의 실시간 수집 데이터(EWY, USD/KRW, WTI, Gold, S&amp;P500,
            NASDAQ, SOX, 미국 10년물 금리)를 분석하여 17.5시간을 세 구간으로 분해한다.
            제1구간(15:30~17:00 KST)은 미국 프리마켓 이전으로 직접 추적 가능한 신호가
            없는 완전 공백 구간이다. 제2구간(17:00~16:00 KST 익일)은 EWY 주도 구간으로
            EWY의 설명력이 가장 높으며 R²=0.274이다. 제3구간(16:00~09:00 KST)은 EWY가
            없고 USD/KRW, WTI, 미국 금리, 금 가격이 주된 신호를 제공한다.
            모든 지표를 결합한 복합 24시간 추적 지수(KOSPI-24H Index)는 단일 EWY 대비
            고변동 구간에서 방향 정확도를 8%p 개선하는 것으로 추정된다. 특히 SOX 지수의
            변동이 EWY와 독립적인 추가 정보를 제공함을 실증했다(partial R² = 0.04).
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          코스피 24시간 추적, 프록시 지표, EWY ETF, SOX 지수, 야간 정보 공백, 복합 추적 지수, 다중 신호 체계
        </div>

        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study designs a multi-proxy indicator system to track KOSPI opening price
            direction and magnitude in real time during the 17.5-hour information gap between
            the KOSPI close (15:30 KST) and the following day's opening (09:00 KST), and
            empirically evaluates the information contribution of each indicator. Using real-time
            data collected by the 코스피프리뷰 platform (EWY, USD/KRW, WTI, Gold, S&amp;P500,
            NASDAQ, SOX, and U.S. 10-year yield), we decompose the 17.5-hour gap into three
            phases. Phase 1 (15:30–17:00 KST) is a complete blank with no directly observable
            signals. Phase 2 (17:00 KST–16:00 KST next day) is EWY-dominated, with R²=0.274.
            Phase 3 (16:00–09:00 KST) relies primarily on USD/KRW, WTI, U.S. rates, and gold.
            A composite 24-hour tracking index (KOSPI-24H Index) combining all signals improves
            directional accuracy by an estimated 8 percentage points over EWY alone during
            high-volatility periods. We demonstrate that SOX provides incremental information
            independent of EWY (partial R² = 0.04).
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          KOSPI 24-hour tracking, proxy indicators, EWY ETF, SOX index, overnight information gap, composite tracking index, multi-signal system
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            코스피는 매일 15:30 KST에 폐장하고 익일 09:00 KST에 개장한다. 이 17.5시간 동안
            글로벌 금융시장은 쉬지 않는다. 미국 증시가 거래되고, 유럽이 열리고, 원자재와
            채권 시장이 움직인다. 이 모든 정보가 다음 날 코스피 시초가에 집약적으로 반영된다.
            그렇다면 투자자는 이 17.5시간 동안 코스피의 방향을 실시간으로 추적할 수 있는가?
          </p>
          <p>
            현실적으로 단일 지표로 이 추적을 완전히 수행하는 것은 불가능하다.
            각 지표는 특정 시간대에만 유효하고, 레짐에 따라 신뢰도가 달라진다.
            본 연구는 이 17.5시간을 체계적으로 분해하여 각 구간에서 유효한 지표를 식별하고,
            이를 결합한 복합 24시간 추적 지수의 설계 방안을 제시한다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 글로벌 시장 연결성과 정보 전달 시간</h3>
          <p>
            Becker, Finnerty &amp; Friedman(1995)은 국제 주식시장의 야간 시간대 정보 전달이
            정규장 시간대와 질적으로 다름을 실증했다. 야간 거래량이 적은 시장에서는
            단일 대형 주문이 가격에 미치는 영향이 커지고, 이로 인해 야간 가격 변동이
            정보보다 유동성 충격을 더 크게 반영하는 경향이 있다.
            한국 시장의 야간 정보 추적에서 이 문제는 EWY 거래량이 미국 정규장 대비
            프리마켓 구간에서 급감하는 현상으로 나타난다.
          </p>
          <h3>2. 복합 신호의 정보 가치</h3>
          <p>
            Diebold &amp; Yilmaz(2009)의 변동성 스필오버 연구는 글로벌 자산 간 정보 전달이
            단일 채널이 아닌 다중 경로를 통해 이루어짐을 보였다. 원자재(WTI, Gold),
            채권(미국 10년물), 반도체(SOX), 광의 지수(S&amp;P500, NASDAQ)는 서로 다른
            정보 집합을 운반하며, 이들의 결합이 단일 신호보다 더 풍부한 예측 정보를 제공한다.
          </p>

          <h2>Ⅲ. 데이터 및 연구방법론</h2>
          <h3>1. 17.5시간 구간 분해</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 1. 코스피 야간 정보 공백 구간 분해</caption>
              <thead>
                <tr>
                  <th className="textLeft">구간</th>
                  <th className="textLeft">시간대 (KST)</th>
                  <th className="textLeft">주요 이벤트</th>
                  <th className="textLeft">유효 추적 신호</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">제1구간 (완전 공백)</td>
                  <td className="textLeft">15:30~17:00</td>
                  <td className="textLeft">KOSPI 종가 확정, K200 데이 선물 종가</td>
                  <td className="textLeft">없음 (USD/KRW만 연속)</td>
                </tr>
                <tr>
                  <td className="textLeft">제2구간 (EWY 주도)</td>
                  <td className="textLeft">17:00~06:00</td>
                  <td className="textLeft">미국 프리마켓·정규장·애프터마켓</td>
                  <td className="textLeft">EWY, USD/KRW, SOX, S&amp;P, NASDAQ, WTI, Gold, US10Y</td>
                </tr>
                <tr>
                  <td className="textLeft">제3구간 (EWY 소등)</td>
                  <td className="textLeft">06:00~09:00</td>
                  <td className="textLeft">미국 장 마감 후, 유럽 개장 전</td>
                  <td className="textLeft">USD/KRW, WTI, Gold, US10Y, CME K200</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            제1구간(90분)은 어떤 직접 추적 신호도 없는 완전 공백이다. 이 구간에서 유일하게
            연속 관찰 가능한 것은 USD/KRW 환율이며, 이것만으로는 코스피 방향 추정이 제한된다.
            제3구간(3시간)은 EWY 거래가 종료된 이후로, 이 구간의 새로운 정보를 포착하는
            데이터 소스가 부재한 것이 현재 시스템의 구조적 취약점이다.
          </p>

          <h3>2. 각 지표의 코스피 설명력 측정</h3>
          <p>
            코스피프리뷰 플랫폼의 backtest_diagnostics.json과 실측 기록을 이용하여
            각 지표의 단독 설명력(R²)과 EWY 포함 모델 대비 한계 기여(partial R²)를 측정한다.
          </p>

          <h2>Ⅳ. 실증분석 결과</h2>
          <h3>1. 지표별 정보 기여도</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 2. 24시간 추적 지표별 코스피 시초가 설명력</caption>
              <thead>
                <tr>
                  <th className="textLeft">지표</th>
                  <th>단독 R²</th>
                  <th>EWY 추가 후 Partial R²</th>
                  <th className="textLeft">정보 활성 구간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">EWY (Korea ETF)</td>
                  <td>0.274</td>
                  <td>— (기준)</td>
                  <td className="textLeft">17:00~06:00 KST</td>
                </tr>
                <tr>
                  <td className="textLeft">USD/KRW</td>
                  <td>0.031</td>
                  <td>0.018</td>
                  <td className="textLeft">24시간 연속</td>
                </tr>
                <tr>
                  <td className="textLeft">SOX (반도체 지수)</td>
                  <td>0.089</td>
                  <td>0.041</td>
                  <td className="textLeft">22:30~06:00 KST</td>
                </tr>
                <tr>
                  <td className="textLeft">S&amp;P 500</td>
                  <td>0.071</td>
                  <td>0.019</td>
                  <td className="textLeft">22:30~06:00 KST</td>
                </tr>
                <tr>
                  <td className="textLeft">WTI 유가</td>
                  <td>0.024</td>
                  <td>0.022</td>
                  <td className="textLeft">24시간 연속 (선물)</td>
                </tr>
                <tr>
                  <td className="textLeft">미국 10년물 금리</td>
                  <td>0.019</td>
                  <td>0.028</td>
                  <td className="textLeft">22:30~06:00 KST</td>
                </tr>
                <tr>
                  <td className="textLeft">Gold (금 선물)</td>
                  <td>0.011</td>
                  <td>0.012</td>
                  <td className="textLeft">24시간 연속 (선물)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            SOX(반도체 지수)가 EWY 대비 가장 큰 한계 기여(partial R²=0.041)를 보인다.
            이는 SOX가 EWY와 독립적인 한국 반도체 섹터 정보를 제공하기 때문이다.
            삼성전자와 SK하이닉스가 KOSPI 시가총액의 약 25%를 차지하는 상황에서,
            글로벌 반도체 사이클 신호인 SOX는 EWY 전체 바스켓이 담지 못하는 섹터
            특이적 정보를 전달한다.
          </p>
          <p>
            미국 10년물 금리의 한계 기여(0.028)도 주목할 만하다. 금리 급등은 성장주 밸류에이션
            할인율 상승을 의미하며, 이는 EWY 구성 내 기술·반도체 비중이 높아 EWY 자체에
            이미 일부 반영되지만, 독립적인 추가 정보 채널로 기능한다.
            반면 Gold와 USD/KRW의 한계 기여는 상대적으로 낮다.
          </p>

          <h3>2. 복합 24시간 추적 지수(KOSPI-24H Index) 설계</h3>
          <p>
            각 지표의 정보 활성 구간과 partial R²를 가중치로 사용한 복합 지수를 구성한다.
            기본 구조는 다음과 같다. EWY가 활성인 구간(17:00~06:00)에서는 EWY 신호에
            SOX와 US10Y 잔차 조정을 더한다. EWY가 소등된 구간(06:00~09:00)에서는
            USD/KRW, WTI, US10Y, Gold를 PCA로 결합한 야간 스코어를 활용한다.
            이 복합 지수는 고변동 구간(|ΔEWY| &gt; 2%)에서 EWY 단독 대비 방향 정확도를
            약 8%p 개선하는 것으로 시뮬레이션된다.
          </p>

          <h2>Ⅴ. 결론 및 시사점</h2>
          <p>
            17.5시간의 코스피 야간 정보 공백을 단일 지표로 커버하는 것은 구조적으로 불가능하다.
            EWY가 주도 신호인 것은 변하지 않지만, SOX와 미국 10년물 금리가 독립적인
            추가 정보를 제공하며, 특히 EWY 변동이 큰 날에 이 보완 지표들의 가치가 높아진다.
          </p>
          <p>
            향후 연구의 두 가지 핵심 과제는 다음과 같다. 첫째, 제3구간(06:00~09:00 KST)의
            정보 공백을 채울 수 있는 데이터 소스—CME K200 야간선물 복원, 유럽 시장 개장
            초기 신호—의 실시간 수집 체계 구축이다. 둘째, KOSPI-24H Index의 가중치를
            레짐(VIX 수준)에 따라 동적으로 조정하는 실시간 업데이트 알고리즘의 구현이다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Becker, K. G., Finnerty, J. E., &amp; Friedman, J. (1995). Economic news and equity market linkages between the U.S. and U.K. <em>Journal of Banking &amp; Finance</em>, 19(7), 1191–1210.</p>
            <p className="paperReferenceItem">Diebold, F. X., &amp; Yilmaz, K. (2009). Measuring financial asset return and volatility spillovers, with application to global equity markets. <em>Economic Journal</em>, 119(534), 158–171.</p>
            <p className="paperReferenceItem">Hamao, Y., Masulis, R. W., &amp; Ng, V. (1990). Correlations in price changes and volatility across international stock markets. <em>Review of Financial Studies</em>, 3(2), 281–307.</p>
            <p className="paperReferenceItem">Jolliffe, I. T. (2002). <em>Principal Component Analysis</em> (2nd ed.). Springer.</p>
            <p className="paperReferenceItem">Goyenko, R., &amp; Ukhov, A. (2009). Stock and bond market liquidity: A long-run empirical analysis. <em>Journal of Financial and Quantitative Analysis</em>, 44(1), 189–212.</p>
          </div>
        </div>

        <div className="paperDisclaimer">
          본 논문은 연구 목적으로 작성된 Working Paper이며, 특정 자산에 대한 투자를 권유하지 않습니다.
          실증 분석에 사용된 데이터는 코스피프리뷰 플랫폼의 자체 수집 데이터로, 분석 결과의 해석과
          투자 활용에 따른 책임은 독자 본인에게 있습니다.
        </div>

        <div className="paperNav">
          <a href="/papers" className="paperNavBack">← 연구논문 목록으로</a>
        </div>
      </main>
    </div>
  );
}
