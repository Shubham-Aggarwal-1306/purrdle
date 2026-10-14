import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from '@/lib/storage';

interface SettingsState {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true,
      hapticsEnabled: true,
      setSoundEnabled: (soundEnabled) => {
        set({ soundEnabled });
      },
      setHapticsEnabled: (hapticsEnabled) => {
        set({ hapticsEnabled });
      },
    }),
    {
      name: 'settings',
      version: 1,
      storage: createJSONStorage(() => zustandStorage),
      partialize: (s) => ({ soundEnabled: s.soundEnabled, hapticsEnabled: s.hapticsEnabled }),
    },
  ),
);
