import type { CategoryId, TimelineEvent } from "@/game/types";

const ENDPOINT = "https://query.wikidata.org/sparql";
const STORAGE_PREFIX = "chronicles-wd-v1:";
const STORAGE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const QUERY_TIMEOUT_MS = 12_000;

export type SparqlEvent = {
  /** Wikidata QID (without the http prefix), e.g. "Q42" */
  qid: string;
  title: string;
  year: number;
  /** Wikipedia URL on en.wikipedia.org */
  wikipediaUrl: string;
};

type Cell = { type: string; value: string };
type SparqlResponse = {
  results: { bindings: Array<Record<string, Cell>> };
};

function qidFromUri(uri: string): string {
  return uri.replace(/^.*\//, "");
}

function readCache(key: string): SparqlEvent[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: SparqlEvent[] };
    if (!parsed || typeof parsed.at !== "number") return null;
    if (Date.now() - parsed.at > STORAGE_TTL_MS) {
      localStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(key: string, data: SparqlEvent[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_PREFIX + key,
      JSON.stringify({ at: Date.now(), data }),
    );
  } catch {
    // ignore quota
  }
}

/**
 * Run a SPARQL query against the Wikidata Query Service.
 * Returns parsed event rows; null on failure (network, timeout, malformed).
 */
export async function runSparql(
  cacheKey: string,
  query: string,
  signal?: AbortSignal,
): Promise<SparqlEvent[] | null> {
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const ctrl = new AbortController();
  const localSignal = signal
    ? // Forward upstream abort
      (signal.addEventListener("abort", () => ctrl.abort()), ctrl.signal)
    : ctrl.signal;
  const timeoutId = window.setTimeout(() => ctrl.abort(), QUERY_TIMEOUT_MS);

  try {
    const url = `${ENDPOINT}?format=json&query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      signal: localSignal,
      headers: { accept: "application/sparql-results+json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as SparqlResponse;
    const out: SparqlEvent[] = [];
    const seen = new Set<string>();
    for (const row of json.results.bindings) {
      const itemUri = row.item?.value;
      const label = row.itemLabel?.value;
      const yearStr = row.year?.value;
      const article = row.article?.value;
      if (!itemUri || !label || !yearStr || !article) continue;
      const year = Number.parseInt(yearStr, 10);
      if (!Number.isFinite(year)) continue;
      // Skip raw QID labels (when the label service can't find an English label)
      if (/^Q\d+$/.test(label)) continue;
      const qid = qidFromUri(itemUri);
      if (seen.has(qid)) continue;
      seen.add(qid);
      out.push({ qid, title: label, year, wikipediaUrl: article });
    }
    writeCache(cacheKey, out);
    return out;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Turn a Wikipedia URL into the page title (slug).
 * e.g., "https://en.wikipedia.org/wiki/Citizen_Kane" → "Citizen Kane"
 */
function articleToTitle(url: string): string {
  const slug = url.replace(/^https?:\/\/en\.wikipedia\.org\/wiki\//, "");
  return decodeURIComponent(slug).replace(/_/g, " ");
}

/**
 * Adapt a SparqlEvent into our TimelineEvent shape so the game treats them
 * the same as bundled events.
 */
export function sparqlToTimelineEvent(
  ev: SparqlEvent,
  category: CategoryId,
  subcategoryIds: string[],
): TimelineEvent {
  const wikiTitle = articleToTitle(ev.wikipediaUrl);
  return {
    id: `wd-${ev.qid}`,
    title: ev.title,
    year: ev.year,
    category,
    subcategories: subcategoryIds,
    related: "",
    wikipediaTitle: wikiTitle,
  };
}
