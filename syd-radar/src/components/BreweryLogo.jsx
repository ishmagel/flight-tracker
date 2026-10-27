import { useState } from 'react';

export default function BreweryLogo({ logoUrl, name }) {
  const [failed, setFailed] = useState(false);
  const label = (name ?? '???').slice(0, 3).toUpperCase();

  return (
    <div className="logo-wrap-inner">
      {logoUrl && !failed ? (
        <img
          className="airline-logo"
          src={logoUrl}
          alt={name ?? ''}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="airline-logo-fallback">
          <span>{label}</span>
        </div>
      )}
      <span className="airline-name">{name ?? '?'}</span>
    </div>
  );
}
