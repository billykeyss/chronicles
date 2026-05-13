export type WikipediaSummary = {
  title: string;
  displayTitle: string;
  extract: string;
  url: string;
  thumbnail?: { url: string; width: number; height: number };
  original?: { url: string; width: number; height: number };
};

const SUMMARY_BASE = "https://en.wikipedia.org/api/rest_v1/page/summary/";
const STORAGE_PREFIX = "chronicles-summary-v1:";
const STORAGE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// Fast in-memory cache (this session only).
const memoryCache = new Map<string, WikipediaSummary | null>();

export function wikipediaPageUrl(title: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;
}

function readStorage(title: string): WikipediaSummary | null | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + title);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as {
      at: number;
      data: WikipediaSummary | null;
    };
    if (!parsed || typeof parsed.at !== "number") return undefined;
    if (Date.now() - parsed.at > STORAGE_TTL_MS) {
      localStorage.removeItem(STORAGE_PREFIX + title);
      return undefined;
    }
    return parsed.data;
  } catch {
    return undefined;
  }
}

function writeStorage(title: string, data: WikipediaSummary | null): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_PREFIX + title,
      JSON.stringify({ at: Date.now(), data }),
    );
  } catch {
    // ignore quota / disabled storage errors
  }
}

export async function fetchWikipediaSummary(
  title: string,
  signal?: AbortSignal,
): Promise<WikipediaSummary | null> {
  // 1. In-memory cache (fastest)
  if (memoryCache.has(title)) {
    return memoryCache.get(title) ?? null;
  }
  // 2. localStorage cache (cross-session)
  const stored = readStorage(title);
  if (stored !== undefined) {
    memoryCache.set(title, stored);
    return stored;
  }
  // 3. Network
  try {
    const url = `${SUMMARY_BASE}${encodeURIComponent(title.replace(/ /g, "_"))}`;
    const res = await fetch(url, {
      signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      memoryCache.set(title, null);
      writeStorage(title, null);
      return null;
    }
    const data = (await res.json()) as {
      type?: string;
      title: string;
      displaytitle?: string;
      extract?: string;
      content_urls?: { desktop?: { page?: string } };
      thumbnail?: { source: string; width: number; height: number };
      originalimage?: { source: string; width: number; height: number };
    };
    if (data.type === "disambiguation" || !data.extract) {
      memoryCache.set(title, null);
      writeStorage(title, null);
      return null;
    }
    const summary: WikipediaSummary = {
      title: data.title,
      displayTitle: data.displaytitle ?? data.title,
      extract: data.extract,
      url: data.content_urls?.desktop?.page ?? wikipediaPageUrl(data.title),
      thumbnail: data.thumbnail
        ? {
            url: data.thumbnail.source,
            width: data.thumbnail.width,
            height: data.thumbnail.height,
          }
        : undefined,
      original: data.originalimage
        ? {
            url: data.originalimage.source,
            width: data.originalimage.width,
            height: data.originalimage.height,
          }
        : undefined,
    };
    memoryCache.set(title, summary);
    writeStorage(title, summary);
    return summary;
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") throw err;
    memoryCache.set(title, null);
    return null;
  }
}

/** Force the browser to download an image so the rendered card is instant. */
export function preloadImage(url: string): void {
  if (typeof window === "undefined") return;
  const img = new window.Image();
  img.src = url;
}

export function firstSentence(text: string): string {
  const m = text.match(/^.*?[.!?](\s|$)/);
  return m ? m[0].trim() : text.slice(0, 220);
}

export function redactYear(text: string, year: number): string {
  const decade = `${Math.floor(year / 10)}0s`;
  return text
    .replace(new RegExp(`\\b${year}\\b`, "g"), "????")
    .replace(new RegExp(`\\b${decade}\\b`, "g"), "????s");
}
