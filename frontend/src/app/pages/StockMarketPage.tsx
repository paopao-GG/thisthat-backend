import React, { useState, useEffect } from 'react';
import { useAuth } from '../../shared/contexts/AuthContext';
import { economyService, type Stock, type StockHolding } from '../../shared/services/economyService';

const StockMarketPage: React.FC = () => {
  const { user } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<StockHolding[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [shares, setShares] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [stocksRes, portfolioRes] = await Promise.all([
        economyService.getStocks(),
        economyService.getPortfolio(),
      ]);
      setStocks(stocksRes.stocks);
      setPortfolio(portfolioRes.portfolio);
    } catch (err: any) {
      setError('Failed to load stock market data');
      console.error(err);
    }
  };

  const handleTrade = async () => {
    if (!selectedStock || !shares || parseFloat(shares) <= 0) {
      setError('Please enter a valid number of shares');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (action === 'buy') {
        const result = await economyService.buyStock(
          selectedStock.id,
          parseFloat(shares),
          leverage
        );
        setSuccess(`Successfully bought ${shares} shares! New balance: ${result.newBalance.toFixed(2)} credits`);
      } else {
        // Find holding for this stock
        const holding = portfolio.find(h => h.stockId === selectedStock.id);
        if (!holding || holding.shares < parseFloat(shares)) {
          setError('Insufficient shares');
          setLoading(false);
          return;
        }
        const result = await economyService.sellStock(selectedStock.id, parseFloat(shares));
        setSuccess(`Successfully sold ${shares} shares! Profit: ${result.profit.toFixed(2)} credits`);
      }
      
      // Reload data
      await loadData();
      setShares('');
    } catch (err: any) {
      setError(err.message || 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  const getHoldingForStock = (stockId: string): StockHolding | undefined => {
    return portfolio.find(h => h.stockId === stockId);
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'radial-gradient(ellipse at left, rgba(30, 30, 45, 0.5) 0%, transparent 50%), radial-gradient(ellipse at right, rgba(30, 30, 45, 0.5) 0%, transparent 50%), #0a0a0a' }}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-white text-4xl font-light mb-8 text-center">
          <span className="text-5xl">STOCK</span>
          <span className="text-xl mx-4 text-white/40">MARKET</span>
        </h1>

        {/* User Stats */}
        {user && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 border border-white/10" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
              <div className="text-sm text-white/50 uppercase tracking-wide">Available Credits</div>
              <div className="text-2xl text-white mt-2">{user.creditBalance.toFixed(2)}</div>
            </div>
            <div className="p-4 border border-white/10" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
              <div className="text-sm text-white/50 uppercase tracking-wide">Portfolio Value</div>
              <div className="text-2xl text-white mt-2">
                {portfolio.reduce((sum, h) => sum + h.currentValue, 0).toFixed(2)}
              </div>
            </div>
            <div className="p-4 border border-white/10" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
              <div className="text-sm text-white/50 uppercase tracking-wide">Total Profit</div>
              <div className="text-2xl text-white mt-2">
                {portfolio.reduce((sum, h) => sum + h.profit, 0).toFixed(2)}
              </div>
            </div>
            <div className="p-4 border border-white/10" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
              <div className="text-sm text-white/50 uppercase tracking-wide">Holdings</div>
              <div className="text-2xl text-white mt-2">{portfolio.length}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stock List */}
          <div className="lg:col-span-2">
            <h2 className="text-white text-xl mb-4 uppercase tracking-wide">Available Stocks</h2>
            <div className="space-y-3">
              {stocks.map((stock) => {
                const holding = getHoldingForStock(stock.id);
                return (
                  <div
                    key={stock.id}
                    className={`p-4 border cursor-pointer transition-all ${
                      selectedStock?.id === stock.id
                        ? 'border-white/40'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                    style={{ background: 'rgba(30, 30, 30, 0.8)' }}
                    onClick={() => setSelectedStock(stock)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-white text-lg font-semibold">{stock.symbol}</div>
                        <div className="text-white/70 text-sm">{stock.name}</div>
                        {holding && (
                          <div className="text-white/50 text-xs mt-2">
                            You own {holding.shares.toFixed(4)} shares
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-white text-xl">${Number(stock.currentPrice).toFixed(4)}</div>
                        <div className="text-white/50 text-xs">
                          Market Cap: ${Number(stock.marketCap).toFixed(2)}
                        </div>
                        {holding && (
                          <div className={`text-xs mt-1 ${holding.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {holding.profitPercent >= 0 ? '+' : ''}{holding.profitPercent.toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trading Panel */}
          <div>
            <h2 className="text-white text-xl mb-4 uppercase tracking-wide">Trade</h2>
            <div className="p-6 border border-white/10" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
              {selectedStock ? (
                <>
                  <div className="mb-4">
                    <div className="text-white text-lg font-semibold">{selectedStock.symbol}</div>
                    <div className="text-white/70 text-sm">{selectedStock.name}</div>
                    <div className="text-white/50 text-xs mt-1">
                      Price: ${Number(selectedStock.currentPrice).toFixed(4)}
                    </div>
                  </div>

                  {/* Action Toggle */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setAction('buy')}
                      className={`flex-1 px-4 py-2 text-sm uppercase tracking-wide transition-all ${
                        action === 'buy'
                          ? 'text-white border border-white/20'
                          : 'text-white/50 border border-white/10'
                      }`}
                      style={{ background: action === 'buy' ? 'rgba(255, 255, 255, 0.1)' : 'transparent' }}
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => setAction('sell')}
                      className={`flex-1 px-4 py-2 text-sm uppercase tracking-wide transition-all ${
                        action === 'sell'
                          ? 'text-white border border-white/20'
                          : 'text-white/50 border border-white/10'
                      }`}
                      style={{ background: action === 'sell' ? 'rgba(255, 255, 255, 0.1)' : 'transparent' }}
                    >
                      Sell
                    </button>
                  </div>

                  {/* Shares Input */}
                  <div className="mb-4">
                    <label className="block text-sm text-white/70 mb-2 uppercase tracking-wide">
                      Shares
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      min="0.00000001"
                      value={shares}
                      onChange={(e) => setShares(e.target.value)}
                      className="w-full px-4 py-3 text-white border border-white/10 focus:border-white/20 transition-all outline-none"
                      style={{ background: 'rgba(20, 20, 20, 0.8)' }}
                      placeholder="0.00000001"
                    />
                  </div>

                  {/* Leverage (only for buy) */}
                  {action === 'buy' && (
                    <div className="mb-4">
                      <label className="block text-sm text-white/70 mb-2 uppercase tracking-wide">
                        Leverage (1x - {selectedStock.maxLeverage}x)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max={selectedStock.maxLeverage}
                        value={leverage}
                        onChange={(e) => setLeverage(parseFloat(e.target.value) || 1)}
                        className="w-full px-4 py-3 text-white border border-white/10 focus:border-white/20 transition-all outline-none"
                        style={{ background: 'rgba(20, 20, 20, 0.8)' }}
                      />
                      <div className="text-xs text-white/50 mt-1">
                        Total Cost: ${(parseFloat(shares || '0') * Number(selectedStock.currentPrice) * leverage).toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Error/Success Messages */}
                  {error && (
                    <div className="mb-4 p-3 border border-red-500/50 text-red-400 text-sm">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="mb-4 p-3 border border-green-500/50 text-green-400 text-sm">
                      {success}
                    </div>
                  )}

                  {/* Trade Button */}
                  <button
                    onClick={handleTrade}
                    disabled={loading || !shares}
                    className="w-full px-6 py-3.5 text-sm font-semibold text-white border border-white/10 hover:border-white/20 transition-all tracking-wide uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'rgba(30, 30, 30, 0.8)' }}
                  >
                    {loading ? 'Processing...' : `${action.toUpperCase()} ${selectedStock.symbol}`}
                  </button>
                </>
              ) : (
                <div className="text-white/50 text-center py-8">
                  Select a stock to trade
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockMarketPage;

