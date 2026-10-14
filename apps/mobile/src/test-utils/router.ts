/** Shared expo-router mock: tests import `router` to assert navigation calls. */
export const router = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

export function resetRouter(): void {
  router.push.mockReset();
  router.replace.mockReset();
  router.back.mockReset();
}
