
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Dashboard } from '@/components/Dashboard';
import { Crown, Trophy, Users, Brain, Sparkles } from 'lucide-react';

const Index = () => {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);

  useEffect(() => {
    // Check for existing session
    const savedUser = sessionStorage.getItem('mindVaultUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    sessionStorage.setItem('mindVaultUser', JSON.stringify(userData));
    setShowLogin(false);
  };

  const handleRegister = (userData) => {
    setUser(userData);
    sessionStorage.setItem('mindVaultUser', JSON.stringify(userData));
    setShowRegister(false);
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('mindVaultUser');
  };

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 w-full">
      {/* Mobile-First Header */}
      <header className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/90 shadow-lg fixed top-0 left-0 z-50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
          <span className="text-lg sm:text-xl font-bold text-white tracking-wide">MIND VAULT</span>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-full">
              <span className="text-sm">{user.avatar || '👤'}</span>
              <span className="text-white font-semibold text-sm hidden sm:inline">{user.displayName || user.username}</span>
            </div>
            <Button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded shadow text-xs"
            >
              Log out
            </Button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-3 pt-16 pb-6">
        {/* Mobile-First Slogan */}
        <div className="w-full flex justify-center mb-4">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-2 rounded-full shadow-lg">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
            <span className="text-sm sm:text-lg font-semibold text-yellow-300 tracking-wide text-center">
              Unlock your potential
            </span>
          </div>
        </div>

        <div className="w-full max-w-6xl flex flex-col gap-6 items-center justify-center">
          {/* Mobile-First Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl shadow-2xl">
                <Brain className="h-8 w-8 sm:h-10 sm:w-10 text-slate-900" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent mb-3">
              Mind Vault
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed px-2">
              Challenge yourself with puzzles, strategic board games, and competitive gameplay. 
              Join thousands of players worldwide.
            </p>
          </div>

          {/* Mobile-First Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6 w-full">
            <Card className="p-4 bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300">
              <Brain className="h-8 w-8 text-yellow-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">1000+ Puzzles</h3>
              <p className="text-sm text-slate-400">Math sequences, trivia, word scrambles, and mind-bending challenges</p>
            </Card>
            
            <Card className="p-4 bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300">
              <Users className="h-8 w-8 text-blue-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Multiplayer Games</h3>
              <p className="text-sm text-slate-400">Chess, Checkers, Connect Four, and more with real-time chat</p>
            </Card>
            
            <Card className="p-4 bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 sm:col-span-2 md:col-span-1">
              <Trophy className="h-8 w-8 text-green-400 mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Compete & Rank</h3>
              <p className="text-sm text-slate-400">Climb leaderboards, earn achievements, and unlock premium themes</p>
            </Card>
          </div>

          {/* Mobile-First CTA Section */}
          <div className="text-center w-full">
            <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
              <Button
                onClick={() => setShowRegister(true)}
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
              >
                <Crown className="h-5 w-5 mr-2" />
                Join the Vault
              </Button>
              <Button
                onClick={() => setShowLogin(true)}
                variant="outline"
                className="w-full py-4 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-300 text-lg"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Enter Vault
              </Button>
            </div>
            
            <div className="mt-4 flex justify-center">
              <Badge variant="secondary" className="bg-slate-800 text-yellow-400 border-yellow-400/50 text-sm">
                Free to Play • Premium Themes Available
              </Badge>
            </div>
          </div>
        </div>
      </main>

      {/* Login Modal */}
      {showLogin && (
        <LoginForm 
          onLogin={handleLogin} 
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}

      {/* Register Modal */}
      {showRegister && (
        <RegisterForm 
          onRegister={handleRegister} 
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
    </div>
  );
};

export default Index;
