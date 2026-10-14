import type { Level, LevelProgress } from '@purrdle/shared';
import { useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Mascot } from '@/components/Mascot';
import { PawStars } from '@/components/PawStars';
import { Screen } from '@/components/Screen';
import { resolveLevelImage } from '@/features/levels/images';
import { getNextLevel } from '@/features/levels/repository';
import { colors, radii, spacing } from '@/theme';

export interface ResultScreenProps {
  level: Level;
  progress: LevelProgress;
}

export function ResultScreen({ level, progress }: ResultScreenProps) {
  const router = useRouter();
  const next = getNextLevel(level.id);
  const winning = progress.guesses.at(-1);
  const closeEnough = winning !== undefined && winning.outcome !== 'exact';

  // Phase 4: interstitial ads may show here, only after this screen is dismissed (AdManager decides).
  const goNext = () => {
    if (next) router.replace({ pathname: '/level/[id]', params: { id: next.id } });
    else router.replace('/levels');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Mascot mood="happy" size={88} />
        <PawStars count={progress.pawStars} size={36} />
        <AppText variant="caption" color={colors.textMuted}>
          {closeEnough ? 'Close enough! The answer is' : 'You got it! The answer is'}
        </AppText>
        <AppText testID="result-word" variant="title" align="center" accessibilityRole="header">
          {level.word}
        </AppText>
        {closeEnough && winning ? (
          <AppText variant="caption" color={colors.textMuted}>
            You typed “{winning.text}”
          </AppText>
        ) : null}

        <View style={styles.imageWrap}>
          <Image
            source={resolveLevelImage(level.image.uri)}
            style={styles.image}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            accessible
            accessibilityLabel={`Picture for ${level.word}`}
          />
          <AppText testID="image-credit" variant="caption" color={colors.textMuted}>
            {level.image.credit} · {level.image.license}
          </AppText>
        </View>

        <AppText style={styles.explanation}>{level.explanation}</AppText>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          testID="next-level"
          label={next ? 'Next level' : 'Back to levels'}
          onPress={goNext}
        />
        {next ? (
          <Button label="Levels" variant="secondary" onPress={() => router.replace('/levels')} />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  imageWrap: { width: '100%', gap: spacing.xs },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceMuted,
  },
  explanation: { alignSelf: 'stretch' },
  actions: { gap: spacing.md, paddingVertical: spacing.md },
});
