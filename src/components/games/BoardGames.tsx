
import { useState } from 'react';
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
      id: 'ludo',
      name: 'Ludo',
      icon: <Gamepad2 className="h-8 w-8" />,
      description: 'Race your pieces to the finish',
      players: '2-4 Players',
      difficulty: 'Easy',
      online: 623
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

  if (selectedGame) {
    return (
      <GameRoom 
        gameId={selectedGame} 
        gameName={games.find(g => g.id === selectedGame)?.name || ''}
        user={user}
        onLeave={() => setSelectedGame(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Board Games Arena</h2>
        <p className="text-slate-400">Challenge players from around the world</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {games.map((game) => (
          <Card 
            key={game.id} 
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 cursor-pointer"
            onClick={() => setSelectedGame(game.id)}
          >
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center text-yellow-400 mb-3">
                {game.icon}
              </div>
              <CardTitle className="text-white text-lg md:text-xl">{game.name}</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-slate-400 text-sm text-center">{game.description}</p>
              
              <div className="flex justify-between items-center flex-wrap gap-2">
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  {game.players}
                </Badge>
                <Badge className={getDifficultyColor(game.difficulty)}>
                  {game.difficulty}
                </Badge>
              </div>

              <div className="text-center">
                <div className="text-lg font-semibold text-green-400">{game.online}</div>
                <div className="text-xs text-slate-400">players online</div>
              </div>

              <Button 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedGame(game.id);
                }}
              >
                Play Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4 md:p-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg md:text-xl font-semibold text-white">Game Rules & Tips</h3>
            <p className="text-slate-400 text-sm md:text-base">
              Each game has its own chat room where you can communicate with your opponents. 
              Be respectful and enjoy the strategic gameplay!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
