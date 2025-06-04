
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Crown, Star, Gift } from 'lucide-react';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'avatar' | 'theme' | 'badge' | 'perk';
  icon: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  owned?: boolean;
}

interface ShopProps {
  user: any;
  onPurchase: (item: ShopItem) => void;
}

export const Shop = ({ user, onPurchase }: ShopProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const shopItems: ShopItem[] = [
    // Premium Avatars
    {
      id: 'dragon-avatar',
      name: 'Dragon Master',
      description: 'Powerful dragon avatar that shows your dominance',
      price: 500,
      category: 'avatar',
      icon: '🐲',
      rarity: 'Legendary'
    },
    {
      id: 'wizard-avatar',
      name: 'Mystic Wizard',
      description: 'Wise wizard avatar for the strategic mind',
      price: 300,
      category: 'avatar',
      icon: '🧙‍♂️',
      rarity: 'Epic'
    },
    {
      id: 'crown-avatar',
      name: 'Royal Crown',
      description: 'Show your royal status with this majestic crown',
      price: 400,
      category: 'avatar',
      icon: '👑',
      rarity: 'Epic'
    },
    {
      id: 'unicorn-avatar',
      name: 'Mythical Unicorn',
      description: 'Rare and magical unicorn avatar',
      price: 600,
      category: 'avatar',
      icon: '🦄',
      rarity: 'Legendary'
    },
    
    // Premium Themes
    {
      id: 'golden-theme',
      name: 'Golden Elite Theme',
      description: 'Luxury golden interface theme',
      price: 800,
      category: 'theme',
      icon: '✨',
      rarity: 'Legendary'
    },
    {
      id: 'neon-theme',
      name: 'Neon Cyber Theme',
      description: 'Futuristic neon theme for tech enthusiasts',
      price: 450,
      category: 'theme',
      icon: '💎',
      rarity: 'Epic'
    },
    {
      id: 'nature-theme',
      name: 'Forest Mystic Theme',
      description: 'Peaceful nature-inspired theme',
      price: 250,
      category: 'theme',
      icon: '🌿',
      rarity: 'Rare'
    },

    // Special Badges
    {
      id: 'champion-badge',
      name: 'Grand Champion',
      description: 'Exclusive champion badge for elite players',
      price: 350,
      category: 'badge',
      icon: '🏆',
      rarity: 'Epic'
    },
    {
      id: 'genius-badge',
      name: 'Certified Genius',
      description: 'Show off your intellectual prowess',
      price: 200,
      category: 'badge',
      icon: '🧠',
      rarity: 'Rare'
    },
    {
      id: 'legend-badge',
      name: 'Living Legend',
      description: 'The most prestigious badge in Mind Vault',
      price: 1000,
      category: 'badge',
      icon: '⭐',
      rarity: 'Legendary'
    },

    // Premium Perks
    {
      id: 'double-coins',
      name: 'Double Coin Boost',
      description: '2x coin earning for 7 days',
      price: 150,
      category: 'perk',
      icon: '💰',
      rarity: 'Common'
    },
    {
      id: 'skip-cooldown',
      name: 'Skip Cooldowns',
      description: 'No waiting time between games for 3 days',
      price: 100,
      category: 'perk',
      icon: '⚡',
      rarity: 'Common'
    },
    {
      id: 'vip-chat',
      name: 'VIP Chat Colors',
      description: 'Special chat colors and effects',
      price: 300,
      category: 'perk',
      icon: '🌈',
      rarity: 'Rare'
    },
    {
      id: 'exclusive-puzzles',
      name: 'Exclusive Puzzles',
      description: 'Access to premium puzzle collection',
      price: 250,
      category: 'perk',
      icon: '🧩',
      rarity: 'Rare'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Items', icon: <Gift className="h-4 w-4" /> },
    { id: 'avatar', name: 'Avatars', icon: <Crown className="h-4 w-4" /> },
    { id: 'theme', name: 'Themes', icon: <Star className="h-4 w-4" /> },
    { id: 'badge', name: 'Badges', icon: <Crown className="h-4 w-4" /> },
    { id: 'perk', name: 'Perks', icon: <Gift className="h-4 w-4" /> }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'bg-gray-500/20 text-gray-400';
      case 'Rare': return 'bg-blue-500/20 text-blue-400';
      case 'Epic': return 'bg-purple-500/20 text-purple-400';
      case 'Legendary': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? shopItems 
    : shopItems.filter(item => item.category === selectedCategory);

  const canAfford = (price: number) => user.coins >= price;

  const handlePurchase = (item: ShopItem) => {
    if (canAfford(item.price)) {
      onPurchase(item);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Premium Vault Shop</h2>
        <p className="text-slate-400">Unlock exclusive features and stand out from the crowd</p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Coins className="h-5 w-5 text-yellow-400" />
          <span className="text-xl font-semibold text-yellow-400">{user.coins} Vault Coins</span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.id)}
            className={`${
              selectedCategory === category.id 
                ? 'bg-yellow-500 text-slate-900 hover:bg-yellow-600' 
                : 'border-slate-600 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {category.icon}
            {category.name}
          </Button>
        ))}
      </div>

      {/* Shop Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <Card 
            key={item.id} 
            className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105"
          >
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
                  canAfford(item.price)
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-slate-900'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
                disabled={!canAfford(item.price)}
                onClick={() => handlePurchase(item)}
              >
                {canAfford(item.price) ? 'Purchase' : 'Insufficient Coins'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Shop Info */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-white">How to Earn Vault Coins</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl mb-2">🧩</div>
                <div className="text-sm text-slate-400">Solve puzzles to earn 10-50 coins each</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🏆</div>
                <div className="text-sm text-slate-400">Win games against other players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-sm text-slate-400">Complete daily challenges</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
