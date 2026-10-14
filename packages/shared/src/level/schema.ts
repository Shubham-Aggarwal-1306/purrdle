import { z } from 'zod';

import { normalizeGuess } from '../matching/normalize.ts';

export const HINT_COUNT = 5;

const nonEmpty = z.string().trim().min(1);

export const LevelImageSchema = z.object({
  /** Remote URL or a bundled-asset key resolved by the app. */
  uri: nonEmpty,
  /** Human-readable attribution, e.g. "Photo by Jane Doe on Unsplash". */
  credit: nonEmpty,
  /** License identifier, e.g. "Unsplash License", "CC BY-SA 4.0", "Own work". */
  license: nonEmpty,
});

export const DifficultySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const LevelSchema = z
  .object({
    id: nonEmpty,
    order: z.number().int().nonnegative(),
    word: nonEmpty,
    /** Other spellings/forms that count as an exact match (plurals, US/UK/IN spellings). */
    acceptedVariants: z.array(nonEmpty),
    /** Ordered vague → obvious. */
    hints: z.tuple([nonEmpty, nonEmpty, nonEmpty, nonEmpty, nonEmpty]),
    /** 2–4 sentences, pre-written. */
    explanation: nonEmpty,
    image: LevelImageSchema,
    difficulty: DifficultySchema,
  })
  .superRefine((level, ctx) => {
    const word = normalizeGuess(level.word);
    if (word === '') {
      ctx.addIssue({ code: 'custom', path: ['word'], message: 'word has no letters or digits' });
    }
    const seen = new Set([word]);
    level.acceptedVariants.forEach((variant, i) => {
      const normalized = normalizeGuess(variant);
      if (seen.has(normalized)) {
        ctx.addIssue({
          code: 'custom',
          path: ['acceptedVariants', i],
          message: `duplicates the word or another variant after normalization: "${variant}"`,
        });
      }
      seen.add(normalized);
    });
  });

export const LevelPackSchema = z
  .object({
    /** Monotonic pack version; the app keeps the highest valid one it has seen. */
    version: z.number().int().positive(),
    levels: z.array(LevelSchema).min(1),
  })
  .superRefine((pack, ctx) => {
    const ids = new Set<string>();
    const orders = new Set<number>();
    pack.levels.forEach((level, i) => {
      if (ids.has(level.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['levels', i, 'id'],
          message: `duplicate id "${level.id}"`,
        });
      }
      if (orders.has(level.order)) {
        ctx.addIssue({
          code: 'custom',
          path: ['levels', i, 'order'],
          message: `duplicate order ${String(level.order)}`,
        });
      }
      ids.add(level.id);
      orders.add(level.order);
    });
  });

export type LevelImage = z.infer<typeof LevelImageSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export type Level = z.infer<typeof LevelSchema>;
export type LevelPack = z.infer<typeof LevelPackSchema>;

/** Parses untrusted pack JSON (bundled or downloaded). Levels are returned sorted by `order`. */
export function parseLevelPack(input: unknown): LevelPack {
  const pack = LevelPackSchema.parse(input);
  return { ...pack, levels: [...pack.levels].sort((a, b) => a.order - b.order) };
}
