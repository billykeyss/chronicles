import type { HintType } from "./types";

/**
 * Scoring rules:
 *   correct, no hint   → 100 base + min(streak*10, 50) streak bonus
 *   correct, related   → 75   (no streak bonus, streak preserved)
 *   correct, eliminate → 60   (timeline: ruled-out slot; reverse: distractor removed)
 *   correct, anchor    → 45   (timeline only)
 *   correct, compare   → 30   (timeline only)
 *   correct, verify    → 50   (reverse only; same value whether hint confirmed or eliminated)
 *   wrong              → 0    (streak resets, strike added)
 */

const HINT_BASE: Record<HintType, number> = {
  related: 75,
  eliminate: 60,
  anchor: 45,
  compare: 30,
  verify: 50,
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
