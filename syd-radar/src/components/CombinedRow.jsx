import SplitFlapText from './SplitFlapText';
import PlaneIcon      from './PlaneIcon';
import AirlineLogo    from './AirlineLogo';
import UserAvatar     from './UserAvatar';
import BreweryLogo    from './BreweryLogo';
import { getIataCode, getAirportCity } from '../utils/airlineMap';
import './CombinedRow.css';

const NAME_LEN = 12;
const DEST_LEN = 12;

function localHHMM(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatFlightNum(callsign, iata, flightNum) {
  if (flightNum) {
    const m = flightNum.match(/^([A-Z]{2,3})(\d+[A-Z]?)$/i);
    const s = m ? `${m[1].toUpperCase()} ${m[2]}` : flightNum;
    return s.slice(0, NAME_LEN).padEnd(NAME_LEN);
  }
  const s   = (callsign ?? '?').trim().toUpperCase();
  const num = s.replace(/^[A-Z]{2,3}/, '');
  const pfx = iata ?? s.slice(0, 2);
  return `${pfx} ${num}`.padEnd(NAME_LEN);
}

function ascii(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9 ]/g, '');
}

function formatBeerName(name = '') {
  return ascii(name.toUpperCase()).slice(0, NAME_LEN).padEnd(NAME_LEN);
}

function formatCity(code, city) {
  const label = city ?? getAirportCity(code) ?? (code ?? '?').toUpperCase();
  return ascii(label.toUpperCase()).slice(0, DEST_LEN).padEnd(DEST_LEN);
}

function formatVenue(venue) {
  if (!venue?.venue_name) return ''.padEnd(DEST_LEN);
  if (/untappd at home/i.test(venue.venue_name)) return 'HOME'.padEnd(DEST_LEN);
  return ascii(venue.venue_name.toUpperCase()).slice(0, DEST_LEN).padEnd(DEST_LEN);
}

function FlightCombinedRow({ item }) {
  const iata   = getIataCode(item.callsign);
  const isArr  = item.type === 'ARR';
  const accent = isArr ? '#42A5F5' : '#66BB6A';

  return (
    <div className="combined-row" style={{ '--row-accent': accent }}>
      <div className="col-direction">
        <PlaneIcon type={item.type} size={28} />
      </div>
      <div className="col-logo">
        <AirlineLogo iata={iata} callsign={item.callsign} />
      </div>
      <div className="col-combined-name">
        <SplitFlapText text={formatFlightNum(item.callsign, iata, item.flight_num)} />
      </div>
      <div className="col-combined-dest">
        <SplitFlapText text={formatCity(item.airport, item.city)} />
      </div>
      <div className="col-time">
        <SplitFlapText text={localHHMM(item._timeMs)} />
      </div>
    </div>
  );
}

function CheckinCombinedRow({ item }) {
  return (
    <div className="combined-row" style={{ '--row-accent': '#F5A623' }}>
      <div className="col-direction">
        <UserAvatar user={item.user} size={36} />
      </div>
      <div className="col-logo">
        <BreweryLogo logoUrl={item.brewery?.brewery_label} name={item.brewery?.brewery_name} />
      </div>
      <div className="col-combined-name">
        <SplitFlapText text={formatBeerName(item.beer?.beer_name)} />
      </div>
      <div className="col-combined-dest">
        <SplitFlapText text={formatVenue(item.venue)} />
      </div>
      <div className="col-time">
        <SplitFlapText text={localHHMM(item._timeMs)} />
      </div>
    </div>
  );
}

export default function CombinedRow({ item }) {
  return item._type === 'flight'
    ? <FlightCombinedRow item={item} />
    : <CheckinCombinedRow item={item} />;
}
