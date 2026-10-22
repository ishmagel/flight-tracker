# flight-tracker

A single-file, split-flap style "aircraft overhead" display. It shows the most
recent flights (callsign, altitude, distance, heading) as airport-board rows.
No build step and no dependencies: open `index.html` and it works in demo mode;
serve it with `proxy.js` (below) and it shows real aircraft over Leichhardt, Sydney.

It follows the system light/dark setting and is laid out for phones as well as
wall-mounted tablets.

## Use it

Open `index.html` in a browser. Use **+ Add Flight (Demo)** to see sample rows.

Feed it real data by calling the page's JavaScript API:

```js
addFlight({ callsign: 'QF1234', altitude: 34250, distance: 2.4, heading: 45 });
setFlights([{ callsign: 'JQ5678', altitude: 3200, distance: 0.6, heading: 270 }]);
clearFlights();
```

| Field      | Unit                                  |
|------------|---------------------------------------|
| `callsign` | text                                  |
| `altitude` | feet                                  |
| `distance` | km (values under 1 display as metres) |
| `heading`  | degrees, 0 = north                    |

A page that embeds this one in an iframe can also use
`frame.contentWindow.postMessage({ flights: [...] }, '*')`.

## Live data

`fetchLive()` polls the ADS-B "v2 point" API for aircraft within 10 nautical
miles of the home point (-33.879, 151.151) every 10 s, and calls `setFlights`
with the nearest `MAX_FLIGHTS`. Distance is haversine from home, heading is the
aircraft's `track`, altitude is `alt_baro` in feet (`ground` shows as 0) and
aircraft without a position are dropped. A badge in the corner shows `LIVE` or
`DEMO`. It never polls faster than every 5 s, backs off exponentially on errors
(up to 2 min), honours `Retry-After` on HTTP 429, and pauses while the tab is hidden.

**CORS.** Checked 2026-10-22: `api.adsb.lol` and `api.airplanes.live` send no
`Access-Control-Allow-Origin`, so browsers cannot call them directly (and
airplanes.live currently answers 403 asking for contact details before use).
So the page first tries a same-origin `/api/aircraft`, served by the optional
dependency-free `proxy.js`, then the direct URLs (which only work where CORS is
allowed). `?api=<url>` overrides all of that; `?live=0` stays in demo mode.

```sh
PORT=8080 node proxy.js     # serves the page and /api/aircraft, caches upstream >= 5 s
```

`LAT`, `LON`, `NM`, `CACHE_MS` and `UPSTREAM` environment variables adjust it.
To move the home point, edit `HOME` in `index.html` as well.

**Data source and licence.** Data comes from [adsb.lol](https://adsb.lol)
(ODbL, primary) with [airplanes.live](https://airplanes.live) as fallback. The
airplanes.live API is free for non-commercial use only and asks for attribution;
this is a personal, non-commercial project. Credit both sources if you share it.
Be a good citizen: keep the poll interval at 10 s or more.

## Kiosk and PWA

- `index.html?kiosk=1` hides the buttons and help text, disables scrolling and
  the cursor, and requests a Screen Wake Lock where the browser supports it
  (re-requested when the tab becomes visible again).
- `manifest.webmanifest` makes it installable (fullscreen, black theme,
  `icon.svg` plus 192/512 px PNGs). The installed app starts in kiosk mode.
- `sw.js` caches only the app shell (network first, cache when offline). API
  calls and cross-origin requests are never cached. Service workers need HTTPS
  or `localhost`.

### Serving over the tailnet with HTTPS

Run `node proxy.js` on the host, then publish it on the tailnet with
`sudo -u svc-services sudo tailscale serve --bg 8080` (see border-spectrum
`docs/nucbox/AGENT_ACCESS.md`). Open the resulting `https://<host>.<tailnet>.ts.net/`
URL on the wall tablet, add it to the home screen and use `?kiosk=1`.
This is documentation only; nothing here runs `tailscale serve` for you.

## Customise

Everything lives at the top of the `<script>` in `index.html`:

- `MAX_FLIGHTS` is how many rows are shown (newest win).
- `FIELDS` lists the readouts. To add one (say, speed), add an entry with
  `key`, `label`, `unit` and `format`; it appears in every row.

## Deploy

Demo mode is a static page, so any static host works (live data needs `proxy.js`
or your own CORS-enabled endpoint): GitHub Pages (Settings > Pages >
deploy from `main`, root), a Home Assistant `/config/www/` folder (served at
`/local/index.html`, embeddable in a webpage card), or just a local file.

## Accessibility

Rows are a list with a spoken summary, new flights are announced politely,
buttons are 44px touch targets, focus is visible and animations respect
`prefers-reduced-motion`.
