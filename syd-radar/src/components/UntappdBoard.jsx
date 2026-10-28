import UntappdRow             from './UntappdRow';
import SplitFlapBoard         from './SplitFlapBoard';
import { useUntappdCheckins } from '../hooks/useUntappdCheckins';
import { useAnimSettings }    from '../context/AnimSettings';
import { CHECKINS_POLL_MS }   from '../hooks/useCombinedFeed';

function hhmm(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

const COLS = [
  { label: '',        cls: 'col-label-dir'    },
  { label: 'BREWERY', cls: 'col-label-logo'   },
  { label: 'BEER',    cls: 'col-label-flight' },
  { label: 'VENUE',   cls: 'col-label-venue'  },
];

export default function UntappdBoard() {
  const { checkins, lastUpdate, lastSuccess, loading, error, isMock } = useUntappdCheckins();
  const { numRows } = useAnimSettings();

  const visible = checkins.slice(0, numRows);
  const cursor  = lastUpdate;
  const pollSecs = Math.round(CHECKINS_POLL_MS / 1_000);

  const footerLeft = (() => {
    if (!visible.length) return undefined;
    const parts = [`${checkins.length} FRIENDS`];
    if (error)   parts.push(`ERR${lastSuccess ? ' · LAST OK '+hhmm(lastSuccess) : ''}`);
    else if (lastUpdate) parts.push('OK '+hhmm(lastUpdate));
    return parts.join(' · ');
  })();

  return (
    <SplitFlapBoard
      title="Untappd Check-ins"
      icon="🍺"
      badge={isMock ? 'DEMO' : 'LIVE'}
      badgeMock={isMock}
      columns={COLS}
      loading={loading}
      loadingMsg="FETCHING CHECK-INS…"
      emptyMsg="NO CHECK-INS"
      hasData={visible.length > 0}
      cursor={cursor}
      total={0}
      pulseClass={error ? 'error' : isMock ? 'stale' : ''}
      soundChars={16}
      footerLeft={footerLeft}
      footerRight={`EVERY ${pollSecs}S · UNTAPPD`}
    >
      {visible.map((c, i) => <UntappdRow key={`row-${i}`} checkin={c} />)}
    </SplitFlapBoard>
  );
}
