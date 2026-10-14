import { z } from 'zod';

const bool = z.enum(['true', 'false', '1', '0']).transform((v) => v === 'true' || v === '1');

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().int().positive().default(3000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    /** Cloud Run sits behind Google's front end; trust one proxy hop for the client IP. */
    TRUST_PROXY: bool.default(true),

    JUDGE_PROVIDER: z.enum(['mock', 'jev']).default('mock'),
    JUDGE_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.85),
    JUDGE_TIMEOUT_MS: z.coerce.number().int().positive().default(2500),
    JUDGE_DAILY_BUDGET: z.coerce.number().int().nonnegative().default(2000),
    JUDGE_CACHE_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(30 * 24 * 60 * 60),

    RATE_LIMIT_DEVICE_PER_HOUR: z.coerce.number().int().positive().default(30),
    RATE_LIMIT_IP_PER_MINUTE: z.coerce.number().int().positive().default(120),

    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

    JEV_API_KEY: z.string().min(1).optional(),
    JEV_BASE_URL: z.url().default('https://openrouter.ai/api/v1'),
    JEV_MODEL: z.string().min(1).optional(),
  })
  .superRefine((env, ctx) => {
    if (
      (env.UPSTASH_REDIS_REST_URL === undefined) !==
      (env.UPSTASH_REDIS_REST_TOKEN === undefined)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['UPSTASH_REDIS_REST_URL'],
        message: 'set both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, or neither',
      });
    }
    if (env.NODE_ENV === 'production' && env.UPSTASH_REDIS_REST_URL === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['UPSTASH_REDIS_REST_URL'],
        message: 'required in production (in-memory limits are per instance)',
      });
    }
    if (
      env.JUDGE_PROVIDER === 'jev' &&
      (env.JEV_API_KEY === undefined || env.JEV_MODEL === undefined)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['JEV_API_KEY'],
        message: 'JUDGE_PROVIDER=jev requires JEV_API_KEY and JEV_MODEL',
      });
    }
  });

export type Config = z.infer<typeof EnvSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = EnvSchema.safeParse(env);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment:\n${details}`);
  }
  return result.data;
}
