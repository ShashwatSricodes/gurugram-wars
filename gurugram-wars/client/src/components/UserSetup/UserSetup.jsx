import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getRandomColor, PLAYER_COLORS } from '../../utils/colors';
import { useGridStore } from '../../store/gridStore';
import socket from '../../socket';
import './UserSetup.css';

export const UserSetup = ({ onDone }) => {
  const [name, setName]   = useState('');
  const [color, setColor] = useState(getRandomColor());
  const setUser = useGridStore(s => s.setUser);

  const handleJoin = () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) return;

    const userId = localStorage.getItem('gw_userId') || uuidv4();
    localStorage.setItem('gw_userId', userId);

    const user = { userId, name: trimmed, color };
    setUser(user);

    socket.connect();
    socket.emit('user:join', user);
    onDone();
  };

  return (
    <div className="setup-overlay">
      <div className="setup-card">
        <div className="setup-badge">⬡ REAL-TIME TERRITORY GAME</div>
        <h1 className="setup-title">GURUGRAM<br/>WARS</h1>
        <p className="setup-sub">Capture hexagons. Dominate the city. Fight in real-time.</p>

        <div className="setup-field">
          <label>YOUR NAME</label>
          <input
            maxLength={20}
            placeholder="e.g. CyberCity Wolf"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            autoFocus
          />
        </div>

        <div className="setup-field">
          <label>YOUR COLOR</label>
          <div className="color-grid">
            {PLAYER_COLORS.map(c => (
              <button
                key={c}
                className={`color-dot ${c === color ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="preview-strip" style={{ background: color }}>
          <span className="preview-hex">⬡</span>
          <span>{name || 'Your Name'}</span>
        </div>

        <button
          className="setup-btn"
          onClick={handleJoin}
          disabled={name.trim().length < 2}
        >
          ENTER THE ARENA →
        </button>

        <p className="setup-hint">Open in multiple tabs to test real-time multiplayer</p>
      </div>
    </div>
  );
};
