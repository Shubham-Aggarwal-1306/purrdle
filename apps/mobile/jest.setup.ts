import 'react-native-gesture-handler/jestSetup';

import { setUpTests } from 'react-native-reanimated';

setUpTests();

// Sound/haptics are device side effects; tests assert on calls instead.
jest.mock('@/features/feedback/sound', () => ({ playSound: jest.fn() }));
jest.mock('@/features/feedback/haptics', () => ({ playHaptic: jest.fn() }));

// MMKV v4 loads Nitro's native module on import; use its own in-memory mock instead.
jest.mock('react-native-mmkv', () => {
  const { createMockMMKV } = jest.requireActual<{
    createMockMMKV: (config?: { id: string }) => unknown;
  }>('react-native-mmkv/lib/createMMKV/createMockMMKV');
  return { createMMKV: createMockMMKV };
});
