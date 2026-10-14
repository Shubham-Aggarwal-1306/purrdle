import { StoreUnavailableError } from './types.ts';
import { UpstashStore } from './upstash.ts';

function fakeFetch(responses: unknown[], status = 200) {
  const calls: { url: string; body: unknown; auth: string | null }[] = [];
  const impl = jest.fn((url: string, init: RequestInit & { body: string }) => {
    const headers = new Headers(init.headers);
    calls.push({
      url,
      body: JSON.parse(init.body) as unknown,
      auth: headers.get('authorization'),
    });
    return Promise.resolve(new Response(JSON.stringify(responses.shift()), { status }));
  });
  return { impl: impl as unknown as typeof fetch, calls };
}

const offline: typeof fetch = () => Promise.reject(new Error('offline'));

const make = (f: typeof fetch) =>
  new UpstashStore({ url: 'https://example.upstash.io/', token: 'tok', fetch: f });

describe('UpstashStore', () => {
  it('GETs with a bearer token', async () => {
    const { impl, calls } = fakeFetch([{ result: 'v' }, { result: null }]);
    const store = make(impl);
    expect(await store.get('k')).toBe('v');
    expect(await store.get('missing')).toBeNull();
    expect(calls[0]).toEqual({
      url: 'https://example.upstash.io',
      body: ['GET', 'k'],
      auth: 'Bearer tok',
    });
  });

  it('SETs with an expiry', async () => {
    const { impl, calls } = fakeFetch([{ result: 'OK' }]);
    await make(impl).set('k', 'v', 30);
    expect(calls[0]?.body).toEqual(['SET', 'k', 'v', 'EX', 30]);
  });

  it('increments via a SET NX + INCR pipeline', async () => {
    const { impl, calls } = fakeFetch([[{ result: 'OK' }, { result: 3 }]]);
    expect(await make(impl).increment('c', 60)).toBe(3);
    expect(calls[0]?.url).toBe('https://example.upstash.io/pipeline');
    expect(calls[0]?.body).toEqual([
      ['SET', 'c', 0, 'EX', 60, 'NX'],
      ['INCR', 'c'],
    ]);
  });

  it.each([
    ['HTTP errors', () => fakeFetch([{}], 500).impl],
    ['command errors', () => fakeFetch([{ error: 'WRONGTYPE' }]).impl],
    ['network errors', () => offline],
  ])('wraps %s as StoreUnavailableError', async (_label, makeFetch) => {
    await expect(make(makeFetch()).get('k')).rejects.toBeInstanceOf(StoreUnavailableError);
  });

  it('rejects pipeline errors and non-numeric counters', async () => {
    await expect(
      make(fakeFetch([[{ result: 'OK' }, { error: 'boom' }]]).impl).increment('c', 1),
    ).rejects.toBeInstanceOf(StoreUnavailableError);
    await expect(
      make(fakeFetch([[{ result: 'OK' }, { result: 'x' }]]).impl).increment('c', 1),
    ).rejects.toBeInstanceOf(StoreUnavailableError);
  });
});
