export function formatSignedPercent(value: number) {
  const formatted = `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
  return value > 0 ? formatted : value < 0 ? formatted : "0.00%";
}

export function formatSignedNumber(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
