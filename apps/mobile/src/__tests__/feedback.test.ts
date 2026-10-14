import type { GameEffect } from '@purrdle/shared';

import { feedbackFor } from '@/features/feedback/feedback';
import { mascotMoodFor } from '@/features/game/mascotMood';
import { messageFor } from '@/features/game/messages';

describe('feedbackFor', () => {
  it.each<[GameEffect, string | null, string | null]>([
    [{ type: 'won', outcome: 'exact', pawStars: 3 }, 'success', 'correct'],
    [{ type: 'wrongGuess', guessesRemaining: 2, hintRevealed: 1 }, 'error', 'wrong'],
    [{ type: 'failed' }, 'warning', 'wrong'],
    [{ type: 'hintRevealed', hintIndex: 1 }, 'light', 'hint'],
    [{ type: 'needsJudge', guess: 'x' }, 'selection', null],
    [{ type: 'extraGuessGranted' }, 'success', 'hint'],
    [{ type: 'rejected', reason: 'repeat-guess' }, 'warning', null],
    [{ type: 'rejected', reason: 'not-allowed' }, null, null],
  ])('%j → %s / %s', (effect, haptic, sound) => {
    expect(feedbackFor(effect)).toEqual({ haptic, sound });
  });

  it('gives haptic feedback on every guess result', () => {
    const guessResults: GameEffect[] = [
      { type: 'won', outcome: 'typo', pawStars: 2 },
      { type: 'wrongGuess', guessesRemaining: 1, hintRevealed: null },
      { type: 'failed' },
      { type: 'needsJudge', guess: 'x' },
    ];
    for (const e of guessResults) expect(feedbackFor(e).haptic).not.toBeNull();
  });
});

describe('mascotMoodFor', () => {
  it('reflects status first, then the latest effect', () => {
    expect(mascotMoodFor('won', null)).toBe('happy');
    expect(mascotMoodFor('failed', null)).toBe('sad');
    expect(mascotMoodFor('judging', null)).toBe('thinking');
    expect(
      mascotMoodFor('playing', { type: 'wrongGuess', guessesRemaining: 2, hintRevealed: 1 }),
    ).toBe('sad');
    expect(mascotMoodFor('playing', { type: 'hintRevealed', hintIndex: 1 })).toBe('thinking');
    expect(mascotMoodFor('playing', null)).toBe('idle');
  });
});

describe('messageFor', () => {
  it('explains rejected and wrong guesses', () => {
    expect(messageFor({ type: 'rejected', reason: 'repeat-guess' })).toMatch(/already tried/);
    expect(messageFor({ type: 'rejected', reason: 'invalid-guess' })).toMatch(/Type a word/);
    expect(messageFor({ type: 'rejected', reason: 'not-allowed' })).toBeNull();
    expect(messageFor({ type: 'wrongGuess', guessesRemaining: 2, hintRevealed: 1 })).toMatch(
      /another hint/,
    );
    expect(messageFor({ type: 'wrongGuess', guessesRemaining: 1, hintRevealed: null })).toBe(
      'Not quite.',
    );
    expect(messageFor({ type: 'needsJudge', guess: 'x' })).toMatch(/think/);
    expect(messageFor(null)).toBeNull();
    expect(messageFor({ type: 'won', outcome: 'exact', pawStars: 3 })).toBeNull();
  });
});
