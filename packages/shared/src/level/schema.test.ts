import { makeLevel } from '../__fixtures__/level.ts';

import { LevelPackSchema, LevelSchema, parseLevelPack } from './schema.ts';

describe('LevelSchema', () => {
  it('accepts a valid level', () => {
    expect(LevelSchema.parse(makeLevel())).toEqual(makeLevel());
  });

  it('requires exactly five non-empty hints', () => {
    const level = makeLevel();
    expect(LevelSchema.safeParse({ ...level, hints: level.hints.slice(0, 4) }).success).toBe(false);
    expect(LevelSchema.safeParse({ ...level, hints: [...level.hints, 'extra'] }).success).toBe(
      false,
    );
    expect(LevelSchema.safeParse({ ...level, hints: ['a', 'b', ' ', 'd', 'e'] }).success).toBe(
      false,
    );
  });

  it.each([
    ['difficulty 0', { difficulty: 0 }],
    ['difficulty 6', { difficulty: 6 }],
    ['negative order', { order: -1 }],
    ['fractional order', { order: 1.5 }],
    ['empty id', { id: '' }],
    ['blank word', { word: '   ' }],
    ['punctuation-only word', { word: '?!' }],
    ['empty explanation', { explanation: '' }],
    ['missing image credit', { image: { uri: 'x', credit: '', license: 'CC0' } }],
    ['missing image license', { image: { uri: 'x', credit: 'Me', license: '' } }],
  ])('rejects %s', (_label, patch) => {
    expect(LevelSchema.safeParse({ ...makeLevel(), ...patch }).success).toBe(false);
  });

  it('rejects variants that duplicate the word or each other after normalization', () => {
    const dupOfWord = LevelSchema.safeParse(makeLevel({ acceptedVariants: ['Whiskers!'] }));
    expect(dupOfWord.success).toBe(false);
    expect(dupOfWord.error?.issues[0]?.path).toEqual(['acceptedVariants', 0]);

    const dupOfVariant = LevelSchema.safeParse(
      makeLevel({ acceptedVariants: ['whisker', 'WHISKER'] }),
    );
    expect(dupOfVariant.success).toBe(false);
    expect(dupOfVariant.error?.issues[0]?.path).toEqual(['acceptedVariants', 1]);
  });

  it('allows no variants', () => {
    expect(LevelSchema.safeParse(makeLevel({ acceptedVariants: [] })).success).toBe(true);
  });
});

describe('LevelPackSchema / parseLevelPack', () => {
  const a = makeLevel({ id: 'a', order: 2 });
  const b = makeLevel({ id: 'b', order: 1, word: 'purr', acceptedVariants: [] });

  it('parses and sorts levels by order', () => {
    const pack = parseLevelPack({ version: 1, levels: [a, b] });
    expect(pack.levels.map((l) => l.id)).toEqual(['b', 'a']);
  });

  it('rejects duplicate ids and orders', () => {
    const result = LevelPackSchema.safeParse({
      version: 1,
      levels: [a, { ...b, id: 'a' }, { ...b, id: 'c', order: 2 }],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.message)).toEqual([
      'duplicate id "a"',
      'duplicate order 2',
    ]);
  });

  it('rejects empty packs and bad versions', () => {
    expect(LevelPackSchema.safeParse({ version: 1, levels: [] }).success).toBe(false);
    expect(LevelPackSchema.safeParse({ version: 0, levels: [a] }).success).toBe(false);
  });

  it('throws on untrusted garbage', () => {
    expect(() => parseLevelPack(null)).toThrow();
    expect(() => parseLevelPack({ version: 1, levels: [{ id: 'x' }] })).toThrow();
  });
});
