/**
 * Normalizes free-text input for comparison: lowercases, strips diacritics and
 * punctuation, and collapses whitespace. Full answer matching lands in Phase 1.
 */
export function normalizeGuess(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}
