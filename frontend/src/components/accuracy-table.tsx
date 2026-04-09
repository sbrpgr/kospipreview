import type { HistoryData } from "@/lib/data";

export function AccuracyTable({ history }: { history: HistoryData }) {
  const records = [...history.records].slice(0, 15);

  return (
    <div className="cleanTableWrap">
      <table className="cleanTable">
        <thead>
          <tr>
            <th>날짜</th>
            <th>실제 시초가</th>
            <th>야간선물 기준 환산치</th>
            <th>모델 예측치</th>
            <th>야간선물 오차</th>
            <th>모델 오차</th>
            <th style={{ textAlign: "center" }}>결과</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const modelPrediction =
              typeof record.modelPrediction === "number" ? record.modelPrediction : (record.low + record.high) / 2;
            const nightSimple = typeof record.nightFuturesSimpleOpen === "number" ? record.nightFuturesSimpleOpen : null;
            const nightError = nightSimple === null ? null : record.actualOpen - nightSimple;
            const modelError = record.actualOpen - modelPrediction;
            const modelWins = nightError !== null && Math.abs(modelError) < Math.abs(nightError);

            return (
              <tr key={record.date}>
                <td style={{ color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{record.date}</td>
                <td style={{ color: "var(--text)", fontWeight: 800 }}>{record.actualOpen.toLocaleString("ko-KR")}</td>
                <td>
                  {nightSimple === null ? "-" : nightSimple.toLocaleString("ko-KR")}
                </td>
                <td style={{ color: "var(--text)", fontWeight: 700 }}>{modelPrediction.toLocaleString("ko-KR")}</td>
                <td
                  style={{
                    color: nightError === null ? "var(--text-secondary)" : nightError >= 0 ? "var(--negative)" : "var(--positive)",
                    fontWeight: 700,
                  }}
                >
                  {nightError === null ? "-" : `${nightError >= 0 ? "+" : ""}${nightError.toFixed(1)}`}
                </td>
                <td style={{ color: modelError >= 0 ? "var(--negative)" : "var(--positive)", fontWeight: 700 }}>
                  {modelError >= 0 ? "+" : ""}
                  {modelError.toFixed(1)}
                </td>
                <td style={{ textAlign: "center" }}>
                  <span className={`badge ${record.hit ? "hit" : "miss"}`}>
                    {nightError === null ? (record.hit ? "적중" : "미적중") : modelWins ? "모델 우세" : "비교 필요"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
