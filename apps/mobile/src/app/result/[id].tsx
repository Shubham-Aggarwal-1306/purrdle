import { Redirect, useLocalSearchParams } from 'expo-router';

import { getLevel } from '@/features/levels/repository';
import { ResultScreen } from '@/features/result/ResultScreen';
import { useProgressStore } from '@/features/progress/store';

export default function ResultRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const level = getLevel(id);
  const progress = useProgressStore((s) => s.levels[id]);

  if (!level) return <Redirect href="/levels" />;
  if (progress?.status !== 'won') {
    return <Redirect href={{ pathname: '/level/[id]', params: { id } }} />;
  }
  return <ResultScreen level={level} progress={progress} />;
}
