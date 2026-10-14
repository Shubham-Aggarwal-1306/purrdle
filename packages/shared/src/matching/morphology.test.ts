import { looksLikeInflection, stemCandidates } from './morphology.ts';

describe('stemCandidates', () => {
  it.each([
    ['purring', 'purr'],
    ['running', 'run'],
    ['baking', 'bake'],
    ['kitties', 'kitty'],
    ['pounced', 'pounce'],
    ['scratches', 'scratch'],
    ['sleepy', 'sleepy'],
  ])('%s includes %s', (word, stem) => {
    expect(stemCandidates(word)).toContain(stem);
  });

  it('does not strip suffixes that would leave fewer than 3 letters', () => {
    expect(stemCandidates('bus')).toEqual(new Set(['bus']));
    expect(stemCandidates('owes')).not.toContain('ow');
  });
});

describe('looksLikeInflection', () => {
  it.each([
    ['purring', 'purr'],
    ['purr', 'purred'],
    ['kitties', 'kitty'],
    ['hunted', 'hunting'],
    ['running', 'run'],
  ])('%s ~ %s', (a, b) => {
    expect(looksLikeInflection(a, b)).toBe(true);
  });

  it.each([
    ['purr', 'purr'], // identical is not an inflection
    ['dog', 'cat'],
    ['catnip', 'cat'],
    ['as', 'ass'],
  ])('%s !~ %s', (a, b) => {
    expect(looksLikeInflection(a, b)).toBe(false);
  });
});
