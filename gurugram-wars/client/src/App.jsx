import React, { useState } from 'react';
import { UserSetup }    from './components/UserSetup/UserSetup';
import { TerritoryMap } from './components/Map/TerritoryMap';
import { HUD }          from './components/HUD/HUD';
import { Leaderboard }  from './components/Leaderboard/Leaderboard';
import { Toast }        from './components/Toast/Toast';
import { useSocket }    from './hooks/useSocket';

export default function App() {
  const [ready, setReady] = useState(false);

  // Register all socket event listeners
  useSocket();

  return (
    <>
      {!ready && <UserSetup onDone={() => setReady(true)} />}
      {ready && (
        <>
          <HUD />
          <TerritoryMap />
          <Leaderboard />
          <Toast />
        </>
      )}
    </>
  );
}
