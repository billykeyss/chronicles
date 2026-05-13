import { CATEGORIES } from "@/game/data";
import type { CategoryId, TimelineEvent } from "@/game/types";
import { CATEGORY_QUERIES } from "./queries";
import { runSparql, sparqlToTimelineEvent } from "./sparql";

/**
 * For a given top-level category, fetch live events from Wikidata.
 * Returns null if the query failed (caller can fall back to bundled).
 */
export async function fetchLiveEventsForCategory(
  category: CategoryId,
  signal?: AbortSignal,
): Promise<TimelineEvent[] | null> {
  const query = CATEGORY_QUERIES[category];
  if (!query) return null;
  const rows = await runSparql(`cat:${category}`, query, signal);
  if (!rows) return null;
  const subIds =
    CATEGORIES.find((c) => c.id === category)?.subcategories.map((s) => s.id) ??
    [];
  return rows.map((row) => sparqlToTimelineEvent(row, category, subIds));
}

/**
 * Fetch live events for many categories in parallel. Categories whose query
 * fails are silently skipped — the returned pool is the union of successful
 * ones.
 */
export async function fetchLiveEventsForCategories(
  categories: CategoryId[],
  signal?: AbortSignal,
): Promise<TimelineEvent[]> {
  const results = await Promise.all(
    categories.map((c) => fetchLiveEventsForCategory(c, signal).catch(() => null)),
  );
  const flat: TimelineEvent[] = [];
  for (const r of results) {
    if (r) flat.push(...r);
  }
  return flat;
}
