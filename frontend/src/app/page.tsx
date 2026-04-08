import { ChartSection } from "@/components/chart-section";
import { AccuracyTable } from "@/components/accuracy-table";
import { SiteHeader } from "@/components/site-header";
import { IndicatorList } from "@/components/indicator-list";
import { DashboardStats } from "@/components/dashboard-stats";
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
    <div className="dashboardShell">
      <AutoRefresh intervalMs={120000} />

      {/* Top Navbar */}
      <SiteHeader lastUpdated={updatedAt} status={freshness.status} />

      <main className="dashboardBody">
        {/* Main Chart Workspace */}
        <section className="mainArea">
          <div className="chartTopInfo">
            <div className="chartTickerBox">
              <span className="chartTickerLabel">{prediction.predictionDate} KOSPI PROJECTION</span>
              <div className="chartTickerBand">
                <span className="chartTickerValue">{prediction.pointPrediction.toLocaleString("ko-KR")}</span>
                <span className={prediction.predictedChangePct >= 0 ? "isPos" : "isNeg"} style={{ fontSize: "1.1rem" }}>
                  {formatSignedPercent(prediction.predictedChangePct)}
                </span>
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                Band: {prediction.rangeLow.toLocaleString("ko-KR")} ~ {prediction.rangeHigh.toLocaleString("ko-KR")}
              </div>
              <div className="chartSummaryTag">
                {prediction.signalSummary}
              </div>
            </div>
          </div>
          
          <div className="chartWorkspace">
            <ChartSection history={history} />
          </div>

          <div className="bottomPanel">
            <AccuracyTable history={history} />
          </div>
        </section>

        {/* Right Sidebar (Orderbook/Indicator style) */}
        <aside className="rightSidebar">
          <DashboardStats prediction={prediction} />
          <IndicatorList indicators={indicators} />
        </aside>
      </main>
    </div>
  );
}
