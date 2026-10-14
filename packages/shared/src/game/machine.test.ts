import { makeLevel } from '../__fixtures__/level.ts';

import { transition, type GameContext, type GameEvent, type Transition } from './machine.ts';
import {
  canGrantExtraGuess,
  canRevealHint,
  guessesRemaining,
  isFinished,
  maxGuesses,
  visibleHints,
} from './selectors.ts';
import { createLevelProgress, parseLevelProgress, type LevelProgress } from './state.ts';

const level = makeLevel(); // word "whiskers", variant "whisker"
const ctx: GameContext = { level, judgeAvailable: true };
const offline: GameContext = { level, judgeAvailable: false };

const guess = (text: string): GameEvent => ({ type: 'submitGuess', guess: text });
const reveal: GameEvent = { type: 'revealHint' };
const extra: GameEvent = { type: 'grantExtraGuess' };
const judge = (accepted: boolean): GameEvent => ({ type: 'judgeResolved', accepted });

/** Applies events in order, returning the final transition. */
function run(
  events: GameEvent[],
  context = ctx,
  start = createLevelProgress(level.id),
): Transition {
  let t: Transition = { state: start, effect: { type: 'rejected', reason: 'not-allowed' } };
  for (const e of events) t = transition(t.state, e, context);
  return t;
}

describe('initial state', () => {
  const s = createLevelProgress(level.id);
  it('shows hint 1 and allows 3 guesses', () => {
    expect(visibleHints(level, s)).toEqual([level.hints[0]]);
    expect(maxGuesses(s)).toBe(3);
    expect(guessesRemaining(s)).toBe(3);
    expect(canRevealHint(s)).toBe(true);
    expect(isFinished(s)).toBe(false);
  });
});

describe('correct guesses', () => {
  it('wins on the first try with 3 paws', () => {
    const { state, effect } = run([guess('Whiskers')]);
    expect(effect).toEqual({ type: 'won', outcome: 'exact', pawStars: 3 });
    expect(state.status).toBe('won');
    expect(state.pawStars).toBe(3);
    expect(state.guesses).toEqual([{ text: 'Whiskers', outcome: 'exact' }]);
    expect(isFinished(state)).toBe(true);
  });

  it('accepts accepted variants and typos', () => {
    expect(run([guess('whisker')]).effect).toMatchObject({ type: 'won', outcome: 'exact' });
    expect(run([guess('wiskers')]).effect).toMatchObject({ type: 'won', outcome: 'typo' });
  });

  it.each([
    [0, 3], // 1 hint
    [1, 3], // 2 hints
    [2, 2], // 3 hints
    [3, 2], // 4 hints
    [4, 1], // 5 hints
  ])('after %i early reveals scores %i paws', (reveals, paws) => {
    const events = [...Array.from({ length: reveals }, () => reveal), guess('whiskers')];
    expect(run(events).effect).toMatchObject({ type: 'won', pawStars: paws });
  });

  it('counts hints auto-revealed by wrong guesses', () => {
    // 2 wrong guesses → 3 hints visible → 2 paws
    expect(run([guess('tail'), guess('paws'), guess('whiskers')]).effect).toEqual({
      type: 'won',
      outcome: 'exact',
      pawStars: 2,
    });
  });
});

describe('hints', () => {
  it('reveals hints one at a time up to five', () => {
    let t = run([reveal]);
    expect(t.effect).toEqual({ type: 'hintRevealed', hintIndex: 1 });
    expect(visibleHints(level, t.state)).toEqual(level.hints.slice(0, 2));
    t = run([reveal, reveal, reveal, reveal]);
    expect(t.state.hintsRevealed).toBe(5);
    expect(canRevealHint(t.state)).toBe(false);
    const sixth = transition(t.state, reveal, ctx);
    expect(sixth.effect).toEqual({ type: 'rejected', reason: 'not-allowed' });
    expect(sixth.state).toBe(t.state);
  });

  it('does not consume guesses', () => {
    expect(guessesRemaining(run([reveal, reveal]).state)).toBe(3);
  });
});

describe('wrong guesses', () => {
  it('auto-reveals the next hint and decrements guesses', () => {
    const { state, effect } = run([guess('tail')]);
    expect(effect).toEqual({ type: 'wrongGuess', guessesRemaining: 2, hintRevealed: 1 });
    expect(state.hintsRevealed).toBe(2);
    expect(state.status).toBe('playing');
  });

  it('fails after 3 wrong guesses, still revealing a hint', () => {
    const { state, effect } = run([guess('tail'), guess('paws'), guess('fur')]);
    expect(effect).toEqual({ type: 'failed' });
    expect(state.status).toBe('failed');
    expect(state.hintsRevealed).toBe(4);
    expect(guessesRemaining(state)).toBe(0);
    expect(canRevealHint(state)).toBe(false);
  });

  it('does not reveal past the fifth hint', () => {
    const { state, effect } = run([reveal, reveal, reveal, reveal, guess('tail')]);
    expect(state.hintsRevealed).toBe(5);
    expect(effect).toEqual({ type: 'wrongGuess', guessesRemaining: 2, hintRevealed: null });
  });

  it('rejects repeat wrong guesses without consuming a guess', () => {
    const first = run([guess('tail')]);
    const again = transition(first.state, guess('  TAIL! '), ctx);
    expect(again.effect).toEqual({ type: 'rejected', reason: 'repeat-guess' });
    expect(again.state).toBe(first.state);
  });

  it('rejects empty/punctuation guesses without consuming a guess', () => {
    const start = createLevelProgress(level.id);
    for (const text of ['', '   ', '?!']) {
      const t = transition(start, guess(text), ctx);
      expect(t.effect).toEqual({ type: 'rejected', reason: 'invalid-guess' });
      expect(t.state).toBe(start);
    }
  });

  it('stores the trimmed guess text', () => {
    expect(run([guess('  tail  ')]).state.guesses).toEqual([{ text: 'tail', outcome: 'wrong' }]);
  });
});

describe('borderline guesses and the AI judge', () => {
  // "wskrs" is 3 edits from "whiskers": outside tolerance (2), inside borderline.
  it('enters judging when the judge is available', () => {
    const { state, effect } = run([guess('wskrs')]);
    expect(effect).toEqual({ type: 'needsJudge', guess: 'wskrs' });
    expect(state.status).toBe('judging');
    expect(state.pendingGuess).toBe('wskrs');
    expect(state.guesses).toEqual([]);
  });

  it('wins when the judge accepts', () => {
    const { state, effect } = run([guess('wskrs'), judge(true)]);
    expect(effect).toEqual({ type: 'won', outcome: 'judge', pawStars: 3 });
    expect(state.pendingGuess).toBeNull();
    expect(state.guesses).toEqual([{ text: 'wskrs', outcome: 'judge' }]);
  });

  it('counts as wrong when the judge rejects (or times out)', () => {
    const { state, effect } = run([guess('wskrs'), judge(false)]);
    expect(effect).toEqual({ type: 'wrongGuess', guessesRemaining: 2, hintRevealed: 1 });
    expect(state.status).toBe('playing');
    expect(state.pendingGuess).toBeNull();
  });

  it('can fail the level on a rejected third guess', () => {
    expect(run([guess('tail'), guess('paws'), guess('wskrs'), judge(false)]).effect).toEqual({
      type: 'failed',
    });
  });

  it('treats borderline as wrong when the judge is unavailable', () => {
    expect(run([guess('wskrs')], offline).effect).toMatchObject({ type: 'wrongGuess' });
  });

  it('blocks other events while judging', () => {
    const judging = run([guess('wskrs')]).state;
    for (const e of [reveal, guess('whiskers'), extra]) {
      const t = transition(judging, e, ctx);
      expect(t.effect).toEqual({ type: 'rejected', reason: 'not-allowed' });
      expect(t.state).toBe(judging);
    }
  });

  it('ignores judge results when not judging', () => {
    expect(run([judge(true)]).effect).toEqual({ type: 'rejected', reason: 'not-allowed' });
  });

  it('survives persistence mid-judgement', () => {
    const judging = run([guess('wskrs')]).state;
    const restored = parseLevelProgress(JSON.parse(JSON.stringify(judging)), level.id);
    expect(restored).toEqual(judging);
    expect(run([judge(true)], ctx, restored ?? judging).effect).toMatchObject({ type: 'won' });
  });
});

describe('rewarded extra guess', () => {
  const failed = run([guess('tail'), guess('paws'), guess('fur')]).state;

  it('is only offered after failing', () => {
    expect(canGrantExtraGuess(createLevelProgress(level.id))).toBe(false);
    expect(canGrantExtraGuess(failed)).toBe(true);
    expect(run([extra]).effect).toEqual({ type: 'rejected', reason: 'not-allowed' });
  });

  it('returns to playing with one more guess', () => {
    const { state, effect } = transition(failed, extra, ctx);
    expect(effect).toEqual({ type: 'extraGuessGranted' });
    expect(state.status).toBe('playing');
    expect(maxGuesses(state)).toBe(4);
    expect(guessesRemaining(state)).toBe(1);
    expect(state.hintsRevealed).toBe(4); // no free hint for watching the ad
  });

  it('can be won with the extra guess (5th hint not needed → 2 paws)', () => {
    const t = run([extra, guess('whiskers')], ctx, failed);
    expect(t.effect).toEqual({ type: 'won', outcome: 'exact', pawStars: 2 });
  });

  it('fails again on a wrong extra guess, revealing hint 5', () => {
    const t = run([extra, guess('nose')], ctx, failed);
    expect(t.effect).toEqual({ type: 'failed' });
    expect(t.state.hintsRevealed).toBe(5);
  });

  it('is granted at most once per level', () => {
    const failedAgain = run([extra, guess('nose')], ctx, failed).state;
    expect(canGrantExtraGuess(failedAgain)).toBe(false);
    expect(transition(failedAgain, extra, ctx).effect).toEqual({
      type: 'rejected',
      reason: 'not-allowed',
    });
  });
});

describe('finished levels', () => {
  it('ignore further input', () => {
    const won = run([guess('whiskers')]).state;
    for (const e of [reveal, guess('tail'), extra, judge(true)]) {
      expect(transition(won, e, ctx)).toEqual({
        state: won,
        effect: { type: 'rejected', reason: 'not-allowed' },
      });
    }
  });
});

describe('purity', () => {
  it('never mutates the input state', () => {
    const start = createLevelProgress(level.id);
    const snapshot: unknown = JSON.parse(JSON.stringify(start));
    transition(start, guess('tail'), ctx);
    transition(start, reveal, ctx);
    transition(start, guess('whiskers'), ctx);
    expect(start).toEqual(snapshot);
  });

  it('rejects events for a different level', () => {
    const other: LevelProgress = createLevelProgress('someone-else');
    expect(transition(other, guess('whiskers'), ctx)).toEqual({
      state: other,
      effect: { type: 'rejected', reason: 'not-allowed' },
    });
  });
});
