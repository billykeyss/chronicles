import type { LucideIcon } from "lucide-react";

export type CategoryId =
  | "films"
  | "books"
  | "inventions"
  | "wars"
  | "music"
  | "art"
  | "sports"
  | "science"
  | "architecture"
  | "games";

export type SubCategory = {
  id: string;
  name: string;
  description?: string;
};

export type Category = {
  id: CategoryId;
  name: string;
  Icon: LucideIcon;
  description: string;
  subcategories: SubCategory[];
};

export type TimelineEvent = {
  id: string;
  title: string;
  year: number;
  category: CategoryId;
  /** One or more subcategory ids. Events may belong to multiple. */
  subcategories: string[];
  related: string;
  /** Override of the Wikipedia page title when it differs from `title`. */
  wikipediaTitle?: string;
};

/**
 * Hint catalogue. Timeline mode and Reverse mode draw from disjoint subsets:
 *   timeline: related | eliminate | anchor | compare
 *   reverse:  related | verify
 */
export type HintType =
  | "related"
  | "eliminate"
  | "anchor"
  | "compare"
  | "verify";

export type HintReveal = {
  type: HintType;
  content: string;
  correctSlotIndices: number[];
  /** Timeline `eliminate`: which slot the oracle ruled out. */
  eliminatedSlotIndex?: number;
};

export type PlacedEvent = TimelineEvent & {
  correct: boolean;
  hintUsed: HintType | null;
};

export type GameStatus = "picking" | "playing" | "gameover";

export type Difficulty = "easy" | "medium" | "hard";

export type GameMode = "timeline" | "reverse";

export const DIFFICULTY_GAP: Record<Difficulty, number> = {
  easy: 100,
  medium: 50,
  hard: 10,
};

export type ReverseChoice = {
  event: TimelineEvent;
  /** True when a hint has marked this distractor as eliminated. */
  eliminated: boolean;
};

export type ReverseRound = {
  /** The year that the player is matching. */
  year: number;
  /** All three choices in display order (shuffled). */
  choices: ReverseChoice[];
  /** Index in `choices` of the correct answer. */
  correctIndex: number;
  /** Index of the player's pick, or null while undecided. */
  pickedIndex: number | null;
  /**
   * True after `use-hint verify` is dispatched and before the player taps a card.
   * While true, taps route to `verify-reverse`; once consumed (either confirmed
   * or eliminated), this flips back to false and taps resume picking.
   */
  verifyArmed: boolean;
  /** Set to the choice index when verify confirms a correct card. */
  verifiedIndex: number | null;
};

export type GameState = {
  status: GameStatus;
  mode: GameMode;
  /** Endless mode: no strike-based game-over, hints regenerate, deck auto-refills. */
  endless: boolean;
  difficulty: Difficulty;
  /** Selected subcategory IDs (the granular filter). */
  selectedSubcategories: string[];
  pool: TimelineEvent[];
  timeline: PlacedEvent[];
  current: TimelineEvent | null;
  /** Reverse-mode current round. Null in timeline mode. */
  reverseRound: ReverseRound | null;
  /**
   * Reverse-mode log of every settled round in this game (in chronological
   * order). Lets the player revisit any past round and see its choices,
   * pick, and outcome. Empty in timeline mode.
   */
  reverseHistory: ReverseRound[];
  strikes: number;
  hintsRemaining: number;
  hintUsedOnCurrent: HintType | null;
  hintReveal: HintReveal | null;
  score: number;
  streak: number;
  bestStreak: number;
  placements: number;
  correctPlacements: number;
  lastResult: null | {
    correct: boolean;
    pointsEarned: number;
    placedEvent: PlacedEvent;
    correctSlotIndices: number[];
    chosenSlotIndex: number;
  };
};

export const STRIKES_MAX = 3;
export const HINTS_PER_GAME = 3;
/** Endless mode: gain one hint after this many correct placements. */
export const ENDLESS_HINT_EVERY_N = 5;
/** Endless mode: cap on stockpiled hints. */
export const ENDLESS_HINT_CAP = 5;
/** Endless mode: refill the deck via SPARQL when it drops below this. */
export const ENDLESS_POOL_REFILL_BELOW = 10;
