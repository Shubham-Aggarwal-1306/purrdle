import { Pressable, StyleSheet } from 'react-native';

import { colors, radii, spacing, touchTarget } from '@/theme';

import { AppText } from './AppText';

export interface RevealHintButtonProps {
  hintNumber: number;
  onPress: () => void;
}

export function RevealHintButton({ hintNumber, onPress }: RevealHintButtonProps) {
  return (
    <Pressable
      testID="reveal-hint"
      accessibilityRole="button"
      accessibilityLabel={`Reveal hint ${String(hintNumber)}`}
      accessibilityHint="Showing more hints lowers your paw score"
      onPress={onPress}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}
    >
      <AppText variant="bodyStrong" color={colors.secondary}>
        Reveal hint {hintNumber}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
});
