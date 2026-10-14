import * as Haptics from 'expo-haptics';

import type { HapticKind } from './feedback';

export function playHaptic(kind: HapticKind): void {
  // Fire-and-forget: haptics are cosmetic and may be unsupported on some devices.
  const run = (): Promise<void> => {
    switch (kind) {
      case 'success':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case 'error':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      case 'warning':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      case 'light':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      case 'selection':
        return Haptics.selectionAsync();
    }
  };
  run().catch(() => undefined);
}
