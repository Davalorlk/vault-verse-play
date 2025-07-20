import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface PlayerInfo {
  username: string;
  avatar: string;
  isCurrent?: boolean;
  isYou?: boolean;
}

interface PlayerVsPlayerCardProps {
  player: PlayerInfo;
  opponent?: PlayerInfo;
  yourTurn?: boolean;
}

export function PlayerVsPlayerCard({ player, opponent, yourTurn }: PlayerVsPlayerCardProps) {
  return (
    <div className="w-full max-w-lg mx-auto flex items-center justify-between bg-slate-800/80 border border-slate-700 rounded-xl p-4 mb-4 shadow-lg">
      {/* Player */}
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>{player.avatar || '👤'}</AvatarFallback>
        </Avatar>
        <div>
          <div className="text-white font-semibold text-base">{player.username} {player.isYou && <span className="text-xs text-yellow-400">(You)</span>}</div>
          {yourTurn && player.isYou && (
            <Badge className="bg-green-600/80 text-white text-xs mt-1">Your Turn</Badge>
          )}
        </div>
      </div>
      {/* VS */}
      <div className="flex flex-col items-center">
        <Users className="h-6 w-6 text-yellow-400 mb-1" />
        <div className="text-slate-400 font-bold text-lg">VS</div>
      </div>
      {/* Opponent */}
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>{opponent?.avatar || '❓'}</AvatarFallback>
        </Avatar>
        <div>
          <div className="text-white font-semibold text-base">{opponent?.username || 'Waiting...'}</div>
         
        </div>
      </div>
    </div>
  );
} 