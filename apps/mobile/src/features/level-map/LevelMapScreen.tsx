import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { LevelTile } from '@/components/LevelTile';
import { Mascot } from '@/components/Mascot';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { getLevels } from '@/features/levels/repository';
import { levelTileState } from '@/features/progress/selectors';
import { useProgressStore } from '@/features/progress/store';
import { spacing } from '@/theme';

const COLUMNS = 4;

export function LevelMapScreen() {
  const router = useRouter();
  const progress = useProgressStore((s) => s.levels);
  const levels = getLevels();

  return (
    <Screen edges={['top', 'left', 'right']}>
      <TopBar title="Levels" onBack={() => router.back()} />
      <FlatList
        data={levels}
        keyExtractor={(l) => l.id}
        numColumns={COLUMNS}
        ListHeaderComponent={
          <View style={styles.mascot}>
            <Mascot mood="sleeping" size={80} />
          </View>
        }
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const state = levelTileState(levels, progress, index);
          return (
            <LevelTile
              number={index + 1}
              state={state}
              stars={progress[item.id]?.pawStars ?? 0}
              onPress={() => {
                router.push(
                  state === 'won'
                    ? { pathname: '/result/[id]', params: { id: item.id } }
                    : { pathname: '/level/[id]', params: { id: item.id } },
                );
              }}
            />
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  mascot: { alignItems: 'center', marginBottom: spacing.md },
  list: { paddingBottom: spacing.xxxl },
});
