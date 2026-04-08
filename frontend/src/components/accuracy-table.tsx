import type { HistoryData } from "@/lib/data";

type AccuracyTableProps = {
  history: HistoryData;
};

export function AccuracyTable({ history }: AccuracyTableProps) {
  return (
    <section className="sectionCard">
      <div className="sectionHeader">
        <div>
          <p className="sectionEyebrow">검증 기록</p>
          <h2>일자별 예측 편차</h2>
        </div>
        <div className="statsInline">
          <span>평균오차(MAE) {history.summary.mae30d}pt</span>
          <span>{history.records.length}일 기록</span>
        </div>
      </div>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>날짜</th>
              <th>예측 밴드</th>
              <th>실제 시작가</th>
              <th>편차</th>
              <th>적중</th>
            </tr>
          </thead>
          <tbody>
            {history.records.map((record) => {
              const center = (record.low + record.high) / 2;
              const deviation = record.actualOpen - center;
              const isPositive = deviation >= 0;
              return (
                <tr key={record.date}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>{record.date}</td>
                  <td>
                    {record.low.toLocaleString("ko-KR", { maximumFractionDigits: 0 })} ~ {record.high.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}
                  </td>
                  <td style={{ fontWeight: 700, color: "#fff" }}>
                    {record.actualOpen.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}
                  </td>
                  <td>
                    <span style={{
                      color: isPositive ? "var(--negative)" : "var(--positive)",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                    }}>
                      {isPositive ? "+" : ""}{deviation.toFixed(0)}
                    </span>
                  </td>
                  <td>
                    <span className={`hitBadge ${record.hit ? "hit" : "miss"}`}>
                      {record.hit ? "HIT" : "MISS"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
