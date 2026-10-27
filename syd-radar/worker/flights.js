// Maps Home Assistant FlightRadar24 sensor states to the minimal flight objects the UI renders.
// Pure functions, no I/O: shared by the Worker and its tests.

export const ENTITIES = [
  'sensor.outside_flightradar24_entered_area',
  'sensor.outside_flightradar24_current_in_area',
];

export function normaliseFlight(raw) {
  if (!raw?.id) return null;

  // DEP if origin is YSSY, ARR otherwise
  const isDep = raw.airport_origin_code_icao === 'YSSY';
  const otherCity = isDep ? raw.airport_destination_city : raw.airport_origin_city;
  const otherIcao = isDep ? raw.airport_destination_code_icao : raw.airport_origin_code_icao;
  const otherIata = isDep ? raw.airport_destination_code_iata : raw.airport_origin_code_iata;

  // Best available time: estimated, then real, then scheduled
  const time = isDep
    ? (raw.time_real_departure ?? raw.time_scheduled_departure)
    : (raw.time_estimated_arrival ?? raw.time_scheduled_arrival);

  return {
    id: raw.id,
    icao24: (raw.aircraft_icao_24bit ?? '').toLowerCase(),
    callsign: raw.callsign ?? raw.flight_number ?? raw.id,
    flight_num: raw.flight_number,
    airline_iata: raw.airline_iata,
    airline_icao: raw.airline_icao,
    type: isDep ? 'DEP' : 'ARR',
    airport: otherIcao,
    city: otherCity ?? otherIata,
    time,                         // unix seconds, may be undefined
    altitude: raw.altitude,
    distance: raw.distance,
    photo: raw.aircraft_photo_small,
  };
}

export function flightsFrom(state) {
  return (state?.attributes?.flights ?? []).map(normaliseFlight).filter(Boolean);
}
