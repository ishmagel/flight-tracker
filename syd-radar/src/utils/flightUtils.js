export function getFlightStatus(flight) {
  const { onGround, verticalRate, velocity, altitude } = flight;

  if (onGround) {
    if (velocity > 10) return { text: 'ROLLING  ', color: '#FFB300' };
    return { text: 'ON GROUND', color: '#757575' };
  }

  const alt = altitude ?? 0;
  const vr = verticalRate ?? 0;

  if (vr > 3) {
    if (alt < 600)  return { text: 'DEPARTING', color: '#66BB6A' };
    return           { text: 'CLIMBING ', color: '#4CAF50' };
  }
  if (vr < -3) {
    if (alt < 1200) return { text: 'ARRIVING ', color: '#42A5F5' };
    return           { text: 'DESCEND  ', color: '#2196F3' };
  }
  return             { text: 'OVERHEAD ', color: '#F5A623' };
}

export function formatCallsign(callsign) {
  if (!callsign) return '????????';
  const s = callsign.trim().toUpperCase();
  if (/^[A-Z]{3}\d/.test(s)) {
    return (s.slice(0, 3) + ' ' + s.slice(3)).slice(0, 8).padEnd(8);
  }
  return s.slice(0, 8).padEnd(8);
}

export function formatAltitude(meters) {
  if (meters == null || meters < 0) return '  ----  ';
  const feet = Math.round(meters * 3.28084 / 100) * 100;
  return feet.toLocaleString().padStart(6) + 'FT';
}

export function formatSpeed(ms) {
  if (ms == null) return ' ---KT';
  return String(Math.round(ms * 1.94384)).padStart(3) + 'KT';
}

export function formatHeading(deg) {
  if (deg == null) return '---°';
  return String(Math.round(deg)).padStart(3, '0') + '°';
}
