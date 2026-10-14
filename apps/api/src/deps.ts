import type { Config } from './config.ts';
import { JevJudge } from './judge/jev.ts';
import { MockJudge } from './judge/mock.ts';
import { JudgeService } from './judge/service.ts';
import type { AnswerJudge } from './judge/types.ts';
import type { PublicAppDeps } from './app.ts';
import { RateLimiter } from './security/rate-limit.ts';
import { MemoryStore } from './store/memory.ts';
import type { KeyValueStore } from './store/types.ts';
import { UpstashStore } from './store/upstash.ts';

export interface WarnLogger {
  warn(obj: object, msg: string): void;
}

/** Wires real dependencies from config (used by the server entry point). */
export function createPublicDeps(config: Config, log: WarnLogger): PublicAppDeps {
  const store: KeyValueStore =
    config.UPSTASH_REDIS_REST_URL && config.UPSTASH_REDIS_REST_TOKEN
      ? new UpstashStore({
          url: config.UPSTASH_REDIS_REST_URL,
          token: config.UPSTASH_REDIS_REST_TOKEN,
        })
      : new MemoryStore();

  let judge: AnswerJudge;
  if (config.JUDGE_PROVIDER === 'jev' && config.JEV_API_KEY && config.JEV_MODEL) {
    judge = new JevJudge({
      apiKey: config.JEV_API_KEY,
      baseUrl: config.JEV_BASE_URL,
      model: config.JEV_MODEL,
    });
  } else {
    judge = new MockJudge();
  }
  if (config.NODE_ENV === 'production' && judge.name === 'mock') {
    log.warn({}, 'JUDGE_PROVIDER=mock in production: borderline guesses are judged by heuristics');
  }

  return {
    judge: new JudgeService({
      judge,
      store,
      confidenceThreshold: config.JUDGE_CONFIDENCE_THRESHOLD,
      timeoutMs: config.JUDGE_TIMEOUT_MS,
      dailyBudget: config.JUDGE_DAILY_BUDGET,
      cacheTtlSeconds: config.JUDGE_CACHE_TTL_SECONDS,
      onError: (err, context) => {
        log.warn({ err, context }, 'judge store error');
      },
    }),
    limiter: new RateLimiter(store),
    deviceRule: { name: 'device', limit: config.RATE_LIMIT_DEVICE_PER_HOUR, windowSeconds: 3600 },
    ipRule: { name: 'ip', limit: config.RATE_LIMIT_IP_PER_MINUTE, windowSeconds: 60 },
  };
}
