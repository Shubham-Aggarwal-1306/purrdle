import type { GameEffect } from '@purrdle/shared';

/** Short status line under the hints. Kept minimal on purpose. */
export function messageFor(effect: GameEffect | null): string | null {
  if (!effect) return null;
  switch (effect.type) {
    case 'wrongGuess':
      return effect.hintRevealed === null ? 'Not quite.' : 'Not quite. Here’s another hint.';
    case 'needsJudge':
      return 'Hmm, let me think…';
    case 'hintRevealed':
      return null;
    case 'rejected':
      if (effect.reason === 'repeat-guess') return 'You already tried that one.';
      if (effect.reason === 'invalid-guess') return 'Type a word first.';
      return null;
    case 'won':
    case 'failed':
    case 'extraGuessGranted':
      return null;
  }
}
