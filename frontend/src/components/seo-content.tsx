export function SeoContent() {
  return (
    <section className="sectionCard proseSection">
      <div className="sectionHeader">
        <div>
          <p className="sectionEyebrow">안내</p>
          <h2>코스피 시초가 예측이란</h2>
        </div>
      </div>
      <div className="faqList">
        <article>
          <h3>어떤 지표를 분석하나요?</h3>
          <p>
            야간선물, EWY(한국 ETF), 원/달러 환율, WTI 원유, VIX 변동성 등 11개 선행지표를 
            LightGBM 앙상블 모델로 종합 분석하여 다음 거래일 시초가의 예측 밴드를 제시합니다.
          </p>
        </article>
        <article>
          <h3>EWY를 왜 함께 보나요?</h3>
          <p>
            EWY는 미국 시장에서 거래되는 한국 ETF로, 미국장 마감까지 반영된 한국 대형주 
            투자 심리를 빠르게 확인할 수 있는 핵심 선행지표입니다.
          </p>
        </article>
        <article>
          <h3>데이터는 얼마나 자주 갱신되나요?</h3>
          <p>
            매일 KST 06:00과 18:00에 자동으로 최신 시장 데이터를 수집하고, 모델을 재학습하여 
            예측값을 갱신합니다. 데이터 출처는 Yahoo Finance입니다.
          </p>
        </article>
      </div>
      <p className="disclaimer">
        ⚠ 본 서비스의 예상 시초가는 통계적 추정치이며 실제 시초가와 다를 수 있습니다. 
        투자 자문이나 매매 권유를 제공하지 않습니다.
      </p>
    </section>
  );
}
