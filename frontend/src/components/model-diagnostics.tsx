import type { BacktestDiagnosticsData } from "@/lib/data";

type ModelDiagnosticsProps = {
  diagnostics: BacktestDiagnosticsData;
};

export function ModelDiagnostics({ diagnostics }: ModelDiagnosticsProps) {
  const coefficientEntries = Object.entries(diagnostics.selectedModel.coefficients);

  return (
    <section className="sectionCard">
      <div className="sectionHeader">
        <div>
          <p className="sectionEyebrow">검증</p>
          <h2>선택 모델 진단</h2>
        </div>
        <div className="statsInline">
          <span>RMSE {diagnostics.selectedModel.rmse}</span>
          <span>MAE {diagnostics.selectedModel.mae}</span>
          <span>방향 {diagnostics.selectedModel.directionHitRate}%</span>
        </div>
      </div>

      <div className="diagnosticsGrid">
        <article className="diagnosticPanel">
          <h3>선택된 변수</h3>
          <div className="chipRow">
            {diagnostics.selectedModel.features.map((feature) => (
              <span className="dataChip" key={feature}>
                {feature}
              </span>
            ))}
          </div>
          <div className="coefficientList">
            {coefficientEntries.map(([key, value]) => (
              <div className="coefficientRow" key={key}>
                <span>{key}</span>
                <strong>{value.toFixed(6)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="diagnosticPanel">
          <h3>후보 모델 순위</h3>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>변수</th>
                  <th>RMSE</th>
                  <th>밴드</th>
                </tr>
              </thead>
              <tbody>
                {diagnostics.candidateRanking.map((candidate) => (
                  <tr key={`${candidate.rank}-${candidate.features.join("-")}`}>
                    <td>{candidate.rank}</td>
                    <td>{candidate.features.join(", ")}</td>
                    <td>{candidate.rmse}</td>
                    <td>{candidate.bandHitRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
