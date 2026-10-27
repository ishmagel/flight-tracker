# SYD Live Radar

React/Vite split-flap board combining live Sydney flights and Untappd check-ins.
Deployed at https://syd-departures.pages.dev/ (Cloudflare Pages project `syd-departures`, direct upload).

```
browser ──GET /flights──▶ syd-radar-flights Worker ──REST, Bearer HA_TOKEN──▶ Home Assistant
        ──GET /checkins─▶ untappd-venue-fetcher Worker (separate repo)
```

The browser holds no credentials. The Home Assistant token exists only as the `HA_TOKEN` Worker secret.

## Develop

```
cd syd-radar
npm install
cp .env.example .env.local      # not committed
npm run dev
npm test
npm run build
```

## Deploy

```
npx wrangler login
npx wrangler secret put HA_TOKEN --config worker/wrangler.toml   # paste the token at the prompt
npm run deploy:worker
npm run build               # needs VITE_FLIGHTS_API_URL / VITE_UNTAPPD_WS_URL (see .env.example)
npm run deploy:pages
```

## Home Assistant token

Create a dedicated non-admin HA user (Settings > People > Users, "Can only log in from the local network" off,
"Administrator" off), log in as it, open its Profile > Security > Long-lived access tokens, and create one.
HA limits non-admin users only through entity exposure, so treat the token as able to read states and keep it only
as the Worker secret. Never put it in a `.env` file, the bundle, or chat.
