export interface JudgeRequest {
  word: string;
  acceptedVariants: readonly string[];
  guess: string;
}

/** A typed decision, not text: is the guess the same word as the answer, and how sure. */
export interface JudgeDecision {
  sameWord: boolean;
  /** 0…1 */
  confidence: number;
}

/** Provider-agnostic AI judge. Swap implementations via config (mock, jev, …). */
export interface AnswerJudge {
  readonly name: string;
  judge(request: JudgeRequest, signal: AbortSignal): Promise<JudgeDecision>;
}

/** The provider could not answer (not configured, timeout, upstream error, budget exhausted). */
export class JudgeUnavailableError extends Error {
  override name = 'JudgeUnavailableError';
}
