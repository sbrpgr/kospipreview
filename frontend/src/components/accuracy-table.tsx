import type { HistoryData } from "@/lib/data";

export function AccuracyTable({ history }: { history: HistoryData }) {
  const records = [...history.records].reverse().slice(0, 15); // Show latest 15 in bottom panel

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="panelHeader">
        <div className="panelTitle">Prediction History</div>
        <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
          Recent 15 trading days
        </div>
      </div>
      
      <div className="scrollable">
        <table className="dataGrid">
          <thead>
            <tr>
              <th>Date</th>
              <th>Pred Low</th>
              <th>Pred High</th>
              <th>Actual Open</th>
              <th>Deviation</th>
              <th style={{ textAlign: "center" }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => {
              const center = (r.low + r.high) / 2;
              const dev = r.actualOpen - center;
              const isDevPos = dev >= 0;
              const isHit = r.actualOpen >= r.low && r.actualOpen <= r.high;

              return (
                <tr key={i}>
                  <td style={{ color: "var(--text-secondary)" }}>{r.date}</td>
                  <td>{Math.round(r.low).toLocaleString()}</td>
                  <td>{Math.round(r.high).toLocaleString()}</td>
                  <td style={{ color: "#fff", fontWeight: 700 }}>{r.actualOpen.toLocaleString()}</td>
                  <td className={isDevPos ? "isNeg" : "isPos"} style={{ fontWeight: 600 }}>
                    {isDevPos ? "+" : ""}{dev.toFixed(1)}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`microBadge ${isHit ? 'hit' : 'miss'}`}>
                      {isHit ? 'HIT' : 'MISS'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
