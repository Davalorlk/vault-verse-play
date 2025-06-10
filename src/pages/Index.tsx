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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 w-full">
      {/* App Header */}
      <header className="w-full flex items-center justify-between px-4 md:px-8 py-3 bg-slate-900/80 shadow-lg fixed top-0 left-0 z-50">
        <div className="flex items-center gap-3">
          <Brain className="h-7 w-7 text-yellow-400" />
          <span className="text-2xl font-bold text-white tracking-wide">MIND VAULT</span>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
              <span className="text-lg">{user.avatar || '👤'}</span>
              <span className="text-white font-semibold">{user.displayName || user.username}</span>
            </div>
            <Button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded shadow text-sm"
            >
              Log out
            </Button>
          </div>
        )}
      </header>
      {/* Slogan below header */}
      <div className="w-full flex justify-center mt-24 mb-2">
        <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-full shadow-lg">
          <Brain className="h-6 w-6 text-yellow-400" />
          <span className="text-lg md:text-xl font-semibold text-yellow-300 tracking-wide">MIND VAULT - Unlock your potential</span>
        </div>
      </div>
      <div className="w-full max-w-3xl px-2 md:px-6 flex flex-col gap-8 items-center justify-center pt-20"> {/* add pt-20 for header offset */}
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center mb-4 md:mb-6">
            <div className="p-3 md:p-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl shadow-2xl">
              <Brain className="h-8 w-8 md:h-12 md:w-12 text-slate-900" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent mb-4">
            Mind Vault
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed px-4">
            Unlock your potential with challenging puzzles, strategic board games, and competitive gameplay. 
            Join thousands of players in the ultimate mental challenge arena.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
          <Card className="p-4 md:p-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 hover:scale-105">
            <Brain className="h-8 w-8 md:h-12 md:w-12 text-yellow-400 mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-white mb-2">1000+ Puzzles</h3>
            <p className="text-sm md:text-base text-slate-400">Math sequences, trivia, word scrambles, and mind-bending challenges await</p>
          </Card>
          
          <Card className="p-4 md:p-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 hover:scale-105">
            <Users className="h-8 w-8 md:h-12 md:w-12 text-blue-400 mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Multiplayer Games</h3>
            <p className="text-sm md:text-base text-slate-400">Chess, Checkers, Connect Four, and more with real-time chat</p>
          </Card>
          
          <Card className="p-4 md:p-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 hover:scale-105">
            <Trophy className="h-8 w-8 md:h-12 md:w-12 text-green-400 mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-white mb-2">Compete & Rank</h3>
            <p className="text-sm md:text-base text-slate-400">Climb leaderboards, earn achievements, and unlock premium themes</p>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={() => setShowRegister(true)}
              className="px-6 md:px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Crown className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              Join the Vault
            </Button>
            <Button
              onClick={() => setShowLogin(true)}
              variant="outline"
              className="px-6 md:px-8 py-3 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-300"
            >
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 mr-2" />
              Enter Vault
            </Button>
          </div>
          
          <div className="mt-6 flex justify-center">
            <Badge variant="secondary" className="bg-slate-800 text-yellow-400 border-yellow-400/50 text-xs md:text-sm">
              Free to Play • Premium Themes Available
            </Badge>
          </div>
        </div>
      </div>

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
