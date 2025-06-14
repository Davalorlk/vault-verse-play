
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PuzzleGame } from '@/components/puzzles/PuzzleGame';
import { Leaderboard } from '@/components/Leaderboard';
import { UserProfile } from '@/components/UserProfile';
import { GlobalChat } from '@/components/chat/GlobalChat';
import { BoardGames } from '@/components/games/BoardGames';
import { Shop } from '@/components/shop/Shop';
import { 
  Brain, 
  Trophy, 
  User, 
  LogOut, 
  Coins, 
  Star, 
  Target,
  Crown,
  MessageCircle,
  Gamepad2,
  Gift
} from 'lucide-react';
import { socket, announceOnline } from '@/lib/socket';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState('puzzles');
  const [userStats, setUserStats] = useState(user);
  const [onlineCount, setOnlineCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);

  const updateUserStats = (newStats: any) => {
    const updated = { ...userStats, ...newStats };
    setUserStats(updated);
    sessionStorage.setItem('mindVaultUser', JSON.stringify(updated));
  };

  const handlePurchase = (item: any) => {
    if (userStats.coins >= item.price) {
      const newCoins = userStats.coins - item.price;
      updateUserStats({ coins: newCoins });
      console.log(`Purchased ${item.name} for ${item.price} coins`);
    }
  };

  // Presence tracking
  useEffect(() => {
    if (userStats) {
      announceOnline({
        uid: userStats.uid,
        displayName: userStats.displayName,
        avatar: userStats.avatar,
        rank: userStats.rank
      });
    }
    const handlePresence = (users: any[]) => {
      setOnlineCount(users.length);
    };
    socket.on('presence-update', handlePresence);
    return () => {
      socket.off('presence-update', handlePresence);
    };
  }, [userStats]);

  useEffect(() => {
    // Real-time online and total players logic would go here
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 w-full">
      {/* Mobile-First Header */}
      <header className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/90 shadow-lg fixed top-0 left-0 z-50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
          <span className="text-lg sm:text-xl font-bold text-white tracking-wide">MIND VAULT</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-full">
            <span className="text-sm">{user.avatar || '👤'}</span>
            <span className="text-white font-semibold text-sm hidden sm:inline">{user.displayName || user.username}</span>
          </div>
          <Button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded shadow text-xs"
          >
            <LogOut className="h-3 w-3 sm:hidden" />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full pt-16 pb-6 px-3">
        <div className="w-full max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Mobile-First Tab Navigation */}
            <TabsList className="grid grid-cols-3 sm:grid-cols-6 gap-1 w-full mb-4 h-auto p-1">
              <TabsTrigger value="puzzles" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900 text-xs px-2 py-2 flex flex-col sm:flex-row items-center gap-1">
                <Brain className="h-3 w-3" />
                <span className="text-[10px] sm:text-xs">Quiz</span>
              </TabsTrigger>
              <TabsTrigger value="games" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900 text-xs px-2 py-2 flex flex-col sm:flex-row items-center gap-1">
                <Gamepad2 className="h-3 w-3" />
                <span className="text-[10px] sm:text-xs">Games</span>
              </TabsTrigger>
              <TabsTrigger value="shop" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900 text-xs px-2 py-2 flex flex-col sm:flex-row items-center gap-1">
                <Gift className="h-3 w-3" />
                <span className="text-[10px] sm:text-xs">Shop</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900 text-xs px-2 py-2 flex flex-col sm:flex-row items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                <span className="text-[10px] sm:text-xs">Chat</span>
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900 text-xs px-2 py-2 flex flex-col sm:flex-row items-center gap-1">
                <Trophy className="h-3 w-3" />
                <span className="text-[10px] sm:text-xs">Rank</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900 text-xs px-2 py-2 flex flex-col sm:flex-row items-center gap-1">
                <User className="h-3 w-3" />
                <span className="text-[10px] sm:text-xs">Profile</span>
              </TabsTrigger>
            </TabsList>

            {/* Mobile-First Stats Bar for Profile */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-blue-500/20 rounded-lg">
                        <Target className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{userStats.puzzlesSolved}</div>
                        <div className="text-xs text-slate-400">Puzzles</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-green-500/20 rounded-lg">
                        <Star className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{userStats.experience}</div>
                        <div className="text-xs text-slate-400">XP</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-purple-500/20 rounded-lg">
                        <Crown className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">Level {userStats.level}</div>
                        <div className="text-xs text-slate-400">Level</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-yellow-500/20 rounded-lg">
                        <Coins className="h-4 w-4 text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{userStats.coins}</div>
                        <div className="text-xs text-slate-400">Coins</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tab Content */}
            <TabsContent value="puzzles" className="mt-0">
              <PuzzleGame user={userStats} onUpdateUser={updateUserStats} />
            </TabsContent>

            <TabsContent value="games" className="mt-0">
              <BoardGames user={userStats} />
            </TabsContent>

            <TabsContent value="shop" className="mt-0">
              <Shop user={userStats} onPurchase={handlePurchase} />
            </TabsContent>

            <TabsContent value="chat" className="mt-0">
              <GlobalChat user={userStats} />
            </TabsContent>

            <TabsContent value="leaderboard" className="mt-0">
              <Leaderboard currentUser={userStats} />
            </TabsContent>

            <TabsContent value="profile" className="mt-0">
              <UserProfile user={userStats} onUpdateUser={updateUserStats} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};
