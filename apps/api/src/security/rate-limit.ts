import type { KeyValueStore } from '../store/types.ts';

export interface RateLimitRule {
  /** Key prefix, e.g. "device" or "ip". */
  name: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the current window resets (upper bound), for Retry-After. */
  retryAfterSeconds: number;
  rule?: string;
}

/** Fixed-window counters in the shared store. Checks every rule; the first exceeded one wins. */
export class RateLimiter {
  constructor(
    private readonly store: KeyValueStore,
    private readonly now: () => number = Date.now,
  ) {}

  async check(checks: { rule: RateLimitRule; subject: string }[]): Promise<RateLimitResult> {
    for (const { rule, subject } of checks) {
      const window = Math.floor(this.now() / 1000 / rule.windowSeconds);
      const count = await this.store.increment(
        `rl:${rule.name}:${subject}:${String(window)}`,
        rule.windowSeconds,
      );
      if (count > rule.limit) {
        const windowEnd = (window + 1) * rule.windowSeconds;
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil(windowEnd - this.now() / 1000)),
          rule: rule.name,
        };
      }
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }
}
