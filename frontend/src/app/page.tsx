import { LiveDashboard } from "@/components/live-dashboard";
import {
  getDataFreshness,
  getHistoryData,
  getIndicatorData,
  getPredictionData,
} from "@/lib/data";

export default async function Home() {
  const [prediction, indicators, history, freshness] = await Promise.all([
    getPredictionData(),
    getIndicatorData(),
    getHistoryData(),
    getDataFreshness(),
  ]);

  return (
    <LiveDashboard
      initialPrediction={prediction}
      initialIndicators={indicators}
      initialHistory={history}
      initialFreshness={freshness}
    />
  );
}
