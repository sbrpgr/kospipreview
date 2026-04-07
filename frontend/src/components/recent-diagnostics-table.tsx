import type { BacktestDiagnosticsData } from "@/lib/data";

type RecentDiagnosticsTableProps = {
  diagnostics: BacktestDiagnosticsData;
};

export function RecentDiagnosticsTable({ diagnostics }: RecentDiagnosticsTableProps) {
  return (
    <section className="sectionCard">
      <div className="sectionHeader">
        <div>
          <p className="sectionEyebrow">최근 30일</p>
          <h2>예측 오차 진단</h2>
        </div>
      </div>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>날짜</th>
              <th>예측 시초가</th>
              <th>실제 시초가</th>
              <th>오차</th>
              <th>밴드</th>
              <th>적중</th>
            </tr>
          </thead>
          <tbody>
            {diagnostics.recent30Diagnostics.map((record) => (
              <tr key={record.date}>
                <td>{record.date}</td>
                <td>{record.predOpen.toLocaleString("ko-KR")}</td>
                <td>{record.actualOpen.toLocaleString("ko-KR")}</td>
                <td className={record.error > 0 ? "isPositive" : record.error < 0 ? "isNegative" : ""}>
                  {record.error > 0 ? "+" : ""}
                  {record.error.toLocaleString("ko-KR")}
                </td>
                <td>
                  {record.bandLow.toLocaleString("ko-KR")} ~ {record.bandHigh.toLocaleString("ko-KR")}
                </td>
                <td>{record.hit ? "✅" : "❌"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
