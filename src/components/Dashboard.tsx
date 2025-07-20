import { Leaderboard } from '@/components/Leaderboard';
import { UserProfile } from '@/components/UserProfile';
import { GlobalChat } from '@/components/chat/GlobalChat';
import { FriendsList } from '@/components/chat/FriendsList';
import { DirectChatWindow } from '@/components/chat/DirectChatWindow';
import { BoardGames } from '@/components/games/BoardGames';
import { PuzzleGame } from '@/components/puzzles/PuzzleGame';
import { Shop } from '@/components/shop/Shop';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { announceOnline, socket } from '@/lib/socket';
import { debouncedSyncUserStats } from '@/lib/userStatsSync';
import {
    Brain,
    Coins,
    Crown,
    Gamepad2,
    Gift,
    LogOut,
    MessageCircle,
    Star,
    Target,
    Trophy,
    User,
    Bell
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NotificationList } from '@/components/ui/NotificationList';

interface DashboardProps {
  user: any;
  onLogout: () => void;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Dashboard = ({ user, onLogout, initialTab = 'puzzles', onTabChange }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem('mindVaultActiveTab');
    return stored || initialTab;
  });
  const [userStats, setUserStats] = useState(user);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [inGame, setInGame] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleEnterGame = () => {
    setInGame(true);
  };

  const handleLeaveGame = () => {
    setInGame(false);
  };

  useEffect(() => {
    setUserStats(user);
  }, [user]);

  const requestNotificationPermission = () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted.');
        } else {
          console.log('Notification permission denied.');
        }
      });
    }
  };

  useEffect(() => {
    requestNotificationPermission();

    const handleReceiveDm = (message: any) => {
      if (message.receiver_id === userStats.uid && activeTab !== 'friends') {
        setNotifications(prev => [...prev, { id: Date.now().toString(), type: 'message', title: `New message from ${message.senderDisplayName || message.senderId}`, body: message.content, timestamp: new Date().toISOString(), read: false, senderId: message.senderId }]);
        // setNotificationCount(prev => prev + 1); // notificationCount is now derived from notifications.length
        if (Notification.permission === 'granted') {
          new Notification(`New message from ${message.senderDisplayName || message.senderId}`, {
            body: message.content,
            icon: message.senderAvatar || '/favicon.svg'
          });
        }
      }
    };

    const handleFriendRequest = (request: any) => {
      if (request.receiverId === userStats.uid && activeTab !== 'friends') {
        setNotifications(prev => [...prev, { id: Date.now().toString(), type: 'friend_request', title: `New friend request from ${request.senderDisplayName || request.senderId}`, body: 'You have a new friend request!', timestamp: new Date().toISOString(), read: false, senderId: request.senderId }]);
        // setNotificationCount(prev => prev + 1); // notificationCount is now derived from notifications.length
        if (Notification.permission === 'granted') {
          new Notification(`New friend request from ${request.senderDisplayName || request.senderId}`, {
            body: 'You have a new friend request!',
            icon: '/favicon.svg'
          });
        }
      }
    };

    socket.on('receive-dm', handleReceiveDm);
    socket.on('friend-request-received', handleFriendRequest);

    return () => {
      socket.off('receive-dm', handleReceiveDm);
      socket.off('friend-request-received', handleFriendRequest);
    };
  }, [userStats, activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem('mindVaultActiveTab', tab);
    if (onTabChange) onTabChange(tab);
  };

  const updateUserStats = (newStats: any) => {
    const updated = { ...userStats, ...newStats };
    setUserStats(updated);
    sessionStorage.setItem('mindVaultUser', JSON.stringify(updated));
    
    // Use debounced sync to avoid too many API calls
    debouncedSyncUserStats(updated);
  };

  const handlePurchase = (item: any) => {
    if (userStats.coins >= item.price) {
      const newCoins = userStats.coins - item.price;
      updateUserStats({ coins: newCoins });
      console.log(`Purchased ${item.name} for ${item.price} coins`);
    }
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 w-full">
      {!inGame && (
        <header className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/90 shadow-lg fixed top-0 left-0 z-50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
            <span className="text-lg sm:text-xl font-bold text-white tracking-wide">MIND VAULT</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={() => {
                setShowNotifications(prev => !prev);
                // Mark all current notifications as read when the list is opened
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
              }}
            >
              <Bell className="h-4 w-4 text-white" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadNotificationCount}
                </span>
              )}
            </Button>
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-full">
              <span className="text-sm">
                {user.avatar?.startsWith('http') ? (
                  <img src={user.avatar} alt="avatar" className="w-6 h-6 rounded-full" />
                ) : (
                  user.avatar || '👤'
                )}
              </span>
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
      )}

      {showNotifications && (
        <NotificationList
          notifications={notifications}
          onMarkAsRead={(id) => {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
          }}
          onClearAll={() => setNotifications([])}
          onViewMessage={(senderId) => {
            // Find the friend and open chat
            const friend = friends.find(f => f.friend_uid === senderId);
            if (friend) {
              setSelectedFriend(friend);
              setActiveTab('friends');
              setShowNotifications(false);
            }
          }}
        />
      )}

      <main className={`flex-1 w-full ${!inGame ? 'pt-16' : ''} pb-6 px-3`}>
        <div className="w-full max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {!inGame && (
              <TabsList className="flex overflow-x-auto justify-start md:grid md:grid-cols-6 gap-1 w-full mb-4 h-auto p-1">
                <TabsTrigger value="puzzles" className="flex-1 flex flex-col sm:flex-row items-center gap-1 data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900">
                  <Brain className="h-3 w-3" />
                  <span className="text-[10px] sm:hidden md:inline">Quiz</span>
                </TabsTrigger>
                <TabsTrigger value="games" className="flex-1 flex flex-col sm:flex-row items-center gap-1 data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900">
                  <Gamepad2 className="h-3 w-3" />
                  <span className="text-[10px] sm:hidden md:inline">Games</span>
                </TabsTrigger>
                <TabsTrigger value="shop" className="flex-1 flex flex-col sm:flex-row items-center gap-1 data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900">
                  <Gift className="h-3 w-3" />
                  <span className="text-[10px] sm:hidden md:inline">Shop</span>
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex-1 flex flex-col sm:flex-row items-center gap-1 data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900">
                  <MessageCircle className="h-3 w-3" />
                  <span className="text-[10px] sm:hidden md:inline">Chat</span>
                </TabsTrigger>
                <TabsTrigger value="friends" className="flex-1 flex flex-col sm:flex-row items-center gap-1 data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900">
                  <User className="h-3 w-3" />
                  <span className="text-[10px] sm:hidden md:inline">Friends</span>
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="flex-1 flex flex-col sm:flex-row items-center gap-1 data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900">
                  <Trophy className="h-3 w-3" />
                  <span className="text-[10px] md:inline">Rank</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex-1 flex flex-col sm:flex-row items-center gap-1 data-[state=active]:bg-yellow-400 data-[state=active]:text-slate-900">
                  <User className="h-3 w-3" />
                  <span className="text-[10px] md:inline">Profile</span>
                </TabsTrigger>
              </TabsList>
            )}

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

            <TabsContent value="puzzles" className="mt-0">
              <PuzzleGame user={userStats} onUpdateUser={updateUserStats} />
            </TabsContent>

            <TabsContent value="games" className="mt-0">
              <BoardGames 
                user={userStats} 
                onEnterGame={handleEnterGame} 
                onLeaveGame={handleLeaveGame} 
              />
            </TabsContent>

            <TabsContent value="shop" className="mt-0">
              <Shop user={userStats} onPurchase={handlePurchase} />
            </TabsContent>

            <TabsContent value="chat" className="mt-0">
              <GlobalChat user={userStats} />
            </TabsContent>

            <TabsContent value="friends" className="mt-0">
              {selectedFriend ? (
                <DirectChatWindow
                  currentUser={userStats}
                  friend={selectedFriend}
                  onCloseChat={() => setSelectedFriend(null)}
                />
              ) : (
                <FriendsList currentUser={userStats} onSelectFriend={setSelectedFriend} />
              )}
            </TabsContent>

            <TabsContent value="leaderboard" className="mt-0">
              <Leaderboard currentUser={userStats} />
            </TabsContent>

            <TabsContent value="profile" className="mt-0">
              <UserProfile user={userStats} onUpdateUser={updateUserStats} isCurrentUser={true} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};