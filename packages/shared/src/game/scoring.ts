export type PawStars = 1 | 2 | 3;

/** 1–2 hints → 3 paws, 3–4 → 2 paws, 5 → 1 paw. */
export function pawStarsForHints(hintsUsed: number): PawStars {
  if (hintsUsed <= 2) return 3;
  if (hintsUsed <= 4) return 2;
  return 1;
}
