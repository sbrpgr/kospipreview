import { afterEach, describe, expect, it, vi } from "vitest";
import { ARTICLE_API, articleTitle, articleTrackingUrl, fetchSpiritArticles, safeSpiritUrl, selectSpiritArticles } from "./spirit-articles";
import { CHANNELS, HEALTH_ORIGIN, MONEY_CATEGORY_ID, ROTATION_MS, channelApi, selectChannelArticles, fetchSpiritChannels, mobileSequence, desktopEntries, emptyChannels } from "./spirit-articles";
const sample = (id = 1) => ({ id, status: "publish", date_gmt: `2026-08-${String(id + 1).padStart(2,"0")}T01:00:00`, link: `https://insightspiritmarket.com/post-${id}/`, title: { rendered: "경제 &amp; 기술 &#8217;" }, excerpt: { protected: false }, meta: { insight_demo: false }, _embedded: { "wp:featuredmedia": [{ media_details: { sizes: { medium: { source_url: "https://insightspiritmarket.com/wp-content/uploads/test.webp" } } } }] } });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe("public Spirit feed", () => {
  it("sorts latest three, deduplicates and accepts any author", () => {
    expect(selectSpiritArticles([sample(1),sample(4),sample(3),sample(2),sample(4)]).map(x=>x.id)).toEqual([4,3,2]);
  });
  it("rejects private, protected, demo, malformed and future entries", () => {
    expect(selectSpiritArticles([{...sample(),status:"draft"},{...sample(),meta:{insight_demo:true}},{...sample(),excerpt:{protected:true}},{...sample(),date_gmt:"2099-01-01T00:00:00"},{...sample(),link:"javascript:alert(1)"},{...sample(),title:{rendered:"[임시글] 시안"}},null])).toEqual([]);
    expect(()=>selectSpiritArticles({message:"blocked"})).toThrow();
  });
  it("uses safe medium image and plain text without HTML injection", () => {
    const article = selectSpiritArticles([sample()])[0];
    expect(article.title).toBe("경제 & 기술 ’");
    expect(article.image).toMatch(/test.webp$/);
    expect(articleTitle('<b>기사</b> &#x110000;')).toBe("기사");
    expect(safeSpiritUrl("https://insightspiritmarket.com.evil.test/a")).toBeNull();
    expect(safeSpiritUrl("http://insightspiritmarket.com/a")).toBeNull();
    expect(safeSpiritUrl("https://user:pass@insightspiritmarket.com/a")).toBeNull();
  });
  it("includes referral attribution", () => {
    expect(articleTrackingUrl(selectSpiritArticles([sample()])[0])).toContain("utm_source=kospipreview&utm_medium=referral&utm_campaign=spirit_latest&utm_content=1");
  });
  it("reserves the selected thumbnail's actual aspect ratio", () => {
    const post = sample();
    Object.assign(post._embedded["wp:featuredmedia"][0].media_details.sizes.medium, { width: 300, height: 188 });
    expect(selectSpiritArticles([post])[0]).toMatchObject({ imageWidth: 300, imageHeight: 188 });
  });
  it("uses original dimensions when the medium image is not usable", () => {
    const post = sample();
    Object.assign(post._embedded["wp:featuredmedia"][0], { source_url: "https://insightspiritmarket.com/original.webp", media_details: { width: 1600, height: 900, sizes: { medium: { source_url: "https://evil.test/image.webp", width: 300, height: 200 } } } });
    expect(selectSpiritArticles([post])[0]).toMatchObject({ image: "https://insightspiritmarket.com/original.webp", imageWidth: 1600, imageHeight: 900 });
  });
  it("falls back safely when image dimensions are missing or malformed", () => {
    expect(selectSpiritArticles([sample()])[0]).toMatchObject({ imageWidth: 300, imageHeight: 169 });
    for (const height of [0, -1, NaN, Infinity, 0.5, 20001, "188"]) {
      const post = sample();
      Object.assign(post._embedded["wp:featuredmedia"][0].media_details.sizes.medium, { width: 300, height });
      expect(selectSpiritArticles([post])[0]).toMatchObject({ imageWidth: 300, imageHeight: 169 });
    }
  });
  it("fetches without credentials and handles HTTP failures", async () => {
    const mock = vi.fn().mockResolvedValue({ok:true,json:async()=>[sample()]}); vi.stubGlobal("fetch",mock);
    expect(await fetchSpiritArticles()).toHaveLength(1);
    expect(mock).toHaveBeenCalledWith(ARTICLE_API,expect.objectContaining({credentials:"omit",signal:expect.any(AbortSignal)}));
    mock.mockResolvedValue({ok:false,status:503}); await expect(fetchSpiritArticles()).rejects.toThrow("503");
  });
  it("aborts stalled requests after eight seconds", async () => {
    vi.useFakeTimers(); vi.stubGlobal("fetch",vi.fn((_url, options)=>new Promise((_resolve,reject)=>options.signal.addEventListener("abort",()=>reject(new Error("timeout"))))));
    const result = expect(fetchSpiritArticles()).rejects.toThrow("timeout");
    await vi.advanceTimersByTimeAsync(8000); await result;
  });
});

describe("three-topic rotation", () => {
  const market = CHANNELS[0], money = CHANNELS[1], health = CHANNELS[2];
  const ordinary = { ...sample(1), categories: [5] };
  const benefit = { ...sample(2), categories: [5, MONEY_CATEGORY_ID] };
  it("separates money from market even with overlapping category assignments", () => {
    expect(selectChannelArticles([ordinary, benefit], market).map(x => x.id)).toEqual([1]);
    expect(selectChannelArticles([ordinary, benefit], money).map(x => x.id)).toEqual([2]);
    expect(channelApi(market)).toContain("categories_exclude=9");
    expect(channelApi(money)).toContain("&categories=9");
    expect(selectChannelArticles([sample()], money)).toEqual([]);
  });
  it("allows only the expected origin per topic, including images and matching IDs", () => {
    const healthPost = { ...ordinary, link: `${HEALTH_ORIGIN}/health/` };
    expect(selectChannelArticles([healthPost], health)[0]).toMatchObject({ id: 1, image: null });
    expect(selectChannelArticles([healthPost], market)).toEqual([]);
    expect(selectChannelArticles([ordinary], health)).toEqual([]);
    expect(articleTrackingUrl(selectChannelArticles([healthPost], health)[0])).toContain(HEALTH_ORIGIN);
  });
  it("keeps three fixed desktop topics and skips empty mobile topics", () => {
    const channels = emptyChannels();
    channels[0].articles = selectSpiritArticles([sample(1), sample(2), sample(3)]);
    channels[2].articles = [channels[0].articles[0]];
    expect(desktopEntries(channels, 1).map(x => x.channel.id)).toEqual(["market", "money", "health"]);
    expect(desktopEntries(channels, 1)[1].article).toBeNull();
    expect(mobileSequence(channels).map(x => x.channel.id)).toEqual(["market", "health", "market", "health", "market", "health"]);
    channels[1].articles = [channels[0].articles[0]];
    expect(mobileSequence(channels).map(x => x.channel.id)).toEqual(["market", "money", "health", "market", "money", "health", "market", "money", "health"]);
    expect(mobileSequence(emptyChannels())).toEqual([]);
    expect(ROTATION_MS).toBe(7000);
  });
  it("one failed feed does not erase the other topics", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("categories=9")) throw new Error("offline");
      return { ok: true, json: async () => url.startsWith(HEALTH_ORIGIN) ? [{...ordinary, link:`${HEALTH_ORIGIN}/health/`}] : [ordinary] };
    }));
    const channels = await fetchSpiritChannels();
    expect(channels.map(x => x.articles.length)).toEqual([1, 0, 1]);
    expect(channels.map(x => x.failed)).toEqual([false, true, false]);
  });
});
