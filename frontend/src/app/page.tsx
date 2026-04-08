import { ChartSection } from "@/components/chart-section";
import { AccuracyTable } from "@/components/accuracy-table";
import { SiteHeader } from "@/components/site-header";
import { IndicatorList } from "@/components/indicator-list";
import {
  getDataFreshness,
  getHistoryData,
  getIndicatorData,
  getPredictionData,
} from "@/lib/data";
import { AutoRefresh } from "@/components/auto-refresh";
import { formatSignedPercent } from "@/lib/format";

export default async function Home() {
  const [prediction, indicators, history, freshness] = await Promise.all([
    getPredictionData(),
    getIndicatorData(),
    getHistoryData(),
    getDataFreshness(),
  ]);

  const updatedAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(freshness.newestModifiedAt));

  return (
    <div className="pageContainer">
      <AutoRefresh intervalMs={120000} />

      <SiteHeader lastUpdated={updatedAt} status={freshness.status} />

      <main>
        {/* Giant Hero Prediction */}
        <section className="heroSection">
          <div className="heroDate">{prediction.predictionDate} 코스피 전망</div>
          <div className="heroPrice">{prediction.pointPrediction.toLocaleString("ko-KR")}</div>
          <div className="heroChangeLabel">
            <span className={prediction.predictedChangePct >= 0 ? "isPos" : "isNeg"}>
              {prediction.predictedChangePct >= 0 ? "▲" : "▼"} {Math.abs(prediction.predictedChangePct).toFixed(2)}%
            </span>
          </div>
          <br/>
          <div className="heroBand">
            예측 밴드 {prediction.rangeLow.toLocaleString("ko-KR")} — {prediction.rangeHigh.toLocaleString("ko-KR")}
          </div>
          <div className="heroMessage">
            {prediction.signalSummary}
          </div>
        </section>

        {/* Chart */}
        <ChartSection history={history} />

        {/* Indicators Card Grid */}
        <h2 className="sectionTitle">시장 지표</h2>
        <IndicatorList indicators={indicators} />

        {/* History Table */}
        <h2 className="sectionTitle" style={{ marginTop: "60px" }}>최근 예측 기록</h2>
        <AccuracyTable history={history} />
      </main>

      <footer className="footer">
        <div>© 2026 KOSPI Dawn. All rights reserved.</div>
        <div className="footerLinks">
          <a href="/about">모델 설명</a>
          <a href="/privacy">개인정보처리방침</a>
        </div>
      </footer>
    </div>
  );
}
