import {
  JudgeUnavailableError,
  type AnswerJudge,
  type JudgeDecision,
  type JudgeRequest,
} from './types.ts';

export interface JevOptions {
  apiKey: string;
  /** e.g. OpenRouter or Vercel AI Gateway base URL. */
  baseUrl: string;
  model: string;
}

/** The yes/no question Jev answers. Kept separate so it can be reviewed and tested. */
export function jevQuestion(request: JudgeRequest): string {
  const variants =
    request.acceptedVariants.length > 0
      ? ` Accepted spellings/forms: ${request.acceptedVariants.map((v) => `"${v}"`).join(', ')}.`
      : '';
  return (
    `In a word-guessing game the answer is "${request.word}".${variants} ` +
    `A player guessed "${request.guess}". Is the guess the same word as the answer ` +
    `(allowing for a misspelling or a different grammatical form of the same word), ` +
    `rather than a different word?`
  );
}

/**
 * Jev (TypeSafe AI) decision model — boolean answer + confidence.
 *
 * TODO(jev): implement once the request/response format is confirmed. Jev is reachable via
 * OpenRouter and Vercel AI Gateway, but its typed-output request shape and where the confidence
 * is returned are not documented to us yet, so this deliberately does not guess. Until then every
 * call reports the judge as unavailable, and the app treats borderline guesses as wrong.
 */
export class JevJudge implements AnswerJudge {
  readonly name = 'jev';

  constructor(private readonly options: JevOptions) {}

  // Will POST jevQuestion(request) using this.options, honouring the abort signal.
  judge(): Promise<JudgeDecision> {
    return Promise.reject(
      new JudgeUnavailableError('Jev client not implemented: request/response format pending'),
    );
  }
}
