import type { GameEffect, LevelStatus } from '@purrdle/shared';

export type MascotMood = 'idle' | 'thinking' | 'happy' | 'sad' | 'sleeping';

/** What the mascot shows on the level screen, given the level status and the latest effect. */
export function mascotMoodFor(status: LevelStatus, lastEffect: GameEffect | null): MascotMood {
  if (status === 'won') return 'happy';
  if (status === 'failed') return 'sad';
  if (status === 'judging') return 'thinking';
  if (lastEffect?.type === 'wrongGuess') return 'sad';
  if (lastEffect?.type === 'hintRevealed') return 'thinking';
  return 'idle';
}
