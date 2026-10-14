import { Redirect, useLocalSearchParams } from 'expo-router';

import { LevelScreen } from '@/features/game/LevelScreen';
import { getLevelNumber, getLevels } from '@/features/levels/repository';
import { levelTileState } from '@/features/progress/selectors';
import { useProgressStore } from '@/features/progress/store';

export default function LevelRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const progress = useProgressStore((s) => s.levels);
  const levels = getLevels();
  const index = levels.findIndex((l) => l.id === id);
  const level = levels[index];

  if (!level || levelTileState(levels, progress, index) === 'locked') {
    return <Redirect href="/levels" />;
  }
  // `key` resets local screen state (typed guess, messages) when moving to the next level.
  return <LevelScreen key={level.id} level={level} levelNumber={getLevelNumber(level.id)} />;
}
