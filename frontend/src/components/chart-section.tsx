const chartTabs = [
  { label: "야간선물", symbol: "KRX:KOSPI200" },
  { label: "EWY", symbol: "AMEX:EWY" },
  { label: "USD/KRW", symbol: "FX_IDC:USDKRW" },
  { label: "WTI", symbol: "NYMEX:CL1!" },
  { label: "S&P500", symbol: "SP:SPX" },
];

export function ChartSection() {
  return (
    <section className="sectionCard">
      <div className="sectionHeader">
        <div>
          <p className="sectionEyebrow">섹션 3</p>
          <h2>차트 영역</h2>
        </div>
      </div>
      <div className="chartTabs">
        {chartTabs.map((tab) => (
          <button className="tabChip" key={tab.symbol} type="button">
            {tab.label}
          </button>
        ))}
      </div>
      <div className="chartPlaceholder">
        TradingView Advanced Chart 위젯 삽입 예정
      </div>
    </section>
  );
}
