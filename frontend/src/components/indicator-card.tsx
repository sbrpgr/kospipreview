import { formatDateTime, formatSignedPercent } from "@/lib/format";

type IndicatorCardProps = {
  label: string;
  value: string;
  changePct: number;
  updatedAt: string;
  emphasized?: boolean;
};

export function IndicatorCard({
  label,
  value,
  changePct,
  updatedAt,
  emphasized = false,
}: IndicatorCardProps) {
  const directionClass = changePct >= 0 ? "isPositive" : "isNegative";

  return (
    <article className={`indicatorCard ${emphasized ? "isPrimary" : ""}`}>
      <div className="indicatorLabel">{label}</div>
      <div className="indicatorValue">{value}</div>
      <div className={`indicatorChange ${directionClass}`}>
        {changePct >= 0 ? "▲" : "▼"} {formatSignedPercent(changePct)}
      </div>
      <div className="indicatorUpdated">{formatDateTime(updatedAt)}</div>
    </article>
  );
}
