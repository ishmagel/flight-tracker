import { useState } from 'react';
import { AnimProvider }    from './context/AnimSettings';
import { useNearestAirport } from './hooks/useNearestAirport';
import CombinedBoard from './components/CombinedBoard';
import FlightBoard   from './components/FlightBoard';
import UntappdBoard  from './components/UntappdBoard';
import './App.css';

function Boards() {
  const [mode, setMode] = useState('combined');
  const { airport, locating } = useNearestAirport();

  return (
    <div className="app">
      <div className="mode-bar">
        <button
          className={`mode-btn${mode === 'combined' ? ' active' : ''}`}
          onClick={() => setMode('combined')}
        >◉ LIVE</button>
        <button
          className={`mode-btn${mode === 'flights' ? ' active' : ''}`}
          onClick={() => setMode('flights')}
        >✈ FLIGHTS</button>
        <button
          className={`mode-btn${mode === 'untappd' ? ' active' : ''}`}
          onClick={() => setMode('untappd')}
        >🍺 UNTAPPD</button>
      </div>
      {mode === 'combined' && <CombinedBoard airport={airport} locating={locating} />}
      {mode === 'flights'  && <FlightBoard  airport={airport} locating={locating} />}
      {mode === 'untappd'  && <UntappdBoard />}
    </div>
  );
}

export default function App() {
  return (
    <AnimProvider>
      <Boards />
    </AnimProvider>
  );
}
