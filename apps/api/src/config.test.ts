import { loadConfig } from './config.ts';

describe('loadConfig', () => {
  it('applies safe defaults for development', () => {
    expect(loadConfig({})).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      TRUST_PROXY: true,
      JUDGE_PROVIDER: 'mock',
      JUDGE_CONFIDENCE_THRESHOLD: 0.85,
      JUDGE_DAILY_BUDGET: 2000,
      RATE_LIMIT_DEVICE_PER_HOUR: 30,
    });
  });

  it('coerces numbers and booleans from strings', () => {
    expect(
      loadConfig({ PORT: '8080', JUDGE_CONFIDENCE_THRESHOLD: '0.9', TRUST_PROXY: 'false' }),
    ).toMatchObject({ PORT: 8080, JUDGE_CONFIDENCE_THRESHOLD: 0.9, TRUST_PROXY: false });
  });

  it.each([
    ['bad port', { PORT: 'abc' }, 'PORT'],
    ['threshold > 1', { JUDGE_CONFIDENCE_THRESHOLD: '1.5' }, 'JUDGE_CONFIDENCE_THRESHOLD'],
    ['half-configured Upstash', { UPSTASH_REDIS_REST_URL: 'https://x.upstash.io' }, 'UPSTASH'],
    ['production without Upstash', { NODE_ENV: 'production' }, 'required in production'],
    ['jev without key', { JUDGE_PROVIDER: 'jev' }, 'JEV_API_KEY'],
  ])('rejects %s', (_label, env, message) => {
    expect(() => loadConfig(env)).toThrow(message);
  });

  it('accepts a complete production config', () => {
    expect(
      loadConfig({
        NODE_ENV: 'production',
        UPSTASH_REDIS_REST_URL: 'https://x.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 't',
        JUDGE_PROVIDER: 'jev',
        JEV_API_KEY: 'k',
        JEV_MODEL: 'm',
      }),
    ).toMatchObject({ NODE_ENV: 'production', JUDGE_PROVIDER: 'jev' });
  });
});
