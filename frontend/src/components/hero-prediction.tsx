import { CopyButton } from "@/components/copy-button";
import { IntradayChart } from "@/components/intraday-chart";
import { formatDateTime, formatSignedPercent } from "@/lib/format";
import type { PredictionData } from "@/lib/data";

type HeroPredictionProps = {
  prediction: PredictionData;
};

export function HeroPrediction({ prediction }: HeroPredictionProps) {
  const copyText = `${prediction.predictionDate} 코스피 예상 시초가: ${prediction.rangeLow}~${prediction.rangeHigh} (${formatSignedPercent(prediction.predictedChangePct)}), 신뢰도 ${prediction.confidence}/5`;
  const selectedFeatures =
    "selectedFeatures" in prediction.model && Array.isArray(prediction.model.selectedFeatures)
      ? prediction.model.selectedFeatures.join(" + ")
      : "기본 조합";

  return (
    <section className="heroPanel">
      <div className="heroGrid">
        <div>
          <div className="eyebrow">{prediction.predictionDate} 코스피 예상 시초가</div>
          <div className="heroRange">
            {prediction.rangeLow.toLocaleString("ko-KR")} ~{" "}
            {prediction.rangeHigh.toLocaleString("ko-KR")}
          </div>
          <div
            className={`heroPoint ${prediction.predictedChangePct >= 0 ? "isPositive" : "isNegative"}`}
          >
            중심 예측값 {prediction.pointPrediction.toLocaleString("ko-KR")} / 전일 대비{" "}
            {formatSignedPercent(prediction.predictedChangePct)}
          </div>
          <div className="heroMeta">
            <span>모델 신뢰도</span>
            <strong>{`${"★".repeat(prediction.confidence)}${"☆".repeat(5 - prediction.confidence)}`}</strong>
            <span>{prediction.confidenceLabel}</span>
          </div>
          <p className="heroSignal">{prediction.signalSummary}</p>
          
          <IntradayChart 
            closePrice={prediction.yesterday.actualOpen} // 시뮬레이션을 위해 전일 기준값 전송 (종목 특성상 종가 또는 전일 시가)
            expectedLow={prediction.rangeLow}
            expectedHigh={prediction.rangeHigh}
            expectedPoint={prediction.pointPrediction}
          />
        </div>

        <aside className="heroAside">
          <div className="miniStatCard">
            <span className="miniStatLabel">최근 30일 밴드 적중률</span>
            <strong>{prediction.bandHitRate30d}%</strong>
          </div>
          <div className="miniStatCard">
            <span className="miniStatLabel">최근 30일 방향 적중률</span>
            <strong>{prediction.directionHitRate30d}%</strong>
          </div>
          <div className="miniStatCard">
            <span className="miniStatLabel">최근 30일 평균 오차율</span>
            <strong>{prediction.mae30d} pt</strong>
          </div>
        </aside>
      </div>

      <div className="heroFooter">
        <span>마지막 계산: {formatDateTime(prediction.lastCalculatedAt)}</span>
        <CopyButton text={copyText} />
      </div>
      <div className="heroSummary">
        <div className="summaryCard">
          <span className="summaryLabel">전일 검증</span>
          어제 예측 {prediction.yesterday.predictionLow.toLocaleString("ko-KR")}~
          {prediction.yesterday.predictionHigh.toLocaleString("ko-KR")} / 실제{" "}
          {prediction.yesterday.actualOpen.toLocaleString("ko-KR")}
        </div>
        <div className="summaryCard">
          <span className="summaryLabel">실제-예측 편차</span>
          {(() => {
            const yesterdayCenter = (prediction.yesterday.predictionLow + prediction.yesterday.predictionHigh) / 2;
            const yesterdayDeviation = prediction.yesterday.actualOpen - yesterdayCenter;
            const isDevPositive = yesterdayDeviation >= 0;
            return (
              <span style={{ color: isDevPositive ? "#FF3B30" : "#34C759", fontWeight: "bold" }}>
                {isDevPositive ? "▲" : "▼"}{Math.abs(yesterdayDeviation).toFixed(2)} pt
              </span>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
