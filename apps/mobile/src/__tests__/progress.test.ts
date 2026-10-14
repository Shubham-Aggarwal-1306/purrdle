import { createLevelProgress, type GameContext } from '@purrdle/shared';

import { getLevels } from '@/features/levels/repository';
import {
  levelTileState,
  nextPlayableLevel,
  totalPaws,
  wonCount,
  type ProgressMap,
} from '@/features/progress/selectors';
import { sanitizeLevels, useProgressStore } from '@/features/progress/store';
import { storage } from '@/lib/storage';

const levels = getLevels();
const [l1, l2, l3] = levels;
if (!l1 || !l2 || !l3) throw new Error('need at least 3 bundled levels');

const won = (id: string, pawStars: 1 | 2 | 3) => ({
  ...createLevelProgress(id),
  status: 'won' as const,
  pawStars,
});

describe('progress selectors', () => {
  const progress: ProgressMap = { [l1.id]: won(l1.id, 3), [l2.id]: createLevelProgress(l2.id) };

  it('unlocks levels in order', () => {
    expect(levelTileState(levels, {}, 0)).toBe('open');
    expect(levelTileState(levels, {}, 1)).toBe('locked');
    expect(levelTileState(levels, progress, 0)).toBe('won');
    expect(levelTileState(levels, progress, 1)).toBe('open');
    expect(levelTileState(levels, progress, 2)).toBe('locked');
    expect(levelTileState(levels, progress, 999)).toBe('locked');
  });

  it('finds the next playable level', () => {
    expect(nextPlayableLevel(levels, {})?.id).toBe(l1.id);
    expect(nextPlayableLevel(levels, progress)?.id).toBe(l2.id);
    const allWon = Object.fromEntries(levels.map((l) => [l.id, won(l.id, 1)]));
    expect(nextPlayableLevel(levels, allWon)?.id).toBe(levels.at(-1)?.id);
  });

  it('counts wins and paws', () => {
    const p: ProgressMap = { [l1.id]: won(l1.id, 3), [l2.id]: won(l2.id, 2) };
    expect(wonCount(levels, p)).toBe(2);
    expect(totalPaws(levels, p)).toBe(5);
  });
});

describe('progress store', () => {
  const ctx: GameContext = { level: l1, judgeAvailable: false };

  beforeEach(() => {
    useProgressStore.getState().resetAll();
  });

  it('runs the state machine and stores the result', () => {
    const effect = useProgressStore
      .getState()
      .dispatch({ type: 'submitGuess', guess: 'zzzz' }, ctx);
    expect(effect).toMatchObject({ type: 'wrongGuess', guessesRemaining: 2 });
    expect(useProgressStore.getState().levels[l1.id]?.hintsRevealed).toBe(2);
  });

  it('persists to MMKV as JSON', () => {
    useProgressStore.getState().dispatch({ type: 'submitGuess', guess: l1.word }, ctx);
    const persisted = JSON.parse(storage.getString('progress') ?? '{}') as {
      state: { levels: Record<string, { status: string }> };
    };
    expect(persisted.state.levels[l1.id]?.status).toBe('won');
  });

  it('restarts a level', () => {
    const { dispatch, restartLevel } = useProgressStore.getState();
    dispatch({ type: 'revealHint' }, ctx);
    restartLevel(l1.id);
    expect(useProgressStore.getState().levels[l1.id]).toEqual(createLevelProgress(l1.id));
  });

  it('drops corrupt or foreign entries on rehydrate', () => {
    const good = createLevelProgress('a');
    expect(
      sanitizeLevels({
        a: good,
        b: { ...createLevelProgress('b'), hintsRevealed: 99 },
        c: createLevelProgress('not-c'),
        d: 'garbage',
      }),
    ).toEqual({ a: good });
    expect(sanitizeLevels(null)).toEqual({});
    expect(sanitizeLevels('x')).toEqual({});
  });
});
