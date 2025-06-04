
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Trophy, Medal, Target } from 'lucide-react';

interface LeaderboardProps {
  currentUser: any;
}

const mockLeaderboard = [
  { id: 1, username: 'PuzzleMaster', avatar: '🧙‍♂️', score: 2847, puzzlesSolved: 156, rank: 'Legend' },
  { id: 2, username: 'BrainStorm', avatar: '🧠', score: 2534, puzzlesSolved: 142, rank: 'Master' },
  { id: 3, username: 'LogicKnight', avatar: '⚡', score: 2291, puzzlesSolved: 128, rank: 'Master' },
  { id: 4, username: 'MindBender', avatar: '🔮', score: 2156, puzzlesSolved: 119, rank: 'Expert' },
  { id: 5, username: 'ThinkTank', avatar: '🌟', score: 1987, puzzlesSolved: 104, rank: 'Expert' },
  { id: 6, username: 'CodeBreaker', avatar: '👩‍💻', score: 1834, puzzlesSolved: 97, rank: 'Expert' },
  { id: 7, username: 'NeuralNet', avatar: '🦸‍♂️', score: 1672, puzzlesSolved: 89, rank: 'Advanced' },
  { id: 8, username: 'QuizWhiz', avatar: '👨‍💻', score: 1589, puzzlesSolved: 83, rank: 'Advanced' },
];

export const Leaderboard = ({ currentUser }: LeaderboardProps) => {
  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="h-5 w-5 text-yellow-400" />;
      case 2: return <Trophy className="h-5 w-5 text-gray-400" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <Target className="h-5 w-5 text-slate-400" />;
    }
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Legend': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'Master': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'Expert': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'Advanced': return 'bg-green-500/20 text-green-400 border-green-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Top 100 Leaderboard</h2>
        <div className="text-sm text-slate-400">
          Updated every hour
        </div>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
            Global Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockLeaderboard.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  player.username === currentUser.username
                    ? 'bg-yellow-400/20 border-yellow-400/50'
                    : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(index + 1)}
                  </div>
                  <div className="text-2xl">{player.avatar}</div>
                  <div>
                    <div className="font-semibold text-white flex items-center space-x-2">
                      <span>{player.username}</span>
                      {player.username === currentUser.username && (
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                          You
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-slate-400">
                      {player.puzzlesSolved} puzzles solved
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Badge className={`border ${getRankColor(player.rank)}`}>
                    {player.rank}
                  </Badge>
                  <div className="text-right">
                    <div className="font-bold text-white">{player.score.toLocaleString()}</div>
                    <div className="text-sm text-slate-400">points</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current User Stats */}
      <Card className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-400/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">{currentUser.avatar}</div>
              <div>
                <div className="font-bold text-white text-lg">{currentUser.displayName}</div>
                <div className="text-slate-300">Your current standing</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">
                #{Math.floor(Math.random() * 50) + 50}
              </div>
              <div className="text-sm text-slate-300">Global Rank</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
