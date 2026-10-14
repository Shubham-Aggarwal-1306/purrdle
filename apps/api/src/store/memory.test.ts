import { MemoryStore } from './memory.ts';

describe('MemoryStore', () => {
  let now = 0;
  const clock = () => now;
  beforeEach(() => {
    now = 1_000_000;
  });

  it('stores values until they expire', async () => {
    const store = new MemoryStore(10, clock);
    await store.set('k', 'v', 10);
    expect(await store.get('k')).toBe('v');
    now += 9_999;
    expect(await store.get('k')).toBe('v');
    now += 1;
    expect(await store.get('k')).toBeNull();
  });

  it('increments within a fixed window, then restarts', async () => {
    const store = new MemoryStore(10, clock);
    expect(await store.increment('c', 60)).toBe(1);
    now += 30_000;
    expect(await store.increment('c', 60)).toBe(2); // TTL not extended
    now += 30_000;
    expect(await store.increment('c', 60)).toBe(1);
  });

  it('evicts the oldest entries beyond capacity', async () => {
    const store = new MemoryStore(2, clock);
    await store.set('a', '1', 60);
    await store.set('b', '2', 60);
    await store.set('c', '3', 60);
    expect(await store.get('a')).toBeNull();
    expect(await store.get('c')).toBe('3');
  });
});
