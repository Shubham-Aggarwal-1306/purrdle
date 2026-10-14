import { pawStarsForHints } from './scoring.ts';

describe('pawStarsForHints', () => {
  it.each([
    [1, 3],
    [2, 3],
    [3, 2],
    [4, 2],
    [5, 1],
  ])('%i hints → %i paws', (hints, paws) => {
    expect(pawStarsForHints(hints)).toBe(paws);
  });
});
