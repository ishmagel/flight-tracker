import FlightRow from './FlightRow';
import SplitFlapBoard from './SplitFlapBoard';
import { useHAFlights } from '../hooks/useHAFlights';
import { useAnimSettings } from '../context/AnimSettings';

const COLS = [
  { label: '',             cls: 'col-label-dir'     },
  { label: 'AIRLINE',     cls: 'col-label-logo'    },
  { label: 'FLIGHT',      cls: 'col-label-flight'  },
  { label: 'DESTINATION', cls: 'col-label-airport' },
  { label: 'TIME',        cls: 'col-label-time'    },
];

function hhmm(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export default function FlightBoard() {
  const { flights, lastUpdate, lastSuccess, loading, error } = useHAFlights();
  const { numRows } = useAnimSettings();
  const visible = flights.slice(0, numRows);

  const footerLeft = (() => {
    if (!visible.length) return undefined;
    const parts = [`${flights.length} FLIGHTS`];
    if (error)           parts.push(`ERR${lastSuccess ? ' · LAST OK '+hhmm(lastSuccess) : ''}`);
    else if (lastUpdate) parts.push('OK '+hhmm(lastUpdate));
    return parts.join(' · ');
  })();

  return (
    <SplitFlapBoard
      title="SYDNEY AIRPORT"
      icon="✈"
      badge="HA PUSH"
      badgeMock={false}
      columns={COLS}
      loading={loading}
      loadingMsg="CONNECTING TO HA…"
      emptyMsg="NO FLIGHTS"
      hasData={visible.length > 0}
      cursor={lastUpdate}
      total={0}
      pulseClass={error ? 'error' : ''}
      footerLeft={footerLeft}
      footerRight="HA PUSH · FR24"
    >
      {visible.map((f, i) => <FlightRow key={`row-${i}`} flight={f} />)}
    </SplitFlapBoard>
  );
}
