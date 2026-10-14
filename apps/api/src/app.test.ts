import type { FastifyInstance } from 'fastify';

import { buildPublicApp } from './app.ts';
import { loadConfig } from './config.ts';
import { createPublicDeps } from './deps.ts';
import { JudgeService } from './judge/service.ts';
import type { AnswerJudge } from './judge/types.ts';
import { RateLimiter } from './security/rate-limit.ts';
import { MemoryStore } from './store/memory.ts';

const DEVICE = 'device-1234-abcd';
const body = { word: 'purr', acceptedVariants: ['purrs'], guess: 'purring' };

function build(judge: AnswerJudge, opts: { deviceLimit?: number; attest?: boolean } = {}) {
  const store = new MemoryStore();
  return buildPublicApp(
    {
      judge: new JudgeService({
        judge,
        store,
        confidenceThreshold: 0.85,
        timeoutMs: 100,
        dailyBudget: 100,
        cacheTtlSeconds: 60,
      }),
      limiter: new RateLimiter(store),
      attestor: { verify: () => Promise.resolve(opts.attest ?? true) },
      deviceRule: { name: 'device', limit: opts.deviceLimit ?? 30, windowSeconds: 3600 },
      ipRule: { name: 'ip', limit: 100, windowSeconds: 60 },
    },
    { trustProxy: true },
  );
}

const accept: AnswerJudge = {
  name: 'accept',
  judge: () => Promise.resolve({ sameWord: true, confidence: 0.95 }),
};
const broken: AnswerJudge = { name: 'broken', judge: () => Promise.reject(new Error('boom')) };

const post = (app: FastifyInstance, payload: unknown, headers: Record<string, string> = {}) =>
  app.inject({
    method: 'POST',
    url: '/judge',
    payload: payload as Record<string, unknown>,
    headers: { 'x-installation-id': DEVICE, ...headers },
  });

describe('public app', () => {
  it('serves /health', async () => {
    const res = await build(accept).inject({ method: 'GET', url: '/health' });
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('judges borderline guesses', async () => {
    const res = await post(build(accept), body);
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ accepted: true, source: 'judge' });
  });

  it('answers clear cases from rules', async () => {
    const res = await post(build(broken), { ...body, guess: 'zebra' });
    expect(res.json()).toEqual({ accepted: false, source: 'rules' });
  });

  it('requires an installation id', async () => {
    const res = await build(accept).inject({ method: 'POST', url: '/judge', payload: body });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'missing_installation_id' });
  });

  it.each([
    ['missing guess', { word: 'purr' }],
    ['unknown field', { ...body, levelId: 'x' }],
    ['oversized guess', { ...body, guess: 'a'.repeat(65) }],
    [
      'too many variants',
      { ...body, acceptedVariants: Array.from({ length: 21 }, (_, i) => `v${String(i)}`) },
    ],
  ])('rejects %s', async (_label, payload) => {
    const res = await post(build(accept), payload);
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'invalid_body' });
  });

  it('rejects oversized requests at the transport level', async () => {
    const res = await post(build(accept), { ...body, acceptedVariants: ['x'.repeat(5000)] });
    expect(res.statusCode).toBe(413);
  });

  it('rate-limits per device with Retry-After', async () => {
    const app = build(accept, { deviceLimit: 1 });
    expect((await post(app, body)).statusCode).toBe(200);
    const res = await post(app, body);
    expect(res.statusCode).toBe(429);
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
    // A different device is unaffected.
    expect((await post(app, body, { 'x-installation-id': 'other-device-5678' })).statusCode).toBe(
      200,
    );
  });

  it('returns 503 when the judge is unavailable', async () => {
    const res = await post(build(broken), body);
    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({ error: 'unavailable' });
  });

  it('returns 401 when attestation fails', async () => {
    expect((await post(build(accept, { attest: false }), body)).statusCode).toBe(401);
  });
});

describe('createPublicDeps', () => {
  it('wires the mock judge and memory store by default', async () => {
    const warn = jest.fn();
    const app = buildPublicApp(createPublicDeps(loadConfig({}), { warn }));
    const res = await post(app, body);
    expect(res.json()).toEqual({ accepted: true, source: 'judge' });
    expect(warn).not.toHaveBeenCalled();
  });

  it('wires the Jev stub when configured (reports unavailable)', async () => {
    const config = loadConfig({ JUDGE_PROVIDER: 'jev', JEV_API_KEY: 'k', JEV_MODEL: 'm' });
    const res = await post(buildPublicApp(createPublicDeps(config, { warn: jest.fn() })), body);
    expect(res.statusCode).toBe(503);
  });

  it('warns when the mock judge runs in production', () => {
    const warn = jest.fn();
    createPublicDeps(
      loadConfig({
        NODE_ENV: 'production',
        UPSTASH_REDIS_REST_URL: 'https://x.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 't',
      }),
      { warn },
    );
    expect(warn).toHaveBeenCalledWith({}, expect.stringContaining('mock'));
  });
});
