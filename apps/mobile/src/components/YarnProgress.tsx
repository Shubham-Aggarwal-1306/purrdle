import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { colors } from '@/theme';

export interface YarnProgressProps {
  value: number;
  max: number;
  accessibilityLabel: string;
  height?: number;
}

/** Progress track that unrolls a strand of yarn, with a yarn ball riding at its end. */
export function YarnProgress({ value, max, accessibilityLabel, height = 12 }: YarnProgressProps) {
  const ratio = max <= 0 ? 0 : Math.min(1, Math.max(0, value / max));
  const progress = useSharedValue(ratio);
  const ball = height * 2;

  useEffect(() => {
    progress.set(withTiming(ratio, { duration: 400 }));
  }, [ratio, progress]);

  const fill = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max, now: value }}
      style={[styles.wrap, { height: ball, paddingRight: ball / 2 }]}
    >
      <View style={[styles.track, { height, borderRadius: height / 2 }]}>
        <Animated.View style={[styles.fill, { borderRadius: height / 2 }, fill]}>
          <View
            style={[
              styles.ball,
              {
                width: ball,
                height: ball,
                borderRadius: ball / 2,
                right: -ball / 2,
                top: (height - ball) / 2,
              },
            ]}
          >
            <View
              style={[
                styles.strand,
                { width: ball * 1.2, top: ball * 0.3, transform: [{ rotate: '-30deg' }] },
              ]}
            />
            <View
              style={[
                styles.strand,
                { width: ball * 1.2, top: ball * 0.55, transform: [{ rotate: '-30deg' }] },
              ]}
            />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'center', width: '100%' },
  track: { backgroundColor: colors.surfaceMuted, width: '100%' },
  fill: { height: '100%', backgroundColor: colors.secondarySoft, minWidth: 0 },
  ball: {
    position: 'absolute',
    backgroundColor: colors.secondary,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  strand: {
    position: 'absolute',
    left: -4,
    height: 2,
    backgroundColor: colors.secondarySoft,
  },
});
