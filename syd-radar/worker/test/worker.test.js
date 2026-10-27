import { describe, it, expect, vi, beforeEach } from 'vitest';

const ORIGIN = 'https://syd-departures.pages.dev';
const SECRET = 'test-secret-not-real';

const flight = (id, extra = {}) => ({ id, airport_origin_code_icao: 'YSSY',
  airport_destination_code_icao: 'YMML', airport_destination_city: 'Melbourne', time_real_departure: 42, ...extra });

function makeEnv() {
  const store = new Map();
  return { store, env: {
    INGEST_SECRET: SECRET, ALLOWED_ORIGIN: ORIGIN,
    FLIGHTS_KV: {
      get: async (k) => (store.has(k) ? JSON.parse(store.get(k)) : null),
      put: async (k, v) => { store.set(k, v); },
    },
  } };
}

let worker, env;
const get = (path = '/flights', origin = ORIGIN, method = 'GET') =>
  new Request(`https://w.example${path}`, { method, headers: origin ? { Origin: origin } : {} });
const post = (body, secret = SECRET) => new Request('https://w.example/ingest', {
  method: 'POST', headers: secret ? { 'X-Ingest-Secret': secret } : {}, body: typeof body === 'string' ? body : JSON.stringify(body),
});

beforeEach(async () => {
  vi.resetModules();                       // fresh per-isolate cache each test
  worker = (await import('../index.js')).default;
  env = makeEnv().env;
});

describe('GET /flights', () => {
  it('returns the mapped flights as JSON with CORS for the Pages origin only', async () => {
    await worker.fetch(post({ entered: [flight('f1')], current: [] }), env);
    const res = await worker.fetch(get(), env);
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(res.headers.get('Cache-Control')).toContain('max-age=10');
    const body = await res.json();
    expect(body.flights[0]).toMatchObject({ id: 'f1', type: 'DEP', city: 'Melbourne', time: 42 });
    expect(JSON.stringify(body)).not.toContain(SECRET);

    const other = await worker.fetch(get('/flights', 'https://evil.example'), env);
    expect(other.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('is empty before any ingest', async () => {
    expect((await (await worker.fetch(get(), env)).json()).flights).toEqual([]);
  });

  it('rejects non-GET and answers preflight for the allowed origin', async () => {
    expect((await worker.fetch(get('/flights', ORIGIN, 'DELETE'), env)).status).toBe(405);
    const pre = await worker.fetch(get('/flights', ORIGIN, 'OPTIONS'), env);
    expect(pre.status).toBe(204);
    expect(pre.headers.get('Access-Control-Allow-Methods')).toBe('GET');
  });

  it('404s unknown paths', async () => {
    expect((await worker.fetch(get('/other'), env)).status).toBe(404);
  });
});

describe('POST /ingest', () => {
  it('requires the shared secret', async () => {
    expect((await worker.fetch(post({ entered: [flight('a')] }, null), env)).status).toBe(401);
    expect((await worker.fetch(post({ entered: [flight('a')] }, 'wrong'), env)).status).toBe(401);
  });

  it('500s when INGEST_SECRET is not configured, never accepting an empty secret', async () => {
    const res = await worker.fetch(post({ entered: [flight('a')] }, ''), { ...env, INGEST_SECRET: undefined });
    expect(res.status).toBe(500);
  });

  it('accumulates new flights, dedupes by id, and caps the list', async () => {
    await worker.fetch(post({ entered: [flight('a'), flight('a')], current: [flight('b')] }), env);
    const second = await worker.fetch(post({ entered: [flight('a'), flight('c')] }), env);
    expect(await second.json()).toEqual({ added: 1 });
    const ids = (await (await worker.fetch(get(), env)).json()).flights.map(f => f.id);
    expect(ids).toEqual(['c', 'a', 'b']);

    await worker.fetch(post({ entered: Array.from({ length: 150 }, (_, i) => flight(`n${i}`)) }), env);
    vi.resetModules(); worker = (await import('../index.js')).default;
    expect((await (await worker.fetch(get(), env)).json()).flights).toHaveLength(100);
  });

  it('rejects bad JSON, oversize bodies and non-POST methods', async () => {
    expect((await worker.fetch(post('{nope'), env)).status).toBe(400);
    expect((await worker.fetch(post('x'.repeat(300 * 1024)), env)).status).toBe(413);
    expect((await worker.fetch(get('/ingest'), env)).status).toBe(405);
  });

  it('ignores malformed flight entries and unknown fields', async () => {
    await worker.fetch(post({ entered: [{ nope: 1 }, flight('ok', { registration: 'VH-X' })], current: 'bad' }), env);
    const f = (await (await worker.fetch(get(), env)).json()).flights;
    expect(f).toHaveLength(1);
    expect(f[0]).not.toHaveProperty('registration');
  });
});
