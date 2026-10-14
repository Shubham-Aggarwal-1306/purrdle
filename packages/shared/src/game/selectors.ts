import { HINT_COUNT, type Level } from '../level/schema.ts';
import { compactForm } from '../matching/normalize.ts';

import { BASE_GUESSES, EXTRA_GUESSES_PER_REWARD, type LevelProgress } from './state.ts';

export const maxGuesses = (p: LevelProgress): number =>
  BASE_GUESSES + (p.extraGuessGranted ? EXTRA_GUESSES_PER_REWARD : 0);

export const wrongGuessCount = (p: LevelProgress): number =>
  p.guesses.filter((g) => g.outcome === 'wrong').length;

export const guessesRemaining = (p: LevelProgress): number =>
  Math.max(0, maxGuesses(p) - wrongGuessCount(p));

export const isFinished = (p: LevelProgress): boolean =>
  p.status === 'won' || p.status === 'failed';

export const canRevealHint = (p: LevelProgress): boolean =>
  p.status === 'playing' && p.hintsRevealed < HINT_COUNT;

/** The rewarded "extra guess" is offered once per level, only after failing. */
export const canGrantExtraGuess = (p: LevelProgress): boolean =>
  p.status === 'failed' && !p.extraGuessGranted;

export const visibleHints = (level: Pick<Level, 'hints'>, p: LevelProgress): string[] =>
  level.hints.slice(0, p.hintsRevealed);

/** True if this guess (after normalization) was already tried and judged wrong. */
export const isRepeatGuess = (p: LevelProgress, guess: string): boolean => {
  const compact = compactForm(guess);
  return p.guesses.some((g) => g.outcome === 'wrong' && compactForm(g.text) === compact);
};
