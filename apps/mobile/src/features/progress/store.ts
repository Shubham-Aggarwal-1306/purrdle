import {
  createLevelProgress,
  parseLevelProgress,
  transition,
  type GameContext,
  type GameEffect,
  type GameEvent,
  type LevelProgress,
} from '@purrdle/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';

interface ProgressState {
  levels: Record<string, LevelProgress>;
  /** Runs the shared state machine for one level and returns the resulting effect. */
  dispatch: (event: GameEvent, ctx: GameContext) => GameEffect;
  /** Starts a level over (used after failing). */
  restartLevel: (levelId: string) => void;
  resetAll: () => void;
}

/** Drops anything that doesn't validate (corrupt, old schema) — those levels just start fresh. */
export function sanitizeLevels(input: unknown): Record<string, LevelProgress> {
  if (typeof input !== 'object' || input === null) return {};
  const out: Record<string, LevelProgress> = {};
  for (const [id, value] of Object.entries(input)) {
    const parsed = parseLevelProgress(value, id);
    if (parsed) out[id] = parsed;
  }
  return out;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      levels: {},
      dispatch: (event, ctx) => {
        const id = ctx.level.id;
        const current = get().levels[id] ?? createLevelProgress(id);
        const { state, effect } = transition(current, event, ctx);
        if (state !== current || get().levels[id] === undefined) {
          set((s) => ({ levels: { ...s.levels, [id]: state } }));
        }
        return effect;
      },
      restartLevel: (levelId) => {
        set((s) => ({ levels: { ...s.levels, [levelId]: createLevelProgress(levelId) } }));
      },
      resetAll: () => {
        set({ levels: {} });
      },
    }),
    {
      name: 'progress',
      version: 1,
      storage: createJSONStorage(() => zustandStorage),
      partialize: (s) => ({ levels: s.levels }),
      merge: (persisted, current) => ({
        ...current,
        levels: sanitizeLevels((persisted as { levels?: unknown } | undefined)?.levels),
      }),
    },
  ),
);
