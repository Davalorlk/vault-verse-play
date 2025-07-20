
import { useEffect, useState } from 'react';
import { getStoredRoomState, rejoinGameRoom, rejoinGlobalChat, clearRoomState } from '@/lib/socket';
import { GameRoom } from './games/GameRoom';
import { Dashboard } from './Dashboard';

interface RoomRejoinerProps {
  user: any;
  onNoRoomToRejoin: () => void;
  onLogout: () => void;
}

export const RoomRejoiner = ({ user, onNoRoomToRejoin, onLogout }: RoomRejoinerProps) => {
  const [roomState, setRoomState] = useState<any>(null);
  const [shouldRejoin, setShouldRejoin] = useState(false);
  const [rejoinType, setRejoinType] = useState<'game' | 'chat' | null>(null);

  useEffect(() => {
    const storedState = getStoredRoomState();
    if (storedState) {
      setRoomState(storedState);
      setRejoinType(storedState.roomType);
      
      // Show rejoin prompt for a few seconds, then auto-rejoin
      setTimeout(() => {
        setShouldRejoin(true);
        
        if (storedState.roomType === 'game') {
          rejoinGameRoom(storedState.roomName, storedState.gameId, storedState.user);
        } else if (storedState.roomType === 'chat') {
          rejoinGlobalChat(storedState.user);
        }
      }, 2000);
    } else {
      onNoRoomToRejoin();
    }
  }, [onNoRoomToRejoin]);

  const handleDeclineRejoin = () => {
    clearRoomState();
    onNoRoomToRejoin();
  };

  const handleLeave = () => {
    clearRoomState();
    onNoRoomToRejoin();
  };

  if (!roomState) {
    return null;
  }

  if (!shouldRejoin) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="bg-slate-800 rounded-lg p-6 space-y-4">
          <div className="text-4xl mb-4">
            {rejoinType === 'game' ? '🎮' : '💬'}
          </div>
          <h2 className="text-xl font-bold text-white">Welcome back!</h2>
          <p className="text-slate-300">
            {rejoinType === 'game' ? (
              <>You were playing <strong>{roomState.gameId}</strong> in room <strong>{roomState.roomName}</strong></>
            ) : (
              <>You were in the <strong>Global Chat</strong></>
            )}
          </p>
          <p className="text-slate-400 text-sm">Rejoining automatically in a moment...</p>
          <button
            onClick={handleDeclineRejoin}
            className="mt-4 text-slate-400 hover:text-white underline text-sm"
          >
            Start fresh instead
          </button>
        </div>
      </div>
    );
  }

  if (rejoinType === 'game') {
    return (
      <GameRoom
        gameId={roomState.gameId}
        gameName={roomState.gameId.charAt(0).toUpperCase() + roomState.gameId.slice(1)}
        user={roomState.user}
        roomName={roomState.roomName}
        playMode="player"
        onLeave={handleLeave}
      />
    );
  } else if (rejoinType === 'chat') {
    return (
      <Dashboard 
        user={user} 
        onLogout={onLogout}
        initialTab="chat"
        onTabChange={(tab) => {
          if (tab !== 'chat') {
            clearRoomState();
          }
        }}
      />
    );
  }

  return null;
};
