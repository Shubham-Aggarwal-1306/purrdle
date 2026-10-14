import { HINT_COUNT, LevelPackSchema, matchAnswer } from '@purrdle/shared';

import raw from '@/features/levels/data/levels.json';
import { isPlaceholderKey } from '@/features/levels/images';
import { getLevels, getNextLevel } from '@/features/levels/repository';

describe('bundled level pack', () => {
  it('passes the shared schema', () => {
    expect(LevelPackSchema.safeParse(raw).error?.issues ?? []).toEqual([]);
  });

  const levels = getLevels();

  it('has ~30 levels in sequential order', () => {
    expect(levels.length).toBeGreaterThanOrEqual(30);
    levels.forEach((l, i) => {
      expect(l.order).toBe(i + 1);
    });
  });

  it.each(levels.map((l) => [l.id, l] as const))('%s is internally consistent', (_id, level) => {
    // The answer and every variant must be accepted exactly.
    for (const form of [level.word, ...level.acceptedVariants]) {
      expect(matchAnswer(form, level)).toMatchObject({ verdict: 'correct', exact: true });
    }
    // No hint gives away the answer (any word of it, 3+ letters).
    const tokens = level.word
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length >= 3);
    expect(level.hints).toHaveLength(HINT_COUNT);
    for (const hint of level.hints) {
      for (const token of tokens) expect(hint.toLowerCase()).not.toContain(token);
    }
    // Explanations are short: 2–4 sentences.
    const sentences = level.explanation.split(/[.!?](?:\s|$)/).filter((s) => s.trim() !== '');
    expect(sentences.length).toBeGreaterThanOrEqual(2);
    expect(sentences.length).toBeLessThanOrEqual(4);
    // Placeholder images resolve to bundled art; every image carries credit + license.
    if (level.image.uri.startsWith('placeholder:')) {
      expect(isPlaceholderKey(level.image.uri.slice('placeholder:'.length))).toBe(true);
    }
    expect(level.image.credit).not.toBe('');
    expect(level.image.license).not.toBe('');
  });

  it('links each level to the next', () => {
    expect(getNextLevel(levels[0]?.id ?? '')?.id).toBe(levels[1]?.id);
    expect(getNextLevel(levels.at(-1)?.id ?? '')).toBeUndefined();
    expect(getNextLevel('nope')).toBeUndefined();
  });
});
