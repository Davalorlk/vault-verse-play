
import { Button } from '@/components/ui/button';
import { Gift, Crown, Star } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface ShopCategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const ShopCategoryFilter = ({ selectedCategory, onCategoryChange }: ShopCategoryFilterProps) => {
  const categories: Category[] = [
    { id: 'all', name: 'All Items', icon: <Gift className="h-4 w-4" /> },
    { id: 'avatar', name: 'Avatars', icon: <Crown className="h-4 w-4" /> },
    { id: 'theme', name: 'Themes', icon: <Star className="h-4 w-4" /> },
    { id: 'badge', name: 'Badges', icon: <Crown className="h-4 w-4" /> },
    { id: 'perk', name: 'Perks', icon: <Gift className="h-4 w-4" /> }
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          onClick={() => onCategoryChange(category.id)}
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
  );
};
