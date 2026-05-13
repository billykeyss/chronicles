import {
  ALL_SUBCATEGORY_IDS,
  CATEGORIES,
  getEventsForSubcategories,
  SUBCATEGORY_BY_ID,
} from "./data";
import { scoreRound } from "./scoring";
import { getCorrectSlotIndices, insertSorted } from "./slots";
import {
  DIFFICULTY_GAP,
  HINTS_PER_GAME,
  STRIKES_MAX,
  type CategoryId,
  type Difficulty,
  type GameState,
  type HintReveal,
  type HintType,
  type PlacedEvent,
  type TimelineEvent,
} from "./types";

export type GameAction =
  | { type: "toggle-subcategory"; subcategory: string }
  | { type: "set-subcategories"; subcategories: string[] }
  | { type: "toggle-category-all"; category: CategoryId }
  | { type: "set-difficulty"; difficulty: Difficulty }
  | { type: "start-game"; events?: TimelineEvent[] }
  | { type: "extend-pool"; events: TimelineEvent[] }
  | { type: "restore"; state: GameState }
  | { type: "place"; slotIndex: number }
  | { type: "next-card" }
  | { type: "use-hint"; hintType: HintType; relatedSentence?: string }
  | { type: "restart" };

export const initialState: GameState = {
  status: "picking",
  difficulty: "medium",
  selectedSubcategories: ALL_SUBCATEGORY_IDS,
  pool: [],
  timeline: [],
  current: null,
  strikes: 0,
  hintsRemaining: HINTS_PER_GAME,
  hintUsedOnCurrent: null,
  hintReveal: null,
  score: 0,
  streak: 0,
  bestStreak: 0,
  placements: 0,
  correctPlacements: 0,
  lastResult: null,
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Draw the first card in `pool` whose year is at least `minGap` years away
 * from EVERY year in `placedYears`. Falls back to drawing the next card if no
 * candidate satisfies the gap (pool effectively exhausted at this difficulty).
 */
function drawCard(
  pool: TimelineEvent[],
  placedYears: number[],
  minGap: number,
): { drawn: TimelineEvent | null; rest: TimelineEvent[] } {
  if (pool.length === 0) return { drawn: null, rest: [] };
  if (placedYears.length === 0 || minGap <= 0) {
    const [drawn, ...rest] = pool;
    return { drawn, rest };
  }
  const idx = pool.findIndex((ev) =>
    placedYears.every((y) => Math.abs(ev.year - y) >= minGap),
  );
  if (idx === -1) return { drawn: null, rest: pool };
  const drawn = pool[idx];
  const rest = [...pool.slice(0, idx), ...pool.slice(idx + 1)];
  return { drawn, rest };
}

function formatYear(y: number): string {
  if (y >= 0) return String(y);
  return `${Math.abs(y)} BC`;
}

function buildHintReveal(
  hintType: HintType,
  event: TimelineEvent,
  correctSlotIndices: number[],
  relatedSentence?: string,
): HintReveal {
  if (hintType === "decade") {
    const decadeStart = Math.floor(event.year / 10) * 10;
    const decadeLabel =
      decadeStart >= 0
        ? `${decadeStart}s`
        : `${Math.abs(decadeStart)}s BC`;
    return {
      type: hintType,
      content: `This is from the ${decadeLabel}.`,
      correctSlotIndices,
    };
  }
  if (hintType === "answer") {
    return {
      type: hintType,
      content: `This event is from ${formatYear(event.year)}. The highlighted slot is correct.`,
      correctSlotIndices,
    };
  }
  return {
    type: hintType,
    content: relatedSentence ?? event.related,
    correctSlotIndices,
  };
}

function subcategoriesIn(category: CategoryId): string[] {
  const cat = CATEGORIES.find((c) => c.id === category);
  return cat ? cat.subcategories.map((s) => s.id) : [];
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "toggle-subcategory": {
      const has = state.selectedSubcategories.includes(action.subcategory);
      const next = has
        ? state.selectedSubcategories.filter((s) => s !== action.subcategory)
        : [...state.selectedSubcategories, action.subcategory];
      return { ...state, selectedSubcategories: next };
    }

    case "set-subcategories": {
      return { ...state, selectedSubcategories: action.subcategories };
    }

    case "toggle-category-all": {
      const subs = subcategoriesIn(action.category);
      const subSet = new Set(state.selectedSubcategories);
      const allSelected = subs.every((s) => subSet.has(s));
      if (allSelected) {
        // deselect all
        for (const s of subs) subSet.delete(s);
      } else {
        // select all
        for (const s of subs) subSet.add(s);
      }
      return { ...state, selectedSubcategories: Array.from(subSet) };
    }

    case "set-difficulty": {
      return { ...state, difficulty: action.difficulty };
    }

    case "start-game": {
      const events =
        action.events && action.events.length > 0
          ? action.events
          : getEventsForSubcategories(state.selectedSubcategories);
      const shuffled = shuffle(events);
      if (shuffled.length < 2) return state;
      const minGap = DIFFICULTY_GAP[state.difficulty];
      const [anchor, ...rest] = shuffled;
      const anchorPlaced: PlacedEvent = {
        ...anchor,
        correct: true,
        hintUsed: null,
      };
      const drawNext = drawCard(rest, [anchor.year], minGap);
      // If no gap-compatible second card exists, fall back to first card (avoid soft-lock).
      const nextCard = drawNext.drawn ?? rest[0] ?? null;
      const remaining = drawNext.drawn ? drawNext.rest : rest.slice(1);
      return {
        ...initialState,
        status: "playing",
        difficulty: state.difficulty,
        selectedSubcategories: state.selectedSubcategories,
        timeline: [anchorPlaced],
        pool: remaining,
        current: nextCard,
      };
    }

    case "use-hint": {
      if (
        state.status !== "playing" ||
        !state.current ||
        state.hintsRemaining <= 0 ||
        state.hintUsedOnCurrent !== null
      ) {
        return state;
      }
      const correctSlotIndices = getCorrectSlotIndices(
        state.timeline,
        state.current.year,
      );
      const reveal = buildHintReveal(
        action.hintType,
        state.current,
        correctSlotIndices,
        action.relatedSentence,
      );
      return {
        ...state,
        hintsRemaining: state.hintsRemaining - 1,
        hintUsedOnCurrent: action.hintType,
        hintReveal: reveal,
      };
    }

    case "place": {
      if (state.status !== "playing" || !state.current) return state;
      const correctSlotIndices = getCorrectSlotIndices(
        state.timeline,
        state.current.year,
      );
      const correct = correctSlotIndices.includes(action.slotIndex);
      const placed: PlacedEvent = {
        ...state.current,
        correct,
        hintUsed: state.hintUsedOnCurrent,
      };
      const newTimeline = correct
        ? [
            ...state.timeline.slice(0, action.slotIndex),
            placed,
            ...state.timeline.slice(action.slotIndex),
          ]
        : insertSorted(state.timeline, placed);

      const { pointsEarned, newStreak } = scoreRound({
        correct,
        hintUsed: state.hintUsedOnCurrent,
        streakBefore: state.streak,
      });

      const strikes = correct ? state.strikes : state.strikes + 1;
      const status = strikes >= STRIKES_MAX ? "gameover" : "playing";

      return {
        ...state,
        timeline: newTimeline,
        score: state.score + pointsEarned,
        streak: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
        strikes,
        status,
        placements: state.placements + 1,
        correctPlacements: state.correctPlacements + (correct ? 1 : 0),
        current: null,
        hintReveal: null,
        lastResult: {
          correct,
          pointsEarned,
          placedEvent: placed,
          correctSlotIndices,
          chosenSlotIndex: action.slotIndex,
        },
      };
    }

    case "next-card": {
      if (state.status !== "playing") return state;
      const placedYears = state.timeline.map((e) => e.year);
      const minGap = DIFFICULTY_GAP[state.difficulty];
      const { drawn, rest } = drawCard(state.pool, placedYears, minGap);
      if (!drawn) {
        return { ...state, status: "gameover", current: null, lastResult: null };
      }
      return {
        ...state,
        current: drawn,
        pool: rest,
        hintUsedOnCurrent: null,
        hintReveal: null,
        lastResult: null,
      };
    }

    case "extend-pool": {
      if (action.events.length === 0) return state;
      // Avoid dupes by id and by lowercased title|year.
      const existingIds = new Set<string>([
        ...state.timeline.map((e) => e.id),
        ...state.pool.map((e) => e.id),
        ...(state.current ? [state.current.id] : []),
      ]);
      const existingKeys = new Set<string>([
        ...state.timeline.map((e) => `${e.title.toLowerCase()}|${e.year}`),
        ...state.pool.map((e) => `${e.title.toLowerCase()}|${e.year}`),
        ...(state.current
          ? [`${state.current.title.toLowerCase()}|${state.current.year}`]
          : []),
      ]);
      const fresh: TimelineEvent[] = [];
      for (const ev of action.events) {
        if (existingIds.has(ev.id)) continue;
        const key = `${ev.title.toLowerCase()}|${ev.year}`;
        if (existingKeys.has(key)) continue;
        existingIds.add(ev.id);
        existingKeys.add(key);
        fresh.push(ev);
      }
      if (fresh.length === 0) return state;
      // Append the new events at the end of the deck so the player's
      // current sequence isn't disrupted.
      return { ...state, pool: [...state.pool, ...shuffle(fresh)] };
    }

    case "restart": {
      return {
        ...initialState,
        selectedSubcategories: state.selectedSubcategories,
        difficulty: state.difficulty,
      };
    }

    case "restore": {
      return action.state;
    }

    default:
      return state;
  }
}

// Re-export helper for components that need to look up subcategory info
export { SUBCATEGORY_BY_ID };
