/**
 * Normalizes free text for comparison:
 * - Unicode NFKD, diacritics stripped, lowercased
 * - apostrophes removed ("cat's" → "cats")
 * - other punctuation/symbols become word separators ("ice-cream" → "ice cream")
 * - whitespace collapsed and trimmed
 */
export function normalizeGuess(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/['‘’ʼ`]/gu, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim();
}

/** Normalized form with all spaces removed, so "ice cream", "ice-cream" and "icecream" compare equal. */
export function compactForm(input: string): string {
  return normalizeGuess(input).replace(/ /g, '');
}
