import { useEffect } from 'react';
import socket from '../socket';
import { useGridStore } from '../store/gridStore';

export const useSocket = () => {
  const { loadGridState, updateCell, removeCell, setOnlineCount, setLeaderboard, addToast, setCooldown } = useGridStore();

  useEffect(() => {
    socket.on('grid:state', loadGridState);

    socket.on('cell:update', (cell) => {
      updateCell(cell);
      addToast({
        type: 'capture',
        message: `${cell.ownerName} captured a hex!`,
        color: cell.ownerColor,
      });
    });

    // NEW — someone unclaimed a hex
    socket.on('cell:removed', ({ cellId }) => {
      removeCell(cellId);
    });

    socket.on('cell:error', ({ reason }) => {
      addToast({ type: 'error', message: reason });
      const match = reason.match(/(\d+\.?\d*)s/);
      if (match) setCooldown(parseFloat(match[1]) * 1000);
    });

    socket.on('users:online', ({ count }) => setOnlineCount(count));
    socket.on('leaderboard:update', setLeaderboard);

    return () => {
      socket.off('grid:state');
      socket.off('cell:update');
      socket.off('cell:removed');
      socket.off('cell:error');
      socket.off('users:online');
      socket.off('leaderboard:update');
    };
  }, []);
};