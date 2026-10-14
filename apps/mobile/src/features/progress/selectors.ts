import type { Level, LevelProgress } from '@purrdle/shared';

export type ProgressMap = Readonly<Record<string, LevelProgress | undefined>>;

export type LevelTileState = 'locked' | 'open' | 'won';

const isWon = (progress: ProgressMap, id: string | undefined): boolean =>
  id !== undefined && progress[id]?.status === 'won';

/** Levels unlock in order: the first is always open, each next one after the previous is won. */
export function levelTileState(
  levels: readonly Level[],
  progress: ProgressMap,
  index: number,
): LevelTileState {
  const level = levels[index];
  if (level === undefined) return 'locked';
  if (isWon(progress, level.id)) return 'won';
  if (index === 0 || isWon(progress, levels[index - 1]?.id)) return 'open';
  return 'locked';
}

/** First level not yet won (the "Play" button target); the last level once all are won. */
export function nextPlayableLevel(
  levels: readonly Level[],
  progress: ProgressMap,
): Level | undefined {
  return levels.find((l) => !isWon(progress, l.id)) ?? levels.at(-1);
}

export function wonCount(levels: readonly Level[], progress: ProgressMap): number {
  return levels.filter((l) => isWon(progress, l.id)).length;
}

export function totalPaws(levels: readonly Level[], progress: ProgressMap): number {
  return levels.reduce((sum, l) => sum + (progress[l.id]?.pawStars ?? 0), 0);
}
