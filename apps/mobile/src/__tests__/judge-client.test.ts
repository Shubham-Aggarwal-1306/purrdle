import {
  getApiUrl,
  isJudgeConfigured,
  JUDGE_TIMEOUT_MS,
  requestJudgement,
} from '@/features/judge/client';
import { getInstallationId } from '@/features/judge/installationId';

const level = { word: 'purr', acceptedVariants: ['purrs'] };

function respond(body: unknown, status = 200): typeof fetch {
  return jest.fn(() =>
    Promise.resolve(new Response(JSON.stringify(body), { status })),
  ) as unknown as typeof fetch;
}

describe('judge client', () => {
  const original = process.env.EXPO_PUBLIC_API_URL;
  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.example.com/';
  });
  afterAll(() => {
    process.env.EXPO_PUBLIC_API_URL = original;
  });

  it('is only enabled when an API URL is configured', () => {
    expect(getApiUrl()).toBe('https://api.example.com');
    expect(isJudgeConfigured()).toBe(true);
    delete process.env.EXPO_PUBLIC_API_URL;
    expect(isJudgeConfigured()).toBe(false);
  });

  it('posts the guess with the installation id and returns the verdict', async () => {
    const fetchImpl = respond({ accepted: true, source: 'judge' });
    await expect(requestJudgement(level, 'purring', fetchImpl)).resolves.toBe(true);
    const [url, init] = jest.mocked(fetchImpl).mock.calls[0] ?? [];
    expect(url).toBe('https://api.example.com/judge');
    expect(JSON.parse(String(init?.body))).toEqual({ ...level, guess: 'purring' });
    expect((init?.headers as Record<string, string>)['X-Installation-Id']).toBe(
      getInstallationId(),
    );
  });

  it.each([
    ['a rejection', respond({ accepted: false })],
    ['rate limiting', respond({ error: 'rate_limited' }, 429)],
    ['server errors', respond({ error: 'unavailable' }, 503)],
    ['malformed JSON', respond('nope')],
    ['network failures', (() => Promise.reject(new Error('offline'))) as unknown as typeof fetch],
  ])('treats %s as wrong', async (_label, fetchImpl) => {
    await expect(requestJudgement(level, 'purring', fetchImpl)).resolves.toBe(false);
  });

  it('gives up after the timeout', async () => {
    jest.useFakeTimers();
    try {
      const hang = jest.fn(
        (_url: unknown, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new Error('aborted'));
            });
          }),
      ) as unknown as typeof fetch;
      const result = requestJudgement(level, 'purring', hang);
      jest.advanceTimersByTime(JUDGE_TIMEOUT_MS);
      await expect(result).resolves.toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  it('returns false without a request when not configured', async () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    const fetchImpl = respond({ accepted: true });
    await expect(requestJudgement(level, 'purring', fetchImpl)).resolves.toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('keeps a stable installation id', () => {
    const id = getInstallationId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(getInstallationId()).toBe(id);
  });
});
