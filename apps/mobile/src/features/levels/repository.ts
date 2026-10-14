import { parseLevelPack, type Level, type LevelPack } from '@purrdle/shared';

import bundled from './data/levels.json';

// Validated once at module load. A broken bundled pack is a build-time bug, caught by
// src/__tests__/levels-data.test.ts — it should never reach a release build.
const bundledPack: LevelPack = parseLevelPack(bundled);

// Phase 3+ will merge downloaded packs here; screens only use these accessors.
export function getLevels(): readonly Level[] {
  return bundledPack.levels;
}

export function getLevel(id: string): Level | undefined {
  return bundledPack.levels.find((l) => l.id === id);
}

export function getLevelNumber(id: string): number {
  return bundledPack.levels.findIndex((l) => l.id === id) + 1;
}

export function getNextLevel(id: string): Level | undefined {
  const index = bundledPack.levels.findIndex((l) => l.id === id);
  return index === -1 ? undefined : bundledPack.levels[index + 1];
}
