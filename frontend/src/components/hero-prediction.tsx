import { CopyButton } from "@/components/copy-button";
import { IntradayChart } from "@/components/intraday-chart";
import { formatDateTime, formatSignedPercent } from "@/lib/format";
import type { PredictionData } from "@/lib/data";

type HeroPredictionProps = {
  prediction: PredictionData;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function HeroPrediction({ prediction }: HeroPredictionProps) {
  const isForecastReady =
    isFiniteNumber(prediction.rangeLow) &&
    isFiniteNumber(prediction.rangeHigh) &&
    isFiniteNumber(prediction.pointPrediction) &&
    isFiniteNumber(prediction.predictedChangePct);
  const rangeLow = isFiniteNumber(prediction.rangeLow) ? prediction.rangeLow : null;
  const rangeHigh = isFiniteNumber(prediction.rangeHigh) ? prediction.rangeHigh : null;
  const pointPrediction = isFiniteNumber(prediction.pointPrediction) ? prediction.pointPrediction : null;
  const predictedChangePct = isFiniteNumber(prediction.predictedChangePct) ? prediction.predictedChangePct : null;
  const copyText = isForecastReady
    ? `${prediction.predictionDate} 코스피 예상 시초가: ${rangeLow}~${rangeHigh} (${formatSignedPercent(predictedChangePct ?? 0)})`
    : `${prediction.predictionDate} 코스피 예상 시초가: 운영 시간 대기`;

  const yesterdayCenter = (prediction.yesterday.predictionLow + prediction.yesterday.predictionHigh) / 2;
  const yesterdayDeviation = prediction.yesterday.actualOpen - yesterdayCenter;
  const isDevPositive = yesterdayDeviation >= 0;

  return (
    <section className="heroPanel">
      <div className="heroGrid">
        <div>
          <div className="eyebrow">{prediction.predictionDate} 코스피 시초가 전망</div>
          <div className="heroRange">
            {isForecastReady
              ? `${rangeLow?.toLocaleString("ko-KR")} ~ ${rangeHigh?.toLocaleString("ko-KR")}`
              : "-"}
          </div>
          <div className="heroPoint">
            <span>모델 예측 (야간선물 브릿지 1회 보정)</span>
            <strong style={{ color: "#fff", fontSize: "1.1rem" }}>
              {isForecastReady ? pointPrediction?.toLocaleString("ko-KR") : "-"}
            </strong>
            <span className={isForecastReady && (predictedChangePct ?? 0) >= 0 ? "isPositive" : "isNegative"}>
              {isForecastReady ? formatSignedPercent(predictedChangePct ?? 0) : "-"}
            </span>
          </div>

          <div className="heroSignal">{prediction.signalSummary}</div>

          {isForecastReady ? (
            <IntradayChart
              closePrice={prediction.yesterday.actualOpen}
              expectedLow={rangeLow ?? 0}
              expectedHigh={rangeHigh ?? 0}
              expectedPoint={pointPrediction ?? 0}
            />
          ) : null}
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
        <span className="heroFooterText">
          마지막 갱신: {prediction.lastCalculatedAt ? formatDateTime(prediction.lastCalculatedAt) : "-"}
        </span>
        <CopyButton text={copyText} />
      </div>
    </section>
  );
}
