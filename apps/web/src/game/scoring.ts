import type { HintType } from "./types";

/**
 * Scoring rules:
 *   correct, no hint  → 100 base + min(streak*10, 50) streak bonus
 *   correct, related  → 75   (no streak bonus, streak preserved)
 *   correct, decade   → 50   (no streak bonus, streak preserved)
 *   correct, answer   → 25   (no streak bonus, streak preserved)
 *   wrong             → 0    (streak resets, strike added)
 */

const HINT_BASE: Record<HintType, number> = {
  related: 75,
  decade: 50,
  answer: 25,
};

const BASE_CORRECT = 100;
const STREAK_BONUS_PER = 10;
const STREAK_BONUS_MAX = 50;

export type ScoreOutcome = {
  pointsEarned: number;
  newStreak: number;
};

export function scoreRound(args: {
  correct: boolean;
  hintUsed: HintType | null;
  streakBefore: number;
}): ScoreOutcome {
  const { correct, hintUsed, streakBefore } = args;
  if (!correct) return { pointsEarned: 0, newStreak: 0 };

  if (hintUsed) {
    return {
      pointsEarned: HINT_BASE[hintUsed],
      newStreak: streakBefore,
    };
  }

  const newStreak = streakBefore + 1;
  const bonus = Math.min(streakBefore * STREAK_BONUS_PER, STREAK_BONUS_MAX);
  return { pointsEarned: BASE_CORRECT + bonus, newStreak };
}

export const SCORING_RULES = {
  baseCorrect: BASE_CORRECT,
  streakBonusPer: STREAK_BONUS_PER,
  streakBonusMax: STREAK_BONUS_MAX,
  hintBase: HINT_BASE,
};
