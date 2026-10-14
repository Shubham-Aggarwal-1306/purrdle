import { HINT_COUNT, type Level } from '../level/schema.ts';
import { DEFAULT_MATCH_OPTIONS, matchAnswer, type MatchOptions } from '../matching/match.ts';

import { pawStarsForHints } from './scoring.ts';
import { canGrantExtraGuess, canRevealHint, guessesRemaining, isRepeatGuess } from './selectors.ts';
import type { GuessOutcome, LevelProgress } from './state.ts';

/*
 * Level state machine (pure, serializable):
 *
 *   playing ──submitGuess(correct)──────────────▶ won
 *   playing ──submitGuess(borderline, judge on)─▶ judging ──judgeResolved(true)──▶ won
 *                                                  judging ──judgeResolved(false)─▶ playing | failed
 *   playing ──submitGuess(wrong / borderline, judge off)──▶ playing (+1 hint) | failed
 *   playing ──revealHint──▶ playing
 *   failed  ──grantExtraGuess (once per level)──▶ playing
 *
 * Events that are not allowed in the current state return the same state object and a
 * `rejected` effect, so callers can always dispatch blindly.
 */

export type GameEvent =
  | { type: 'revealHint' }
  | { type: 'submitGuess'; guess: string }
  /** Answer from the AI judge. Dispatch `accepted: false` on timeout/error/unavailable. */
  | { type: 'judgeResolved'; accepted: boolean }
  /** Rewarded ad completed. */
  | { type: 'grantExtraGuess' };

export type RejectReason = 'invalid-guess' | 'repeat-guess' | 'not-allowed';

/** What happened — drives haptics, sounds, analytics and ad/judge calls. */
export type GameEffect =
  | { type: 'hintRevealed'; hintIndex: number }
  | { type: 'won'; outcome: Exclude<GuessOutcome, 'wrong'>; pawStars: 1 | 2 | 3 }
  | { type: 'wrongGuess'; guessesRemaining: number; hintRevealed: number | null }
  | { type: 'failed' }
  | { type: 'needsJudge'; guess: string }
  | { type: 'extraGuessGranted' }
  | { type: 'rejected'; reason: RejectReason };

export interface GameContext {
  level: Pick<Level, 'id' | 'word' | 'acceptedVariants'>;
  /** Whether a borderline guess may be sent to the AI judge (online + feature enabled). */
  judgeAvailable: boolean;
  matchOptions?: MatchOptions;
}

export interface Transition {
  state: LevelProgress;
  effect: GameEffect;
}

const reject = (state: LevelProgress, reason: RejectReason): Transition => ({
  state,
  effect: { type: 'rejected', reason },
});

function win(
  state: LevelProgress,
  guess: string,
  outcome: Exclude<GuessOutcome, 'wrong'>,
): Transition {
  const pawStars = pawStarsForHints(state.hintsRevealed);
  return {
    state: {
      ...state,
      status: 'won',
      pendingGuess: null,
      pawStars,
      guesses: [...state.guesses, { text: guess, outcome }],
    },
    effect: { type: 'won', outcome, pawStars },
  };
}

function wrong(state: LevelProgress, guess: string): Transition {
  const hintRevealed = state.hintsRevealed < HINT_COUNT ? state.hintsRevealed : null;
  const next: LevelProgress = {
    ...state,
    status: 'playing',
    pendingGuess: null,
    hintsRevealed: Math.min(HINT_COUNT, state.hintsRevealed + 1),
    guesses: [...state.guesses, { text: guess, outcome: 'wrong' }],
  };
  const remaining = guessesRemaining(next);
  if (remaining === 0) {
    return { state: { ...next, status: 'failed' }, effect: { type: 'failed' } };
  }
  return { state: next, effect: { type: 'wrongGuess', guessesRemaining: remaining, hintRevealed } };
}

export function transition(state: LevelProgress, event: GameEvent, ctx: GameContext): Transition {
  if (state.levelId !== ctx.level.id) return reject(state, 'not-allowed');

  switch (event.type) {
    case 'revealHint': {
      if (!canRevealHint(state)) return reject(state, 'not-allowed');
      return {
        state: { ...state, hintsRevealed: state.hintsRevealed + 1 },
        effect: { type: 'hintRevealed', hintIndex: state.hintsRevealed },
      };
    }

    case 'submitGuess': {
      if (state.status !== 'playing') return reject(state, 'not-allowed');
      const guess = event.guess.trim();
      const result = matchAnswer(guess, ctx.level, ctx.matchOptions ?? DEFAULT_MATCH_OPTIONS);
      if (result.verdict === 'invalid') return reject(state, 'invalid-guess');
      if (isRepeatGuess(state, guess)) return reject(state, 'repeat-guess');

      if (result.verdict === 'correct') return win(state, guess, result.exact ? 'exact' : 'typo');
      // Borderline without a judge is treated as wrong (spec).
      if (result.verdict === 'wrong' || !ctx.judgeAvailable) return wrong(state, guess);
      return {
        state: { ...state, status: 'judging', pendingGuess: guess },
        effect: { type: 'needsJudge', guess },
      };
    }

    case 'judgeResolved': {
      if (state.status !== 'judging' || state.pendingGuess === null) {
        return reject(state, 'not-allowed');
      }
      return event.accepted
        ? win(state, state.pendingGuess, 'judge')
        : wrong(state, state.pendingGuess);
    }

    case 'grantExtraGuess': {
      if (!canGrantExtraGuess(state)) return reject(state, 'not-allowed');
      return {
        state: { ...state, status: 'playing', extraGuessGranted: true },
        effect: { type: 'extraGuessGranted' },
      };
    }
  }
}
