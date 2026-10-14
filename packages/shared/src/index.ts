export { compactForm, normalizeGuess } from './matching/normalize.ts';
export { damerauLevenshtein } from './matching/damerau-levenshtein.ts';
export {
  DEFAULT_MATCH_OPTIONS,
  matchAnswer,
  typoTolerance,
  type MatchOptions,
  type MatchResult,
  type MatchTarget,
} from './matching/match.ts';
