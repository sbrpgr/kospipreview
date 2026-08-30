import { afterEach, describe, expect, it, vi } from "vitest";
import { ARTICLE_API, articleTitle, articleTrackingUrl, fetchSpiritArticles, safeSpiritUrl, selectSpiritArticles } from "./spirit-articles";
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
