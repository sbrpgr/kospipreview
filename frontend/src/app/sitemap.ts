import type { MetadataRoute } from "next";
import { toAbsoluteUrl } from "@/lib/seo";

const ROUTES = [
  { path: "/", changeFrequency: "hourly" as const, priority: 1.0 },
  { path: "/history", changeFrequency: "daily" as const, priority: 0.9 },
  { path: "/research", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/research/model-in-volatile-markets", changeFrequency: "monthly" as const, priority: 0.85 },
  { path: "/research/reading-the-prediction-band", changeFrequency: "monthly" as const, priority: 0.85 },
  { path: "/research/ewy-krw-core-signals", changeFrequency: "monthly" as const, priority: 0.85 },
  { path: "/research/direction-accuracy-vs-coin-flip", changeFrequency: "monthly" as const, priority: 0.82 },
  { path: "/research/residual-model-auto-disable", changeFrequency: "monthly" as const, priority: 0.82 },
  { path: "/research/rolling-ridge-reestimation", changeFrequency: "monthly" as const, priority: 0.82 },
  { path: "/research/trend-follow-floor-explained", changeFrequency: "monthly" as const, priority: 0.82 },
  { path: "/research/april-10-tariff-pause-case", changeFrequency: "monthly" as const, priority: 0.82 },
  { path: "/research/april-recovery-underestimation", changeFrequency: "monthly" as const, priority: 0.82 },
  { path: "/research/april-27-may-4-consecutive-hit", changeFrequency: "monthly" as const, priority: 0.82 },
  { path: "/research/ewy-up-kospi-down-divergence", changeFrequency: "monthly" as const, priority: 0.82 },
  { path: "/research/sox-and-kospi-opening", changeFrequency: "monthly" as const, priority: 0.82 },
  { path: "/research/vix-thresholds-and-volatility", changeFrequency: "monthly" as const, priority: 0.82 },
  { path: "/research/night-futures-vs-model-comparison", changeFrequency: "monthly" as const, priority: 0.82 },
  { path: "/research/usdkrw-regime-and-model", changeFrequency: "monthly" as const, priority: 0.82 },
  { path: "/research/kospi-simultaneous-quote-mechanism", changeFrequency: "monthly" as const, priority: 0.82 },
  { path: "/research/information-timeline-1530-to-0900", changeFrequency: "monthly" as const, priority: 0.82 },
  { path: "/research/opening-gap-conditions", changeFrequency: "monthly" as const, priority: 0.82 },
  { path: "/research/three-numbers-together", changeFrequency: "monthly" as const, priority: 0.82 },
  { path: "/research/five-principles-for-using-forecast", changeFrequency: "monthly" as const, priority: 0.82 },
  { path: "/papers", changeFrequency: "monthly" as const, priority: 0.88 },
  { path: "/papers/oil-fx-ewy-kospi-model", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/regime-dependent-accuracy", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/signal-convergence-index", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/opening-gap-asymmetry", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/ewy-time-varying-coefficient", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/total-signal-failure-days", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/multilayer-prediction-architecture", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/night-futures-signal-limitations", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/kospi-24h-tracking-indicators", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/prediction-alert-score-design", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/opening-gap-mean-reversion", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/krw-regime-ewy-coefficient-shift", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/simultaneous-quote-information-asymmetry", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/us10y-nonlinear-impact-on-kospi", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/dynamic-band-width-mae30d-adjustment", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/additional-indices-for-kospi-prediction", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/intraday-pattern-impact-on-next-opening", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/overnight-kospi-synthetic-index", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/prediction-accuracy-extreme-regime-analysis", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/kospi-gap-event-taxonomy", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/papers/kospi-predictability-ceiling-information-entropy", changeFrequency: "monthly" as const, priority: 0.84 },
  { path: "/about", changeFrequency: "weekly" as const, priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.75 },
  { path: "/quant-calculator", changeFrequency: "weekly" as const, priority: 0.75 },
  { path: "/terms", changeFrequency: "monthly" as const, priority: 0.7 },
  { path: "/privacy", changeFrequency: "monthly" as const, priority: 0.65 },
  { path: "/disclaimer", changeFrequency: "monthly" as const, priority: 0.65 },
] as const;

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((route) => ({
    url: toAbsoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

