import { z } from 'zod';

import { HINT_COUNT } from '../level/schema.ts';

export const BASE_GUESSES = 3;
export const EXTRA_GUESSES_PER_REWARD = 1;
export const PROGRESS_SCHEMA_VERSION = 1;

export type LevelStatus = 'playing' | 'judging' | 'won' | 'failed';

/** How a guess was resolved: exact match, typo-tolerant match, AI judge accepted, or wrong. */
export type GuessOutcome = 'exact' | 'typo' | 'judge' | 'wrong';

export interface GuessRecord {
  text: string;
  outcome: GuessOutcome;
}

/**
 * Persisted per-level state. Plain JSON — safe to store in MMKV as-is.
 * Derived values (guesses left, max guesses) are computed by selectors, not stored.
 */
export interface LevelProgress {
  schemaVersion: typeof PROGRESS_SCHEMA_VERSION;
  levelId: string;
  status: LevelStatus;
  /** Number of hints visible, 1…5. Hint 1 is free. */
  hintsRevealed: number;
  guesses: GuessRecord[];
  /** Rewarded ad used for this level (max once). */
  extraGuessGranted: boolean;
  /** The guess awaiting the AI judge; non-null only while `status === 'judging'`. */
  pendingGuess: string | null;
  /** 0 until won. */
  pawStars: 0 | 1 | 2 | 3;
}

export const LevelProgressSchema = z
  .object({
    schemaVersion: z.literal(PROGRESS_SCHEMA_VERSION),
    levelId: z.string().min(1),
    status: z.enum(['playing', 'judging', 'won', 'failed']),
    hintsRevealed: z.number().int().min(1).max(HINT_COUNT),
    guesses: z.array(
      z.object({ text: z.string(), outcome: z.enum(['exact', 'typo', 'judge', 'wrong']) }),
    ),
    extraGuessGranted: z.boolean(),
    pendingGuess: z.string().nullable(),
    pawStars: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  })
  .refine((p) => (p.status === 'judging') === (p.pendingGuess !== null), {
    message: 'pendingGuess must be set exactly when status is "judging"',
    path: ['pendingGuess'],
  })
  .refine((p) => (p.status === 'won') === p.pawStars > 0, {
    message: 'pawStars must be set exactly when status is "won"',
    path: ['pawStars'],
  });

export function createLevelProgress(levelId: string): LevelProgress {
  return {
    schemaVersion: PROGRESS_SCHEMA_VERSION,
    levelId,
    status: 'playing',
    hintsRevealed: 1,
    guesses: [],
    extraGuessGranted: false,
    pendingGuess: null,
    pawStars: 0,
  };
}

/**
 * Validates progress restored from storage. Returns `null` when it is corrupt, from an
 * unknown schema version, or belongs to another level — callers should then start fresh.
 */
export function parseLevelProgress(input: unknown, levelId: string): LevelProgress | null {
  const result = LevelProgressSchema.safeParse(input);
  if (!result.success || result.data.levelId !== levelId) return null;
  return result.data;
}
