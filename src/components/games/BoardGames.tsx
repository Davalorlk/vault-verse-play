import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Blocks, CircleDot, Crown, Grid3X3, Puzzle, Search, Target, UserX } from 'lucide-react';
import { useState } from 'react';
import { GameRoom } from './GameRoom';

interface Game {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  players: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  online: number;
}

interface BoardGamesProps {
  user: any;
  onEnterGame: () => void;
  onLeaveGame: () => void;
}

export const BoardGames = ({ user, onEnterGame, onLeaveGame }: BoardGamesProps) => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>('');
  const [roomInput, setRoomInput] = useState<string>('');
  const [showRoomInput, setShowRoomInput] = useState<string | null>(null);
  const [playMode, setPlayMode] = useState<'player' | 'computer' | null>(null);

  const games: Game[] = [
    {
      id: 'chess',
      name: 'Chess',
      icon: <Crown className="h-6 w-6 sm:h-8 sm:w-8" />,
      description: 'The classic strategy game of kings and queens',
      players: '2 Players',
      difficulty: 'Hard',
      online: 1247
    },
    {
      id: 'checkers',
      name: 'Checkers',
      icon: <Crown className="h-6 w-6 sm:h-8 sm:w-8" />,
      description: 'Capture all opponent pieces to win',
      players: '2 Players',
      difficulty: 'Medium',
      online: 892
    },
    {
      id: 'tictactoe',
      name: 'Tic Tac Toe',
      icon: <Grid3X3 className="h-6 w-6 sm:h-8 sm:w-8" />,
      description: 'Get three in a row to win',
      players: '2 Players',
      difficulty: 'Easy',
      online: 1534
    },
    {
      id: 'connect4',
      name: 'Connect Four',
      icon: <Target className="h-6 w-6 sm:h-8 sm:w-8" />,
      description: 'Connect four pieces in a row',
      players: '2 Players',
      difficulty: 'Medium',
      online: 743
    },
    {
      id: 'dotandbox',
      name: 'Dot and Box',
      icon: <CircleDot className="h-6 w-6 sm:h-8 sm:w-8" />,
      description: 'Complete boxes by drawing lines between dots',
      players: '2 Players',
      difficulty: 'Medium',
      online: 412
    },
    {
      id: 'gomoku',
      name: 'Gomoku',
      icon: <Grid3X3 className="h-6 w-6 sm:h-8 sm:w-8" />,
      description: 'Get five stones in a row to win',
      players: '2 Players',
      difficulty: 'Medium',
      online: 321
    },
    {
      id: 'hangman',
      name: 'Hanging Man',
      icon: <UserX className="h-6 w-6 sm:h-8 sm:w-8" />,
      description: 'Guess the word before time runs out',
      players: '2 Players',
      difficulty: 'Easy',
      online: 567
    },
    {
      id: 'nineholes',
      name: 'Nine Holes',
      icon: <Puzzle className="h-6 w-6 sm:h-8 sm:w-8" />,
      description: 'Mill strategy game with nine positions',
      players: '2 Players',
      difficulty: 'Medium',
      online: 234
    },
    {
      id: 'guesswho',
      name: 'Guess Who',
      icon: <Search className="h-6 w-6 sm:h-8 sm:w-8" />,
      description: 'Guess your opponent\'s character first',
      players: '2 Players',
      difficulty: 'Easy',
      online: 456
    },
    {
      id: 'brickbreaker',
      name: 'Brick Breaker',
      icon: <Blocks className="h-6 w-6 sm:h-8 sm:w-8" />,
      description: 'Break bricks with balls in competitive PvP mode',
      players: '2 Players',
      difficulty: 'Medium',
      online: 189
    },
    {
      id: 'reversi',
      name: 'Reversi',
      icon: <CircleDot className="h-6 w-6 sm:h-8 sm:w-8" />,
      description: 'Flip opponent pieces to control the board',
      players: '2 Players',
      difficulty: 'Medium',
      online: 324
    },
    {
      id: 'battleship',
      name: 'Battleship',
      icon: <Target className="h-6 w-6 sm:h-8 sm:w-8" />,
      description: 'Sink your opponent\'s fleet before they sink yours',
      players: '2 Players',
      difficulty: 'Medium',
      online: 278
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/20 text-green-400';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'Hard': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const handleJoinRoom = () => {
    if (roomInput.trim() && showRoomInput) {
      setRoomName(roomInput.trim());
      setSelectedGame(showRoomInput);
      onEnterGame();
    }
  };

  if (selectedGame && roomName && playMode) {
    const game = games.find(g => g.id === selectedGame);
    return (
      <GameRoom
        gameId={selectedGame}
        gameName={game?.name || 'Game'}
        user={user}
        roomName={roomName}
        playMode={playMode}
        onLeave={() => {
          setSelectedGame(null);
          setRoomName('');
          setPlayMode(null);
          onLeaveGame();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full p-2 sm:p-4">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Board Games Arena</h2>
        <p className="text-slate-400 text-sm sm:text-base px-4">Challenge players or play against the computer in a beautiful, modern arena</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 w-full max-w-7xl mx-auto px-2 sm:px-4">
        {games.map((game) => (
          <Card 
            key={game.id} 
            className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 border-0 shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer flex flex-col p-3 sm:p-4 min-h-[280px] sm:min-h-[320px]"
            onClick={() => setShowRoomInput(game.id)}
          >
            <CardHeader className="text-center pb-2 sm:pb-4 w-full flex flex-col items-center p-0">
              <div className="flex justify-center text-yellow-400 mb-2 sm:mb-3">
                {game.icon}
              </div>
              <CardTitle className="text-white text-lg sm:text-xl font-bold mb-1 sm:mb-2 leading-tight">{game.name}</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-3 sm:space-y-4 w-full flex-1 flex flex-col justify-between p-0">
              <p className="text-slate-400 text-xs sm:text-sm text-center leading-relaxed">{game.description}</p>
              
              <div className="flex justify-between items-center flex-wrap gap-1 sm:gap-2">
                <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                  {game.players}
                </Badge>
                <Badge className={`${getDifficultyColor(game.difficulty)} text-xs`}>
                  {game.difficulty}
                </Badge>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button 
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold text-sm py-2"
                  onClick={e => {
                    e.stopPropagation();
                    setPlayMode('player');
                    setShowRoomInput(game.id);
                    onEnterGame();
                  }}
                >
                  Play vs Player
                </Button>
                
                {showRoomInput === game.id && playMode === 'player' && (
                  <div className="space-y-2">
                    <input
                      className="w-full rounded bg-slate-700 text-white px-2 py-1 border border-slate-600 text-sm"
                      placeholder="Enter room name"
                      value={roomInput}
                      onChange={e => setRoomInput(e.target.value)}
                      onClick={e => e.stopPropagation()}
                    />
                    <Button
                      className="w-full bg-green-500 hover:bg-green-600 text-white text-sm py-2"
                      onClick={handleJoinRoom}
                      disabled={!roomInput.trim()}
                    >
                      Join Room
                    </Button>
                  </div>
                )}
                
                <Button 
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm py-2"
                  onClick={e => {
                    e.stopPropagation();
                    setPlayMode('computer');
                    setRoomName('computer-match');
                    setSelectedGame(game.id);
                    onEnterGame();
                  }}
                >
                  Play vs Computer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
