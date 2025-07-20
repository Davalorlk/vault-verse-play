
import { Card, CardContent } from '@/components/ui/card';

export const ShopInfo = () => {
  return (
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
  );
};
