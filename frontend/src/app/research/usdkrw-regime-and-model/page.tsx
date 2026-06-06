import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "달러-원 환율 1,400원대의 의미 — 레짐 변화가 모델 계수에 미치는 영향";
const PAGE_DESCRIPTION =
  "환율이 특정 레짐에 있을 때 EWY-코스피 관계가 어떻게 달라지고, 롤링 재추정이 이를 어떻게 포착하는지 설명합니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/usdkrw-regime-and-model" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/usdkrw-regime-and-model"),
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
            코스피프리뷰 모델의 현재 환율 계수는 0.20이다. 이 값은 최근 180거래일 데이터로 추정된 것이다.
            2024~2026년 원화 약세 기조가 장기화되면서 환율 레짐이 1,200원대에서 1,400원대로 이동했다.
            이 변화가 모델 계수와 예측에 어떤 영향을 미치는지 분석한다.
          </p>
        </div>

        <h3>1. 환율 레짐이란 무엇인가</h3>
        <p>
          환율 레짐은 달러-원 환율이 어떤 수준대에서 안정적으로 움직이는 구간을 뜻한다.
          1,200원대는 원화 상대적 강세 레짐, 1,400원대는 원화 구조적 약세 레짐이다.
          단순히 환율 수치의 차이가 아니라, 시장 참여자들의 행동 방식, 외국인 투자 의사결정,
          수출 기업 헤지 전략 등이 레짐에 따라 달라진다.
        </p>
        <p>
          같은 EWY 1% 상승이라도 환율 레짐에 따라 코스피 시초가에 미치는 영향이 다를 수 있다.
          1,200원대에서는 원화 강세 기조 속에 외국인 투자자의 원화 자산 선호가 높아
          EWY 상승이 코스피에 더 강하게 전달될 수 있다.
          1,400원대에서는 원화 약세 부담으로 외국인의 추가 매수 의지가 약해져
          같은 EWY 신호가 코스피에 더 약하게 반영될 수 있다.
        </p>

        <h3>2. 1,400원대에서 외국인 행동이 달라지는 이유</h3>
        <p>
          달러 기준으로 투자하는 외국인 입장에서 환율 1,400원은 원화 자산의 달러 환산 비용이
          높다는 뜻이다. 같은 코스피 지수 상승이더라도 환율이 1,400원 이상이면
          달러로 환전할 때 손실이 더 크게 발생한다.
          이는 외국인의 코스피 신규 진입 장벽을 높이고, 기존 보유 포지션의 조기 청산 압력을 높인다.
        </p>
        <p>
          환율 계수 0.20은 원화가 1% 약세(환율 1% 상승)일 때 코스피 시초가가 약 0.20% 하락한다는
          역사적 관계를 반영한다. 이 계수가 롤링 재추정으로 최근 1,400원대 레짐 데이터를
          반영하면서 설정된 값이다. 1,200원대 레짐에서의 계수와 동일하지 않을 수 있다.
        </p>

        <h3>3. 롤링 재추정이 레짐 변화를 포착하는 방식</h3>
        <p>
          환율 레짐이 1,200원대에서 1,400원대로 이동하는 과정에서 롤링 180일 윈도우는
          점차 1,400원대 데이터 비중을 높여간다. 초기에는 두 레짐이 혼재하다가
          6~9개월이 지나면 새 레짐 데이터가 대부분을 차지하게 된다.
          이 과정에서 환율 계수도 새 레짐에 맞는 값으로 서서히 이동한다.
          단기 급변보다 구조적 레짐 전환에 더 적합한 설계다.
        </p>
        <p>
          EWY 계수(0.3535)와 환율 계수(0.20)의 조합은 현재 레짐—EWY 신호가 환율 신호보다
          코스피에 약 1.8배 강하게 영향을 준다—을 반영한다.
          레짐이 다시 원화 강세로 전환되면 환율 계수가 변화하거나
          EWY 계수 대비 비중이 달라질 수 있다.
        </p>

        <h3>4. 극단적 원화 약세 구간에서의 주의점</h3>
        <p>
          2026년 4월 관세 충격 기간에는 원화가 단기간에 급격히 약세로 움직였다.
          이런 급변 구간에서 환율 계수 0.20은 과거 정상 변동폭에 맞춰진 값이므로
          실제 시장 반응을 충분히 반영하지 못할 수 있다.
          극단적 원화 약세가 EWY 신호와 같은 방향(코스피 하락)일 때 두 신호가 증폭되어
          모델보다 실제 낙폭이 더 클 수 있다. 4월 충격 기간 여러 날의 과대 예측이 이를 보여준다.
        </p>

        <h3>5. 레짐 전환 구간에서 모델을 읽는 방법</h3>
        <p>
          환율 레짐 전환 구간에서는 EWY+환율 R²(현재 0.2349)를 주목할 필요가 있다.
          R²가 평소보다 낮아지면 현재 레짐에서 EWY+환율 신호의 설명력이 떨어지고 있다는 의미다.
          이 경우 예측 밴드를 더 넓게 해석하고, 세 가지 예측값의 발산 여부를 추가로 확인하는 것이
          레짐 전환 구간에서 예측을 다루는 방법이다.
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
