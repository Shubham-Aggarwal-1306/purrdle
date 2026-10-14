import { MemoryStore } from '../store/memory.ts';

import { RateLimiter } from './rate-limit.ts';

describe('RateLimiter', () => {
  let now = 0;
  const clock = () => now;
  const rule = { name: 'device', limit: 2, windowSeconds: 60 };

  beforeEach(() => {
    now = 60_000 * 1000; // aligned to a window start
  });

  it('allows up to the limit per window, then reports Retry-After', async () => {
    const limiter = new RateLimiter(new MemoryStore(100, clock), clock);
    const check = () => limiter.check([{ rule, subject: 'abc' }]);
    expect((await check()).allowed).toBe(true);
    expect((await check()).allowed).toBe(true);
    now += 15_000;
    expect(await check()).toEqual({ allowed: false, retryAfterSeconds: 45, rule: 'device' });
    now += 45_000; // next window
    expect((await check()).allowed).toBe(true);
  });

  it('tracks subjects independently and stops at the first exceeded rule', async () => {
    const limiter = new RateLimiter(new MemoryStore(100, clock), clock);
    const ip = { name: 'ip', limit: 1, windowSeconds: 60 };
    expect(
      (
        await limiter.check([
          { rule: ip, subject: '1.1.1.1' },
          { rule, subject: 'a' },
        ])
      ).allowed,
    ).toBe(true);
    expect(
      (
        await limiter.check([
          { rule: ip, subject: '2.2.2.2' },
          { rule, subject: 'b' },
        ])
      ).allowed,
    ).toBe(true);
    expect(
      await limiter.check([
        { rule: ip, subject: '1.1.1.1' },
        { rule, subject: 'a' },
      ]),
    ).toMatchObject({
      allowed: false,
      rule: 'ip',
    });
  });
});
