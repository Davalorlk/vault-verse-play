import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { X, UserPlus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface RegisterFormProps {
  onRegister: (userData: any) => void;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const avatarOptions = ['👤', '🧙‍♂️', '🦸‍♀️', '🦸‍♂️', '👩‍💻', '👨‍💻', '🧠', '🔮', '⚡', '🌟'];

export const RegisterForm = ({ onRegister, onClose, onSwitchToLogin }: RegisterFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!username || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    const uid = uuidv4();
    const userData = {
      uid,
      username,
      displayName: username,
      avatar: selectedAvatar,
      rank: 'Novice',
      coins: 100,
      experience: 0,
      puzzlesSolved: 0,
      achievements: ['🏆 Vault Explorer'],
      createdAt: new Date().toISOString()
    };
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (!res.ok) throw new Error('Registration failed');
      const registeredUser = await res.json();
      onRegister(registeredUser);
      toast.success(`Welcome to Mind Vault, ${username}!`);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-white">Create Your Vault</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-300">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Choose a unique username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Choose Avatar</Label>
              <div className="grid grid-cols-5 gap-2">
                {avatarOptions.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`p-2 text-2xl rounded-lg border-2 transition-colors ${
                      selectedAvatar === avatar
                        ? 'border-yellow-400 bg-yellow-400/20'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white pr-10"
                  placeholder="Create a secure password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Confirm your password"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Creating...' : 'Create Vault'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-sm text-slate-400 hover:text-yellow-400 transition-colors"
              >
                Already have a vault? Enter here
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
