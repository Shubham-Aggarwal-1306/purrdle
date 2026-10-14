import { DEFAULT_MATCH_OPTIONS, matchAnswer, typoTolerance, type MatchTarget } from './match.ts';

const target = (word: string, acceptedVariants: string[] = []): MatchTarget => ({
  word,
  acceptedVariants,
});

describe('typoTolerance', () => {
  it('allows 1 edit up to 6 letters and 2 beyond', () => {
    expect(typoTolerance(3)).toBe(1);
    expect(typoTolerance(6)).toBe(1);
    expect(typoTolerance(7)).toBe(2);
    expect(typoTolerance(15)).toBe(2);
  });
});

describe('matchAnswer', () => {
  describe('invalid', () => {
    it.each(['', '   ', '?!', '—'])('%j is invalid', (guess) => {
      expect(matchAnswer(guess, target('cat'))).toEqual({ verdict: 'invalid' });
    });
  });

  describe('exact', () => {
    it.each([
      ['whiskers', 'whiskers'],
      ['  WHISKERS ', 'whiskers'],
      ['Whiskers!', 'whiskers'],
      ['whisker', 'whisker'], // accepted variant
    ])('%j → exact (%s)', (guess, matched) => {
      expect(matchAnswer(guess, target('whiskers', ['whisker']))).toEqual({
        verdict: 'correct',
        exact: true,
        matched,
      });
    });

    it('ignores diacritics, spacing and hyphens', () => {
      expect(matchAnswer('Café', target('cafe'))).toMatchObject({ exact: true });
      expect(matchAnswer('maine coon', target('Maine Coon'))).toMatchObject({ exact: true });
      expect(matchAnswer('mainecoon', target('Maine Coon'))).toMatchObject({ exact: true });
      expect(matchAnswer('maine-coon', target('Maine Coon'))).toMatchObject({ exact: true });
    });

    it('matches UK/US variants', () => {
      expect(matchAnswer('colour', target('color', ['colour']))).toMatchObject({
        exact: true,
        matched: 'colour',
      });
    });
  });

  describe('close enough (typo tolerance)', () => {
    it.each([
      ['purr', 'pur', 1], // short word, 1 deletion
      ['tabby', 'tabyb', 1], // transposition
      ['kitten', 'kittin', 1], // 6 letters → still 1
      ['whiskers', 'wiskers', 1],
      ['whiskers', 'wihskres', 2], // 8 letters → 2 allowed
      ['scratching', 'scrathcing', 1],
    ])('%s ← %j (distance %i)', (word, guess, distance) => {
      expect(matchAnswer(guess, target(word))).toEqual({
        verdict: 'correct',
        exact: false,
        matched: word,
        distance,
      });
    });

    it('reports the closest form when several are within tolerance', () => {
      const result = matchAnswer('colr', target('color', ['colour']));
      expect(result).toEqual({ verdict: 'correct', exact: false, matched: 'color', distance: 1 });
    });

    it('applies tolerance by answer length, not guess length', () => {
      // "kitn" is 2 edits from "kitten" (6 letters → tolerance 1): not correct.
      expect(matchAnswer('kitn', target('kitten')).verdict).not.toBe('correct');
      // "wihskres" is 2 edits from "whiskers" (8 letters → tolerance 2): correct.
      expect(matchAnswer('wihskres', target('whiskers')).verdict).toBe('correct');
    });
  });

  describe('borderline', () => {
    it('flags a near miss just outside tolerance', () => {
      expect(matchAnswer('ktiten', target('kitten'))).toMatchObject({ verdict: 'correct' });
      expect(matchAnswer('kitn', target('kitten'))).toEqual({
        verdict: 'borderline',
        reason: 'near-miss',
        matched: 'kitten',
        distance: 2,
      });
      expect(matchAnswer('wskrs', target('whiskers'))).toMatchObject({
        verdict: 'borderline',
        reason: 'near-miss',
        distance: 3,
      });
    });

    it('flags inflected forms', () => {
      expect(matchAnswer('purring', target('purr'))).toEqual({
        verdict: 'borderline',
        reason: 'inflection',
        matched: 'purr',
        distance: 3,
      });
      expect(matchAnswer('running', target('run'))).toMatchObject({
        verdict: 'borderline',
        reason: 'inflection',
      });
    });

    it('does not flag near misses that change too much of a short word', () => {
      // "cat" → "dot": distance 2 = tolerance + 1, but ratio 2/3 > 0.4
      expect(matchAnswer('dot', target('cat'))).toEqual({ verdict: 'wrong', distance: 2 });
    });
  });

  describe('wrong', () => {
    it.each([
      ['dog', 'cat'],
      ['tail', 'whiskers'],
      ['mouse', 'whiskers'],
    ])('%j for %s', (guess, word) => {
      expect(matchAnswer(guess, target(word)).verdict).toBe('wrong');
    });

    it('rejects absurdly long input without computing distance', () => {
      expect(matchAnswer('a'.repeat(200), target('cat'))).toEqual({
        verdict: 'wrong',
        distance: Number.POSITIVE_INFINITY,
      });
    });

    it('handles a target with no usable forms', () => {
      expect(matchAnswer('cat', target('!!!'))).toEqual({ verdict: 'wrong', distance: 3 });
    });
  });

  it('honours custom options', () => {
    const strict = { ...DEFAULT_MATCH_OPTIONS, shortWordTolerance: 0 };
    expect(matchAnswer('pur', target('purr'), strict)).toMatchObject({
      verdict: 'borderline',
      reason: 'near-miss',
    });
  });

  it('is case-, whitespace- and punctuation-insensitive in every branch', () => {
    expect(matchAnswer('  WISKERS!! ', target('whiskers'))).toMatchObject({
      verdict: 'correct',
      exact: false,
    });
  });
});
