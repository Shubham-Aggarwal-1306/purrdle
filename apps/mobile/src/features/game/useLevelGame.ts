import {
  canRevealHint,
  createLevelProgress,
  guessesRemaining,
  maxGuesses,
  visibleHints,
  type GameEffect,
  type GameEvent,
  type Level,
  type LevelProgress,
} from '@purrdle/shared';
import { useCallback, useMemo, useState } from 'react';

import { useFeedback } from '@/features/feedback/useFeedback';
import { useProgressStore } from '@/features/progress/store';

import { mascotMoodFor, type MascotMood } from './mascotMood';
import { messageFor } from './messages';

export interface LevelGame {
  progress: LevelProgress;
  hints: string[];
  guessesLeft: number;
  maxGuesses: number;
  canRevealHint: boolean;
  mood: MascotMood;
  message: string | null;
  lastEffect: GameEffect | null;
  submitGuess: (guess: string) => GameEffect;
  revealHint: () => GameEffect;
  restart: () => void;
}

/**
 * Binds one level to the shared state machine, the persisted progress store and feedback.
 * The AI judge arrives in Phase 3; until then borderline guesses count as wrong.
 */
export function useLevelGame(level: Level): LevelGame {
  const stored = useProgressStore((s) => s.levels[level.id]);
  const dispatch = useProgressStore((s) => s.dispatch);
  const restartLevel = useProgressStore((s) => s.restartLevel);
  const feedback = useFeedback();
  const [lastEffect, setLastEffect] = useState<GameEffect | null>(null);

  const progress = useMemo(() => stored ?? createLevelProgress(level.id), [stored, level.id]);

  const send = useCallback(
    (event: GameEvent): GameEffect => {
      const effect = dispatch(event, { level, judgeAvailable: false });
      setLastEffect(effect);
      feedback.forEffect(effect);
      return effect;
    },
    [dispatch, level, feedback],
  );

  return {
    progress,
    hints: visibleHints(level, progress),
    guessesLeft: guessesRemaining(progress),
    maxGuesses: maxGuesses(progress),
    canRevealHint: canRevealHint(progress),
    mood: mascotMoodFor(progress.status, lastEffect),
    message: messageFor(lastEffect),
    lastEffect,
    submitGuess: (guess) => send({ type: 'submitGuess', guess }),
    revealHint: () => send({ type: 'revealHint' }),
    restart: () => {
      restartLevel(level.id);
      setLastEffect(null);
    },
  };
}
