import type { FastifyBaseLogger } from 'fastify';

import { buildPublicApp } from './app.ts';
import { loadConfig } from './config.ts';
import { createPublicDeps } from './deps.ts';

const config = loadConfig();

// Dependencies log through Fastify's logger, which exists only once the app is built.
const logRef: { current?: FastifyBaseLogger } = {};
const deps = createPublicDeps(config, {
  warn: (obj, msg) => {
    if (logRef.current) logRef.current.warn(obj, msg);
    else console.warn(msg, obj);
  },
});
const app = buildPublicApp(deps, {
  logger: { level: config.LOG_LEVEL },
  trustProxy: config.TRUST_PROXY,
});
logRef.current = app.log;

try {
  await app.listen({ host: config.HOST, port: config.PORT });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
