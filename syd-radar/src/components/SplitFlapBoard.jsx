import { useState, useEffect, useRef } from 'react';
import { useAnimSettings } from '../context/AnimSettings';
import { useFlipSound }    from '../hooks/useFlipSound';
import './SplitFlapBoard.css';

function useClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const p = n => String(n).padStart(2, '0');
      setTime(`${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function SplitFlapBoard({
  title,
  icon = '◉',
  badge,
  badgeMock = false,
  columns = [],
  loading = false,
  loadingMsg = 'LOADING…',
  emptyMsg = 'NO DATA',
  hasData = false,
  cursor = 0,
  total = 0,
  itemLabel = 'ITEM',
  pulseClass = '',
  footerLeft,
  footerRight,
  soundChars = 18,
  children,
}) {
  const { flipMs, stagger, replayMs, numRows, update } = useAnimSettings();
  const { playBoardUpdate } = useFlipSound();
  const prevCursorRef = useRef(-1);
  const clock = useClock();
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (cursor !== prevCursorRef.current && hasData) {
      // Spread clicks across the full animation window so sound follows the flip cascade
      const durationSecs = ((soundChars - 1) * stagger + flipMs) / 1000;
      playBoardUpdate(soundChars, durationSecs);
      prevCursorRef.current = cursor;
    }
  }, [cursor, hasData, playBoardUpdate, soundChars, stagger, flipMs]);

  return (
    <div className="board">

      <div className="board-header">
        <div className="board-title">
          <span className="board-icon">{icon}</span>
          <span className="board-name">{title}</span>
          {badge && (
            <span className={`board-badge${badgeMock ? ' mock' : ''}`}>{badge}</span>
          )}
        </div>
        <div className="board-header-right">
          <button
            className={`settings-btn${showSettings ? ' active' : ''}`}
            onClick={() => setShowSettings(s => !s)}
            title="Settings"
          >⚙</button>
          <div className="board-clock">{clock}</div>
        </div>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <div className="setting-row">
            <span className="setting-label">ANIM SPEED</span>
            <input type="range" min="50" max="700" step="10" value={flipMs}
              onChange={e => update('flipMs', +e.target.value)} />
            <span className="setting-val">{flipMs}ms</span>
          </div>
          <div className="setting-row">
            <span className="setting-label">CHAR STAGGER</span>
            <input type="range" min="20" max="350" step="10" value={stagger}
              onChange={e => update('stagger', +e.target.value)} />
            <span className="setting-val">{stagger}ms</span>
          </div>
          <div className="setting-row">
            <span className="setting-label">ROWS</span>
            <input type="range" min="1" max="5" step="1" value={numRows}
              onChange={e => update('numRows', +e.target.value)} />
            <span className="setting-val">{numRows}</span>
          </div>
        </div>
      )}

      <div className="board-cols">
        {columns.map((col, i) => (
          <span key={i} className={`col-label ${col.cls ?? ''}`}>{col.label}</span>
        ))}
      </div>

      <div className="board-rows">
        {loading ? (
          <div className="board-empty">{loadingMsg}</div>
        ) : !hasData ? (
          <div className="board-empty">{emptyMsg}</div>
        ) : children}
      </div>

      <div className="board-progress">
        <div key={cursor} className="board-progress-bar"
             style={{ animationDuration: `${replayMs}ms` }} />
      </div>

      <div className="board-footer">
        <span>
          <span className={`board-pulse ${pulseClass}`} />
          {footerLeft !== undefined
            ? footerLeft
            : total > 0 ? `${itemLabel} ${cursor + 1} OF ${total}` : emptyMsg}
        </span>
        {footerRight && <span>{footerRight}</span>}
      </div>

    </div>
  );
}
