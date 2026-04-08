import { AccuracyTable } from "@/components/accuracy-table";
import { AutoRefresh } from "@/components/auto-refresh";
import { ChartSection } from "@/components/chart-section";
import { IndicatorList } from "@/components/indicator-list";
import { SiteHeader } from "@/components/site-header";
import {
  getDataFreshness,
  getHistoryData,
  getIndicatorData,
  getPredictionData,
} from "@/lib/data";

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

  const latestRecordDate = freshness.latestRecordDate
    ? new Intl.DateTimeFormat("ko-KR", {
        dateStyle: "medium",
        timeZone: "Asia/Seoul",
      }).format(new Date(`${freshness.latestRecordDate}T00:00:00+09:00`))
    : "확인 불가";

  return (
    <div className="pageContainer">
      <AutoRefresh intervalMs={60000} />

      <SiteHeader lastUpdated={updatedAt} status={freshness.status} />

      <main>
        <section className="card heroSection">
          <div className="heroTopLine">
            <div className="heroDate">{prediction.predictionDate} 코스피 시초가 전망</div>
            <div className="heroMeta">
              <div className="heroMetaChip">최근 실측 반영: {latestRecordDate}</div>
              <div className="heroMetaChip">30일 평균 오차: {prediction.mae30d.toFixed(2)}pt</div>
            </div>
          </div>

          <div className="heroPrice">{prediction.pointPrediction.toLocaleString("ko-KR")}</div>

          <div className="heroChangeLabel">
            <span className={prediction.predictedChangePct >= 0 ? "isPos" : "isNeg"}>
              {prediction.predictedChangePct >= 0 ? "상방" : "하방"} {Math.abs(prediction.predictedChangePct).toFixed(2)}%
            </span>
          </div>

          <div className="heroBand">
            예상 밴드 {prediction.rangeLow.toLocaleString("ko-KR")} ~ {prediction.rangeHigh.toLocaleString("ko-KR")}
          </div>

          <div className="heroMessage">{prediction.signalSummary}</div>
        </section>

        <ChartSection history={history} />

        <h2 className="sectionTitle">시장 지표</h2>
        <IndicatorList indicators={indicators} />

        <h2 className="sectionTitle" style={{ marginTop: "60px" }}>
          최근 예측 기록
        </h2>
        <AccuracyTable history={history} />
      </main>

      <footer className="footer">
        <div>© 2026 KOSPI Dawn. Forecast dashboard for KOSPI opening range.</div>
        <div className="footerLinks">
          <a href="/about">모델 설명</a>
          <a href="/privacy">개인정보처리방침</a>
        </div>
      </footer>
    </div>
  );
}
