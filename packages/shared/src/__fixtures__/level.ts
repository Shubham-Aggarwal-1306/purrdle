import type { Level } from '../level/schema.ts';

export function makeLevel(overrides: Partial<Level> = {}): Level {
  return {
    id: 'lvl-001',
    order: 1,
    word: 'whiskers',
    acceptedVariants: ['whisker'],
    hints: [
      'Cats have about two dozen of these.',
      'They help a cat judge narrow gaps.',
      'They are extremely sensitive to touch.',
      'They grow on the muzzle and above the eyes.',
      'Long stiff hairs on a cat’s face.',
    ],
    explanation:
      'Whiskers are thick, deeply rooted hairs packed with nerves. Cats use them to sense air currents and measure openings.',
    image: {
      uri: 'placeholder://whiskers',
      credit: 'Placeholder art',
      license: 'Own work',
    },
    difficulty: 2,
    ...overrides,
  };
}
