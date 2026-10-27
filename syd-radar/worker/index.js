// SYD Live Radar flight feed.
// Home Assistant POSTs the FlightRadar24 sensor flights to /ingest (outbound from HA, so HA needs no
// public exposure and no token leaves HA). The Worker keeps the latest flights in KV and serves them
// read-only to the page at GET /flights. The browser holds no credentials.
import { flightsFrom } from './flights.js';

const KEY = 'flights';
const MAX_FLIGHTS = 100;
const MAX_BODY_BYTES = 256 * 1024;
const CACHE_MS = 10_000;           // many viewers share one KV read per isolate

let cache = { at: 0, data: null };

function corsHeaders(request, env) {
  const headers = { Vary: 'Origin' };
  if (env.ALLOWED_ORIGIN && request.headers.get('Origin') === env.ALLOWED_ORIGIN) {
    headers['Access-Control-Allow-Origin'] = env.ALLOWED_ORIGIN;
  }
  return headers;
}

function json(body, status, request, env, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env), ...extra },
  });
}

// Constant-time-ish comparison so the secret cannot be probed by timing.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function readStored(env) {
  return (await env.FLIGHTS_KV.get(KEY, 'json')) ?? { flights: [], updated: 0 };
}

async function handleIngest(request, env) {
  if (!env.INGEST_SECRET) return json({ error: 'worker not configured' }, 500, request, env);
  if (!safeEqual(request.headers.get('X-Ingest-Secret') ?? '', env.INGEST_SECRET)) {
    return json({ error: 'unauthorized' }, 401, request, env);
  }
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return json({ error: 'payload too large' }, 413, request, env);

  let body;
  try { body = JSON.parse(text); } catch (_) { return json({ error: 'invalid json' }, 400, request, env); }

  const incoming = [body?.entered, body?.current]
    .flatMap(list => flightsFrom({ attributes: { flights: Array.isArray(list) ? list : [] } }));

  const stored = await readStored(env);
  const seen = new Set(stored.flights.map(f => f.id));
  const fresh = incoming.filter((f, i) => !seen.has(f.id) && incoming.findIndex(g => g.id === f.id) === i);
  if (fresh.length) {
    const data = { flights: [...fresh, ...stored.flights].slice(0, MAX_FLIGHTS), updated: Date.now() };
    await env.FLIGHTS_KV.put(KEY, JSON.stringify(data));
    cache = { at: 0, data: null };
  }
  return json({ added: fresh.length }, 200, request, env, { 'Cache-Control': 'no-store' });
}

async function handleFlights(request, env) {
  const now = Date.now();
  if (!cache.data || now - cache.at >= CACHE_MS) {
    cache = { at: now, data: await readStored(env) };
  }
  return json(cache.data, 200, request, env, { 'Cache-Control': 'public, max-age=10' });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (pathname === '/ingest') {
      if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405, request, env, { Allow: 'POST' });
      return handleIngest(request, env);
    }

    if (pathname === '/flights') {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: { ...corsHeaders(request, env), 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Max-Age': '86400' },
        });
      }
      if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405, request, env, { Allow: 'GET, OPTIONS' });
      return handleFlights(request, env);
    }

    return json({ error: 'not found' }, 404, request, env);
  },
};
