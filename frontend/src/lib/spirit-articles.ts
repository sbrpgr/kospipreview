export const SPIRIT_ORIGIN = "https://insightspiritmarket.com";
export const ARTICLE_REFRESH_MS = 5 * 60 * 1000;
export const ARTICLE_API = `${SPIRIT_ORIGIN}/wp-json/wp/v2/posts?per_page=12&status=publish&orderby=date&order=desc&_embed=wp:featuredmedia&_fields=id,date_gmt,status,link,title,excerpt,meta,_links,_embedded`;

export type SpiritArticle = { id: number; title: string; url: string; date: string; image: string | null; imageWidth: number; imageHeight: number };
type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === "object" ? value as RecordValue : {};

export function safeSpiritUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.origin === SPIRIT_ORIGIN && !url.username && !url.password ? url.href : null;
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

export function selectSpiritArticles(payload: unknown, now = Date.now()): SpiritArticle[] {
  if (!Array.isArray(payload)) throw new Error("Invalid article response");
  const articles: SpiritArticle[] = [];
  const seen = new Set<number>();
  for (const item of payload) {
    const post = record(item);
    const demo = record(post.meta).insight_demo;
    const title = articleTitle(record(post.title).rendered);
    const url = safeSpiritUrl(post.link);
    const date = typeof post.date_gmt === "string" ? `${post.date_gmt.replace(/Z$/, "")}Z` : "";
    if (post.status !== "publish" || demo === true || demo === 1 || demo === "1" || record(post.excerpt).protected === true || !Number.isInteger(post.id) || seen.has(post.id as number) || !title || !url || !Number.isFinite(Date.parse(date)) || Date.parse(date) > now || /^\[임시글\]/.test(title)) continue;
    const mediaList = record(post._embedded)["wp:featuredmedia"];
    const media = record(Array.isArray(mediaList) ? mediaList[0] : null);
    const details = record(media.media_details);
    const medium = record(record(details.sizes).medium);
    const mediumUrl = safeSpiritUrl(medium.source_url);
    const image = mediumUrl ?? safeSpiritUrl(media.source_url);
    const dimensions = mediumUrl ? medium : details;
    const validDimensions = [dimensions.width, dimensions.height].every(value => typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 20000);
    const imageWidth = validDimensions ? dimensions.width as number : 300;
    const imageHeight = validDimensions ? dimensions.height as number : 169;
    seen.add(post.id as number);
    articles.push({ id: post.id as number, title, url, date, image, imageWidth, imageHeight });
  }
  return articles.sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 3);
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
