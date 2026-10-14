import type { KeyValueStore } from './types.ts';

interface Entry {
  value: string;
  expiresAt: number;
}

/**
 * Process-local store for development and tests. Not shared between instances, so production
 * must use Upstash (see config). Evicts the oldest entries beyond `maxEntries`.
 */
export class MemoryStore implements KeyValueStore {
  private readonly entries = new Map<string, Entry>();

  constructor(
    private readonly maxEntries = 10_000,
    private readonly now: () => number = Date.now,
  ) {}

  private live(key: string): Entry | undefined {
    const entry = this.entries.get(key);
    if (entry && entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry;
  }

  private put(key: string, entry: Entry): void {
    this.entries.delete(key);
    this.entries.set(key, entry);
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next();
      if (oldest.done) break;
      this.entries.delete(oldest.value);
    }
  }

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.live(key)?.value ?? null);
  }

  set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.put(key, { value, expiresAt: this.now() + ttlSeconds * 1000 });
    return Promise.resolve();
  }

  increment(key: string, ttlSeconds: number): Promise<number> {
    const entry = this.live(key);
    const next = (entry ? Number(entry.value) : 0) + 1;
    this.put(key, {
      value: String(next),
      expiresAt: entry?.expiresAt ?? this.now() + ttlSeconds * 1000,
    });
    return Promise.resolve(next);
  }
}
