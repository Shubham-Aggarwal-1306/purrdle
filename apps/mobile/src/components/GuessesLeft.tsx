import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { AppText } from './AppText';

export interface GuessesLeftProps {
  remaining: number;
  max: number;
}

export function GuessesLeft({ remaining, max }: GuessesLeftProps) {
  const label = `${String(remaining)} ${remaining === 1 ? 'guess' : 'guesses'} left`;
  return (
    <View style={styles.row} accessible accessibilityLabel={label}>
      <View style={styles.dots}>
        {Array.from({ length: max }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i < remaining ? colors.primary : colors.starEmpty },
            ]}
          />
        ))}
      </View>
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dots: { flexDirection: 'row', gap: spacing.xs },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
