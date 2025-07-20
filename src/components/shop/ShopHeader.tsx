
import { Brain, Coins } from 'lucide-react';

interface ShopHeaderProps {
  userCoins: number;
}

export const ShopHeader = ({ userCoins }: ShopHeaderProps) => {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-white mb-2">Premium Vault Shop</h2>
      <p className="text-slate-400">Unlock exclusive features and stand out from the crowd</p>
      <div className="flex items-center justify-center gap-2 mt-4">
        <Coins className="h-5 w-5 text-yellow-400" />
        <span className="text-xl font-semibold text-yellow-400">{userCoins} Vault Coins</span>
      </div>
    </div>
  );
};
