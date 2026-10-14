import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { PawIcon } from './PawIcon';

export interface PawStarsProps {
  count: number;
  max?: number;
  size?: number;
}

export function PawStars({ count, max = 3, size = 28 }: PawStarsProps) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${String(count)} of ${String(max)} paws`}
    >
      {Array.from({ length: max }, (_, i) => (
        <PawIcon key={i} size={size} color={i < count ? colors.star : colors.starEmpty} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: spacing.xs } });
