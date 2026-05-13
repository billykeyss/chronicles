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
    if (parsed.status !== "playing" && parsed.status !== "gameover" && parsed.status !== "picking") {
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
        Array.isArray(parsed.selectedSubcategories) && parsed.selectedSubcategories.length > 0
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
