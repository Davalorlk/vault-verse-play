import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GameRoom } from './GameRoom';
import { Crown, Grid3X3, Gamepad2, Target, Brain, Puzzle, UserX, CircleDot, Search } from 'lucide-react';

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
}

export const BoardGames = ({ user }: BoardGamesProps) => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>('');
  const [roomInput, setRoomInput] = useState<string>('');
  const [showRoomInput, setShowRoomInput] = useState<string | null>(null);
  const [playMode, setPlayMode] = useState<'player' | 'computer' | null>(null);
  const [totalPlayed, setTotalPlayed] = useState({});

  const games: Game[] = [
    {
      id: 'chess',
      name: 'Chess',
      icon: <Crown className="h-8 w-8" />,
      description: 'The classic strategy game of kings and queens',
      players: '2 Players',
      difficulty: 'Hard',
      online: 1247
    },
    {
      id: 'checkers',
      name: 'Checkers',
      icon: <Crown className="h-8 w-8" />,
      description: 'Capture all opponent pieces to win',
      players: '2 Players',
      difficulty: 'Medium',
      online: 892
    },
    {
      id: 'tictactoe',
      name: 'Tic Tac Toe',
      icon: <Grid3X3 className="h-8 w-8" />,
      description: 'Get three in a row to win',
      players: '2 Players',
      difficulty: 'Easy',
      online: 1534
    },
    {
      id: 'connect4',
      name: 'Connect Four',
      icon: <Target className="h-8 w-8" />,
      description: 'Connect four pieces in a row',
      players: '2 Players',
      difficulty: 'Medium',
      online: 743
    },
    {
      id: 'dotandbox',
      name: 'Dot and Box',
      icon: <CircleDot className="h-8 w-8" />,
      description: 'Complete boxes by drawing lines between dots',
      players: '2 Players',
      difficulty: 'Medium',
      online: 412
    },
    {
      id: 'gomoku',
      name: 'Gomoku',
      icon: <Grid3X3 className="h-8 w-8" />,
      description: 'Get five stones in a row to win',
      players: '2 Players',
      difficulty: 'Medium',
      online: 321
    },
    {
      id: 'hangman',
      name: 'Hanging Man',
      icon: <UserX className="h-8 w-8" />,
      description: 'Guess the word before time runs out',
      players: '2 Players',
      difficulty: 'Easy',
      online: 567
    },
    {
      id: 'nineholes',
      name: 'Nine Holes',
      icon: <Puzzle className="h-8 w-8" />,
      description: 'Mill strategy game with nine positions',
      players: '2 Players',
      difficulty: 'Medium',
      online: 234
    },
    {
      id: 'guesswho',
      name: 'Guess Who',
      icon: <Search className="h-8 w-8" />,
      description: 'Guess your opponent\'s character first',
      players: '2 Players',
      difficulty: 'Easy',
      online: 456
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

  if (selectedGame && playMode) {
    return (
      <GameRoom 
        gameId={selectedGame} 
        gameName={games.find(g => g.id === selectedGame)?.name || ''}
        user={user}
        roomName={playMode === 'player' ? roomName : ''}
        playMode={playMode}
        onLeave={() => {
          setSelectedGame(null);
          setRoomName('');
          setPlayMode(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full">
      <div className="text-center mb-6">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Board Games Arena</h2>
        <p className="text-slate-400">Challenge players or play against the computer in a beautiful, modern arena</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-7xl mx-auto px-2 md:px-6">
        {games.map((game) => (
          <Card 
            key={game.id} 
            className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 border-0 shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer flex flex-col items-center justify-between p-6 min-h-[340px]"
            onClick={() => setShowRoomInput(game.id)}
          >
            <CardHeader className="text-center pb-4 w-full flex flex-col items-center">
              <div className="flex justify-center text-yellow-400 mb-3">
                {game.icon}
              </div>
              <CardTitle className="text-white text-xl md:text-2xl font-bold mb-2">{game.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 w-full flex-1 flex flex-col justify-between">
              <p className="text-slate-400 text-sm text-center mb-2">{game.description}</p>
              <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  {game.players}
                </Badge>
                <Badge className={getDifficultyColor(game.difficulty)}>
                  {game.difficulty}
                </Badge>
              </div>
              <div className="text-center mb-2">
                <div className="text-lg font-semibold text-green-400">{totalPlayed[game.id] || 0}</div>
                <div className="text-xs text-slate-400">games played</div>
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold"
                  onClick={e => {
                    e.stopPropagation();
                    setPlayMode('player');
                    setShowRoomInput(game.id);
                  }}
                >
                  Play vs Player
                </Button>
                {showRoomInput === game.id && playMode === 'player' && (
                  <div className="mt-2 space-y-2">
                    <input
                      className="w-full rounded bg-slate-700 text-white px-2 py-1 border border-slate-600"
                      placeholder="Enter or share a room name"
                      value={roomInput}
                      onChange={e => setRoomInput(e.target.value)}
                      onClick={e => e.stopPropagation()}
                    />
                    <Button
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                      onClick={e => {
                        e.stopPropagation();
                        setRoomName(roomInput.trim() || 'default-room');
                        setSelectedGame(game.id);
                      }}
                      disabled={!roomInput.trim()}
                    >
                      Join Room
                    </Button>
                  </div>
                )}
                <Button 
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                  onClick={e => {
                    e.stopPropagation();
                    setPlayMode('computer');
                    setSelectedGame(game.id);
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
