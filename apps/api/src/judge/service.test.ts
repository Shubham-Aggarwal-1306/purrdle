import { MemoryStore } from '../store/memory.ts';
import type { KeyValueStore } from '../store/types.ts';

import { MockJudge } from './mock.ts';
import { JudgeService, type JudgeServiceOptions } from './service.ts';
import { JudgeUnavailableError, type AnswerJudge, type JudgeDecision } from './types.ts';

const purr = { word: 'purr', acceptedVariants: ['purrs'] };

function fakeJudge(decision: JudgeDecision | Error | 'hang'): AnswerJudge & { calls: number } {
  const judge = {
    name: 'fake',
    calls: 0,
    judge(_req: unknown, signal: AbortSignal): Promise<JudgeDecision> {
      judge.calls++;
      if (decision === 'hang') {
        return new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            reject(new Error('aborted'));
          });
        });
      }
      return decision instanceof Error ? Promise.reject(decision) : Promise.resolve(decision);
    },
  };
  return judge;
}

function service(judge: AnswerJudge, overrides: Partial<JudgeServiceOptions> = {}) {
  return new JudgeService({
    judge,
    store: new MemoryStore(),
    confidenceThreshold: 0.85,
    timeoutMs: 50,
    dailyBudget: 100,
    cacheTtlSeconds: 60,
    now: () => new Date('2026-10-14T12:00:00Z'),
    ...overrides,
  });
}

describe('JudgeService', () => {
  it('settles exact/typo guesses with rules, without calling the judge', async () => {
    const judge = fakeJudge({ sameWord: false, confidence: 1 });
    const s = service(judge);
    expect(await s.decide({ ...purr, guess: 'PURR' })).toEqual({ accepted: true, source: 'rules' });
    expect(await s.decide({ ...purr, guess: 'pur' })).toEqual({ accepted: true, source: 'rules' });
    expect(await s.decide({ ...purr, guess: 'zebra' })).toEqual({
      accepted: false,
      source: 'rules',
    });
    expect(await s.decide({ ...purr, guess: '!!!' })).toEqual({ accepted: false, source: 'rules' });
    expect(judge.calls).toBe(0);
  });

  it('asks the judge for borderline guesses and applies the threshold', async () => {
    expect(
      await service(fakeJudge({ sameWord: true, confidence: 0.9 })).decide({
        ...purr,
        guess: 'purring',
      }),
    ).toEqual({ accepted: true, source: 'judge' });
    expect(
      await service(fakeJudge({ sameWord: true, confidence: 0.84 })).decide({
        ...purr,
        guess: 'purring',
      }),
    ).toEqual({ accepted: false, source: 'judge' });
    expect(
      await service(fakeJudge({ sameWord: false, confidence: 0.99 })).decide({
        ...purr,
        guess: 'purring',
      }),
    ).toEqual({ accepted: false, source: 'judge' });
  });

  it('caches decisions across players, regardless of casing and variant order', async () => {
    const judge = fakeJudge({ sameWord: true, confidence: 0.9 });
    const s = service(judge);
    await s.decide({ ...purr, guess: 'purring' });
    expect(
      await s.decide({ word: 'PURR', acceptedVariants: ['Purrs'], guess: ' Purring ' }),
    ).toEqual({
      accepted: true,
      source: 'cache',
    });
    expect(judge.calls).toBe(1);
    expect(JudgeService.cacheKey({ word: 'a', acceptedVariants: ['b', 'c'], guess: 'x' })).toBe(
      JudgeService.cacheKey({ word: 'a', acceptedVariants: ['c', 'b'], guess: 'X!' }),
    );
  });

  it('caches rejections too', async () => {
    const judge = fakeJudge({ sameWord: false, confidence: 0.99 });
    const s = service(judge);
    await s.decide({ ...purr, guess: 'purring' });
    expect(await s.decide({ ...purr, guess: 'purring' })).toEqual({
      accepted: false,
      source: 'cache',
    });
  });

  it('enforces the daily budget (cache hits stay free)', async () => {
    const judge = fakeJudge({ sameWord: true, confidence: 0.9 });
    const s = service(judge, { dailyBudget: 1 });
    await s.decide({ ...purr, guess: 'purring' });
    await expect(s.decide({ ...purr, guess: 'purred' })).rejects.toBeInstanceOf(
      JudgeUnavailableError,
    );
    expect(await s.decide({ ...purr, guess: 'purring' })).toMatchObject({ source: 'cache' });
  });

  it('reports judge failures and timeouts as unavailable', async () => {
    await expect(
      service(fakeJudge(new Error('upstream 500'))).decide({ ...purr, guess: 'purring' }),
    ).rejects.toBeInstanceOf(JudgeUnavailableError);
    await expect(
      service(fakeJudge(new JudgeUnavailableError('nope'))).decide({ ...purr, guess: 'purring' }),
    ).rejects.toThrow('nope');
    await expect(
      service(fakeJudge('hang')).decide({ ...purr, guess: 'purring' }),
    ).rejects.toBeInstanceOf(JudgeUnavailableError);
  });

  it('still judges when the cache is down, but fails closed without a budget counter', async () => {
    const errors: string[] = [];
    const flaky: KeyValueStore = {
      get: () => Promise.reject(new Error('down')),
      set: () => Promise.reject(new Error('down')),
      increment: () => Promise.resolve(1),
    };
    const s = service(fakeJudge({ sameWord: true, confidence: 0.9 }), {
      store: flaky,
      onError: (_e, ctx) => errors.push(ctx),
    });
    expect(await s.decide({ ...purr, guess: 'purring' })).toEqual({
      accepted: true,
      source: 'judge',
    });
    expect(errors).toEqual(['cache-read', 'cache-write']);

    const noCounter: KeyValueStore = {
      ...flaky,
      increment: () => Promise.reject(new Error('down')),
    };
    await expect(
      service(fakeJudge({ sameWord: true, confidence: 0.9 }), { store: noCounter }).decide({
        ...purr,
        guess: 'purring',
      }),
    ).rejects.toBeInstanceOf(JudgeUnavailableError);
  });
});

describe('MockJudge', () => {
  it('is deterministic and straddles the default threshold', async () => {
    const judge: AnswerJudge = new MockJudge();
    const signal = new AbortController().signal;
    expect(await judge.judge({ ...purr, guess: 'purring' }, signal)).toEqual({
      sameWord: true,
      confidence: 0.9,
    });
    expect(
      await judge.judge({ word: 'kitten', acceptedVariants: [], guess: 'kitn' }, signal),
    ).toEqual({
      sameWord: true,
      confidence: 0.88,
    });
    expect(
      await judge.judge({ word: 'whiskers', acceptedVariants: [], guess: 'wskrs' }, signal),
    ).toEqual({
      sameWord: true,
      confidence: 0.7,
    });
    expect(await judge.judge({ ...purr, guess: 'purr' }, signal)).toEqual({
      sameWord: true,
      confidence: 0.99,
    });
    expect(await judge.judge({ ...purr, guess: 'zebra' }, signal)).toEqual({
      sameWord: false,
      confidence: 0.95,
    });
  });
});
