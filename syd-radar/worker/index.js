// Read-only proxy between the SYD Live Radar page and Home Assistant.
// The HA token lives only in the HA_TOKEN Worker secret; the browser never sees it.
import { ENTITIES, flightsFrom } from './flights.js';

const CACHE_MS = 10_000;          // many clients share one HA fetch per isolate
const STALE_MS = 5 * 60_000;      // serve last good data this long if HA is unreachable
const HA_TIMEOUT_MS = 8_000;

let cache = { at: 0, flights: null };   // per-isolate (the Cache API is a no-op on workers.dev)
let inflight = null;

function corsHeaders(request, env) {
  const allowed = env.ALLOWED_ORIGIN;
  const headers = { Vary: 'Origin' };
  if (allowed && request.headers.get('Origin') === allowed) {
    headers['Access-Control-Allow-Origin'] = allowed;
  }
  return headers;
}

function json(body, status, request, env, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env), ...extra },
  });
}

async function fetchState(env, entity) {
  const resp = await fetch(`${env.HA_BASE_URL}/api/states/${entity}`, {
    headers: { Authorization: `Bearer ${env.HA_TOKEN}` },
    signal: AbortSignal.timeout(HA_TIMEOUT_MS),
  });
  if (!resp.ok) throw new Error(`HA ${resp.status}`);
  return resp.json();
}

async function loadFlights(env) {
  const states = await Promise.all(ENTITIES.map(e => fetchState(env, e)));
  return states.flatMap(flightsFrom);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { ...corsHeaders(request, env), 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Max-Age': '86400' },
      });
    }
    if (request.method !== 'GET') {
      return json({ error: 'method not allowed' }, 405, request, env, { Allow: 'GET, OPTIONS' });
    }
    if (new URL(request.url).pathname !== '/flights') {
      return json({ error: 'not found' }, 404, request, env);
    }
    if (!env.HA_TOKEN || !env.HA_BASE_URL) {
      return json({ error: 'worker not configured' }, 500, request, env);
    }

    const now = Date.now();
    if (cache.flights && now - cache.at < CACHE_MS) {
      return json({ flights: cache.flights, updated: cache.at }, 200, request, env,
        { 'Cache-Control': 'public, max-age=10' });
    }

    try {
      inflight ??= loadFlights(env).finally(() => { inflight = null; });
      const flights = await inflight;
      cache = { at: Date.now(), flights };
      return json({ flights, updated: cache.at }, 200, request, env, { 'Cache-Control': 'public, max-age=10' });
    } catch (_) {
      if (cache.flights && now - cache.at < STALE_MS) {
        return json({ flights: cache.flights, updated: cache.at, stale: true }, 200, request, env,
          { 'Cache-Control': 'no-store' });
      }
      return json({ error: 'upstream unavailable' }, 502, request, env, { 'Cache-Control': 'no-store' });
    }
  },
};
