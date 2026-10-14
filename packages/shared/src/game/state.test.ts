import { createLevelProgress, parseLevelProgress, type LevelProgress } from './state.ts';

describe('createLevelProgress', () => {
  it('starts playing with one free hint and no guesses', () => {
    expect(createLevelProgress('lvl-1')).toEqual({
      schemaVersion: 1,
      levelId: 'lvl-1',
      status: 'playing',
      hintsRevealed: 1,
      guesses: [],
      extraGuessGranted: false,
      pendingGuess: null,
      pawStars: 0,
    });
  });
});

describe('parseLevelProgress', () => {
  const base = createLevelProgress('lvl-1');

  it('round-trips through JSON (MMKV persistence)', () => {
    const progress: LevelProgress = {
      ...base,
      status: 'won',
      hintsRevealed: 3,
      guesses: [
        { text: 'dog', outcome: 'wrong' },
        { text: 'kitten', outcome: 'typo' },
      ],
      pawStars: 2,
    };
    const restored = parseLevelProgress(JSON.parse(JSON.stringify(progress)), 'lvl-1');
    expect(restored).toEqual(progress);
  });

  it.each([
    ['null', null],
    ['wrong level', { ...base, levelId: 'other' }],
    ['unknown schema version', { ...base, schemaVersion: 2 }],
    ['hints out of range', { ...base, hintsRevealed: 6 }],
    ['zero hints', { ...base, hintsRevealed: 0 }],
    ['judging without pending guess', { ...base, status: 'judging' }],
    ['pending guess while playing', { ...base, pendingGuess: 'cat' }],
    ['won without stars', { ...base, status: 'won' }],
    ['stars while playing', { ...base, pawStars: 3 }],
    ['bad outcome', { ...base, guesses: [{ text: 'x', outcome: 'maybe' }] }],
  ])('returns null for %s', (_label, input) => {
    expect(parseLevelProgress(input, 'lvl-1')).toBeNull();
  });
});
