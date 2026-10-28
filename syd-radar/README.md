# SYD Live Radar

React/Vite split-flap board combining live Sydney flights and Untappd check-ins.
Deployed at https://syd-departures.pages.dev/ (Cloudflare Pages project `syd-departures`, direct upload).

```
Home Assistant ──POST /ingest (X-Ingest-Secret)──▶ syd-radar-flights Worker ──▶ KV (last 100 flights)
browser ◀──GET /flights── syd-radar-flights Worker
browser ◀──websocket── untappd-venue-fetcher Worker (separate repo; pushes check-ins)
```

Home Assistant pushes outbound, so it needs no public exposure for this app and no Home Assistant token exists
anywhere in the browser or the Worker. The only secret is a random shared `INGEST_SECRET`.

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
openssl rand -hex 32                  # generate INGEST_SECRET; keep it in your password manager
npx wrangler secret put INGEST_SECRET --config worker/wrangler.toml   # paste at the prompt
npm run deploy:worker                 # also auto-provisions the FLIGHTS_KV namespace
VITE_FLIGHTS_API_URL=https://syd-radar-flights.<subdomain>.workers.dev \
VITE_UNTAPPD_WS_URL=wss://untappd-venue-fetcher.<subdomain>.workers.dev npm run build
npm run deploy:pages
```

## Home Assistant side

Add the same secret to HA `secrets.yaml` as `syd_radar_ingest_secret`, then add:

```yaml
rest_command:
  syd_radar_push:
    url: https://syd-radar-flights.<subdomain>.workers.dev/ingest
    method: POST
    content_type: application/json
    timeout: 15
    headers:
      X-Ingest-Secret: !secret syd_radar_ingest_secret
    payload: >-
      {{ {'entered': state_attr('sensor.outside_flightradar24_entered_area', 'flights') or [],
          'current': state_attr('sensor.outside_flightradar24_current_in_area', 'flights') or []} | tojson }}

automation:
  - alias: SYD Radar - push flights to Worker
    mode: queued
    triggers:
      - trigger: state
        entity_id:
          - sensor.outside_flightradar24_entered_area
          - sensor.outside_flightradar24_current_in_area
    conditions:
      - condition: template
        value_template: >-
          {{ trigger.to_state is not none and trigger.to_state.attributes.get('flights', []) | length > 0 }}
    actions:
      - action: rest_command.syd_radar_push
```
