
import { useEffect, useState } from 'react';
import { getStoredGameRoomState, rejoinGameRoom, clearGameRoomState } from '@/lib/socket';
import { GameRoom } from './GameRoom';

interface GameRoomRejoinerProps {
  onNoRoomToRejoin: () => void;
}

export const GameRoomRejoiner = ({ onNoRoomToRejoin }: GameRoomRejoinerProps) => {
  const [gameRoomState, setGameRoomState] = useState<any>(null);
  const [shouldRejoin, setShouldRejoin] = useState(false);

  useEffect(() => {
    const storedState = getStoredGameRoomState();
    if (storedState) {
      setGameRoomState(storedState);
      // Show rejoin prompt for a few seconds, then auto-rejoin
      setTimeout(() => {
        setShouldRejoin(true);
        rejoinGameRoom(storedState.roomName, storedState.gameId, storedState.user);
      }, 2000);
    } else {
      onNoRoomToRejoin();
    }
  }, [onNoRoomToRejoin]);

  const handleDeclineRejoin = () => {
    clearGameRoomState();
    onNoRoomToRejoin();
  };

  const handleLeave = () => {
    clearGameRoomState();
    onNoRoomToRejoin();
  };

  if (!gameRoomState) {
    return null;
  }

  if (!shouldRejoin) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="bg-slate-800 rounded-lg p-6 space-y-4">
          <div className="text-4xl mb-4">🎮</div>
          <h2 className="text-xl font-bold text-white">Welcome back!</h2>
          <p className="text-slate-300">
            You were playing <strong>{gameRoomState.gameId}</strong> in room <strong>{gameRoomState.roomName}</strong>
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

  return (
    <GameRoom
      gameId={gameRoomState.gameId}
      gameName={gameRoomState.gameId.charAt(0).toUpperCase() + gameRoomState.gameId.slice(1)}
      user={gameRoomState.user}
      roomName={gameRoomState.roomName}
      playMode="player"
      onLeave={handleLeave}
    />
  );
};
