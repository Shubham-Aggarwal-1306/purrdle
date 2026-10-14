import type { GameEffect } from '@purrdle/shared';

export type HapticKind = 'success' | 'error' | 'warning' | 'light' | 'selection';
export type SoundName = 'correct' | 'wrong' | 'hint' | 'tap';

export interface Feedback {
  haptic: HapticKind | null;
  sound: SoundName | null;
}

/** Pure mapping from a game effect to the haptic + sound it should trigger. */
export function feedbackFor(effect: GameEffect): Feedback {
  switch (effect.type) {
    case 'won':
      return { haptic: 'success', sound: 'correct' };
    case 'wrongGuess':
      return { haptic: 'error', sound: 'wrong' };
    case 'failed':
      return { haptic: 'warning', sound: 'wrong' };
    case 'hintRevealed':
      return { haptic: 'light', sound: 'hint' };
    case 'needsJudge':
      return { haptic: 'selection', sound: null };
    case 'extraGuessGranted':
      return { haptic: 'success', sound: 'hint' };
    case 'rejected':
      // Invalid/repeat input: a nudge, no sound.
      return { haptic: effect.reason === 'not-allowed' ? null : 'warning', sound: null };
  }
}
