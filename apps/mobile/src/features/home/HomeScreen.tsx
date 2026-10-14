import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Mascot } from '@/components/Mascot';
import { PawIcon } from '@/components/PawIcon';
import { Screen } from '@/components/Screen';
import { YarnProgress } from '@/components/YarnProgress';
import { getLevelNumber, getLevels } from '@/features/levels/repository';
import { nextPlayableLevel, totalPaws, wonCount } from '@/features/progress/selectors';
import { useProgressStore } from '@/features/progress/store';
import { colors, spacing } from '@/theme';

export function HomeScreen() {
  const router = useRouter();
  const progress = useProgressStore((s) => s.levels);
  const levels = getLevels();
  const next = nextPlayableLevel(levels, progress);
  const won = wonCount(levels, progress);
  const paws = totalPaws(levels, progress);
  const allDone = won === levels.length;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.paws} accessible accessibilityLabel={`${String(paws)} paws collected`}>
          <PawIcon size={22} color={colors.star} />
          <AppText variant="bodyStrong">{paws}</AppText>
        </View>
        <IconButton
          testID="open-settings"
          glyph="⚙"
          accessibilityLabel="Settings"
          onPress={() => {
            router.push('/settings');
          }}
        />
      </View>

      <View style={styles.center}>
        <AppText variant="display" accessibilityRole="header">
          Purrdle
        </AppText>
        <Mascot mood="idle" size={140} />
        <View style={styles.progress}>
          <YarnProgress
            value={won}
            max={levels.length}
            accessibilityLabel={`${String(won)} of ${String(levels.length)} levels solved`}
          />
          <AppText variant="caption" color={colors.textMuted} align="center">
            {won} / {levels.length} solved
          </AppText>
        </View>
      </View>

      <View style={styles.actions}>
        {next ? (
          <Button
            testID="play"
            label={allDone ? 'All levels solved!' : `Play level ${String(getLevelNumber(next.id))}`}
            disabled={allDone}
            onPress={() => {
              router.push({ pathname: '/level/[id]', params: { id: next.id } });
            }}
          />
        ) : null}
        <Button
          testID="open-levels"
          label="Levels"
          variant="secondary"
          onPress={() => {
            router.push('/levels');
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  paws: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  progress: { width: '80%', gap: spacing.xs },
  actions: { gap: spacing.md, paddingBottom: spacing.xl },
});
