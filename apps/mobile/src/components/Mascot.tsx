import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { MascotMood } from '@/features/game/mascotMood';
import { colors, palette } from '@/theme';

import { AppText } from './AppText';

export interface MascotProps {
  mood: MascotMood;
  size?: number;
}

const moodLabel: Record<MascotMood, string> = {
  idle: 'calm',
  thinking: 'thinking',
  happy: 'happy',
  sad: 'sad',
  sleeping: 'sleeping',
};

/**
 * Placeholder cat mascot built from views and animated with Reanimated.
 * Original design (no existing characters). Swap for final Lottie art later — keep the `mood` API.
 */
export function Mascot({ mood, size = 120 }: MascotProps) {
  const reduceMotion = useReducedMotion();
  const breathe = useSharedValue(1);
  const tilt = useSharedValue(0);
  const lift = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(breathe);
    cancelAnimation(tilt);
    cancelAnimation(lift);
    breathe.set(1);
    tilt.set(0);
    lift.set(0);
    if (reduceMotion) return;

    const ease = Easing.inOut(Easing.sin);
    switch (mood) {
      case 'idle':
        breathe.set(withRepeat(withTiming(1.03, { duration: 1400, easing: ease }), -1, true));
        break;
      case 'sleeping':
        breathe.set(withRepeat(withTiming(1.04, { duration: 2200, easing: ease }), -1, true));
        break;
      case 'thinking':
        tilt.set(
          withRepeat(
            withSequence(
              withTiming(-8, { duration: 600, easing: ease }),
              withTiming(4, { duration: 600, easing: ease }),
            ),
            -1,
            true,
          ),
        );
        break;
      case 'happy':
        lift.set(
          withSequence(withSpring(-size * 0.15, { damping: 6 }), withSpring(0, { damping: 8 })),
        );
        break;
      case 'sad':
        lift.set(withTiming(size * 0.04, { duration: 300 }));
        break;
    }
  }, [mood, reduceMotion, size, breathe, tilt, lift]);

  const body = useAnimatedStyle(() => ({
    transform: [
      { translateY: lift.get() },
      { rotate: `${String(tilt.get())}deg` },
      { scale: breathe.get() },
    ],
  }));

  const head = size;
  const earSize = size * 0.28;
  const earsFlat = mood === 'sad';
  const eyeSize = size * 0.1;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Cat mascot, ${moodLabel[mood]}`}
      style={{
        width: size * 1.3,
        height: size * 1.25,
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      <Animated.View style={[{ width: head, height: head }, body]}>
        {/* Ears */}
        {[-1, 1].map((side) => (
          <View
            key={side}
            style={[
              styles.ear,
              {
                borderLeftWidth: earSize / 2,
                borderRightWidth: earSize / 2,
                borderBottomWidth: earSize,
                top: earsFlat ? head * 0.02 : -earSize * 0.55,
                left: side < 0 ? head * 0.1 : head * 0.9 - earSize,
                transform: [{ rotate: `${String(side * (earsFlat ? 70 : 12))}deg` }],
              },
            ]}
          />
        ))}
        {/* Head */}
        <View style={[styles.head, { borderRadius: head / 2 }]}>
          <View style={[styles.eyes, { top: head * 0.38, paddingHorizontal: head * 0.22 }]}>
            {[0, 1].map((i) => (
              <Eye key={i} mood={mood} size={eyeSize} />
            ))}
          </View>
          <View
            style={[
              styles.nose,
              {
                top: head * 0.55,
                borderLeftWidth: head * 0.05,
                borderRightWidth: head * 0.05,
                borderTopWidth: head * 0.06,
              },
            ]}
          />
          {/* Whiskers */}
          {[-1, 1].map((side) =>
            [0, 1].map((row) => (
              <View
                key={`${String(side)}-${String(row)}`}
                style={[
                  styles.whisker,
                  {
                    width: head * 0.24,
                    top: head * (0.6 + row * 0.07),
                    left: side < 0 ? head * 0.04 : head * 0.72,
                    transform: [{ rotate: `${String(side * (row === 0 ? -8 : 8))}deg` }],
                  },
                ]}
              />
            )),
          )}
        </View>
      </Animated.View>
      {mood === 'sleeping' || mood === 'thinking' ? (
        <AppText variant="heading" color={colors.textMuted} style={styles.bubble}>
          {mood === 'sleeping' ? 'z z' : '?'}
        </AppText>
      ) : null}
    </View>
  );
}

function Eye({ mood, size }: { mood: MascotMood; size: number }) {
  if (mood === 'happy') {
    // ^ ^ — upper half of a ring
    return (
      <View
        style={[
          styles.arc,
          {
            width: size * 1.6,
            height: size * 0.8,
            borderTopLeftRadius: size,
            borderTopRightRadius: size,
          },
        ]}
      />
    );
  }
  if (mood === 'sleeping') {
    return <View style={[styles.closed, { width: size * 1.6 }]} />;
  }
  return (
    <View
      style={[
        styles.eye,
        {
          width: size,
          height: mood === 'sad' ? size * 0.75 : size * 1.2,
          borderRadius: size / 2,
          marginTop: mood === 'thinking' ? -size * 0.4 : 0,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ear: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: palette.peachDeep,
  },
  head: { flex: 1, backgroundColor: palette.peach, borderWidth: 3, borderColor: palette.peachDeep },
  eyes: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eye: { backgroundColor: palette.plum },
  arc: { borderWidth: 3, borderBottomWidth: 0, borderColor: palette.plum },
  closed: { height: 3, borderRadius: 2, backgroundColor: palette.plum },
  nose: {
    position: 'absolute',
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: palette.roseDeep,
  },
  whisker: { position: 'absolute', height: 2, borderRadius: 1, backgroundColor: palette.plumSoft },
  bubble: { position: 'absolute', top: 0, right: 0 },
});
