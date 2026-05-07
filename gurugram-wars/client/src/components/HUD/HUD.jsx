import React from 'react';
import { useGridStore } from '../../store/gridStore';
import { useCooldown } from '../../hooks/useCooldown';
import './HUD.css';

export const HUD = () => {
  const user        = useGridStore(s => s.user);
  const onlineCount = useGridStore(s => s.onlineCount);
  const cells       = useGridStore(s => s.cells);
  const { isOnCooldown, remaining, progress } = useCooldown();

  const totalCaptured = Object.keys(cells).length;
  const myCells = Object.values(cells).filter(c => c.ownerId === user?.userId).length;

  return (
    <div className="hud">
      <div className="hud-left">
        <div className="hud-logo">
          <span className="hud-hex">⬡</span> GURUGRAM<span className="hud-accent">WARS</span>
        </div>
        <div className="hud-divider" />
        <div className="hud-stat">
          <span className="dot online" />
          {onlineCount} online
        </div>
        <div className="hud-stat">
          <span className="stat-icon">⬡</span>
          {totalCaptured} captured
        </div>
      </div>

      <div className="hud-center">
        {isOnCooldown && (
          <div className="cooldown-bar">
            <div className="cooldown-label">
              ⏱ COOLDOWN {(remaining / 1000).toFixed(1)}s
            </div>
            <div className="cooldown-track">
              <div
                className="cooldown-fill"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}
        {!isOnCooldown && (
          <div className="ready-badge">● READY TO CAPTURE</div>
        )}
      </div>

      <div className="hud-right">
        {user && (
          <div className="hud-user">
            <div className="hud-score-wrap">
              <div className="hud-score-num" style={{ color: user.color }}>
                {myCells}
              </div>
              <div className="hud-score-label">hexes</div>
            </div>
            <div className="hud-avatar" style={{ background: user.color }}>
              {user.name[0].toUpperCase()}
            </div>
            <div className="hud-name">{user.name}</div>
          </div>
        )}
      </div>
    </div>
  );
};
