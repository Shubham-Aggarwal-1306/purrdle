/**
 * Lightweight English inflection heuristic. Not a stemmer: it only produces candidate
 * base forms so that "purring"/"purr" or "kitties"/"kitty" can be flagged as `borderline`
 * and sent to the AI judge. False positives are acceptable (the judge decides);
 * false negatives just mean the guess is treated as wrong.
 */
const SUFFIXES = [
  'ingly',
  'ings',
  'ing',
  'edly',
  'ied',
  'ies',
  'ed',
  'ers',
  'er',
  'est',
  'es',
  's',
  'ly',
  'ness',
  'ful',
  'ish',
] as const;

const MIN_STEM_LENGTH = 3;

export function stemCandidates(word: string): Set<string> {
  const out = new Set<string>([word]);
  for (const suffix of SUFFIXES) {
    if (!word.endsWith(suffix)) continue;
    const base = word.slice(0, -suffix.length);
    if (base.length < MIN_STEM_LENGTH) continue;
    out.add(base);
    out.add(`${base}e`); // baking → bake
    if (suffix === 'ies' || suffix === 'ied') out.add(`${base}y`); // kitties → kitty
    const last = base.at(-1);
    if (last !== undefined && base.at(-2) === last && !'aeiou'.includes(last)) {
      out.add(base.slice(0, -1)); // running → run
    }
  }
  return out;
}

/** True when both words reduce to a shared base form of at least 3 letters. */
export function looksLikeInflection(a: string, b: string): boolean {
  if (a === b) return false;
  const stemsA = stemCandidates(a);
  for (const stem of stemCandidates(b)) {
    if (stem.length >= MIN_STEM_LENGTH && stemsA.has(stem)) return true;
  }
  return false;
}
