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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFeedback } from '@/features/feedback/useFeedback';
import { isJudgeConfigured, requestJudgement } from '@/features/judge/client';
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
 * Borderline guesses go to the API's AI judge when it is configured; any failure or timeout
 * resolves them as wrong. A judgement interrupted by an app restart is resumed on mount.
 */
export function useLevelGame(level: Level): LevelGame {
  const stored = useProgressStore((s) => s.levels[level.id]);
  const dispatch = useProgressStore((s) => s.dispatch);
  const restartLevel = useProgressStore((s) => s.restartLevel);
  const feedback = useFeedback();
  const [lastEffect, setLastEffect] = useState<GameEffect | null>(null);

  const progress = useMemo(() => stored ?? createLevelProgress(level.id), [stored, level.id]);

  const apply = useCallback(
    (event: GameEvent): GameEffect => {
      const effect = dispatch(event, { level, judgeAvailable: isJudgeConfigured() });
      setLastEffect(effect);
      feedback.forEffect(effect);
      return effect;
    },
    [dispatch, level, feedback],
  );

  const judging = useRef(false);
  const resolveJudgement = useCallback(
    async (guess: string) => {
      if (judging.current) return;
      judging.current = true;
      try {
        const accepted = await requestJudgement(level, guess);
        apply({ type: 'judgeResolved', accepted });
      } finally {
        judging.current = false;
      }
    },
    [level, apply],
  );

  // Entering `judging` (a borderline guess, or one left pending when the app was closed)
  // starts the request; the ref guards against duplicate calls.
  const pending = progress.status === 'judging' ? progress.pendingGuess : null;
  useEffect(() => {
    if (pending !== null) void resolveJudgement(pending);
  }, [pending, resolveJudgement]);

  return {
    progress,
    hints: visibleHints(level, progress),
    guessesLeft: guessesRemaining(progress),
    maxGuesses: maxGuesses(progress),
    canRevealHint: canRevealHint(progress),
    mood: mascotMoodFor(progress.status, lastEffect),
    message: messageFor(lastEffect),
    lastEffect,
    submitGuess: (guess) => apply({ type: 'submitGuess', guess }),
    revealHint: () => apply({ type: 'revealHint' }),
    restart: () => {
      restartLevel(level.id);
      setLastEffect(null);
    },
  };
}
