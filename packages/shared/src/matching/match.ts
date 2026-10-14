import { damerauLevenshtein } from './damerau-levenshtein.ts';
import { looksLikeInflection } from './morphology.ts';
import { compactForm } from './normalize.ts';

export interface MatchOptions {
  /** Answers with at most this many letters must be typed exactly (no typo or near-miss leniency). */
  exactMatchMaxLength: number;
  /** Answers with at most this many letters use `shortWordTolerance`. */
  shortWordMaxLength: number;
  /** Max typo distance still accepted as correct for short answers. */
  shortWordTolerance: number;
  /** Max typo distance still accepted as correct for longer answers. */
  longWordTolerance: number;
  /** A guess up to this much further than the tolerance is `borderline`… */
  borderlineExtraDistance: number;
  /** …but only if distance / max(guess, answer length) stays at or below this ratio. */
  borderlineMaxRatio: number;
  /** Guesses longer than this (in letters) are rejected without computing distance. */
  maxGuessLength: number;
}

/** Defaults: exact for ≤3 letters, ≤1 typo for 4–6 letters, ≤2 for longer answers. */
export const DEFAULT_MATCH_OPTIONS: Readonly<MatchOptions> = Object.freeze({
  exactMatchMaxLength: 3,
  shortWordMaxLength: 6,
  shortWordTolerance: 1,
  longWordTolerance: 2,
  borderlineExtraDistance: 1,
  borderlineMaxRatio: 0.4,
  maxGuessLength: 64,
});

export interface MatchTarget {
  word: string;
  acceptedVariants: readonly string[];
}

export type MatchResult =
  /** Nothing left after normalization (empty/punctuation only). Should not consume a guess. */
  | { verdict: 'invalid' }
  /** Exact match with the word or an accepted variant (after normalization). */
  | { verdict: 'correct'; exact: true; matched: string }
  /** Within typo tolerance: correct, but the UI should show the right spelling. */
  | { verdict: 'correct'; exact: false; matched: string; distance: number }
  /** Close-ish or an inflected form: ask the AI judge; treat as wrong if unavailable. */
  | { verdict: 'borderline'; reason: 'near-miss' | 'inflection'; matched: string; distance: number }
  | { verdict: 'wrong'; distance: number };

export function typoTolerance(
  answerLength: number,
  options: MatchOptions = DEFAULT_MATCH_OPTIONS,
): number {
  if (answerLength <= options.exactMatchMaxLength) return 0;
  return answerLength <= options.shortWordMaxLength
    ? options.shortWordTolerance
    : options.longWordTolerance;
}

const letterCount = (s: string): number => Array.from(s).length;

/**
 * Deterministic, offline answer check. Compares the guess against the word and every
 * accepted variant (spaces/punctuation ignored) and returns the most favourable verdict.
 */
export function matchAnswer(
  guess: string,
  target: MatchTarget,
  options: MatchOptions = DEFAULT_MATCH_OPTIONS,
): MatchResult {
  const g = compactForm(guess);
  if (g === '') return { verdict: 'invalid' };

  const candidates = [target.word, ...target.acceptedVariants]
    .map((raw) => ({ raw, compact: compactForm(raw) }))
    .filter((c) => c.compact !== '');

  const exact = candidates.find((c) => c.compact === g);
  if (exact) return { verdict: 'correct', exact: true, matched: exact.raw };

  const guessLength = letterCount(g);
  if (guessLength > options.maxGuessLength) {
    return { verdict: 'wrong', distance: Number.POSITIVE_INFINITY };
  }

  const scored = candidates
    .map((c) => {
      const length = letterCount(c.compact);
      return {
        ...c,
        length,
        distance: damerauLevenshtein(g, c.compact),
        tolerance: typoTolerance(length, options),
      };
    })
    .sort((a, b) => a.distance - b.distance);

  const close = scored.find((c) => c.distance <= c.tolerance);
  if (close) {
    return { verdict: 'correct', exact: false, matched: close.raw, distance: close.distance };
  }

  const nearMiss = scored.find(
    (c) =>
      c.length > options.exactMatchMaxLength &&
      c.distance <= c.tolerance + options.borderlineExtraDistance &&
      c.distance / Math.max(c.length, guessLength) <= options.borderlineMaxRatio,
  );
  if (nearMiss) {
    return {
      verdict: 'borderline',
      reason: 'near-miss',
      matched: nearMiss.raw,
      distance: nearMiss.distance,
    };
  }

  const inflected = scored.find((c) => looksLikeInflection(g, c.compact));
  if (inflected) {
    return {
      verdict: 'borderline',
      reason: 'inflection',
      matched: inflected.raw,
      distance: inflected.distance,
    };
  }

  return { verdict: 'wrong', distance: scored[0]?.distance ?? guessLength };
}
