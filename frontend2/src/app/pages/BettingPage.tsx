import React, { useState, useEffect, useCallback } from 'react';
import SwipeableCard from '@features/betting/components/SwipeableCard';
import CategoryFilter from '@shared/components/CategoryFilter';
import { useCategoryFilter } from '@shared/contexts/CategoryFilterContext';
import type { Market } from '@shared/types';
import '@/styles/betting/style.css';
import { marketService, mapStaticMarketToMarket } from '@shared/services/marketService';
import { betService } from '@shared/services/betService';
import { useAuth } from '@shared/contexts/AuthContext';

const MIN_BET = 10;
const MAX_BET = 10000;

const BettingPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { selectedCategory, setSelectedCategory, categories } = useCategoryFilter();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response =
        selectedCategory === 'All'
          ? await marketService.getRandomMarkets(10)
          : await marketService.getMarketsByCategory(selectedCategory, 10);

      const staticMarkets = response.data.map(mapStaticMarketToMarket);
      const liveRes = await marketService.getBatchLivePrices(staticMarkets.map((m) => m.id));

      const merged = staticMarkets.map((market) => {
        const live = liveRes.data[market.id];
        return {
          ...market,
          thisOdds: live?.thisOdds ?? 0.5,
          thatOdds: live?.thatOdds ?? 0.5,
          liquidity: live?.liquidity ?? market.liquidity,
        };
      });

      setMarkets(merged);
      setCurrentIndex(0);
    } catch (err: any) {
      const message = err?.message || 'Unable to load markets. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const handlePlaceBet = async ({
    marketId,
    side,
    amount,
  }: {
    marketId: string;
    side: 'this' | 'that';
    amount: number;
  }) => {
    await betService.placeBet({ marketId, side, amount });
    await refreshUser();
  };

  const currentMarket = markets[currentIndex];

  return (
    <div className="flex flex-col items-center justify-start min-h-full p-3 pt-4 relative betting-page-container">
      <div className="w-full max-w-lg mx-auto mb-8">
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>

      {loading && <div className="text-white/60 mt-12">Loading markets…</div>}
      {error && (
        <div className="text-red-400 text-sm mt-12 text-center">
          {error}
          <button className="block mx-auto mt-4 underline" onClick={fetchMarkets}>
            Retry
          </button>
        </div>
      )}
      {!loading && !error && currentMarket && (
        <SwipeableCard
          market={currentMarket}
          onNext={() => setCurrentIndex((prev) => (prev + 1) % markets.length)}
          onPrev={() => setCurrentIndex((prev) => (prev - 1 + markets.length) % markets.length)}
          availableCredits={user?.availableCredits ?? 0}
          minBet={MIN_BET}
          maxBet={MAX_BET}
          onPlaceBet={handlePlaceBet}
        />
      )}
      {!loading && !error && markets.length === 0 && (
        <div className="text-white/60 mt-12">No markets available in this category yet.</div>
      )}
    </div>
  );
};

export default BettingPage;
