
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins } from 'lucide-react';

export interface ShopItemType {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'avatar' | 'theme' | 'badge' | 'perk';
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  owned?: boolean;
}

interface ShopItemProps {
  item: ShopItemType;
  canAfford: boolean;
  onPurchase: () => void;
}

export const ShopItem = ({ item, canAfford, onPurchase }: ShopItemProps) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'bg-gray-500/20 text-gray-400';
      case 'Rare': return 'bg-blue-500/20 text-blue-400';
      case 'Epic': return 'bg-purple-500/20 text-purple-400';
      case 'Legendary': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105">
      <CardHeader className="text-center pb-4">
        <div className="text-4xl mb-2">{item.icon}</div>
        <CardTitle className="text-white text-lg">{item.name}</CardTitle>
        <Badge className={getRarityColor(item.rarity)}>
          {item.rarity}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-slate-400 text-sm text-center min-h-[40px]">
          {item.description}
        </p>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-yellow-400 text-lg font-semibold">
            <Coins className="h-4 w-4" />
            {item.price}
          </div>
        </div>

        <Button 
          className={`w-full font-semibold ${
            canAfford
              ? 'bg-yellow-500 hover:bg-yellow-600 text-slate-900'
              : 'bg-slate-600 text-slate-400 cursor-not-allowed'
          }`}
          disabled={!canAfford}
          onClick={onPurchase}
        >
          {canAfford ? 'Purchase' : 'Insufficient Coins'}
        </Button>
      </CardContent>
    </Card>
  );
};
