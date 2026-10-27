import SplitFlapText from './SplitFlapText';
import AirlineLogo   from './AirlineLogo';
import PlaneIcon      from './PlaneIcon';
import { getIataCode, getAirportCity } from '../utils/airlineMap';
import './FlightRow.css';

const AIRPORT_LEN = 13;
const SYD_TZ      = 'Australia/Sydney';

function formatFlightNum(callsign, iata, flightNum) {
  if (flightNum) {
    const m = flightNum.match(/^([A-Z]{2,3})(\d+[A-Z]?)$/i);
    return m ? `${m[1].toUpperCase()} ${m[2]}`.padEnd(8) : flightNum.slice(0, 8).padEnd(8);
  }
  const s   = (callsign ?? '?').trim().toUpperCase();
  const num = s.replace(/^[A-Z]{2,3}/, '');
  const pfx = iata ?? s.slice(0, 2);
  return `${pfx} ${num}`.padEnd(8);
}

function ascii(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9 ]/g, '');
}

function formatAirport(code, city) {
  const label = city ?? getAirportCity(code) ?? (code ?? '?').toUpperCase();
  return ascii(label.toUpperCase()).slice(0, AIRPORT_LEN).padEnd(AIRPORT_LEN);
}

function formatTime(unixSecs) {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: SYD_TZ,
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false,
  }).format(new Date(unixSecs * 1000));
}

export default function FlightRow({ flight }) {
  const iata    = getIataCode(flight.callsign);
  const isArr   = flight.type === 'ARR';
  const accent  = isArr ? '#42A5F5' : '#66BB6A';
  const flt     = formatFlightNum(flight.callsign, iata, flight.flight_num);
  const airport = formatAirport(flight.airport, flight.city);
  const time    = formatTime(flight.time);

  return (
    <div className="flight-row" style={{ '--row-accent': accent }}>

      <div className="col-direction">
        <PlaneIcon type={flight.type} size={28} />
      </div>

      <div className="col-logo">
        <AirlineLogo iata={iata} callsign={flight.callsign} />
      </div>

      <div className="col-flight">
        <SplitFlapText text={flt} />
      </div>

      <div className="col-airport">
        <SplitFlapText text={airport} />
      </div>

      <div className="col-time">
        <SplitFlapText text={time} />
      </div>

    </div>
  );
}
