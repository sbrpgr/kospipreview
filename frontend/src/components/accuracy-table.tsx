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
          <h2>예측 적중 기록</h2>
        </div>
        <div className="statsInline">
          <span>밴드 {history.summary.bandHitRate30d}%</span>
          <span>방향 {history.summary.directionHitRate30d}%</span>
          <span>MAE {history.summary.mae30d}</span>
        </div>
      </div>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>날짜</th>
              <th>예측 밴드</th>
              <th>실제 시초가</th>
              <th>적중</th>
            </tr>
          </thead>
          <tbody>
            {history.records.map((record) => (
              <tr key={record.date}>
                <td>{record.date}</td>
                <td>
                  {record.low.toLocaleString("ko-KR")} ~ {record.high.toLocaleString("ko-KR")}
                </td>
                <td>{record.actualOpen.toLocaleString("ko-KR")}</td>
                <td>{record.hit ? "✅" : "❌"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
