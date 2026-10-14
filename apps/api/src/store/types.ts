/**
 * Minimal key-value operations the API needs (cache + rate-limit counters).
 * Implementations: in-memory (dev/tests) and Upstash Redis REST (production).
 */
export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  /** Sets a value that expires after `ttlSeconds`. */
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  /**
   * Increments a counter, creating it with the given TTL if missing (fixed window).
   * Returns the value after incrementing.
   */
  increment(key: string, ttlSeconds: number): Promise<number>;
}

export class StoreUnavailableError extends Error {
  override name = 'StoreUnavailableError';
}
