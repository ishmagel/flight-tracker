import CombinedRow    from './CombinedRow';
import SplitFlapBoard from './SplitFlapBoard';
import { useCombinedFeed, CHECKINS_POLL_MS } from '../hooks/useCombinedFeed';
import { useAnimSettings } from '../context/AnimSettings';
import { DEFAULT_AIRPORT } from '../utils/airports';

const COLS = [
  { label: '',            cls: 'col-label-dir'           },
  { label: '',            cls: 'col-label-logo'          },
  { label: 'FLIGHT/BEER', cls: 'col-label-combined-name' },
  { label: 'WHERE',       cls: 'col-label-combined-dest' },
  { label: 'TIME',        cls: 'col-label-time'          },
];

function hhmm(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function statusLeft({ items, flightsError, checkinsError, flightsLastSuccess, checkinsLastSuccess }) {
  const parts = [];
  if (items.length) parts.push(`${items.length} EVENTS`);
  if (flightsError)  parts.push(`✈ ERR${flightsLastSuccess ? ' '+hhmm(flightsLastSuccess) : ''}`);
  if (checkinsError) parts.push(`🍺 ERR${checkinsLastSuccess ? ' '+hhmm(checkinsLastSuccess) : ''}`);
  return parts.join(' · ') || undefined;
}

export default function CombinedBoard({ airport = DEFAULT_AIRPORT, locating = false }) {
  const feed = useCombinedFeed(airport.icao);
  const { items, lastUpdate, loading, error, isMock } = feed;
  const { numRows } = useAnimSettings();
  const visible = items.slice(0, numRows);

  const checkinsSecs = Math.round(CHECKINS_POLL_MS / 1_000);

  return (
    <SplitFlapBoard
      title={airport.city}
      icon="◉"
      badge={isMock ? 'DEMO' : 'LIVE'}
      badgeMock={isMock}
      columns={COLS}
      loading={loading}
      loadingMsg={locating ? 'LOCATING…' : 'CONNECTING…'}
      emptyMsg="NO ACTIVITY"
      hasData={visible.length > 0}
      cursor={lastUpdate}
      total={0}
      pulseClass={error ? 'error' : isMock ? 'stale' : ''}
      footerLeft={statusLeft(feed)}
      footerRight={`✈ HA PUSH · 🍺 ${checkinsSecs}S`}
    >
      {visible.map((item, i) => <CombinedRow key={`row-${i}`} item={item} />)}
    </SplitFlapBoard>
  );
}
