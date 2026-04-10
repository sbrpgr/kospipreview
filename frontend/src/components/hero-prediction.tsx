import { CopyButton } from "@/components/copy-button";
import { IntradayChart } from "@/components/intraday-chart";
import { formatDateTime, formatSignedPercent } from "@/lib/format";
import type { PredictionData } from "@/lib/data";

type HeroPredictionProps = {
  prediction: PredictionData;
};

export function HeroPrediction({ prediction }: HeroPredictionProps) {
  const copyText = `${prediction.predictionDate} 코스피 예상 시초가: ${prediction.rangeLow}~${prediction.rangeHigh} (${formatSignedPercent(prediction.predictedChangePct)})`;

  const yesterdayCenter = (prediction.yesterday.predictionLow + prediction.yesterday.predictionHigh) / 2;
  const yesterdayDeviation = prediction.yesterday.actualOpen - yesterdayCenter;
  const isDevPositive = yesterdayDeviation >= 0;

  return (
    <section className="heroPanel">
      <div className="heroGrid">
        <div>
          <div className="eyebrow">{prediction.predictionDate} 코스피 시초가 전망</div>
          <div className="heroRange">
            {prediction.rangeLow.toLocaleString("ko-KR")} ~ {prediction.rangeHigh.toLocaleString("ko-KR")}
          </div>
          <div className="heroPoint">
            <span>모델 예측 (야간 선물 지표 완전 미사용)</span>
            <strong style={{ color: "#fff", fontSize: "1.1rem" }}>
              {prediction.pointPrediction.toLocaleString("ko-KR")}
            </strong>
            <span className={prediction.predictedChangePct >= 0 ? "isPositive" : "isNegative"}>
              {formatSignedPercent(prediction.predictedChangePct)}
            </span>
          </div>

          <div className="heroSignal">{prediction.signalSummary}</div>

          <IntradayChart
            closePrice={prediction.yesterday.actualOpen}
            expectedLow={prediction.rangeLow}
            expectedHigh={prediction.rangeHigh}
            expectedPoint={prediction.pointPrediction}
          />
        </div>

        <aside className="heroAside">
          <div className="statCard">
            <span className="statLabel">전일 예측 검증</span>
            <div style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
              예측 {prediction.yesterday.predictionLow.toLocaleString("ko-KR")}~
              {prediction.yesterday.predictionHigh.toLocaleString("ko-KR")}
            </div>
            <div style={{ fontSize: "0.88rem", color: "#fff", fontWeight: 700, marginTop: 2 }}>
              실제 {prediction.yesterday.actualOpen.toLocaleString("ko-KR")}
            </div>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <span className={`hitBadge ${prediction.yesterday.hit ? "hit" : "miss"}`}>
                {prediction.yesterday.hit ? "적중" : "이탈"}
              </span>
              <span
                style={{
                  color: isDevPositive ? "var(--negative)" : "var(--positive)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {isDevPositive ? "+" : ""}
                {yesterdayDeviation.toFixed(1)}pt
              </span>
            </div>
          </div>

          <div className="statCard">
            <span className="statLabel">평균 예측 오차 (30일)</span>
            <span className="statValue" style={{ fontFamily: "var(--font-mono)" }}>
              {prediction.mae30d} pt
            </span>
          </div>

          <div className="statCard">
            <span className="statLabel">VIX 변동성 지표</span>
            <span
              className="statValue"
              style={{
                fontFamily: "var(--font-mono)",
                color:
                  prediction.model.vix > 30
                    ? "var(--negative)"
                    : prediction.model.vix > 20
                      ? "var(--gold)"
                      : "var(--positive)",
              }}
            >
              {prediction.model.vix}
            </span>
            <span className="statValueSm" style={{ marginTop: 4, display: "block" }}>
              {prediction.model.vix > 30 ? "고변동성 구간" : prediction.model.vix > 20 ? "보통 변동성" : "안정 구간"}
            </span>
          </div>

          <div className="statCard">
            <span className="statLabel">예측 엔진</span>
            <span className="statValue" style={{ fontSize: "0.95rem" }}>
              {prediction.model.engine}
            </span>
            <span className="statValueSm" style={{ display: "block", marginTop: 2, fontFamily: "var(--font-mono)" }}>
              RMSE {prediction.model.lgbmRmse}
            </span>
          </div>
        </aside>
      </div>

      <div className="heroFooter">
        <span className="heroFooterText">마지막 갱신: {formatDateTime(prediction.lastCalculatedAt)}</span>
        <CopyButton text={copyText} />
      </div>
    </section>
  );
}
