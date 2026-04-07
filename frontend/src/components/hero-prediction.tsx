import { CopyButton } from "@/components/copy-button";
import { formatDateTime, formatSignedPercent } from "@/lib/format";
import type { PredictionData } from "@/lib/data";

type HeroPredictionProps = {
  prediction: PredictionData;
};

export function HeroPrediction({ prediction }: HeroPredictionProps) {
  const copyText = `내일 코스피 예상 시초가: ${prediction.rangeLow}~${prediction.rangeHigh} (${formatSignedPercent(prediction.predictedChangePct)}), 신뢰도 ${prediction.confidence}/5`;
  const selectedFeatures =
    "selectedFeatures" in prediction.model && Array.isArray(prediction.model.selectedFeatures)
      ? prediction.model.selectedFeatures.join(" + ")
      : "기본 조합";

  return (
    <section className="heroPanel">
      <div className="heroGrid">
        <div>
          <div className="eyebrow">내일 코스피 예상 시초가</div>
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
            <span className="miniStatLabel">최근 30일 MAE</span>
            <strong>{prediction.mae30d}</strong>
          </div>
          <div className="miniStatCard">
            <span className="miniStatLabel">선택 모델</span>
            <strong>{selectedFeatures}</strong>
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
          <span className="summaryLabel">판정</span>
          {prediction.yesterday.hit ? "밴드 내 적중" : "밴드 이탈"}
        </div>
        <div className="summaryCard">
          <span className="summaryLabel">밴드 폭</span>
          VIX {prediction.model.vix} / 배수 {prediction.model.bandMultiplier}x
        </div>
      </div>
    </section>
  );
}
