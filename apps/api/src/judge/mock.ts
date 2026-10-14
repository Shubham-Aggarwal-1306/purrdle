import { matchAnswer } from '@purrdle/shared';

import type { AnswerJudge, JudgeDecision, JudgeRequest } from './types.ts';

/**
 * Deterministic stand-in for local development and tests. Accepts inflections and near misses
 * with confidences on either side of the default 0.85 threshold, so threshold behaviour is visible.
 */
export class MockJudge implements AnswerJudge {
  readonly name = 'mock';

  judge(request: JudgeRequest): Promise<JudgeDecision> {
    const result = matchAnswer(request.guess, request);
    if (result.verdict === 'correct') return Promise.resolve({ sameWord: true, confidence: 0.99 });
    if (result.verdict === 'borderline') {
      return Promise.resolve(
        result.reason === 'inflection'
          ? { sameWord: true, confidence: 0.9 }
          : { sameWord: true, confidence: result.distance <= 2 ? 0.88 : 0.7 },
      );
    }
    return Promise.resolve({ sameWord: false, confidence: 0.95 });
  }
}
