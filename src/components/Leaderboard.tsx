import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { socket } from '@/lib/socket';
import { Badge as BadgeIcon, Crown, Star, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LeaderboardProps {
  currentUser: any;
}

const API_BASE_URL = 'https://mind-vault-kcfw.onrender.com';

export const Leaderboard = ({ currentUser }: LeaderboardProps) => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [userRank, setUserRank] = useState<number|null>(null);

  // Get rank-based icon and theme
  const getRankTheme = (position: number) => {
    if (position === 1) {
      return {
        icon: <Crown className="h-5 w-5 text-yellow-400" />,
        bgGradient: 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/20',
        borderColor: 'border-yellow-400/50',
        textColor: 'text-yellow-400',
        title: 'Champion'
      };
    } else if (position === 2) {
      return {
        icon: <Trophy className="h-5 w-5 text-gray-300" />,
        bgGradient: 'bg-gradient-to-r from-gray-300/20 to-gray-500/20',
        borderColor: 'border-gray-400/50',
        textColor: 'text-gray-300',
        title: 'Master'
      };
    } else if (position === 3) {
      return {
        icon: <BadgeIcon className="h-5 w-5 text-amber-600" />,
        bgGradient: 'bg-gradient-to-r from-amber-600/20 to-amber-800/20',
        borderColor: 'border-amber-600/50',
        textColor: 'text-amber-600',
        title: 'Expert'
      };
    } else if (position <= 10) {
      return {
        icon: <Star className="h-5 w-5 text-blue-400" />,
        bgGradient: 'bg-gradient-to-r from-blue-400/20 to-blue-600/20',
        borderColor: 'border-blue-400/50',
        textColor: 'text-blue-400',
        title: 'Elite'
      };
    } else {
      return {
        icon: <Star className="h-5 w-5 text-slate-400" />,
        bgGradient: 'bg-slate-700/30',
        borderColor: 'border-slate-600',
        textColor: 'text-slate-400',
        title: 'Player'
      };
    }
  };

  // Fetch leaderboard and sort by puzzles solved
  const fetchLeaderboard = () => {
    fetch(`${API_BASE_URL}/api/leaderboard`)
      .then(res => res.json())
      .then(data => {
        // Sort by puzzles solved only (highest first)
        const sortedData = data.sort((a: any, b: any) => {
          const aPuzzles = a.puzzles_solved || a.puzzlesSolved || 0;
          const bPuzzles = b.puzzles_solved || b.puzzlesSolved || 0;
          return bPuzzles - aPuzzles;
        });
        setLeaderboard(sortedData);
        setTotalPlayers(sortedData.length);
        // Find current user's rank (1-based)
        const idx = sortedData.findIndex((p: any) =>
          p.uid === currentUser.uid ||
          p.username === currentUser.username ||
          p.displayName === currentUser.displayName
        );
        setUserRank(idx >= 0 ? idx + 1 : null);
      })
      .catch(() => {
        setLeaderboard([]);
        setTotalPlayers(0);
        setUserRank(null);
      });
  };

  useEffect(() => {
    fetchLeaderboard();
    // Listen for real-time online count via Socket.IO
    const handlePresence = (users: any[]) => {
      setOnlineCount(users.length);
      // Optionally, refetch leaderboard for real-time updates
      fetchLeaderboard();
    };
    socket.on('presence-update', handlePresence);
    // Request current presence
    socket.emit('get-presence');
    return () => {
      socket.off('presence-update', handlePresence);
    };
  }, [currentUser]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Top 100 Leaderboard</h2>
        <div className="text-sm text-slate-400 flex flex-col items-end">
          <span>Online: <span className="text-green-400 font-bold">{onlineCount}</span></span>
          <span>Total Players: <span className="text-blue-400 font-bold">{totalPlayers}</span></span>
        </div>
      </div>
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
            Global Rankings - Based on Puzzles Solved
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((player, index) => {
              const position = index + 1;
              const theme = getRankTheme(position);
              const puzzlesSolved = player.puzzles_solved || player.puzzlesSolved || 0;
              const timePlayed = player.time_played || player.timePlayed || 0;
              const isCurrentUser = player.uid && currentUser.uid && player.uid === currentUser.uid;
              return (
                <div
                  key={player.uid || player.id || index}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    isCurrentUser
                      ? 'bg-yellow-400/20 border-yellow-400/50'
                      : `${theme.bgGradient} ${theme.borderColor} hover:bg-slate-700/50`
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8">
                      {theme.icon}
                    </div>
                    <div className="text-2xl">{player.avatar}</div>
                    <div>
                      <div className="font-semibold text-white flex items-center space-x-2">
                        <span>{player.username || player.displayName}</span>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-slate-400">
                        {puzzlesSolved} puzzles • {Math.floor(timePlayed)} min played
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className={`border ${theme.borderColor} ${theme.textColor} bg-transparent`}>
                      #{position} {theme.title}
                    </Badge>
                    <div className="text-right">
                      <div className={`font-bold ${theme.textColor} text-xl`}>
                        {puzzlesSolved}
                      </div>
                      <div className="text-sm text-slate-400">puzzles</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      {/* Current User Stats - Only show if not in leaderboard */}
      {userRank === null && (
        <Card className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-400/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 flex items-center justify-center">
                  {currentUser.avatar?.startsWith('http') ? (
                    <img src={currentUser.avatar} alt="avatar" className="w-full h-full rounded-full" />
                  ) : (
                    <span className="text-3xl">{currentUser.avatar}</span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-white text-lg">{currentUser.displayName}</div>
                  <div className="text-slate-300">
                    {currentUser.puzzlesSolved || 0} puzzles • {Math.floor(currentUser.timePlayed || 0)} min played
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-400">
                  Unranked
                </div>
                <div className="text-sm text-slate-300">Global Rank</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
