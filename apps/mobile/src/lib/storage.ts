import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/** Single on-device key-value store (MMKV). In Jest, MMKV substitutes an in-memory mock. */
export const storage = createMMKV({ id: 'purrdle' });

/** Adapter so zustand's `persist` middleware writes through MMKV (synchronous, no flash on launch). */
export const zustandStorage: StateStorage = {
  getItem: (key) => storage.getString(key) ?? null,
  setItem: (key, value) => {
    storage.set(key, value);
  },
  removeItem: (key) => {
    storage.remove(key);
  },
};
