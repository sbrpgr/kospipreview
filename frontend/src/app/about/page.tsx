import { SiteHeader } from "@/components/site-header";

export default function AboutPage() {
  return (
    <main className="pageShell innerPage">
      <SiteHeader
        description="현재 예측 밴드가 어떤 입력값과 로직으로 계산되는지, 그리고 신뢰도를 어떻게 낮추거나 높이는지 정리한 페이지입니다."
        eyebrow="모델 설명"
        title="예측 모델 설명"
      />
      <section className="sectionCard proseSection">
        <h2>모델 A</h2>
        <p>
          야간선물, EWY, NDF 환율, WTI, S&amp;P500 등락률을 입력으로 사용하는 다중 회귀
          기반 포인트 예측입니다.
        </p>
        <h2>모델 B</h2>
        <p>
          야간선물 단독 변환식으로 계산한 크로스체크 모델입니다. 모델 A와 괴리가 커지면
          신뢰도를 낮추는 기준으로 사용합니다.
        </p>
        <h2>밴드 산출</h2>
        <p>
          잔차 표준편차를 기본 폭으로 사용하고, VIX 수준에 따라 밴드 배수를 늘려 변동성
          환경을 반영합니다.
        </p>
      </section>
    </main>
  );
}
