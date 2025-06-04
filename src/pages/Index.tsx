
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Dashboard } from '@/components/Dashboard';
import { Crown, Trophy, Users, Brain, Lock, Sparkles } from 'lucide-react';

const Index = () => {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl shadow-2xl">
              <Lock className="h-12 w-12 text-slate-900" />
            </div>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent mb-4">
            Mind Vault
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Unlock your potential with challenging puzzles, strategic board games, and competitive gameplay. 
            Join thousands of players in the ultimate mental challenge arena.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="p-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 hover:scale-105">
            <Brain className="h-12 w-12 text-yellow-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">1000+ Puzzles</h3>
            <p className="text-slate-400">Math sequences, trivia, word scrambles, and mind-bending challenges await</p>
          </Card>
          
          <Card className="p-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 hover:scale-105">
            <Users className="h-12 w-12 text-blue-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Multiplayer Games</h3>
            <p className="text-slate-400">Chess, Checkers, Connect Four, and more with real-time chat</p>
          </Card>
          
          <Card className="p-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 hover:scale-105">
            <Trophy className="h-12 w-12 text-green-400 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Compete & Rank</h3>
            <p className="text-slate-400">Climb leaderboards, earn achievements, and unlock premium themes</p>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="flex justify-center space-x-8 mb-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">2,847</div>
            <div className="text-sm text-slate-400">Players Online</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">45,291</div>
            <div className="text-sm text-slate-400">Games Played</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">156,832</div>
            <div className="text-sm text-slate-400">Puzzles Solved</div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="space-x-4">
            <Button
              onClick={() => setShowRegister(true)}
              className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Crown className="h-5 w-5 mr-2" />
              Join the Vault
            </Button>
            <Button
              onClick={() => setShowLogin(true)}
              variant="outline"
              className="px-8 py-3 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-300"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Enter Vault
            </Button>
          </div>
          
          <div className="mt-6 flex justify-center">
            <Badge variant="secondary" className="bg-slate-800 text-yellow-400 border-yellow-400/50">
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
