/**
 * Unrestricted Damerau–Levenshtein distance (Lowrance–Wagner): insertions, deletions,
 * substitutions and transpositions of adjacent characters, each costing 1. Unlike the
 * "optimal string alignment" variant, a transposed pair may be edited again
 * (e.g. "ca" → "abc" is 2, not 3). Operates on Unicode code points.
 */
export function damerauLevenshtein(a: string, b: string): number {
  const s = Array.from(a);
  const t = Array.from(b);
  const n = s.length;
  const m = t.length;
  if (n === 0) return m;
  if (m === 0) return n;

  const inf = n + m;
  const width = m + 2;
  // (n + 2) × (m + 2) matrix, row-major; row/col 0 hold the sentinel "infinity".
  const d = new Array<number>((n + 2) * width).fill(0);
  const get = (i: number, j: number): number => d[i * width + j] ?? inf;
  const set = (i: number, j: number, v: number): void => {
    d[i * width + j] = v;
  };

  set(0, 0, inf);
  for (let i = 0; i <= n; i++) {
    set(i + 1, 0, inf);
    set(i + 1, 1, i);
  }
  for (let j = 0; j <= m; j++) {
    set(0, j + 1, inf);
    set(1, j + 1, j);
  }

  // Last row (1-based) in `s` where each character was seen.
  const lastRow = new Map<string, number>();

  for (let i = 1; i <= n; i++) {
    const si = s[i - 1] ?? '';
    let lastMatchCol = 0;
    for (let j = 1; j <= m; j++) {
      const tj = t[j - 1] ?? '';
      const i1 = lastRow.get(tj) ?? 0;
      const j1 = lastMatchCol;
      const cost = si === tj ? 0 : 1;
      if (cost === 0) lastMatchCol = j;
      set(
        i + 1,
        j + 1,
        Math.min(
          get(i, j) + cost, // substitution / match
          get(i + 1, j) + 1, // insertion
          get(i, j + 1) + 1, // deletion
          get(i1, j1) + (i - i1 - 1) + 1 + (j - j1 - 1), // transposition
        ),
      );
    }
    lastRow.set(si, i);
  }

  return get(n + 1, m + 1);
}
