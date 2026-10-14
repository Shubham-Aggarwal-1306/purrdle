import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors, radii, shadow, spacing } from '@/theme';

import { AppText } from './AppText';

export interface HintCardProps {
  index: number;
  text: string;
}

export function HintCard({ index, text }: HintCardProps) {
  return (
    <Animated.View entering={FadeInDown.duration(300)} style={[styles.card, shadow.card]}>
      <View style={styles.badge}>
        <AppText variant="caption" color={colors.text}>
          {index + 1}
        </AppText>
      </View>
      <AppText style={styles.text} accessibilityLabel={`Hint ${String(index + 1)}: ${text}`}>
        {text}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
});
