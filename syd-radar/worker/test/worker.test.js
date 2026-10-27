import { describe, it, expect, vi, beforeEach } from 'vitest';

const ORIGIN = 'https://syd-departures.pages.dev';
const env = { HA_TOKEN: 'test-token-not-real', HA_BASE_URL: 'https://ha.example:8123', ALLOWED_ORIGIN: ORIGIN };
const state = { attributes: { flights: [{ id: 'f1', airport_origin_code_icao: 'YSSY',
  airport_destination_code_icao: 'YMML', airport_destination_city: 'Melbourne', time_real_departure: 42 }] } };

let worker;
const req = (method = 'GET', path = '/flights', origin = ORIGIN) =>
  new Request(`https://w.example${path}`, { method, headers: origin ? { Origin: origin } : {} });

beforeEach(async () => {
  vi.resetModules();                       // fresh per-isolate cache each test
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(state))));
  worker = (await import('../index.js')).default;
});

describe('worker', () => {
  it('returns only the mapped flight fields as JSON with CORS for the Pages origin', async () => {
    const res = await worker.fetch(req(), env);
    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(res.headers.get('Cache-Control')).toContain('max-age=10');
    const body = await res.json();
    expect(body.flights[0]).toMatchObject({ id: 'f1', type: 'DEP', city: 'Melbourne', time: 42 });
    expect(JSON.stringify(body)).not.toContain(env.HA_TOKEN);
  });

  it('queries only the two sensors, sending the token server-side', async () => {
    await worker.fetch(req(), env);
    const calls = fetch.mock.calls;
    expect(calls.map(c => c[0]).sort()).toEqual([
      'https://ha.example:8123/api/states/sensor.outside_flightradar24_current_in_area',
      'https://ha.example:8123/api/states/sensor.outside_flightradar24_entered_area',
    ]);
    expect(calls[0][1].headers.Authorization).toBe(`Bearer ${env.HA_TOKEN}`);
  });

  it('caches so repeat requests do not hit HA again', async () => {
    await worker.fetch(req(), env);
    await worker.fetch(req(), env);
    expect(fetch).toHaveBeenCalledTimes(2);   // 2 sensors, once
  });

  it('does not grant CORS to other origins', async () => {
    const res = await worker.fetch(req('GET', '/flights', 'https://evil.example'), env);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('rejects non-GET methods and answers preflight for the allowed origin only', async () => {
    const post = await worker.fetch(req('POST'), env);
    expect(post.status).toBe(405);
    expect(fetch).not.toHaveBeenCalled();
    const pre = await worker.fetch(req('OPTIONS'), env);
    expect(pre.status).toBe(204);
    expect(pre.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(pre.headers.get('Access-Control-Allow-Methods')).toBe('GET');
  });

  it('404s other paths and 500s when unconfigured', async () => {
    expect((await worker.fetch(req('GET', '/other'), env)).status).toBe(404);
    expect((await worker.fetch(req(), { ...env, HA_TOKEN: undefined })).status).toBe(500);
  });

  it('returns 502 without leaking details when HA is down and nothing is cached', async () => {
    fetch.mockImplementation(async () => new Response('nope', { status: 401 }));
    const res = await worker.fetch(req(), env);
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'upstream unavailable' });
  });
});
