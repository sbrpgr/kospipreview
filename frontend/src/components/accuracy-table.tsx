import type { HistoryData } from "@/lib/data";

type AccuracyTableProps = {
  history: HistoryData;
};

export function AccuracyTable({ history }: AccuracyTableProps) {
  return (
    <section className="sectionCard">
      <div className="sectionHeader">
        <div>
          <p className="sectionEyebrow">섹션 4</p>
          <h2>일자별 시작가 편차 기록</h2>
        </div>
        <div className="statsInline">
          <span>밴드 적중률 {history.summary.bandHitRate30d}%</span>
          <span>방향 적중률 {history.summary.directionHitRate30d}%</span>
          <span>평균오차(MAE) {history.summary.mae30d}pt</span>
        </div>
      </div>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>날짜</th>
              <th>예측 밴드 (중심)</th>
              <th>실제 시작가</th>
              <th>실제-예측 편차</th>
            </tr>
          </thead>
          <tbody>
            {history.records.map((record) => {
              const center = (record.low + record.high) / 2;
              const deviation = record.actualOpen - center;
              const isPositive = deviation >= 0;
              return (
                <tr key={record.date}>
                  <td>{record.date}</td>
                  <td>
                    {record.low.toLocaleString("ko-KR", { maximumFractionDigits: 1 })} ~ {record.high.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}
                    <div style={{ fontSize: "0.8rem", color: "#94A3B8", marginTop: "4px" }}>
                      중심: {center.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}
                    </div>
                  </td>
                  <td><strong>{record.actualOpen.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}</strong></td>
                  <td>
                    <span
                      style={{
                        color: isPositive ? "#FF3B30" : "#34C759", // 한국 증시: 양수 빨강, 음수 파랑/초록
                        fontWeight: "600",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {isPositive ? "▲" : "▼"}
                      {Math.abs(deviation).toLocaleString("ko-KR", { maximumFractionDigits: 2 })} pt
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
