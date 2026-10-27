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

Create a dedicated non-admin HA user (Settings > People > Users; Administrator off; "Can only log in from the local
network" off, otherwise the Worker is refused). Log in as it, open Profile > Security > Long-lived access tokens and
create one. HA has no per-entity permissions, so even a non-admin token can read every entity's state over REST. The
protection is therefore (a) a non-admin user so it cannot call services or change config via the UI, (b) the Worker only
ever requesting the two FlightRadar24 sensors, and (c) the token living only as a Worker secret. Never put it in a
`.env` file, the bundle, or chat.
