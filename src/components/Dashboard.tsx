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
    // Backup to Firebase
    // set(ref(db, `users/${updated.uid}`), {
    //   ...updated,
    //   lastActive: serverTimestamp(),
    // });
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

  // Real-time online and total players
  useEffect(() => {
    // COMMENTED OUT: Firebase logic for online and total players
    // const usersRef = ref(db, 'users');
    // onValue(usersRef, snap => {
    //   const users = snap.val() ? Object.values(snap.val()) : [];
    //   setTotalPlayers(users.length);
    // });
    // const presenceRef = ref(db, 'presence');
    // onValue(presenceRef, snap => {
    //   setOnlineCount(snap.val() ? Object.keys(snap.val()).length : 0);
    // });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex flex-col items-center w-full">
      <div className="w-full max-w-7xl px-2 md:px-6 flex-1 flex flex-col">
        <div className="py-6 flex flex-col gap-6 w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-wrap gap-2 justify-center w-full mb-4">
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
