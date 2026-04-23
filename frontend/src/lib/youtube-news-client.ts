import { getYoutubeNewsClientUrl, getYoutubeNewsStaticUrl } from "@/lib/data-paths";
import type { YoutubeNewsIndex } from "@/lib/youtube-news-types";

const SIGNIFICANT_COUNT_DROP = 2;
const ALLOW_NEWER_DROP_MINUTES = 15;

function parseGeneratedTime(value: string | undefined): number {
  if (!value) {
    return Number.NaN;
  }

  const parsed = new Date(value).getTime();
  if (!Number.isNaN(parsed)) {
    return parsed;
  }

  return Number.NaN;
}

function pickLatestIndex(
  primary: YoutubeNewsIndex,
  fallback: YoutubeNewsIndex,
  previous?: YoutubeNewsIndex,
): YoutubeNewsIndex {
  const primaryItems = Array.isArray(primary.latestItems) ? primary.latestItems.length : 0;
  const fallbackItems = Array.isArray(fallback.latestItems) ? fallback.latestItems.length : 0;
  const countGap = Math.abs(primaryItems - fallbackItems);

  if (primaryItems === 0) {
    return fallback;
  }

  if (fallbackItems === 0) {
    return primary;
  }

  const primaryGeneratedAt = parseGeneratedTime(primary.generatedAt);
  const fallbackGeneratedAt = parseGeneratedTime(fallback.generatedAt);
  if (
    !Number.isNaN(primaryGeneratedAt) &&
    !Number.isNaN(fallbackGeneratedAt) &&
    primaryGeneratedAt !== fallbackGeneratedAt
  ) {
    return primaryGeneratedAt > fallbackGeneratedAt ? primary : fallback;
  }

  if (countGap >= 3) {
    const selectedByCount = primaryItems > fallbackItems ? primary : fallback;
    const selectedByCountItems = selectedByCount === primary ? primaryItems : fallbackItems;
    const alternateByCount = selectedByCount === primary ? fallback : primary;
    const alternateByCountItems = alternateByCount === primary ? primaryItems : fallbackItems;

    if (
      shouldAvoidRollback(selectedByCount, alternateByCount, previous, selectedByCountItems, alternateByCountItems)
    ) {
      return alternateByCount;
    }

    return selectedByCount;
  }

  if (Number.isNaN(primaryGeneratedAt) && Number.isNaN(fallbackGeneratedAt)) {
    return primary;
  }

  if (Number.isNaN(primaryGeneratedAt)) {
    return fallback;
  }

  if (Number.isNaN(fallbackGeneratedAt)) {
    return primary;
  }

  if (fallbackGeneratedAt > primaryGeneratedAt) {
    return fallback;
  }

  if (fallbackGeneratedAt === primaryGeneratedAt && fallbackItems > primaryItems) {
    return fallback;
  }

  return fallbackGeneratedAt >= primaryGeneratedAt ? fallback : primary;
}

function shouldAvoidRollback(
  candidate: YoutubeNewsIndex,
  fallback: YoutubeNewsIndex,
  previous: YoutubeNewsIndex | undefined,
  candidateItemCount: number,
  fallbackItemCount: number,
): boolean {
  if (!previous) {
    return false;
  }

  const previousItemCount = Array.isArray(previous.latestItems) ? previous.latestItems.length : 0;
  const candidateGeneratedAt = parseGeneratedTime(candidate.generatedAt);
  const fallbackGeneratedAt = parseGeneratedTime(fallback.generatedAt);
  const previousGeneratedAt = parseGeneratedTime(previous.generatedAt);

  const drop = previousItemCount - candidateItemCount;
  if (drop < SIGNIFICANT_COUNT_DROP || previousItemCount === 0) {
    return false;
  }

  if (Number.isNaN(previousGeneratedAt)) {
    return true;
  }

  if (!Number.isNaN(candidateGeneratedAt) && candidateGeneratedAt - previousGeneratedAt > ALLOW_NEWER_DROP_MINUTES * 60 * 1000) {
    return false;
  }

  if (!Number.isNaN(fallbackGeneratedAt) && fallbackItemCount > candidateItemCount + SIGNIFICANT_COUNT_DROP) {
    return true;
  }

  return previousItemCount > candidateItemCount;
}

export async function fetchYoutubeNewsIndex(previous?: YoutubeNewsIndex): Promise<YoutubeNewsIndex> {
  const primaryUrl = getYoutubeNewsClientUrl();
  const fallbackUrl = getYoutubeNewsStaticUrl();

  const fetchOptions = {
    cache: "no-store" as RequestCache,
    headers: {
      pragma: "no-cache",
      "cache-control": "no-cache",
    },
  };

  let primaryResponse = await fetch(primaryUrl, fetchOptions);
  if (!primaryResponse.ok) {
    const fallbackResponse = await fetch(fallbackUrl, fetchOptions);
    if (!fallbackResponse.ok) {
      throw new Error(`Failed to fetch ${primaryUrl}`);
    }

    const fallbackIndex = (await fallbackResponse.json()) as YoutubeNewsIndex;
    return previous ? pickLatestIndex(previous, fallbackIndex, previous) : fallbackIndex;
  }

  let fallbackResponse: Response | null = null;
  try {
    fallbackResponse = await fetch(fallbackUrl, fetchOptions);
  } catch {
    fallbackResponse = null;
  }

  if (!fallbackResponse || !fallbackResponse.ok) {
    const primaryIndex = (await primaryResponse.json()) as YoutubeNewsIndex;
    return previous ? pickLatestIndex(primaryIndex, previous, previous) : primaryIndex;
  }

  const primaryIndex = (await primaryResponse.json()) as YoutubeNewsIndex;
  const fallbackIndex = (await fallbackResponse.json()) as YoutubeNewsIndex;
  return pickLatestIndex(primaryIndex, fallbackIndex, previous);
}
