import { apiClient } from './api';

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  description: string | null;
  currentPrice: number;
  totalSupply: number;
  circulatingSupply: number;
  marketCap: number;
  baseMultiplier: number;
  maxLeverage: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockHolding {
  id: string;
  userId: string;
  stockId: string;
  shares: number;
  averageBuyPrice: number;
  totalInvested: number;
  leverage: number;
  stock: Stock;
  currentValue: number;
  profit: number;
  profitPercent: number;
}

export interface StockTransaction {
  id: string;
  userId: string;
  stockId: string;
  type: 'buy' | 'sell';
  shares: number;
  pricePerShare: number;
  totalAmount: number;
  leverage: number;
  transactionHash: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export interface DailyCreditsResponse {
  success: boolean;
  creditsAwarded: number;
  consecutiveDays: number;
  nextAvailableAt: string;
}

class EconomyService {
  /**
   * Claim daily credits
   */
  async claimDailyCredits(): Promise<DailyCreditsResponse> {
    return apiClient.post<DailyCreditsResponse>('/api/v1/economy/daily-credits', {});
  }

  /**
   * Get all stocks
   */
  async getStocks(): Promise<{ success: boolean; stocks: Stock[] }> {
    return apiClient.get<{ success: boolean; stocks: Stock[] }>('/api/v1/economy/stocks');
  }

  /**
   * Buy stocks
   */
  async buyStock(stockId: string, shares: number, leverage: number = 1): Promise<{
    success: boolean;
    transaction: StockTransaction;
    holding: StockHolding;
    newBalance: number;
  }> {
    return apiClient.post('/api/v1/economy/buy', {
      stockId,
      shares,
      leverage,
    });
  }

  /**
   * Sell stocks
   */
  async sellStock(stockId: string, shares: number): Promise<{
    success: boolean;
    transaction: StockTransaction;
    holding: StockHolding | null;
    newBalance: number;
    profit: number;
  }> {
    return apiClient.post('/api/v1/economy/sell', {
      stockId,
      shares,
    });
  }

  /**
   * Get user portfolio
   */
  async getPortfolio(): Promise<{ success: boolean; portfolio: StockHolding[] }> {
    return apiClient.get<{ success: boolean; portfolio: StockHolding[] }>('/api/v1/economy/portfolio');
  }
}

export const economyService = new EconomyService();

