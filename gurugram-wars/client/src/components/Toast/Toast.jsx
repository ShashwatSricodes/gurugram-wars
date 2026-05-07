import React from 'react';
import { useGridStore } from '../../store/gridStore';
import './Toast.css';

export const Toast = () => {
  const toasts = useGridStore(s => s.toasts);

  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          style={t.color ? { borderLeftColor: t.color } : {}}
        >
          {t.type === 'capture' && t.color && (
            <span className="toast-dot" style={{ background: t.color }} />
          )}
          {t.type === 'error' && <span className="toast-err-icon">⚠</span>}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};
