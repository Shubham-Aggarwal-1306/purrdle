import { Pressable, StyleSheet } from 'react-native';

import type { LevelTileState } from '@/features/progress/selectors';
import { colors, radii, spacing } from '@/theme';

import { AppText } from './AppText';
import { PawStars } from './PawStars';

export interface LevelTileProps {
  number: number;
  state: LevelTileState;
  stars: number;
  onPress: () => void;
}

export function LevelTile({ number, state, stars, onPress }: LevelTileProps) {
  const locked = state === 'locked';
  const label =
    state === 'won'
      ? `Level ${String(number)}, completed with ${String(stars)} paws`
      : `Level ${String(number)}${locked ? ', locked' : ''}`;
  return (
    <Pressable
      testID={`level-tile-${String(number)}`}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: locked }}
      disabled={locked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        state === 'won' && styles.won,
        locked && styles.locked,
        pressed && styles.pressed,
      ]}
    >
      <AppText variant="heading" color={locked ? colors.textMuted : colors.text}>
        {number}
      </AppText>
      {state === 'won' ? <PawStars count={stars} size={14} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 1,
    margin: spacing.xs,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  won: { backgroundColor: colors.successSoft, borderColor: colors.successSoft },
  locked: { backgroundColor: colors.surfaceMuted, borderColor: colors.locked },
  pressed: { opacity: 0.8 },
});
