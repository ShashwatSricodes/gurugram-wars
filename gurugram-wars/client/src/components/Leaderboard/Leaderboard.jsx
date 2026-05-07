import React, { useState } from 'react';
import { useGridStore } from '../../store/gridStore';
import './Leaderboard.css';

const MEDALS = ['🥇', '🥈', '🥉'];

export const Leaderboard = () => {
  const leaderboard = useGridStore(s => s.leaderboard);
  const user        = useGridStore(s => s.user);
  const cells       = useGridStore(s => s.cells);
  const [open, setOpen] = useState(false);

  const totalCells = Object.keys(cells).length || 1;

  return (
    <>
      <button className="lb-mobile-toggle" onClick={() => setOpen(o => !o)}>
        <span className="lb-toggle-icon">🏆</span>
        <span>Leaderboard</span>
        <span className="lb-toggle-count">{leaderboard.length}</span>
      </button>

      {open && (
        <div className="lb-backdrop" onClick={() => setOpen(false)} />
      )}

      <div className={`lb-panel ${open ? 'open' : ''}`}>
        <div className="lb-handle-row">
          <div className="lb-handle" />
        </div>

        <div className="lb-header-row">
          <span className="lb-title">Leaderboard</span>
          <button className="lb-close" onClick={() => setOpen(false)}>✕</button>
        </div>

        <div className="lb-body">
          {leaderboard.length === 0 && (
            <div className="lb-empty">No captures yet. Be first!</div>
          )}

          {leaderboard.map((u, i) => {
            const isMe = u.userId === user?.userId;
            const pct  = ((u.score / totalCells) * 100).toFixed(1);

            return (
              <div key={u.userId} className={`lb-row ${isMe ? 'me' : ''}`}>
                <span className="lb-rank">{MEDALS[i] || `#${i + 1}`}</span>
                <div className="lb-dot" style={{ background: u.color }} />
                <div className="lb-info">
                  <span className="lb-name">{u.name}{isMe ? ' (you)' : ''}</span>
                  <div className="lb-bar-track">
                    <div
                      className="lb-bar-fill"
                      style={{
                        width: `${Math.min(100, parseFloat(pct) * 3)}%`,
                        background: u.color,
                      }}
                    />
                  </div>
                </div>
                <span className="lb-score">{u.score}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
