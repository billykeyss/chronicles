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

export type HintType = "related" | "decade" | "answer";

export type HintReveal = {
  type: HintType;
  content: string;
  correctSlotIndices: number[];
};

export type PlacedEvent = TimelineEvent & {
  correct: boolean;
  hintUsed: HintType | null;
};

export type GameStatus = "picking" | "playing" | "gameover";

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_GAP: Record<Difficulty, number> = {
  easy: 100,
  medium: 50,
  hard: 10,
};

export type GameState = {
  status: GameStatus;
  difficulty: Difficulty;
  /** Selected subcategory IDs (the granular filter). */
  selectedSubcategories: string[];
  pool: TimelineEvent[];
  timeline: PlacedEvent[];
  current: TimelineEvent | null;
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
