import type { Level } from '@purrdle/shared';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { GuessInput } from '@/components/GuessInput';
import { GuessesLeft } from '@/components/GuessesLeft';
import { HintCard } from '@/components/HintCard';
import { Mascot } from '@/components/Mascot';
import { RevealHintButton } from '@/components/RevealHintButton';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { YarnProgress } from '@/components/YarnProgress';
import { colors, spacing } from '@/theme';

import { useLevelGame } from './useLevelGame';

/** Delay before showing the result, so the happy mascot and sound can play. */
export const WIN_TRANSITION_MS = 700;

export interface LevelScreenProps {
  level: Level;
  levelNumber: number;
}

export function LevelScreen({ level, levelNumber }: LevelScreenProps) {
  const router = useRouter();
  const game = useLevelGame(level);
  const [guess, setGuess] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const { status } = game.progress;

  // Move on to the result screen once the level is won (replace: back goes to the map, not here).
  useEffect(() => {
    if (status !== 'won') return;
    const t = setTimeout(() => {
      router.replace({ pathname: '/result/[id]', params: { id: level.id } });
    }, WIN_TRANSITION_MS);
    return () => {
      clearTimeout(t);
    };
  }, [status, level.id, router]);

  const submit = () => {
    const effect = game.submitGuess(guess);
    if (effect.type !== 'rejected' || effect.reason === 'repeat-guess') setGuess('');
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <TopBar title={`Level ${String(levelNumber)}`} onBack={() => router.back()} />
        <YarnProgress
          value={game.hints.length}
          max={level.hints.length}
          accessibilityLabel={`${String(game.hints.length)} of ${String(level.hints.length)} hints shown`}
        />

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.hints}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.mascot}>
            <Mascot mood={game.mood} size={96} />
          </View>
          {game.hints.map((hint, i) => (
            <HintCard key={i} index={i} text={hint} />
          ))}
          {game.canRevealHint ? (
            <RevealHintButton hintNumber={game.hints.length + 1} onPress={game.revealHint} />
          ) : null}
        </ScrollView>

        {status === 'failed' ? (
          <View style={styles.footer} testID="failed-panel">
            <AppText variant="heading" align="center">
              Out of guesses
            </AppText>
            {/* Phase 4: rewarded "extra guess" button goes here (opt-in, once per level). */}
            <Button testID="retry" label="Try again" onPress={game.restart} />
            <Button label="Back to levels" variant="secondary" onPress={() => router.back()} />
          </View>
        ) : (
          <View style={styles.footer}>
            <View style={styles.statusRow}>
              <GuessesLeft remaining={game.guessesLeft} max={game.maxGuesses} />
              {game.message ? (
                <AppText
                  testID="game-message"
                  variant="caption"
                  color={colors.textMuted}
                  accessibilityLiveRegion="polite"
                >
                  {game.message}
                </AppText>
              ) : null}
            </View>
            <GuessInput
              value={guess}
              onChangeText={setGuess}
              onSubmit={submit}
              disabled={status !== 'playing'}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  mascot: { alignItems: 'center' },
  hints: { gap: spacing.md, paddingVertical: spacing.lg },
  footer: { gap: spacing.md, paddingVertical: spacing.md },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
