# flight-tracker

A single-file, split-flap style "aircraft overhead" display. It shows the most
recent flights (callsign, altitude, distance, heading) as airport-board rows.
No build step, no dependencies, no network calls: open `index.html` and it works.

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

## Customise

Everything lives at the top of the `<script>` in `index.html`:

- `MAX_FLIGHTS` is how many rows are shown (newest win).
- `FIELDS` lists the readouts. To add one (say, speed), add an entry with
  `key`, `label`, `unit` and `format`; it appears in every row.

## Deploy

It is a static page, so any static host works: GitHub Pages (Settings > Pages >
deploy from `main`, root), a Home Assistant `/config/www/` folder (served at
`/local/index.html`, embeddable in a webpage card), or just a local file.

## Accessibility

Rows are a list with a spoken summary, new flights are announced politely,
buttons are 44px touch targets, focus is visible and animations respect
`prefers-reduced-motion`.
