import type { FastifyRequest } from 'fastify';

/**
 * Proves a request comes from our genuine app on a real device.
 * TODO(phase 5): Firebase App Check (Play Integrity) — verify the `X-Firebase-AppCheck` token.
 * Until then all requests pass and rate limits are the only protection.
 */
export interface RequestAttestor {
  verify(request: FastifyRequest): Promise<boolean>;
}

export const allowAllAttestor: RequestAttestor = {
  verify: () => Promise.resolve(true),
};
