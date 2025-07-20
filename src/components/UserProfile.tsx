import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Edit2, Save, X, Star, Trophy, Coins, Target, HelpCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SupportForm } from './SupportForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UserProfileProps {
  user: any;
  onUpdateUser: (stats: any) => void;
  isCurrentUser?: boolean; // New prop to determine if the profile belongs to the current user
  onAddFriend?: (userId: string) => void; // New prop for adding friend functionality
}

const avatarOptions = ['👤', '🧙‍♂️', '🦸‍♀️', '🦸‍♂️', '👩‍💻', '👨‍💻', '🧠', '🔮', '⚡', '🌟'];

const formatDate = (date: any) => {
  if (!date) return 'N/A';
  if (date.seconds) {
    return new Date(date.seconds * 1000).toLocaleDateString();
  }
  return new Date(date).toLocaleDateString();
};

export const UserProfile = ({ user, onUpdateUser, isCurrentUser, onAddFriend }: UserProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar?.startsWith('http') ? user.avatar : '');
  const [showSupportForm, setShowSupportForm] = useState(false);

  const experienceToNextLevel = (user.level * 100) - user.experience;
  const progressToNextLevel = (user.experience % 100);

  const handleSave = () => {
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }

    onUpdateUser({
      displayName: displayName.trim(),
      avatar: avatarUrl.trim() || selectedAvatar
    });

    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleCancel = () => {
    setDisplayName(user.displayName);
    setSelectedAvatar(user.avatar);
    setAvatarUrl(user.avatar?.startsWith('http') ? user.avatar : '');
    setIsEditing(false);
  };

  const handleSupportClick = () => {
    setShowSupportForm(true);
  };

  const handleDeleteAccount = () => {
    // Clear user data from session storage
    sessionStorage.removeItem('mindVaultUser');
    localStorage.removeItem('mindVaultActiveTab');
    
    toast.success('Account deleted successfully. You will be redirected to the home page.');
    
    // Reload the page to redirect to home
    setTimeout(() => {
      window.location.reload();
    }, 2000);
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

  const renderEditingView = () => (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Edit Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-slate-300">Choose Avatar</Label>
          <div className="grid grid-cols-5 gap-2">
            {avatarOptions.map((avatar) => (
              <button
                key={avatar}
                type="button"
                onClick={() => {
                  setSelectedAvatar(avatar)
                  setAvatarUrl('')
                }}
                className={`p-3 text-3xl rounded-lg border-2 transition-colors ${
                  selectedAvatar === avatar
                    ? 'border-yellow-400 bg-yellow-400/20'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                {avatar}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatarUrl" className="text-slate-300">Or enter image URL</Label>
            <Input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => {
                setAvatarUrl(e.target.value)
                setSelectedAvatar('')
              }}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="https://example.com/image.png"
            />
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <Label htmlFor="displayName" className="text-slate-300">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderDisplayView = () => (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-6">
          <div className="text-6xl">
            {user.avatar?.startsWith('http') ? (
              <img src={user.avatar} alt="avatar" className="w-16 h-16 rounded-full" />
            ) : (
              user.avatar
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-white">{user.displayName}</h3>
              <div className="flex items-center space-x-3 mt-2">
                <Badge className={`border ${getRankColor(user.rank)}`}>
                  {user.rank}
                </Badge>
                <Badge variant="secondary" className="bg-yellow-400/20 text-yellow-400">
                  Level {user.level}
                </Badge>
              </div>
            </div>
            {/* Only show Add Friend button if not current user and onAddFriend prop is provided */}
            {user.uid !== user.currentUserId && onAddFriend && (
              <Button
                onClick={() => onAddFriend(user.uid)}
                className="mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Add Friend
              </Button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-4 bg-slate-700/30 rounded-lg">
            <div className="text-sm text-slate-400">Member Since</div>
            <div className="text-white font-semibold">
              {formatDate(user.createdAt)}
            </div>
          </div>
          <div className="text-center p-4 bg-slate-700/30 rounded-lg">
            <div className="text-sm text-slate-400">Username</div>
            <div className="text-white font-semibold">@{user.username}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Your Vault Profile</h2>
        <div className="flex gap-2">
          <Button
            onClick={handleSupportClick}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Support
          </Button>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {isEditing ? renderEditingView() : renderDisplayView()}

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-blue-500/20 rounded-full w-fit mx-auto mb-3">
              <Target className="h-8 w-8 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{user.puzzlesSolved}</div>
            <div className="text-sm text-slate-400">Puzzles Solved</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-green-500/20 rounded-full w-fit mx-auto mb-3">
              <Star className="h-8 w-8 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white">{user.experience}</div>
            <div className="text-sm text-slate-400">Experience Points</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-yellow-500/20 rounded-full w-fit mx-auto mb-3">
              <Coins className="h-8 w-8 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white">{user.coins}</div>
            <div className="text-sm text-slate-400">Vault Coins</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 text-center">
            <div className="p-3 bg-purple-500/20 rounded-full w-fit mx-auto mb-3">
              <Trophy className="h-8 w-8 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">{user.achievements?.length || 0}</div>
            <div className="text-sm text-slate-400">Achievements</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Level Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Level {user.level}</span>
              <span className="text-slate-400">{experienceToNextLevel} XP to next level</span>
            </div>
            <Progress value={progressToNextLevel} className="h-3" />
            <div className="text-center text-sm text-slate-400">
              {user.experience} / {user.level * 100} XP
            </div>
          </div>
        </CardContent>
      </Card>

      {user.achievements && user.achievements.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user.achievements.map((achievement: string, index: number) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <span className="text-white">{achievement}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-red-900/20 border-red-500/50">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-semibold">Delete Account</h4>
              <p className="text-slate-400 text-sm">
                This action cannot be undone. All your progress and data will be permanently lost.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-800 border-slate-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-300">
                    This action cannot be undone. This will permanently delete your account
                    and remove all your data including progress, achievements, and coins.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Yes, delete my account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <SupportForm 
        isOpen={showSupportForm}
        onClose={() => setShowSupportForm(false)}
        userEmail={user.email}
        userName={user.displayName}
      />
    </div>
  );
};