import { Pressable, StyleSheet } from 'react-native';

import { colors, radii, touchTarget } from '@/theme';

import { AppText } from './AppText';

export interface IconButtonProps {
  /** A short glyph, e.g. "‹" or "⚙". Replaced by real icons with final art. */
  glyph: string;
  accessibilityLabel: string;
  onPress: () => void;
  testID?: string;
}

export function IconButton({ glyph, accessibilityLabel, onPress, testID }: IconButtonProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}
    >
      <AppText variant="title" align="center">
        {glyph}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: touchTarget - 8,
    height: touchTarget - 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.surfaceMuted },
});
