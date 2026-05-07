import React, { useState } from 'react';
import { useGridStore } from '../../store/gridStore';
import './Leaderboard.css';

const MEDALS = ['🥇', '🥈', '🥉'];

export const Leaderboard = () => {
  const leaderboard = useGridStore(s => s.leaderboard);
  const user        = useGridStore(s => s.user);
  const cells       = useGridStore(s => s.cells);
  const [open, setOpen] = useState(true);

  // Compute % of map each user owns
  const totalCells = Object.keys(cells).length || 1;

  return (
    <div className={`lb-panel ${open ? 'open' : 'closed'}`}>
      <button className="lb-toggle" onClick={() => setOpen(o => !o)}>
        <span className="lb-toggle-icon">{open ? '▶' : '◀'}</span>
        <span>LEADERBOARD</span>
      </button>

      <div className="lb-body">
        <div className="lb-header">
          <span>TOP COMMANDERS</span>
          <span className="lb-total">{leaderboard.length} players</span>
        </div>

        {leaderboard.length === 0 && (
          <div className="lb-empty">
            <div className="lb-empty-icon">⬡</div>
            <p>No captures yet.</p>
            <p>Be the first!</p>
          </div>
        )}

        {leaderboard.map((u, i) => {
          const pct = totalCells > 1
            ? ((u.score / totalCells) * 100).toFixed(1)
            : '0.0';
          const isMe = u.userId === user?.userId;

          return (
            <div key={u.userId} className={`lb-row ${isMe ? 'me' : ''}`}>
              <span className="lb-rank">
                {MEDALS[i] || `#${i + 1}`}
              </span>
              <div className="lb-dot" style={{ background: u.color }} />
              <div className="lb-info">
                <span className="lb-name">{u.name}{isMe ? ' (you)' : ''}</span>
                <div className="lb-bar-track">
                  <div
                    className="lb-bar-fill"
                    style={{
                      width: `${Math.min(100, parseFloat(pct) * 3)}%`,
                      background: u.color
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
  );
};
