const GIPHY_HOST = /^(media\d*\.giphy\.com|i\.giphy\.com)$/i;
const SEARCH = "https://api.giphy.com/v1/gifs/search";
const TRENDING = "https://api.giphy.com/v1/gifs/trending";
const LIMIT = 24;
const RATING = "pg-13";
const ALLOWED_LANGS = new Set(["en", "es", "fr"]);

export function isGiphyMediaUrl(raw) {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && GIPHY_HOST.test(url.hostname);
  } catch {
    return false;
  }
}

export function mapGiphyItems(items) {
  if (!Array.isArray(items)) return [];
  const hits = [];
  for (const item of items) {
    const hit = mapGiphyItem(item);
    if (hit) hits.push(hit);
  }
  return hits;
}

export function normalizeGiphyLang(lang) {
  return ALLOWED_LANGS.has(lang) ? lang : "fr";
}

export async function runGifSearch({ query, lang, apiKey }) {
  if (!apiKey) {
    return {
      status: 503,
      body: {
        error: {
          code: "giphy-unconfigured",
          message: "GIF search is not configured."
        }
      }
    };
  }

  try {
    const gifs = await fetchGiphyGifs(query, normalizeGiphyLang(lang), apiKey);
    return { status: 200, body: { gifs } };
  } catch {
    return {
      status: 502,
      body: { error: { code: "giphy-failed", message: "Could not load GIFs." } }
    };
  }
}

async function fetchGiphyGifs(query, lang, apiKey) {
  const q = String(query || "")
    .trim()
    .slice(0, 50);
  const url = new URL(q ? SEARCH : TRENDING);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("limit", String(LIMIT));
  url.searchParams.set("rating", RATING);
  url.searchParams.set("lang", lang);
  if (q) url.searchParams.set("q", q);

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error("giphy_failed");
  const body = await res.json();
  return mapGiphyItems(body.data);
}

function mapGiphyItem(item) {
  if (!item || typeof item !== "object") return null;
  if (
    typeof item.id !== "string" ||
    item.id.length === 0 ||
    item.id.length > 64
  ) {
    return null;
  }
  const images = item.images;
  if (!images || typeof images !== "object") return null;
  const previewUrl =
    pickImageUrl(images.fixed_height_small) ||
    pickImageUrl(images.fixed_height);
  const url =
    pickImageUrl(images.fixed_height) ||
    pickImageUrl(images.fixed_height_small);
  if (!previewUrl || !url) return null;
  const title = typeof item.title === "string" ? item.title.slice(0, 120) : "";
  return { id: item.id, title, previewUrl, url };
}

function pickImageUrl(image) {
  if (!image || typeof image !== "object") return null;
  for (const key of ["webp", "url"]) {
    const val = image[key];
    if (typeof val === "string" && isGiphyMediaUrl(val)) return val;
  }
  return null;
}
