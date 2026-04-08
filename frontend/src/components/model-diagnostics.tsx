import type { BacktestDiagnosticsData } from "@/lib/data";

type ModelDiagnosticsProps = {
  diagnostics: BacktestDiagnosticsData;
};

export function ModelDiagnostics({ diagnostics }: ModelDiagnosticsProps) {
  const importanceEntries = Object.entries(diagnostics.featureImportance).sort((a, b) => b[1] - a[1]);

  return (
    <section className="sectionCard">
      <div className="sectionHeader">
        <div>
          <p className="sectionEyebrow">모델</p>
          <h2>LightGBM 변수 중요도</h2>
        </div>
        <div className="statsInline">
          <span>RMSE {diagnostics.rmse.toFixed(2)}</span>
          <span>MAE {diagnostics.mae.toFixed(2)}</span>
        </div>
      </div>

      <div className="diagnosticsGrid">
        <article className="diagnosticPanel">
          <h3>학습 변수</h3>
          <div className="chipRow">
            {diagnostics.selectedFeatures.map((feature) => (
              <span className="dataChip" key={feature}>
                {feature}
              </span>
            ))}
          </div>
        </article>

        <article className="diagnosticPanel">
          <h3>변수 중요도 (Feature Importance)</h3>
          <div className="coefficientList" style={{ maxHeight: "300px", overflowY: "auto" }}>
            {importanceEntries.map(([key, value]) => (
              <div className="coefficientRow" key={key}>
                <span style={{ minWidth: 110, fontSize: "0.82rem" }}>{key}</span>
                <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }}>
                  <div style={{ 
                    width: `${Math.min(100, (value / importanceEntries[0][1]) * 100)}%`, 
                    height: "100%", 
                    background: "var(--accent)",
                    borderRadius: "4px"
                  }} />
                </div>
                <strong style={{ minWidth: 40, textAlign: "right", fontSize: "0.82rem", fontFamily: "var(--font-mono)" }}>{value}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
