export function SeoContent() {
  return (
    <section className="sectionCard proseSection">
      <div className="sectionHeader">
        <div>
          <p className="sectionEyebrow">안내</p>
          <h2>코스피 시초가 예측 모델 안내</h2>
        </div>
      </div>
      <div className="faqList">
        <article>
          <h3>어떤 방식으로 예측하나요?</h3>
          <p>
            현재 모델은 EWY와 USD/KRW를 코어 신호로 사용해 합성 KOSPI 200 야간 환산값을 만들고, 이를 다시
            코스피 지수로 매핑하는 구조입니다. SOX, S&amp;P 500, NASDAQ 100, Dow, 금리, 원자재 지표는
            코어 신호가 설명하지 못한 오차를 제한적으로 보정하는 용도로만 반영합니다.
          </p>
        </article>
        <article>
          <h3>야간 선물 데이터는 모델에 쓰이나요?</h3>
          <p>
            EWY가 한국장 마감 시점에 거래되지 않는 공백을 맞추기 위해 프리장 시작 직후 1회 브릿지 보정으로만 사용합니다.
            그 이후의 모델 움직임은 EWY, USD/KRW, 보조 해외지표를 중심으로 계산합니다.
          </p>
        </article>
        <article>
          <h3>보조 지표는 어떤 역할을 하나요?</h3>
          <p>
            보조 지표는 예측의 중심이 아니라 잔차 보정층입니다. 최근 구간 검증에서 실제 개선이 확인된 경우에만
            반영 강도를 높이고, 성능을 해치는 구간에서는 자동으로 영향력을 줄이도록 설계했습니다.
          </p>
        </article>
      </div>
      <p className="disclaimer">
        본 서비스의 예측값은 통계적 추정치이며 실제 시초가와 차이가 발생할 수 있습니다. 투자 판단의 최종 책임은
        이용자 본인에게 있습니다.
      </p>
    </section>
  );
}
