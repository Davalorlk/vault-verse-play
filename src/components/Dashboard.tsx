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
import { db } from '@/lib/firebase';
import { ref, set, onValue, serverTimestamp } from 'firebase/database';

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
    // Backup to Firebase
    if (updated.uid) {
      set(ref(db, `users/${updated.uid}`), {
        ...updated,
        lastActive: serverTimestamp(),
      });
    }
  };

  const handlePurchase = (item: any) => {
    if (userStats.coins >= item.price) {
      const newCoins = userStats.coins - item.price;
      updateUserStats({ coins: newCoins });
      console.log(`Purchased ${item.name} for ${item.price} coins`);
      // You could add a toast notification here
    }
  };

  // Presence tracking
  useEffect(() => {
    if (userStats.uid) {
      const presenceRef = ref(db, `presence/${userStats.uid}`);
      set(presenceRef, true);
      window.addEventListener('beforeunload', () => set(presenceRef, null));
      return () => set(presenceRef, null);
    }
  }, [userStats.uid]);

  // Real-time online and total players
  useEffect(() => {
    const usersRef = ref(db, 'users');
    onValue(usersRef, snap => {
      const users = snap.val() ? Object.values(snap.val()) : [];
      setTotalPlayers(users.length);
    });
    const presenceRef = ref(db, 'presence');
    onValue(presenceRef, snap => {
      setOnlineCount(snap.val() ? Object.keys(snap.val()).length : 0);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg">
                  <Brain className="h-5 w-5 md:h-6 md:w-6 text-slate-900" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                  Mind Vault
                </h1>
              </div>
              
              <div className="flex items-center space-x-2 md:space-x-4">
                <div className="flex items-center space-x-2 text-yellow-400">
                  <Coins className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="font-semibold text-sm md:text-base">{userStats.coins}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg md:text-2xl">{userStats.avatar}</span>
                  <span className="text-white font-medium text-sm md:text-base truncate max-w-[100px] md:max-w-none">{userStats.displayName}</span>
                  <Badge variant="secondary" className="bg-yellow-400/20 text-yellow-400 text-xs">
                    {userStats.rank}
                  </Badge>
                </div>
                <div className="flex flex-col items-end text-xs text-slate-400">
                  <span>Online: <span className="text-green-400 font-bold">{onlineCount}</span></span>
                  <span>Total Players: <span className="text-blue-400 font-bold">{totalPlayers}</span></span>
                </div>
                <Button
                  onClick={onLogout}
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-4 md:py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-slate-800 border-slate-700">
              <TabsTrigger value="puzzles" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900 text-xs md:text-sm">
                <Brain className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Puzzles</span>
                <span className="sm:hidden">Quiz</span>
              </TabsTrigger>
              <TabsTrigger value="games" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900 text-xs md:text-sm">
                <Gamepad2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Games</span>
                <span className="sm:hidden">Play</span>
              </TabsTrigger>
              <TabsTrigger value="shop" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900 text-xs md:text-sm">
                <Gift className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Shop
              </TabsTrigger>
              <TabsTrigger value="chat" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900 text-xs md:text-sm">
                <MessageCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900 text-xs md:text-sm">
                <Trophy className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Leaderboard</span>
                <span className="sm:hidden">Rank</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900 text-xs md:text-sm">
                <User className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Profile
              </TabsTrigger>
            </TabsList>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="p-1.5 md:p-2 bg-blue-500/20 rounded-lg">
                      <Target className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm md:text-lg font-semibold text-white">{userStats.puzzlesSolved}</div>
                      <div className="text-xs text-slate-400">Puzzles</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="p-1.5 md:p-2 bg-green-500/20 rounded-lg">
                      <Star className="h-4 w-4 md:h-5 md:w-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm md:text-lg font-semibold text-white">{userStats.experience}</div>
                      <div className="text-xs text-slate-400">XP</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="p-1.5 md:p-2 bg-purple-500/20 rounded-lg">
                      <Crown className="h-4 w-4 md:h-5 md:w-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm md:text-lg font-semibold text-white">Level {userStats.level}</div>
                      <div className="text-xs text-slate-400">Level</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center space-x-2 md:space-x-3">
                    <div className="p-1.5 md:p-2 bg-yellow-500/20 rounded-lg">
                      <Coins className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-sm md:text-lg font-semibold text-white">{userStats.coins}</div>
                      <div className="text-xs text-slate-400">Coins</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tab Content */}
            <TabsContent value="puzzles">
              <PuzzleGame user={userStats} onUpdateUser={updateUserStats} />
            </TabsContent>

            <TabsContent value="games">
              <BoardGames user={userStats} />
            </TabsContent>

            <TabsContent value="shop">
              <Shop user={userStats} onPurchase={handlePurchase} />
            </TabsContent>

            <TabsContent value="chat">
              <GlobalChat user={userStats} />
            </TabsContent>

            <TabsContent value="leaderboard">
              <Leaderboard currentUser={userStats} />
            </TabsContent>

            <TabsContent value="profile">
              <UserProfile user={userStats} onUpdateUser={updateUserStats} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
