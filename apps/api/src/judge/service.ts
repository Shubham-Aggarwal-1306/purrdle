import { createHash } from 'node:crypto';

import { compactForm, matchAnswer } from '@purrdle/shared';

import type { KeyValueStore } from '../store/types.ts';

import { JudgeUnavailableError, type AnswerJudge, type JudgeRequest } from './types.ts';

export type JudgeSource = 'rules' | 'cache' | 'judge';

export interface JudgeOutcome {
  accepted: boolean;
  source: JudgeSource;
}

export interface JudgeServiceOptions {
  judge: AnswerJudge;
  store: KeyValueStore;
  confidenceThreshold: number;
  timeoutMs: number;
  /** Max AI calls per UTC day across all users (cost cap). Cache hits are free. */
  dailyBudget: number;
  cacheTtlSeconds: number;
  now?: () => Date;
  onError?: (err: unknown, context: string) => void;
}

/**
 * Answers "is this guess the same word?" with the cheapest source that can decide:
 * deterministic rules → shared cache → AI judge (only for `borderline`, within budget and timeout).
 */
export class JudgeService {
  constructor(private readonly options: JudgeServiceOptions) {}

  static cacheKey(request: JudgeRequest): string {
    const forms = [request.word, ...request.acceptedVariants].map(compactForm).sort();
    const material = `${forms.join('\u0000')}\u0001${compactForm(request.guess)}`;
    return `judge:v1:${createHash('sha256').update(material).digest('base64url')}`;
  }

  async decide(request: JudgeRequest): Promise<JudgeOutcome> {
    // 1. Rules: never spend an AI call on something the deterministic matcher can settle.
    const match = matchAnswer(request.guess, request);
    if (match.verdict === 'correct') return { accepted: true, source: 'rules' };
    if (match.verdict !== 'borderline') return { accepted: false, source: 'rules' };

    const { store } = this.options;
    const key = JudgeService.cacheKey(request);

    // 2. Cache (shared across players: the same near-misses repeat).
    try {
      const cached = await store.get(key);
      if (cached === '1' || cached === '0') return { accepted: cached === '1', source: 'cache' };
    } catch (err) {
      this.options.onError?.(err, 'cache-read');
    }

    // 3. AI judge, within the daily budget and a hard timeout.
    await this.consumeBudget();
    let accepted: boolean;
    try {
      const decision = await this.options.judge.judge(
        request,
        AbortSignal.timeout(this.options.timeoutMs),
      );
      accepted = decision.sameWord && decision.confidence >= this.options.confidenceThreshold;
    } catch (err) {
      if (err instanceof JudgeUnavailableError) throw err;
      throw new JudgeUnavailableError('Judge call failed', { cause: err });
    }

    try {
      await store.set(key, accepted ? '1' : '0', this.options.cacheTtlSeconds);
    } catch (err) {
      this.options.onError?.(err, 'cache-write');
    }
    return { accepted, source: 'judge' };
  }

  private async consumeBudget(): Promise<void> {
    const day = (this.options.now?.() ?? new Date()).toISOString().slice(0, 10);
    let used: number;
    try {
      used = await this.options.store.increment(`judge:budget:${day}`, 2 * 24 * 60 * 60);
    } catch (err) {
      // Without a budget counter we can't cap spend: fail closed.
      throw new JudgeUnavailableError('Budget counter unavailable', { cause: err });
    }
    if (used > this.options.dailyBudget) {
      throw new JudgeUnavailableError('Daily judge budget exhausted');
    }
  }
}
