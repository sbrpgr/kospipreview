export function SeoContent() {
  return (
    <section className="sectionCard proseSection">
      <div className="sectionHeader">
        <div>
          <p className="sectionEyebrow">섹션 5</p>
          <h2>코스피 시초가 예측이란</h2>
        </div>
      </div>
      <div className="faqList">
        <article>
          <h3>코스피 시초가 예측은 무엇을 보는가</h3>
          <p>
            야간선물, EWY, 환율, 유가, VIX 같은 선행지표를 종합해 다음 거래일 시초가의
            확률 범위를 제시합니다.
          </p>
        </article>
        <article>
          <h3>EWY와 코스피는 왜 함께 보나</h3>
          <p>
            EWY는 미국 시장에서 거래되는 한국 ETF라서 미국장 마감까지 반영된 한국 대형주
            심리를 빠르게 확인할 수 있습니다.
          </p>
        </article>
        <article>
          <h3>야간선물은 어떻게 활용하나</h3>
          <p>
            코스피200 야간선물은 한국 현물 개장 전 가장 직접적인 선행지표라서 모델의 핵심
            입력값으로 사용됩니다.
          </p>
        </article>
      </div>
      <p className="disclaimer">
        본 서비스의 예상 시초가는 통계적 추정치이며 실제 시초가와 다를 수 있습니다. 투자
        자문이나 매매 권유를 제공하지 않습니다.
      </p>
    </section>
  );
}
