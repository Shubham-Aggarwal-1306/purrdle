import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';

import type { JudgeService } from './judge/service.ts';
import { judgeRoutes } from './routes/judge.ts';
import { allowAllAttestor, type RequestAttestor } from './security/attestation.ts';
import type { RateLimiter, RateLimitRule } from './security/rate-limit.ts';

export interface PublicAppDeps {
  judge: JudgeService;
  limiter: RateLimiter;
  attestor?: RequestAttestor;
  deviceRule: RateLimitRule;
  ipRule: RateLimitRule;
}

/**
 * Public deployment: health + /judge only. Admin/generation routes live in a separate
 * entry point and are never registered here.
 */
export function buildPublicApp(
  deps: PublicAppDeps,
  opts: FastifyServerOptions = {},
): FastifyInstance {
  const app = Fastify({ bodyLimit: 4096, ...opts });

  app.get('/health', () => ({ status: 'ok' }));

  judgeRoutes(app, {
    service: deps.judge,
    limiter: deps.limiter,
    attestor: deps.attestor ?? allowAllAttestor,
    deviceRule: deps.deviceRule,
    ipRule: deps.ipRule,
  });

  return app;
}
