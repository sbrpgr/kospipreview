import type { HistoryData } from "@/lib/data";

export function AccuracyTable({ history }: { history: HistoryData }) {
  const records = [...history.records].reverse().slice(0, 15);

  return (
    <div className="cleanTableWrap">
      <table className="cleanTable">
        <thead>
          <tr>
            <th>Date</th>
            <th>Pred Range</th>
            <th>Actual Close</th>
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
                <td style={{ color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{r.date}</td>
                <td>{Math.round(r.low).toLocaleString()} — {Math.round(r.high).toLocaleString()}</td>
                <td style={{ color: "#fff", fontWeight: 800 }}>{r.actualOpen.toLocaleString()}</td>
                <td style={{ color: isDevPos ? "var(--negative)" : "var(--positive)", fontWeight: 700 }}>
                  {isDevPos ? "+" : ""}{dev.toFixed(1)}
                </td>
                <td style={{ textAlign: "center" }}>
                  <span className={`badge ${isHit ? 'hit' : 'miss'}`}>
                    {isHit ? 'HIT' : 'MISS'}
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
