import { normalizeGuess } from './normalize.ts';

describe('normalizeGuess', () => {
  it('lowercases, trims and collapses whitespace', () => {
    expect(normalizeGuess('  Big   CAT ')).toBe('big cat');
  });

  it('strips diacritics and punctuation', () => {
    expect(normalizeGuess("Café, s'il vous plaît!")).toBe('cafe sil vous plait');
  });
});
