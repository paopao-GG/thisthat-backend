/**
 * BettingPage V2 - Position Trading with Lazy Loading
 *
 * Features:
 * - Buy/sell shares like Polymarket
 * - Real-time price updates from Polymarket API
 * - Position management with P&L tracking
 * - Price visualization
 */

import React, { useState, useEffect, useCallback } from 'react';
import MarketCard from '../../features/betting/components/MarketCard';
import PositionCard from '../../features/betting/components/PositionCard';
import type { Market } from '../../shared/types';
import { marketServiceV2, type MarketWithLiveData } from '../../shared/services/marketServiceV2';
import { positionService, type Position } from '../../shared/services/positionService';
import { useAuth } from '../../shared/contexts/AuthContext';

// Price refresh interval (10 seconds)
const PRICE_REFRESH_INTERVAL = 10000;

const BettingPageV2: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [markets, setMarkets] = useState<MarketWithLiveData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [tradeSuccess, setTradeSuccess] = useState<string | null>(null);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);

  // Position state
  const [positions, setPositions] = useState<Position[]>([]);
  const [showPositions, setShowPositions] = useState(false);

  // Trading modal state
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState<'this' | 'that'>('this');
  const [tradeAmount, setTradeAmount] = useState<number>(10);
  const [trading, setTrading] = useState(false);

  // Fetch markets on mount
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setLoading(true);
        setError(null);
        const marketsWithPrices = await marketServiceV2.getRandomMarketsWithPrices(20);
        setMarkets(marketsWithPrices);
        setLastPriceUpdate(new Date());

        if (marketsWithPrices.length === 0) {
          setError('No active markets available. Please try again later.');
        }
      } catch (err) {
        console.error('Error fetching markets:', err);
        setError(err instanceof Error ? err.message : 'Failed to load markets');
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  // Fetch user positions
  const fetchPositions = useCallback(async () => {
    if (!user) return;
    try {
      const response = await positionService.getUserPositions({ status: 'open' });
      setPositions(response.data);
    } catch (err) {
      console.error('Error fetching positions:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  // Refresh prices periodically
  const refreshPrices = useCallback(async () => {
    if (markets.length === 0) return;

    try {
      setPricesLoading(true);
      const marketIds = markets.map((m) => m.id);
      const livePrices = await marketServiceV2.getBatchLivePrices(marketIds);

      setMarkets((prevMarkets) =>
        prevMarkets.map((market) => ({
          ...market,
          live: livePrices.data[market.id] || market.live,
        }))
      );
      setLastPriceUpdate(new Date());
    } catch (err) {
      console.error('Error refreshing prices:', err);
    } finally {
      setPricesLoading(false);
    }
  }, [markets]);

  // Auto-refresh prices
  useEffect(() => {
    if (markets.length === 0) return;
    const interval = setInterval(refreshPrices, PRICE_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [markets.length, refreshPrices]);

  // Get current market
  const currentMarketData = markets[currentIndex];

  // Map to frontend Market type
  const mapToMarket = (data: MarketWithLiveData): Market | null => {
    if (!data.live) return null;

    return {
      id: data.id,
      title: data.title,
      description: data.description || '',
      thisOption: data.thisOption,
      thatOption: data.thatOption,
      thisOdds: data.live.thisOdds,
      thatOdds: data.live.thatOdds,
      expiryDate: data.expiresAt ? new Date(data.expiresAt) : new Date(),
      category: data.category || 'Uncategorized',
      liquidity: data.live.liquidity,
      imageUrl: data.imageUrl || undefined,
    };
  };

  const currentMarket = currentMarketData ? mapToMarket(currentMarketData) : null;

  // Get current price for selected side
  const getCurrentPrice = (side: 'this' | 'that'): number => {
    if (!currentMarketData?.live) return 0.5;
    return side === 'this' ? currentMarketData.live.thisOdds : currentMarketData.live.thatOdds;
  };

  // Navigation handlers
  const handleSwipeUp = () => {
    if (markets.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % markets.length);
    }
  };

  const handleSwipeDown = () => {
    if (markets.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + markets.length) % markets.length);
    }
  };

  // Buy shares handler
  const handleBuyShares = async () => {
    if (!currentMarket || !user) {
      setTradeError('Please log in to trade');
      return;
    }

    if (!currentMarketData?.live?.acceptingOrders) {
      setTradeError('This market is not accepting orders');
      return;
    }

    const currentPrice = getCurrentPrice(tradeType);
    if (tradeAmount < 1) {
      setTradeError('Minimum trade amount is 1 credit');
      return;
    }

    setTrading(true);
    setTradeError(null);

    try {
      const response = await positionService.buyShares({
        marketId: currentMarket.id,
        side: tradeType,
        amount: tradeAmount,
        currentPrice,
      });

      if (response.success) {
        await refreshUser();
        await fetchPositions();
        setTradeSuccess(
          `Bought ${response.sharesBought.toFixed(4)} shares at $${currentPrice.toFixed(2)}`
        );
        setShowTradeModal(false);
        setTimeout(() => setTradeSuccess(null), 5000);
      }
    } catch (err: any) {
      setTradeError(err.message || 'Failed to buy shares');
    } finally {
      setTrading(false);
    }
  };

  // Sell shares handler
  const handleSellShares = async (positionId: string, shares: number, currentPrice: number) => {
    try {
      const response = await positionService.sellShares({
        positionId,
        shares,
        currentPrice,
      });

      if (response.success) {
        await refreshUser();
        await fetchPositions();
        setTradeSuccess(
          `Sold ${shares.toFixed(4)} shares. P&L: ${response.realizedPnL >= 0 ? '+' : ''}$${response.realizedPnL.toFixed(2)}`
        );
        setTimeout(() => setTradeSuccess(null), 5000);
      }
    } catch (err: any) {
      setTradeError(err.message || 'Failed to sell shares');
    }
  };

  // Calculate shares preview
  const previewShares = tradeAmount / getCurrentPrice(tradeType);

  // Get positions for current market
  const currentMarketPositions = positions.filter(
    (p) => p.marketId === currentMarketData?.id && p.status === 'open'
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Loading markets...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No markets
  if (markets.length === 0 || !currentMarket) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="text-center">
          <p className="text-white/60 mb-4">No markets available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 min-h-full relative">
      {/* Header with tabs */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setShowPositions(false)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              !showPositions ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            Markets
          </button>
          <button
            onClick={() => setShowPositions(true)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              showPositions ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            Positions ({positions.length})
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/30">
          {pricesLoading && <div className="animate-spin rounded-full h-3 w-3 border-b border-white/50"></div>}
          {lastPriceUpdate && <span>{lastPriceUpdate.toLocaleTimeString()}</span>}
        </div>
      </div>

      {/* Success/Error messages */}
      {tradeSuccess && (
        <div className="p-3 border border-green-500/50 text-green-400 text-sm text-center rounded-lg">
          {tradeSuccess}
        </div>
      )}
      {tradeError && (
        <div className="p-3 border border-red-500/50 text-red-400 text-sm text-center rounded-lg">
          {tradeError}
        </div>
      )}

      {showPositions ? (
        // Positions View
        <div className="flex-1 overflow-auto">
          {positions.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              <p>No open positions</p>
              <p className="text-sm mt-2">Buy shares in a market to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map((position) => {
                const marketData = markets.find((m) => m.id === position.marketId);
                const currentPrice = marketData?.live
                  ? position.side === 'this'
                    ? marketData.live.thisOdds
                    : marketData.live.thatOdds
                  : position.avgBuyPrice;

                return (
                  <PositionCard
                    key={position.id}
                    position={position}
                    currentPrice={currentPrice}
                    onSell={handleSellShares}
                  />
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // Markets View
        <>
          {/* Market Card */}
          <div className="w-full">
            <MarketCard
              market={currentMarket}
              onSwipeUp={handleSwipeUp}
              onSwipeDown={handleSwipeDown}
              onSwipeLeft={handleSwipeDown}
              onSwipeRight={handleSwipeUp}
            />
          </div>

          {/* Current Market Positions */}
          {currentMarketPositions.length > 0 && (
            <div className="mb-2">
              <h3 className="text-sm text-white/50 mb-2">Your Positions</h3>
              {currentMarketPositions.map((position) => (
                <PositionCard
                  key={position.id}
                  position={position}
                  currentPrice={getCurrentPrice(position.side as 'this' | 'that')}
                  onSell={handleSellShares}
                />
              ))}
            </div>
          )}

          {/* Trading Controls */}
          <div className="w-full">
            {!currentMarketData?.live?.acceptingOrders && (
              <div className="mb-3 p-3 border border-yellow-500/50 text-yellow-400 text-sm text-center rounded-lg">
                This market is not accepting orders
              </div>
            )}

            <div className="flex gap-3 mb-3">
              <button
                onClick={() => { setTradeType('this'); setShowTradeModal(true); }}
                disabled={!currentMarketData?.live?.acceptingOrders}
                className="flex-1 p-4 border border-green-500/30 bg-green-900/20 hover:bg-green-900/40 rounded-lg transition-colors disabled:opacity-50"
              >
                <div className="text-xs text-green-400/70 uppercase mb-1">Buy {currentMarketData?.thisOption}</div>
                <div className="text-xl font-bold text-green-400">
                  ${currentMarketData?.live?.thisOdds.toFixed(2) || '0.50'}
                </div>
                <div className="text-xs text-green-400/50">
                  Payout: ${(1 / (currentMarketData?.live?.thisOdds || 0.5)).toFixed(2)}x
                </div>
              </button>

              <button
                onClick={() => { setTradeType('that'); setShowTradeModal(true); }}
                disabled={!currentMarketData?.live?.acceptingOrders}
                className="flex-1 p-4 border border-red-500/30 bg-red-900/20 hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-50"
              >
                <div className="text-xs text-red-400/70 uppercase mb-1">Buy {currentMarketData?.thatOption}</div>
                <div className="text-xl font-bold text-red-400">
                  ${currentMarketData?.live?.thatOdds.toFixed(2) || '0.50'}
                </div>
                <div className="text-xs text-red-400/50">
                  Payout: ${(1 / (currentMarketData?.live?.thatOdds || 0.5)).toFixed(2)}x
                </div>
              </button>
            </div>

            {/* Market Navigation */}
            <div className="text-center text-sm text-white/40">
              Market {currentIndex + 1} of {markets.length}
            </div>
          </div>
        </>
      )}

      {/* Trade Modal */}
      {showTradeModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowTradeModal(false)}
        >
          <div
            className="w-full max-w-md p-6 bg-gray-900 border border-white/10 rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">
              Buy {tradeType === 'this' ? currentMarketData?.thisOption : currentMarketData?.thatOption}
            </h3>

            <div className="mb-4">
              <label className="text-sm text-white/50 block mb-2">Amount (credits)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={user?.creditBalance || 0}
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(parseFloat(e.target.value) || 0)}
                  className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none"
                />
                <button
                  onClick={() => setTradeAmount(Math.min(100, user?.creditBalance || 0))}
                  className="px-3 py-2 bg-white/10 text-white text-sm rounded"
                >
                  +100
                </button>
                <button
                  onClick={() => setTradeAmount(user?.creditBalance || 0)}
                  className="px-3 py-2 bg-white/10 text-white text-sm rounded"
                >
                  Max
                </button>
              </div>
              <div className="text-xs text-white/30 mt-1 text-right">
                Available: {(user?.creditBalance || 0).toLocaleString()} credits
              </div>
            </div>

            <div className="bg-white/5 rounded p-3 mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/50">Price per Share:</span>
                <span className="text-white">${getCurrentPrice(tradeType).toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/50">Shares You'll Get:</span>
                <span className="text-white font-medium">{previewShares.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">If Market Resolves {tradeType.toUpperCase()}:</span>
                <span className="text-green-400 font-medium">
                  ${previewShares.toFixed(2)} (+${(previewShares - tradeAmount).toFixed(2)})
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTradeModal(false)}
                className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleBuyShares}
                disabled={trading || tradeAmount < 1 || tradeAmount > (user?.creditBalance || 0)}
                className={`flex-1 py-2 px-4 font-medium rounded-lg transition-colors disabled:opacity-50 ${
                  tradeType === 'this'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {trading ? 'Buying...' : 'Confirm Buy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BettingPageV2;
