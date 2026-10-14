export * from './level/schema.ts';

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

export * from './game/state.ts';
export * from './game/selectors.ts';
export * from './game/scoring.ts';
export {
  transition,
  type GameContext,
  type GameEffect,
  type GameEvent,
  type RejectReason,
  type Transition,
} from './game/machine.ts';
