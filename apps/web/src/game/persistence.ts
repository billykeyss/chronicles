import { initialState } from "./state";
import { ALL_SUBCATEGORY_IDS } from "./data";
import type { GameState } from "./types";

const STORAGE_KEY = "chronicles-game-state-v1";

/**
 * Read the previously persisted game state from localStorage.
 * Returns null if nothing is stored or the payload is incompatible.
 */
export function loadPersistedState(): GameState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (!parsed || typeof parsed !== "object") return null;
    if (
      parsed.status !== "playing" &&
      parsed.status !== "gameover" &&
      parsed.status !== "picking"
    ) {
      return null;
    }
    // Basic structural validation — make sure required fields are present.
    if (
      !Array.isArray(parsed.timeline) ||
      !Array.isArray(parsed.pool) ||
      typeof parsed.score !== "number" ||
      typeof parsed.strikes !== "number"
    ) {
      return null;
    }
    return {
      ...initialState,
      ...parsed,
      // Always reset transient UI state on load.
      lastResult: null,
      hintReveal: null,
      // Guard the legacy fallback in case shape predates this field.
      selectedSubcategories:
        Array.isArray(parsed.selectedSubcategories) &&
        parsed.selectedSubcategories.length > 0
          ? parsed.selectedSubcategories
          : ALL_SUBCATEGORY_IDS,
    } as GameState;
  } catch {
    return null;
  }
}

export function savePersistedState(state: GameState): void {
  if (typeof window === "undefined") return;
  try {
    // Don't persist transient toast/hint state.
    const { lastResult: _lr, hintReveal: _hr, ...rest } = state;
    void _lr;
    void _hr;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch {
    // ignore quota errors
  }
}

export function clearPersistedState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ----------------------------------------------------------------------
// "Recently seen events" tracker — lets us prioritize fresh content across runs.
// ----------------------------------------------------------------------
const SEEN_KEY = "chronicles-seen-events-v1";
const SEEN_MAX = 300;

export function loadSeenEventIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export function recordSeenEventIds(ids: string[]): void {
  if (typeof window === "undefined" || ids.length === 0) return;
  try {
    const existing = loadSeenEventIds();
    // Preserve insertion order so we keep most-recent on overflow.
    const arr = Array.from(existing);
    for (const id of ids) {
      if (!existing.has(id)) {
        arr.push(id);
        existing.add(id);
      }
    }
    const trimmed = arr.slice(-SEEN_MAX);
    localStorage.setItem(SEEN_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore quota
  }
}

export function clearSeenEventIds(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SEEN_KEY);
  } catch {
    // ignore
  }
}
