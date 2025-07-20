
import { useState } from 'react';
import { ShopHeader } from './ShopHeader';
import { ShopCategoryFilter } from './ShopCategoryFilter';
import { ShopItem, ShopItemType } from './ShopItem';
import { ShopInfo } from './ShopInfo';
import { shopItems } from './shopItems';

interface ShopProps {
  user: any;
  onPurchase: (item: ShopItemType) => void;
}

export const Shop = ({ user, onPurchase }: ShopProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredItems = selectedCategory === 'all' 
    ? shopItems 
    : shopItems.filter(item => item.category === selectedCategory);

  const canAfford = (price: number) => user.coins >= price;

  const handlePurchase = (item: ShopItemType) => {
    if (canAfford(item.price)) {
      onPurchase(item);
    }
  };

  return (
    <div className="space-y-6">
      <ShopHeader userCoins={user.coins} />
      
      <ShopCategoryFilter 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <ShopItem
            key={item.id}
            item={item}
            canAfford={canAfford(item.price)}
            onPurchase={() => handlePurchase(item)}
          />
        ))}
      </div>

      <ShopInfo />
    </div>
  );
};
