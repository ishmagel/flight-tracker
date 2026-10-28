import { useState } from 'react';
import { AIRLINE_NAMES } from '../utils/airlineMap';

// kiwi.com CDN first, avs.io as fallback (broader regional coverage)
const makeSrcs = iata => [
  `https://images.kiwi.com/airlines/64/${iata.toUpperCase()}.png`,
  `https://images.kiwi.com/airlines/64/${iata.toLowerCase()}.png`,
  `https://pics.avs.io/64/64/${iata.toUpperCase()}.png`,
];

export default function AirlineLogo({ iata, callsign }) {
  const [srcIdx, setSrcIdx] = useState(0);
  const name  = AIRLINE_NAMES[iata] ?? iata ?? callsign?.slice(0, 3) ?? '??';
  const label = iata || callsign?.slice(0, 3) || '??';
  const srcs  = iata ? makeSrcs(iata) : [];

  return (
    <div className="logo-wrap-inner">
      {srcs.length > 0 && srcIdx < srcs.length ? (
        <img
          className="airline-logo"
          src={srcs[srcIdx]}
          alt={name}
          onError={() => setSrcIdx(i => i + 1)}
        />
      ) : (
        <div className="airline-logo-fallback">
          <span>{label}</span>
        </div>
      )}
      <span className="airline-name">{name}</span>
    </div>
  );
}
