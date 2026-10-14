import { StoreUnavailableError, type KeyValueStore } from './types.ts';

type Command = (string | number)[];

interface UpstashResult {
  result?: unknown;
  error?: string;
}

export interface UpstashOptions {
  url: string;
  token: string;
  timeoutMs?: number;
  fetch?: typeof fetch;
}

/**
 * Upstash Redis over its REST API using the platform `fetch` — no client dependency.
 * Commands are JSON arrays: POST {url} with ["GET","k"]; POST {url}/pipeline with [[...],[...]].
 */
export class UpstashStore implements KeyValueStore {
  private readonly url: string;
  private readonly token: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: UpstashOptions) {
    this.url = options.url.replace(/\/+$/, '');
    this.token = options.token;
    this.timeoutMs = options.timeoutMs ?? 1500;
    this.fetchImpl = options.fetch ?? fetch;
  }

  private async post(path: string, body: Command | Command[]): Promise<unknown> {
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.url}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err) {
      throw new StoreUnavailableError('Upstash request failed', { cause: err });
    }
    if (!res.ok) throw new StoreUnavailableError(`Upstash responded ${String(res.status)}`);
    return res.json();
  }

  private async command(cmd: Command): Promise<unknown> {
    const data = (await this.post('', cmd)) as UpstashResult;
    if (data.error) throw new StoreUnavailableError(`Upstash error: ${data.error}`);
    return data.result;
  }

  private async pipeline(cmds: Command[]): Promise<unknown[]> {
    const data = (await this.post('/pipeline', cmds)) as UpstashResult[];
    return data.map((r) => {
      if (r.error) throw new StoreUnavailableError(`Upstash error: ${r.error}`);
      return r.result;
    });
  }

  async get(key: string): Promise<string | null> {
    const result = await this.command(['GET', key]);
    return typeof result === 'string' ? result : null;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.command(['SET', key, value, 'EX', ttlSeconds]);
  }

  async increment(key: string, ttlSeconds: number): Promise<number> {
    // SET NX creates the window with its TTL only once; INCR then counts within it.
    const [, count] = await this.pipeline([
      ['SET', key, 0, 'EX', ttlSeconds, 'NX'],
      ['INCR', key],
    ]);
    if (typeof count !== 'number') throw new StoreUnavailableError('Unexpected INCR result');
    return count;
  }
}
