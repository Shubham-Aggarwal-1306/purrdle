import type { GameEffect } from '@purrdle/shared';
import { useCallback } from 'react';

import { useSettingsStore } from '@/features/settings/store';

import { feedbackFor, type HapticKind, type SoundName } from './feedback';
import { playHaptic } from './haptics';
import { playSound } from './sound';

export interface FeedbackApi {
  forEffect: (effect: GameEffect) => void;
  haptic: (kind: HapticKind) => void;
  sound: (name: SoundName) => void;
}

/** Plays haptics/sounds for game effects, honouring the user's settings. */
export function useFeedback(): FeedbackApi {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  const haptic = useCallback(
    (kind: HapticKind) => {
      if (hapticsEnabled) playHaptic(kind);
    },
    [hapticsEnabled],
  );
  const sound = useCallback(
    (name: SoundName) => {
      if (soundEnabled) playSound(name);
    },
    [soundEnabled],
  );
  const forEffect = useCallback(
    (effect: GameEffect) => {
      const f = feedbackFor(effect);
      if (f.haptic) haptic(f.haptic);
      if (f.sound) sound(f.sound);
    },
    [haptic, sound],
  );

  return { forEffect, haptic, sound };
}
