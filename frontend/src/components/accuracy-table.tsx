import type { HistoryData } from "@/lib/data";

export function AccuracyTable({ history }: { history: HistoryData }) {
  const records = [...history.records].slice(0, 15);

  return (
    <div className="cleanTableWrap">
      <table className="cleanTable">
        <thead>
          <tr>
            <th>Date</th>
            <th>Pred Range</th>
            <th>Actual Open</th>
            <th>Deviation</th>
            <th style={{ textAlign: "center" }}>Result</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const center = (record.low + record.high) / 2;
            const deviation = record.actualOpen - center;
            const isDeviationPositive = deviation >= 0;

            return (
              <tr key={record.date}>
                <td style={{ color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{record.date}</td>
                <td>
                  {Math.round(record.low).toLocaleString("ko-KR")} ~ {Math.round(record.high).toLocaleString("ko-KR")}
                </td>
                <td style={{ color: "var(--text)", fontWeight: 800 }}>{record.actualOpen.toLocaleString("ko-KR")}</td>
                <td style={{ color: isDeviationPositive ? "var(--negative)" : "var(--positive)", fontWeight: 700 }}>
                  {isDeviationPositive ? "+" : ""}
                  {deviation.toFixed(1)}
                </td>
                <td style={{ textAlign: "center" }}>
                  <span className={`badge ${record.hit ? "hit" : "miss"}`}>{record.hit ? "HIT" : "MISS"}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
