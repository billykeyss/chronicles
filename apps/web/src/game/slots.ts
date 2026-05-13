import type { PlacedEvent } from "./types";

/**
 * Slot indices in [0, timeline.length] that are valid placements for `year`.
 * A slot i sits between timeline[i-1] and timeline[i]. Bounds are inclusive
 * so ties are treated as either side being correct.
 */
export function getCorrectSlotIndices(
  timeline: PlacedEvent[],
  year: number,
): number[] {
  const indices: number[] = [];
  for (let i = 0; i <= timeline.length; i++) {
    const left = timeline[i - 1]?.year;
    const right = timeline[i]?.year;
    const leftOk = left === undefined || left <= year;
    const rightOk = right === undefined || year <= right;
    if (leftOk && rightOk) indices.push(i);
  }
  return indices;
}

/** Insert event at the lowest correct slot so the timeline stays sorted. */
export function insertSorted(
  timeline: PlacedEvent[],
  event: PlacedEvent,
): PlacedEvent[] {
  const idx = getCorrectSlotIndices(timeline, event.year)[0] ?? timeline.length;
  return [...timeline.slice(0, idx), event, ...timeline.slice(idx)];
}
