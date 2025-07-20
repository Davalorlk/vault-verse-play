import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { socket } from '@/lib/socket';
import { ArrowLeft, Gamepad2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Battleship } from './Battleship';
import { BrickBreaker } from './BrickBreaker';
import { Checkers } from './Checkers';
import { ChessBoard } from './ChessBoard';
import { ConnectFour } from './ConnectFour';
import { DotAndBox } from './DotAndBox';
import { Gomoku } from './Gomoku';
import { GuessWho } from './GuessWho';
import { Hangman } from './Hangman';
import { NineHoles } from './NineHoles';
import { PlayerVsPlayerCard } from './PlayerVsPlayerCard';
import { Reversi } from './Reversi';
import { TicTacToe } from './TicTacToe';

interface GameRoomProps {
  gameId: string;
  gameName: string;
  user: any;
  roomName: string;
  playMode: 'player' | 'computer';
  onLeave: () => void;
}

export const GameRoom = ({ gameId, gameName, user, roomName, playMode, onLeave }: GameRoomProps) => {
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [playersCount, setPlayersCount] = useState(playMode === 'computer' ? 1 : 0);
  const [roomPlayers, setRoomPlayers] = useState<any[]>([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showReplay, setShowReplay] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    if (playMode === 'player') {
      // Restore chat messages from localStorage
      const chatKey = `mindVaultRoomChatMessages-${roomName}-${gameId}`;
      const stored = localStorage.getItem(chatKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setMessages(parsed);
        } catch {}
      }

      // Request current room state
      socket.emit('get-room-state', { roomName, gameId });

      socket.on('player-joined', (data: { playersCount: number, player?: any, players?: any[] }) => {
        setPlayersCount(data.playersCount);
        
        // Update room players list
        if (data.players) {
          setRoomPlayers(data.players);
        }
        
        // Add join message to chat
        if (data.player && data.player.username !== user.username) {
          const joinMessage = {
            id: Date.now(),
            text: `${data.player.displayName || data.player.username} joined the game`,
            user: 'System',
            timestamp: new Date().toISOString(),
            roomName,
            gameId,
            isSystem: true
          };
          setMessages(prev => {
            const updated = [...prev, joinMessage];
            localStorage.setItem(chatKey, JSON.stringify(updated));
            return updated;
          });
        }
      });

      socket.on('player-left', (data: { playersCount: number, player?: any, players?: any[] }) => {
        setPlayersCount(data.playersCount);
        
        // Update room players list
        if (data.players) {
          setRoomPlayers(data.players);
        }
        
        // Add leave message to chat
        if (data.player) {
          const leaveMessage = {
            id: Date.now(),
            text: `${data.player.displayName || data.player.username} left the game`,
            user: 'System',
            timestamp: new Date().toISOString(),
            roomName,
            gameId,
            isSystem: true
          };
          setMessages(prev => {
            const updated = [...prev, leaveMessage];
            localStorage.setItem(chatKey, JSON.stringify(updated));
            return updated;
          });
        }
      });

      socket.on('game-chat-message', (message: any) => {
        setMessages(prev => {
          const updated = [...prev, message];
          localStorage.setItem(chatKey, JSON.stringify(updated));
          return updated;
        });
      });

      socket.on('room-players-update', (players: any[]) => {
        setRoomPlayers(players);
      });

      socket.on('room-state', (data: { players: any[], playersCount: number, gameState: any }) => {
        console.log('Room state received:', data);
        setRoomPlayers(data.players);
        setPlayersCount(data.playersCount);
      });

      // Listen for game end events
      const handleGameEnded = (data: { winner: string }) => {
        console.log('Game ended event received:', data);
        setGameEnded(true);
        setShowReplay(true);
      };

      // Listen for game restart events
      socket.on('game-restarted', () => {
        console.log('Game restarted event received');
        setGameEnded(false);
        setShowReplay(false);
        setCountdown(5);
        setGameKey(prev => prev + 1); // Force game component to remount
        setMessages([]);
      });

      // Listen for game reset events
      socket.on('game-reset', () => {
        console.log('Game reset event received');
        setGameEnded(false);
        setShowReplay(false);
        setGameKey(prev => prev + 1); // Force game component to remount
        socket.emit('get-room-state', { roomName, gameId });
        if (playersCount === 2) {
          setGameStarted(true);
        }
      });

      if (playMode === 'player') {
        socket.on('game-ended', handleGameEnded);
      }

      return () => {
        socket.off('player-joined');
        socket.off('player-left');
        socket.off('game-chat-message');
        socket.off('game-ended');
        socket.off('game-restarted');
        socket.off('game-reset');
        socket.off('room-players-update');
        socket.off('room-state');
        localStorage.removeItem(chatKey);
      };
    }
  }, [playMode, user.username, roomName, gameId]);

  // Check for game end in computer mode
  useEffect(() => {
    if (playMode === 'computer') {
      // This will be handled by individual game components
      // They should call setGameEnded(true) when their game ends
    }
  }, [playMode]);

  useEffect(() => {
    if (gameEnded && playersCount === 2) {
      const timer = setTimeout(() => {
        if (playMode === 'player') {
          socket.emit('replay-game', { roomName, gameId });
        } else {
          setGameEnded(false);
          setShowReplay(false);
          setCountdown(5);
          setGameKey(prev => prev + 1);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gameEnded, playersCount, playMode, roomName, gameId]);

  const renderGame = () => {
    const gameProps = {
      roomName,
      user,
      isMyTurn,
      playMode,
      onGameEnd: () => {
        setGameEnded(true);
        setShowReplay(true);
      },
      key: gameKey // Add key prop to force remount on replay
    };

    switch (gameId) {
      case 'tictactoe':
        return <TicTacToe {...gameProps} roomPlayers={roomPlayers} gameKey={gameKey} />;
      case 'connect4':
        return <ConnectFour {...gameProps} />;
      case 'chess':
        return <ChessBoard {...gameProps} />;
      case 'checkers':
        return <Checkers {...gameProps} />;
      case 'dotandbox':
        return <DotAndBox {...gameProps} />;
      case 'gomoku':
        return <Gomoku {...gameProps} />;
      case 'hangman':
        return <Hangman {...gameProps} />;
      case 'guesswho':
        return <GuessWho {...gameProps} />;
      case 'nineholes':
        return <NineHoles {...gameProps} />;
      case 'brickbreaker':
        return <BrickBreaker {...gameProps} />;
      case 'reversi':
        return <Reversi {...gameProps} />;
      case 'battleship':
        return <Battleship {...gameProps} />;
      default:
        return <div className="text-white">Game not implemented yet</div>;
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const message = {
      id: Date.now(),
      text: newMessage,
      user: user.displayName || user.username,
      timestamp: new Date().toISOString(),
      roomName,
      gameId
    };
    socket.emit('game-chat-message', message);
    setNewMessage('');
  };

  const handleLeave = () => {
    if (playMode === 'player') {
      socket.emit('leave-game-room', { roomName, gameId });
    }
    onLeave();
  };

  // Use uid as the primary unique identifier for player matching
  const currentPlayer = roomPlayers.find(p => 
    (p.uid && user.uid && p.uid === user.uid) ||
    (p.username && user.username && p.username === user.username) ||
    (p.displayName && user.displayName && p.displayName === user.displayName)
  );
  
  const opponent = roomPlayers.find(p => 
    (p.uid && user.uid && p.uid !== user.uid) ||
    (p.username && user.username && p.username !== user.username) ||
    (p.displayName && user.displayName && p.displayName !== user.displayName)
  );

  // Fallback: if we have multiple players but can't identify opponent, use the other player
  const fallbackOpponent = roomPlayers.length > 1 && !opponent ? 
    roomPlayers.find(p => 
      (p.uid && user.uid && p.uid !== user.uid) ||
      (p.username && user.username && p.username !== user.username) ||
      (p.displayName && user.displayName && p.displayName !== user.displayName)
    ) : null;

  const finalOpponent = opponent || fallbackOpponent;

  // Debug logging
  console.log('GameRoom Debug:', {
    roomPlayers,
    user,
    currentPlayer,
    opponent,
    fallbackOpponent,
    finalOpponent,
    playersCount
  });

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col overflow-y-auto relative">
      {/* Header */}
      <div className="sticky top-0 left-0 right-0 z-10 p-3 sm:p-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeave}
              className="text-white hover:bg-white/10 p-2"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">{gameName}</h1>
                {playMode === 'player' && (
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-300">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Room: {roomName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 text-xs sm:text-sm">
              {playMode === 'computer' ? 'vs Computer' : `${playersCount}/2 Players`}
            </Badge>
          </div>
        </div>
      </div>

      {/* Player vs Player Card */}
      {playMode === 'player' && (
        <div className="flex-shrink-0 pt-4">
          <PlayerVsPlayerCard
            player={{ 
              username: user.displayName || user.username, 
              avatar: user.avatar || '👤', 
              isYou: true 
            }}
            opponent={finalOpponent ? { 
              username: finalOpponent.displayName || finalOpponent.username, 
              avatar: finalOpponent.avatar || '👤' 
            } : (playersCount > 1 ? {
              username: 'Opponent',
              avatar: '👤'
            } : undefined)}
            yourTurn={isMyTurn}
          />
        </div>
      )}

      {/* Game Content */}
      <div className="flex-1 flex flex-col items-center justify-start px-2 pb-4">
        <div className="w-full max-w-3xl flex-1 flex flex-col items-center justify-center">
          {renderGame()}
        </div>

        {/* No replay button or manual replay UI. Game will auto-reset after 5 seconds if both players are present. */}

        {/* Chat Box (always visible below the game) */}
        {playMode === 'player' && (
          <div className="w-full max-w-lg mt-4 bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-xl flex flex-col">
            <div className="p-3 border-b border-white/10">
              <h3 className="text-white font-semibold text-sm">Room Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-60">
              {messages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <div className={`font-medium ${msg.isSystem ? 'text-blue-400 italic' : 'text-yellow-400'}`}>
                    {msg.user}
                  </div>
                  <div className="text-slate-300">{msg.text}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600 focus:border-yellow-400 focus:outline-none"
                />
                <Button
                  onClick={sendMessage}
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold text-sm px-4 py-2"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
