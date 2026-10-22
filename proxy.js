#!/usr/bin/env node
// Optional tiny server: serves this folder and proxies /api/aircraft to a public
// ADS-B v2 API (the upstreams send no CORS headers, so browsers cannot call them
// directly). Upstream results are cached for >= 5 s so many tabs cost one request.
// Usage: PORT=8080 node proxy.js      (no dependencies, Node 18+)
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '127.0.0.1';   // loopback by default; put tailscale serve in front
const LAT = process.env.LAT || '-33.879', LON = process.env.LON || '151.151', NM = process.env.NM || '10';
const UPSTREAMS = process.env.UPSTREAM ? [process.env.UPSTREAM] : [
  `https://api.adsb.lol/v2/point/${LAT}/${LON}/${NM}`,
  `https://api.airplanes.live/v2/point/${LAT}/${LON}/${NM}`,
];
const TTL_MS = Math.max(5000, Number(process.env.CACHE_MS) || 10000);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const ROOT = __dirname, ALLOWED = new Set(['index.html', 'sw.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png']);
let cache = { at: 0, body: null };

async function upstream() {
  if (cache.body && Date.now() - cache.at < TTL_MS) return cache.body;
  let err;
  for (const u of UPSTREAMS) {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': 'flight-tracker-personal/1.0' }, signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error(`${u} HTTP ${r.status}`);
      cache = { at: Date.now(), body: await r.text() };
      return cache.body;
    } catch (e) { err = e; }
  }
  if (cache.body && Date.now() - cache.at < 60000) return cache.body;   // brief stale-ok
  throw err;
}

http.createServer(async (req, res) => {
  const p = new URL(req.url, 'http://x').pathname;
  if (p === '/api/aircraft') {
    try {
      const body = await upstream();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
      res.end(body);
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end('{"error":"upstream unavailable"}');
    }
    return;
  }
  const name = p === '/' ? 'index.html' : p.slice(1);
  if (!ALLOWED.has(name)) { res.writeHead(404); return res.end('not found'); }
  fs.readFile(path.join(ROOT, name), (e, buf) => {
    if (e) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(name)] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(PORT, HOST, () => console.log(`flight-tracker on http://${HOST}:${PORT}`));
