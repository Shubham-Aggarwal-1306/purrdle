import { compactForm, normalizeGuess } from './normalize.ts';

describe('normalizeGuess', () => {
  it.each([
    ['  Big   CAT ', 'big cat'],
    ['Café', 'cafe'],
    ['NAÏVE', 'naive'],
    ["Cat's", 'cats'],
    ['cat’s', 'cats'],
    ['ice-cream', 'ice cream'],
    ['hello,world!', 'hello world'],
    ['\tpurr\n', 'purr'],
    ['ﬁsh', 'fish'], // NFKD expands the "fi" ligature
    ['!!!', ''],
    ['', ''],
    ['r2d2', 'r2d2'],
  ])('%j → %j', (input, expected) => {
    expect(normalizeGuess(input)).toBe(expected);
  });
});

describe('compactForm', () => {
  it('ignores spacing and separators', () => {
    expect(compactForm('Ice Cream')).toBe('icecream');
    expect(compactForm('ice-cream')).toBe('icecream');
    expect(compactForm('icecream')).toBe('icecream');
  });
});
