export const SPIRIT_ORIGIN = "https://insightspiritmarket.com";
export const HEALTH_ORIGIN = "https://insightspirithealth.com";
export const ROTATION_MS = 7000;
export const MONEY_CATEGORY_ID = 9;
export const ARTICLE_REFRESH_MS = 5 * 60 * 1000;
export const ARTICLE_API = `${SPIRIT_ORIGIN}/wp-json/wp/v2/posts?per_page=12&status=publish&orderby=date&order=desc&_embed=wp:featuredmedia&_fields=id,date_gmt,status,link,title,excerpt,meta,_links,_embedded`;

export type SpiritArticle = { id: number; title: string; url: string; date: string; image: string | null; imageWidth: number; imageHeight: number };
export const CHANNELS = [
  { id: "market", label: "마켓", origin: SPIRIT_ORIGIN, url: `${SPIRIT_ORIGIN}/`, query: `categories_exclude=${MONEY_CATEGORY_ID}` },
  { id: "money", label: "돈 되는 소식", origin: SPIRIT_ORIGIN, url: `${SPIRIT_ORIGIN}/category/money-information/`, query: `categories=${MONEY_CATEGORY_ID}` },
  { id: "health", label: "건강", origin: HEALTH_ORIGIN, url: `${HEALTH_ORIGIN}/`, query: "" },
] as const;
export type SpiritChannel = typeof CHANNELS[number] & { articles: SpiritArticle[]; failed: boolean };
export type ChannelEntry = { channel: SpiritChannel; article: SpiritArticle | null };
export const emptyChannels = (): SpiritChannel[] => CHANNELS.map(channel => ({ ...channel, articles: [], failed: false }));
type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === "object" ? value as RecordValue : {};

export function safeSpiritUrl(value: unknown, origin = SPIRIT_ORIGIN): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return [SPIRIT_ORIGIN, HEALTH_ORIGIN].includes(origin) && url.origin === origin && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

// Render only text, never WordPress HTML. Decode the small title entity vocabulary.
export function articleTitle(value: unknown): string {
  if (typeof value !== "string") return "";
  const entities: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", hellip: "…" };
  return value.replace(/<[^>]*>/g, "").replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, key: string) => {
    if (key.startsWith("#")) {
      const code = key[1].toLowerCase() === "x" ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    }
    return entities[key.toLowerCase()] ?? entity;
  }).replace(/\s+/g, " ").trim().slice(0, 220);
}

export function selectSpiritArticles(payload: unknown, now = Date.now(), origin = SPIRIT_ORIGIN): SpiritArticle[] {
  if (!Array.isArray(payload)) throw new Error("Invalid article response");
  const articles: SpiritArticle[] = [];
  const seen = new Set<number>();
  for (const item of payload) {
    const post = record(item);
    const demo = record(post.meta).insight_demo;
    const title = articleTitle(record(post.title).rendered);
    const url = safeSpiritUrl(post.link, origin);
    const date = typeof post.date_gmt === "string" ? `${post.date_gmt.replace(/Z$/, "")}Z` : "";
    if (post.status !== "publish" || demo === true || demo === 1 || demo === "1" || demo === "true" || record(post.excerpt).protected === true || !Number.isSafeInteger(post.id) || Number(post.id) < 1 || seen.has(post.id as number) || !title || !url || !Number.isFinite(Date.parse(date)) || Date.parse(date) > now || /^\[임시글\]/.test(title) || /editorial-preview/.test(url)) continue;
    const mediaList = record(post._embedded)["wp:featuredmedia"];
    const media = record(Array.isArray(mediaList) ? mediaList[0] : null);
    const details = record(media.media_details);
    const medium = record(record(details.sizes).medium);
    const mediumUrl = safeSpiritUrl(medium.source_url, origin);
    const image = mediumUrl ?? safeSpiritUrl(media.source_url, origin);
    const dimensions = mediumUrl ? medium : details;
    const validDimensions = [dimensions.width, dimensions.height].every(value => typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 20000);
    const imageWidth = validDimensions ? dimensions.width as number : 300;
    const imageHeight = validDimensions ? dimensions.height as number : 169;
    seen.add(post.id as number);
    articles.push({ id: post.id as number, title, url, date, image, imageWidth, imageHeight });
  }
  return articles.sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 3);
}

export function channelApi(channel: typeof CHANNELS[number]): string {
  return `${channel.origin}/wp-json/wp/v2/posts?per_page=12&status=publish&orderby=date&order=desc&_embed=wp:featuredmedia&_fields=id,categories,date_gmt,status,link,title,excerpt,meta,_links,_embedded${channel.query ? `&${channel.query}` : ""}`;
}

export function selectChannelArticles(payload: unknown, channel: typeof CHANNELS[number], now = Date.now()): SpiritArticle[] {
  if (!Array.isArray(payload)) throw new Error("Invalid article response");
  const filtered = payload.filter(post => {
    if (channel.id === "health") return true;
    const categories = record(post).categories;
    if (!Array.isArray(categories)) return false;
    return categories.includes(MONEY_CATEGORY_ID) === (channel.id === "money");
  });
  return selectSpiritArticles(filtered, now, channel.origin);
}

export async function fetchSpiritChannels(): Promise<SpiritChannel[]> {
  return Promise.all(CHANNELS.map(async channel => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(channelApi(channel), { credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("Feed unavailable");
      return { ...channel, articles: selectChannelArticles(await response.json(), channel), failed: false };
    } catch { return { ...channel, articles: [], failed: true }; }
    finally { clearTimeout(timeout); }
  }));
}

// Each nonempty topic gets equal mobile exposure even if it has fewer articles.
export function mobileSequence(channels: SpiritChannel[]): ChannelEntry[] {
  const available = channels.filter(channel => channel.articles.length);
  return Array.from({ length: Math.max(0, ...available.map(channel => channel.articles.length)) }, (_, round) =>
    available.map(channel => ({ channel, article: channel.articles[round % channel.articles.length] }))
  ).flat();
}

export function desktopEntries(channels: SpiritChannel[], round: number): ChannelEntry[] {
  return channels.map(channel => ({ channel, article: channel.articles[round % channel.articles.length] || null }));
}

export function articleTrackingUrl(article: SpiritArticle): string {
  const url = new URL(article.url);
  url.searchParams.set("utm_source", "kospipreview");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", "spirit_latest");
  url.searchParams.set("utm_content", String(article.id));
  return url.href;
}

export async function fetchSpiritArticles(): Promise<SpiritArticle[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(ARTICLE_API, { credentials: "omit", cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error(`Article feed ${response.status}`);
    return selectSpiritArticles(await response.json());
  } finally { clearTimeout(timeout); }
}
