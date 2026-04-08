import type { PredictionData } from "@/lib/data";

export function DashboardStats({ prediction }: { prediction: PredictionData }) {
  const yesterdayCenter = (prediction.yesterday.predictionLow + prediction.yesterday.predictionHigh) / 2;
  const yesterdayDeviation = prediction.yesterday.actualOpen - yesterdayCenter;
  const isDevPos = yesterdayDeviation >= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div className="panelHeader">
        <div className="panelTitle">Overview</div>
      </div>
      
      <div className="dataRow">
        <span className="dataRowLabel">Yesterday Actual</span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span className="dataRowValue">{prediction.yesterday.actualOpen.toLocaleString("ko-KR")}</span>
          <span className={`microBadge ${prediction.yesterday.hit ? 'hit' : 'miss'}`}>
            {prediction.yesterday.hit ? 'HIT' : 'MISS'}
          </span>
        </div>
      </div>
      
      <div className="dataRow">
        <span className="dataRowLabel">Y-Deviation</span>
        <span className={`dataRowChange ${isDevPos ? 'isNeg' : 'isPos'}`}>
          {isDevPos ? "+" : ""}{yesterdayDeviation.toFixed(1)}
        </span>
      </div>

      <div className="dataRow">
        <span className="dataRowLabel">30d MAE</span>
        <span className="dataRowValue" style={{ color: "var(--text)" }}>{prediction.mae30d} pt</span>
      </div>

      <div className="dataRow">
        <span className="dataRowLabel">VIX Level</span>
        <span className="dataRowValue" style={{
          color: prediction.model.vix > 30 ? "var(--negative)" : prediction.model.vix > 20 ? "var(--gold)" : "var(--positive)"
        }}>
          {prediction.model.vix}
        </span>
      </div>

      <div className="dataRow">
        <span className="dataRowLabel">Model</span>
        <div style={{ textAlign: "right" }}>
          <div className="dataRowValue">{prediction.model.engine}</div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
            RMSE {prediction.model.lgbmRmse}
          </div>
        </div>
      </div>
    </div>
  );
}
