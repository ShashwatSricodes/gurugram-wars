import { useState, useEffect } from 'react';
import { useGridStore } from '../store/gridStore';

const COOLDOWN_TOTAL = 3000;

export const useCooldown = () => {
  const cooldownUntil = useGridStore(s => s.cooldownUntil);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!cooldownUntil) return;
    const tick = () => {
      const left = cooldownUntil - Date.now();
      setRemaining(left > 0 ? left : 0);
    };
    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  return {
    isOnCooldown: remaining > 0,
    remaining,
    progress: remaining / COOLDOWN_TOTAL,
  };
};
