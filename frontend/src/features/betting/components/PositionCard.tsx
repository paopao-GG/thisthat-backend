/**
 * PositionCard Component
 *
 * Displays a user's position in a market with:
 * - Current shares and value
 * - Buy price vs current price visualization
 * - Unrealized P&L
 * - Sell button
 */

import React, { useState } from 'react';
import type { Position } from '../../../shared/services/positionService';

interface PositionCardProps {
  position: Position;
  currentPrice: number; // Live price from Polymarket
  onSell: (positionId: string, shares: number, currentPrice: number) => Promise<void>;
  isLoading?: boolean;
}

const PositionCard: React.FC<PositionCardProps> = ({
  position,
  currentPrice,
  onSell,
  isLoading = false,
}) => {
  const [sellAmount, setSellAmount] = useState<number>(position.shares);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selling, setSelling] = useState(false);

  // Calculations
  const currentValue = position.shares * currentPrice;
  const costBasis = position.shares * position.avgBuyPrice;
  const unrealizedPnL = currentValue - costBasis;
  const returnPercentage = position.avgBuyPrice > 0
    ? ((currentPrice - position.avgBuyPrice) / position.avgBuyPrice) * 100
    : 0;
  const potentialPayout = position.shares; // $1 per share if wins

  // Price bar visualization (0-100%)
  const buyPricePercent = position.avgBuyPrice * 100;
  const currentPricePercent = currentPrice * 100;
  const isProfitable = currentPrice > position.avgBuyPrice;

  const handleSell = async () => {
    if (sellAmount <= 0 || sellAmount > position.shares) return;

    setSelling(true);
    try {
      await onSell(position.id, sellAmount, currentPrice);
      setShowSellModal(false);
    } finally {
      setSelling(false);
    }
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatShares = (shares: number) => shares.toFixed(4);
  const formatPnL = (pnl: number) => {
    const sign = pnl >= 0 ? '+' : '';
    return `${sign}$${pnl.toFixed(2)}`;
  };

  return (
    <>
      <div className="border border-white/10 rounded-lg p-4 bg-white/5">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded ${
              position.side === 'this' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
            }`}>
              {position.side === 'this' ? position.market.thisOption : position.market.thatOption}
            </span>
            <h3 className="text-sm text-white/80 mt-1 line-clamp-2">{position.market.title}</h3>
          </div>
          <div className="text-right">
            <div className={`text-lg font-bold ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
              {formatPnL(unrealizedPnL)}
            </div>
            <div className={`text-xs ${isProfitable ? 'text-green-400/70' : 'text-red-400/70'}`}>
              {returnPercentage >= 0 ? '+' : ''}{returnPercentage.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Price Visualization Bar */}
        <div className="mb-4">
          <div className="h-8 bg-white/5 rounded-lg relative overflow-hidden">
            {/* Buy price marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10"
              style={{ left: `${buyPricePercent}%` }}
            />
            <div
              className="absolute -top-5 text-xs text-blue-400 transform -translate-x-1/2"
              style={{ left: `${buyPricePercent}%` }}
            >
              Buy
            </div>

            {/* Current price fill */}
            <div
              className={`absolute top-0 bottom-0 left-0 ${
                isProfitable ? 'bg-green-500/30' : 'bg-red-500/30'
              }`}
              style={{ width: `${currentPricePercent}%` }}
            />

            {/* Current price marker */}
            <div
              className={`absolute top-0 bottom-0 w-0.5 z-10 ${
                isProfitable ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ left: `${currentPricePercent}%` }}
            />
            <div
              className={`absolute bottom-full mb-1 text-xs transform -translate-x-1/2 ${
                isProfitable ? 'text-green-400' : 'text-red-400'
              }`}
              style={{ left: `${currentPricePercent}%` }}
            >
              Now
            </div>

            {/* Price labels */}
            <div className="absolute left-1 top-1/2 -translate-y-1/2 text-xs text-white/30">$0</div>
            <div className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-white/30">$1</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          <div className="bg-white/5 rounded p-2">
            <div className="text-xs text-white/50">Shares</div>
            <div className="text-sm font-medium text-white">{formatShares(position.shares)}</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-xs text-white/50">Avg Buy</div>
            <div className="text-sm font-medium text-white">{formatPrice(position.avgBuyPrice)}</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-xs text-white/50">Current</div>
            <div className={`text-sm font-medium ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
              {formatPrice(currentPrice)}
            </div>
          </div>
        </div>

        {/* Value and Potential */}
        <div className="flex justify-between text-sm mb-4">
          <div>
            <span className="text-white/50">Current Value: </span>
            <span className="text-white font-medium">{formatPrice(currentValue)}</span>
          </div>
          <div>
            <span className="text-white/50">If Wins: </span>
            <span className="text-green-400 font-medium">{formatPrice(potentialPayout)}</span>
          </div>
        </div>

        {/* Sell Button */}
        {position.status === 'open' && (
          <button
            onClick={() => setShowSellModal(true)}
            disabled={isLoading}
            className="w-full py-2 px-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-400 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            Sell Position
          </button>
        )}

        {position.status === 'settled' && (
          <div className="text-center py-2 text-white/50 text-sm">
            Settled: {formatPrice(position.settlementPayout || 0)}
          </div>
        )}
      </div>

      {/* Sell Modal */}
      {showSellModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSellModal(false)}
        >
          <div
            className="w-full max-w-md p-6 bg-gray-900 border border-white/10 rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Sell Shares</h3>

            <div className="mb-4">
              <label className="text-sm text-white/50 block mb-2">Shares to Sell</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0.0001}
                  max={position.shares}
                  step={0.0001}
                  value={sellAmount}
                  onChange={(e) => setSellAmount(parseFloat(e.target.value) || 0)}
                  className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={() => setSellAmount(position.shares)}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded transition-colors"
                >
                  Max
                </button>
              </div>
            </div>

            <div className="bg-white/5 rounded p-3 mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/50">Sell Price:</span>
                <span className="text-white">{formatPrice(currentPrice)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/50">You'll Receive:</span>
                <span className="text-green-400 font-medium">
                  {formatPrice(sellAmount * currentPrice)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Realized P&L:</span>
                <span className={sellAmount * (currentPrice - position.avgBuyPrice) >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {formatPnL(sellAmount * (currentPrice - position.avgBuyPrice))}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSellModal(false)}
                className="flex-1 py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSell}
                disabled={selling || sellAmount <= 0 || sellAmount > position.shares}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {selling ? 'Selling...' : 'Confirm Sell'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PositionCard;
