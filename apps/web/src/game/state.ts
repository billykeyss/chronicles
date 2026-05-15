import { pickClosestAnchor } from "./anchors";
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
  type GameMode,
  type GameState,
  type HintReveal,
  type HintType,
  type PlacedEvent,
  type ReverseRound,
  type TimelineEvent,
} from "./types";

export type GameAction =
  | { type: "toggle-subcategory"; subcategory: string }
  | { type: "set-subcategories"; subcategories: string[] }
  | { type: "toggle-category-all"; category: CategoryId }
  | { type: "set-difficulty"; difficulty: Difficulty }
  | { type: "set-mode"; mode: GameMode }
  | { type: "start-game"; events?: TimelineEvent[] }
  | { type: "extend-pool"; events: TimelineEvent[] }
  | { type: "restore"; state: GameState }
  | { type: "place"; slotIndex: number }
  | { type: "next-card" }
  | { type: "pick-reverse"; choiceIndex: number }
  | { type: "verify-reverse"; choiceIndex: number }
  | { type: "use-hint"; hintType: HintType; relatedSentence?: string }
  | { type: "restart" };

export const initialState: GameState = {
  status: "picking",
  mode: "timeline",
  endless: false,
  difficulty: "medium",
  selectedSubcategories: ALL_SUBCATEGORY_IDS,
  pool: [],
  timeline: [],
  current: null,
  reverseRound: null,
  reverseHistory: [],
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

/**
 * Aggressive dedupe key that strips disambiguation suffixes ("(film)",
 * "(1942 film)", etc.) and normalizes whitespace, so bundled and live
 * versions of the same event collapse together.
 */
function dedupKey(title: string, year: number): string {
  const normalized = title
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*$/g, "") // trailing parenthetical
    .replace(/\s*–\s*.*$/g, "") // strip "– Artist" / "– Author" suffixes
    .replace(/[^\w\s]/g, "") // remove punctuation
    .replace(/\s+/g, " ")
    .trim();
  return `${normalized}|${year}`;
}

/**
 * Build a reverse-mode round: pick a random correct event from the pool, then
 * choose 2 distractors whose years are within `maxGap` of the correct year
 * (and not the same year as the correct or each other). Tighter gaps = harder.
 *
 * Returns the round + the remaining pool (correct + 2 distractors removed).
 */
function buildReverseRound(
  pool: TimelineEvent[],
  maxGap: number,
): { round: ReverseRound | null; remaining: TimelineEvent[] } {
  if (pool.length < 3) return { round: null, remaining: pool };
  // Trust the caller's pool ordering (so unseen-priority weighting holds).
  // Take the first event as the correct answer; distractors come from the rest.
  const correct = pool[0];

  const distractors: TimelineEvent[] = [];
  const usedYears = new Set<number>([correct.year]);
  for (const ev of pool.slice(1)) {
    if (distractors.length === 2) break;
    if (ev.id === correct.id) continue;
    if (usedYears.has(ev.year)) continue;
    if (Math.abs(ev.year - correct.year) > maxGap) continue;
    distractors.push(ev);
    usedYears.add(ev.year);
  }
  // Fallback: if the pool doesn't have enough nearby events, accept any
  // distractor with a different year so the round can still be built.
  if (distractors.length < 2) {
    for (const ev of pool.slice(1)) {
      if (distractors.length === 2) break;
      if (ev.id === correct.id) continue;
      if (distractors.some((d) => d.id === ev.id)) continue;
      if (ev.year === correct.year) continue;
      distractors.push(ev);
    }
  }
  if (distractors.length < 2) return { round: null, remaining: pool };

  // Shuffle the 3 cards so the correct one isn't always first
  const allChoices = shuffle([correct, ...distractors]);
  const correctIndex = allChoices.findIndex((e) => e.id === correct.id);
  const round: ReverseRound = {
    year: correct.year,
    choices: allChoices.map((event) => ({ event, eliminated: false })),
    correctIndex,
    pickedIndex: null,
    verifyArmed: false,
    verifiedIndex: null,
  };

  // Remove all three used events from the pool
  const usedIds = new Set([correct.id, ...distractors.map((d) => d.id)]);
  const remaining = pool.filter((e) => !usedIds.has(e.id));
  return { round, remaining };
}

function buildTimelineHintReveal(
  hintType: HintType,
  event: TimelineEvent,
  timeline: PlacedEvent[],
  correctSlotIndices: number[],
  relatedSentence?: string,
): HintReveal | null {
  if (hintType === "related") {
    return {
      type: "related",
      content: relatedSentence ?? event.related,
      correctSlotIndices,
    };
  }

  if (hintType === "anchor") {
    const a = pickClosestAnchor(event.year);
    if (!a) return null;
    const direction = event.year >= a.year ? "after" : "before";
    return {
      type: "anchor",
      content: `Happened ${direction} ${a.name} (${formatYear(a.year)}).`,
      correctSlotIndices,
    };
  }

  if (hintType === "compare") {
    if (timeline.length === 0) return null;
    // Median placed card by year — gives ~50% search reduction on average.
    const sorted = [...timeline].sort((a, b) => a.year - b.year);
    let pivot = sorted[Math.floor(sorted.length / 2)];
    if (pivot.year === event.year) {
      // Ties don't narrow the answer — fall back to a neighbour if available.
      const idx = sorted.indexOf(pivot);
      const alt = sorted[idx + 1] ?? sorted[idx - 1];
      if (!alt || alt.year === event.year) return null;
      pivot = alt;
    }
    const direction = event.year > pivot.year ? "newer" : "older";
    return {
      type: "compare",
      content: `It's ${direction} than "${pivot.title}".`,
      correctSlotIndices,
    };
  }

  if (hintType === "eliminate") {
    const totalSlots = timeline.length + 1;
    const correctSet = new Set(correctSlotIndices);
    const wrongs: number[] = [];
    for (let i = 0; i < totalSlots; i++) {
      if (!correctSet.has(i)) wrongs.push(i);
    }
    if (wrongs.length === 0) return null;
    const eliminated = wrongs[Math.floor(Math.random() * wrongs.length)];
    // Describe the ruled-out slot in plain language so the hint reads on
    // every layout (the desktop rail also paints an X badge).
    let description: string;
    if (eliminated === 0) {
      description = `It's not before "${timeline[0].title}" (${formatYear(timeline[0].year)}).`;
    } else if (eliminated === timeline.length) {
      const last = timeline[timeline.length - 1];
      description = `It's not after "${last.title}" (${formatYear(last.year)}).`;
    } else {
      const before = timeline[eliminated - 1];
      const after = timeline[eliminated];
      description = `It's not between "${before.title}" (${formatYear(before.year)}) and "${after.title}" (${formatYear(after.year)}).`;
    }
    return {
      type: "eliminate",
      content: description,
      correctSlotIndices,
      eliminatedSlotIndex: eliminated,
    };
  }

  return null;
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

    case "set-mode": {
      return { ...state, mode: action.mode };
    }

    case "start-game": {
      const events =
        action.events && action.events.length > 0
          ? action.events
          : getEventsForSubcategories(state.selectedSubcategories);
      const gap = DIFFICULTY_GAP[state.difficulty];

      if (state.mode === "reverse") {
        if (events.length < 3) return state;
        const { round, remaining } = buildReverseRound(events, gap);
        if (!round) return state;
        return {
          ...initialState,
          status: "playing",
          mode: "reverse",
          difficulty: state.difficulty,
          selectedSubcategories: state.selectedSubcategories,
          pool: remaining,
          reverseRound: round,
        };
      }

      // Timeline mode (default). If the caller has pre-ordered events
      // (e.g., for unseen-priority weighting), respect their order.
      const shuffled =
        action.events && action.events.length > 0 ? events : shuffle(events);
      if (shuffled.length < 2) return state;
      const [anchor, ...rest] = shuffled;
      const anchorPlaced: PlacedEvent = {
        ...anchor,
        correct: true,
        hintUsed: null,
      };
      const drawNext = drawCard(rest, [anchor.year], gap);
      const nextCard = drawNext.drawn ?? rest[0] ?? null;
      const remaining = drawNext.drawn ? drawNext.rest : rest.slice(1);
      return {
        ...initialState,
        status: "playing",
        mode: "timeline",
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
        state.hintUsedOnCurrent !== null
      ) {
        return state;
      }

      if (state.mode === "reverse") {
        if (!state.reverseRound) return state;
        const round = state.reverseRound;
        const correctEvent = round.choices[round.correctIndex].event;

        if (action.hintType === "related") {
          return {
            ...state,
            hintUsedOnCurrent: "related",
            hintReveal: {
              type: "related",
              content: action.relatedSentence ?? correctEvent.related,
              correctSlotIndices: [round.correctIndex],
            },
          };
        }

        // Passive elimination — oracle picks a random wrong card to remove.
        if (action.hintType === "eliminate") {
          const candidates = round.choices
            .map((c, i) => ({ c, i }))
            .filter(({ c, i }) => i !== round.correctIndex && !c.eliminated);
          if (candidates.length === 0) return state;
          const toElim =
            candidates[Math.floor(Math.random() * candidates.length)];
          const newChoices = round.choices.map((c, i) =>
            i === toElim.i ? { ...c, eliminated: true } : c,
          );
          return {
            ...state,
            hintUsedOnCurrent: "eliminate",
            reverseRound: { ...round, choices: newChoices },
            hintReveal: {
              type: "eliminate",
              content: `Eliminated "${toElim.c.event.title}".`,
              correctSlotIndices: [round.correctIndex],
            },
          };
        }

        // `verify` arms the round — the player's next card tap is consumed
        // by the oracle (yes/no) rather than being a final pick. The result
        // is materialised by the separate `verify-reverse` action below.
        if (action.hintType === "verify") {
          return {
            ...state,
            hintUsedOnCurrent: "verify",
            reverseRound: { ...round, verifyArmed: true },
            hintReveal: {
              type: "verify",
              content: "Tap a card to verify with the Oracle.",
              correctSlotIndices: [round.correctIndex],
            },
          };
        }

        // Hints that don't apply to reverse mode are no-ops.
        return state;
      }

      // Timeline mode
      if (!state.current) return state;
      const correctSlotIndices = getCorrectSlotIndices(
        state.timeline,
        state.current.year,
      );
      const reveal = buildTimelineHintReveal(
        action.hintType,
        state.current,
        state.timeline,
        correctSlotIndices,
        action.relatedSentence,
      );
      if (!reveal) return state;
      return {
        ...state,
        hintUsedOnCurrent: action.hintType,
        hintReveal: reveal,
      };
    }

    case "verify-reverse": {
      if (state.status !== "playing" || !state.reverseRound) return state;
      const round = state.reverseRound;
      if (!round.verifyArmed) return state;
      if (round.pickedIndex !== null) return state;
      const target = round.choices[action.choiceIndex];
      if (!target || target.eliminated) return state;
      const correct = action.choiceIndex === round.correctIndex;
      if (correct) {
        return {
          ...state,
          reverseRound: {
            ...round,
            verifyArmed: false,
            verifiedIndex: action.choiceIndex,
          },
          hintReveal: {
            type: "verify",
            content: "Confirmed — the Oracle says yes.",
            correctSlotIndices: [round.correctIndex],
          },
        };
      }
      const newChoices = round.choices.map((c, i) =>
        i === action.choiceIndex ? { ...c, eliminated: true } : c,
      );
      return {
        ...state,
        reverseRound: {
          ...round,
          choices: newChoices,
          verifyArmed: false,
        },
        hintReveal: {
          type: "verify",
          content: `Not this one — "${target.event.title}" is eliminated.`,
          correctSlotIndices: [round.correctIndex],
        },
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
      const minGap = DIFFICULTY_GAP[state.difficulty];

      if (state.mode === "reverse") {
        const { round, remaining } = buildReverseRound(state.pool, minGap);
        // Note: in reverse mode the value is reinterpreted as a max gap.
        if (!round) {
          return {
            ...state,
            status: "gameover",
            reverseRound: null,
            lastResult: null,
          };
        }
        return {
          ...state,
          reverseRound: round,
          pool: remaining,
          hintUsedOnCurrent: null,
          hintReveal: null,
          lastResult: null,
        };
      }

      const placedYears = state.timeline.map((e) => e.year);
      const { drawn, rest } = drawCard(state.pool, placedYears, minGap);
      if (!drawn) {
        return {
          ...state,
          status: "gameover",
          current: null,
          lastResult: null,
        };
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

    case "pick-reverse": {
      if (state.status !== "playing" || !state.reverseRound) return state;
      if (state.reverseRound.pickedIndex !== null) return state;
      const round = state.reverseRound;
      const correct = action.choiceIndex === round.correctIndex;
      const correctEvent = round.choices[round.correctIndex].event;
      const placed: PlacedEvent = {
        ...correctEvent,
        correct,
        hintUsed: state.hintUsedOnCurrent,
      };
      const { pointsEarned, newStreak } = scoreRound({
        correct,
        hintUsed: state.hintUsedOnCurrent,
        streakBefore: state.streak,
      });
      const strikes = correct ? state.strikes : state.strikes + 1;
      const status = strikes >= STRIKES_MAX ? "gameover" : "playing";
      const settledRound: ReverseRound = {
        ...round,
        pickedIndex: action.choiceIndex,
      };

      return {
        ...state,
        score: state.score + pointsEarned,
        streak: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
        strikes,
        status,
        placements: state.placements + 1,
        correctPlacements: state.correctPlacements + (correct ? 1 : 0),
        reverseRound: settledRound,
        reverseHistory: [...state.reverseHistory, settledRound],
        hintReveal: null,
        lastResult: {
          correct,
          pointsEarned,
          placedEvent: placed,
          correctSlotIndices: [round.correctIndex],
          chosenSlotIndex: action.choiceIndex,
        },
      };
    }

    case "extend-pool": {
      if (action.events.length === 0) return state;
      // Dedupe by id, by normalized title+year, and by Wikipedia article slug.
      const existingIds = new Set<string>([
        ...state.timeline.map((e) => e.id),
        ...state.pool.map((e) => e.id),
        ...(state.current ? [state.current.id] : []),
      ]);
      const existingKeys = new Set<string>([
        ...state.timeline.map((e) => dedupKey(e.title, e.year)),
        ...state.pool.map((e) => dedupKey(e.title, e.year)),
        ...(state.current
          ? [dedupKey(state.current.title, state.current.year)]
          : []),
      ]);
      const existingWikiTitles = new Set<string>(
        [
          ...state.timeline,
          ...state.pool,
          ...(state.current ? [state.current] : []),
        ]
          .map((e) =>
            (e.wikipediaTitle ?? e.title).toLowerCase().replace(/_/g, " "),
          ),
      );
      const fresh: TimelineEvent[] = [];
      for (const ev of action.events) {
        if (existingIds.has(ev.id)) continue;
        const key = dedupKey(ev.title, ev.year);
        if (existingKeys.has(key)) continue;
        const wikiKey = (ev.wikipediaTitle ?? ev.title)
          .toLowerCase()
          .replace(/_/g, " ");
        if (existingWikiTitles.has(wikiKey)) continue;
        existingIds.add(ev.id);
        existingKeys.add(key);
        existingWikiTitles.add(wikiKey);
        fresh.push(ev);
      }
      if (fresh.length === 0) return state;
      // Shuffle fresh SPARQL events into the remaining pool so they start
      // surfacing immediately, instead of waiting behind the small bundled
      // pool. The caller has already applied unseen-priority weighting to
      // `fresh`, and `state.pool` was weighted at start — mixing them with a
      // uniform shuffle is good enough at this point.
      return { ...state, pool: shuffle([...state.pool, ...fresh]) };
    }

    case "restart": {
      return {
        ...initialState,
        selectedSubcategories: state.selectedSubcategories,
        difficulty: state.difficulty,
        mode: state.mode,
        endless: state.endless,
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
