import { damerauLevenshtein as dl } from './damerau-levenshtein.ts';

describe('damerauLevenshtein', () => {
  it.each([
    ['', '', 0],
    ['', 'cat', 3],
    ['cat', '', 3],
    ['cat', 'cat', 0],
    ['cat', 'cut', 1], // substitution
    ['cat', 'cats', 1], // insertion
    ['cats', 'cat', 1], // deletion
    ['cat', 'act', 1], // adjacent transposition
    ['whiskers', 'wihskers', 1],
    ['kitten', 'sitting', 3],
    ['ca', 'abc', 2], // unrestricted DL (OSA would give 3)
    ['abcdef', 'badcfe', 3],
    ['purr', 'prru', 2],
    ['naïve', 'naive', 1], // code points, not bytes
    ['🐱cat', '🐱cat', 0],
    ['🐱', '🐶', 1],
  ])('dl(%j, %j) = %i', (a, b, expected) => {
    expect(dl(a, b)).toBe(expected);
  });

  // Deterministic pseudo-random strings to check metric properties.
  function rng(seed: number): () => number {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) % 2147483648;
      return s / 2147483648;
    };
  }
  const rand = rng(42);
  const word = (): string =>
    Array.from({ length: Math.floor(rand() * 8) }, () => 'abcd'[Math.floor(rand() * 4)]).join('');
  const samples = Array.from({ length: 150 }, () => [word(), word(), word()] as const);

  it('is symmetric and bounded by the longer length', () => {
    for (const [a, b] of samples) {
      expect(dl(a, b)).toBe(dl(b, a));
      expect(dl(a, b)).toBeLessThanOrEqual(Math.max(a.length, b.length));
      expect(dl(a, b)).toBeGreaterThanOrEqual(Math.abs(a.length - b.length));
    }
  });

  it('satisfies the triangle inequality', () => {
    for (const [a, b, c] of samples) {
      expect(dl(a, c)).toBeLessThanOrEqual(dl(a, b) + dl(b, c));
    }
  });

  it('is zero only for equal strings', () => {
    for (const [a, b] of samples) {
      expect(dl(a, b) === 0).toBe(a === b);
    }
  });
});
