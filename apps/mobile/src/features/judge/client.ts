import type { Level } from '@purrdle/shared';

import { getInstallationId } from './installationId';

/** Upper bound the player waits for the AI judge before the guess counts as wrong. */
export const JUDGE_TIMEOUT_MS = 4000;

/** Read at call time so tests can set it; Expo inlines EXPO_PUBLIC_* values at build time. */
export function getApiUrl(): string | undefined {
  const url = process.env.EXPO_PUBLIC_API_URL;
  return url ? url.replace(/\/+$/, '') : undefined;
}

export const isJudgeConfigured = (): boolean => getApiUrl() !== undefined;

/**
 * Asks the API whether a borderline guess is the same word. Never throws: any failure
 * (offline, timeout, rate limit, server error) resolves to `false`, i.e. the guess is wrong.
 */
export async function requestJudgement(
  level: Pick<Level, 'word' | 'acceptedVariants'>,
  guess: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const apiUrl = getApiUrl();
  if (!apiUrl) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, JUDGE_TIMEOUT_MS);
  try {
    const res = await fetchImpl(`${apiUrl}/judge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Installation-Id': getInstallationId(),
      },
      body: JSON.stringify({ word: level.word, acceptedVariants: level.acceptedVariants, guess }),
      signal: controller.signal,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { accepted?: unknown };
    return data.accepted === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
