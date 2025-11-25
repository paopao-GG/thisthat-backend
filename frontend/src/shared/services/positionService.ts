/**
 * Position Service
 *
 * Frontend service for position trading (like Polymarket):
 * - Buy shares in market outcomes
 * - Sell shares anytime before resolution
 * - Track positions and P&L
 */

import { apiClient } from './api';

// Position data from backend
export interface Position {
  id: string;
  userId: string;
  marketId: string;
  side: 'this' | 'that';
  shares: number;
  avgBuyPrice: number;
  totalInvested: number;
  status: 'open' | 'closed' | 'settled';
  realizedPnL: number;
  settlementPayout: number | null;
  settledAt: string | null;
  createdAt: string;
  updatedAt: string;
  market: {
    id: string;
    title: string;
    thisOption: string;
    thatOption: string;
    status: string;
    resolution: string | null;
  };
  trades: PositionTrade[];
}

export interface PositionTrade {
  id: string;
  type: 'buy' | 'sell';
  shares: number;
  pricePerShare: number;
  totalAmount: number;
  realizedPnL: number | null;
  createdAt: string;
}

// Request/Response types
export interface BuySharesRequest {
  marketId: string;
  side: 'this' | 'that';
  amount: number;
  currentPrice: number;
}

export interface SellSharesRequest {
  positionId: string;
  shares: number;
  currentPrice: number;
}

export interface BuySharesResponse {
  success: boolean;
  position: Position;
  trade: PositionTrade;
  newBalance: number;
  sharesBought: number;
}

export interface SellSharesResponse {
  success: boolean;
  position: Position;
  trade: PositionTrade;
  newBalance: number;
  creditsReceived: number;
  realizedPnL: number;
}

export interface PositionListResponse {
  success: boolean;
  data: Position[];
  count: number;
}

export interface PositionResponse {
  success: boolean;
  data: Position;
}

class PositionService {
  /**
   * Buy shares in a market outcome
   */
  async buyShares(data: BuySharesRequest): Promise<BuySharesResponse> {
    try {
      return await apiClient.post<BuySharesResponse>('/api/v1/positions/buy', data);
    } catch (error) {
      console.error('[PositionService] Error buying shares:', error);
      throw error;
    }
  }

  /**
   * Sell shares from a position
   */
  async sellShares(data: SellSharesRequest): Promise<SellSharesResponse> {
    try {
      return await apiClient.post<SellSharesResponse>('/api/v1/positions/sell', data);
    } catch (error) {
      console.error('[PositionService] Error selling shares:', error);
      throw error;
    }
  }

  /**
   * Get user's positions
   */
  async getUserPositions(options?: {
    status?: 'open' | 'closed' | 'settled';
    marketId?: string;
    limit?: number;
    offset?: number;
  }): Promise<PositionListResponse> {
    try {
      const params: Record<string, string> = {};
      if (options?.status) params.status = options.status;
      if (options?.marketId) params.marketId = options.marketId;
      if (options?.limit) params.limit = String(options.limit);
      if (options?.offset) params.offset = String(options.offset);

      return await apiClient.get<PositionListResponse>('/api/v1/positions/me', params);
    } catch (error) {
      console.error('[PositionService] Error getting positions:', error);
      throw error;
    }
  }

  /**
   * Get a single position by ID
   */
  async getPositionById(positionId: string): Promise<PositionResponse> {
    try {
      return await apiClient.get<PositionResponse>(`/api/v1/positions/${positionId}`);
    } catch (error) {
      console.error('[PositionService] Error getting position:', error);
      throw error;
    }
  }

  /**
   * Get user's positions for a specific market
   */
  async getPositionsForMarket(marketId: string): Promise<PositionListResponse> {
    try {
      return await apiClient.get<PositionListResponse>(`/api/v1/positions/market/${marketId}`);
    } catch (error) {
      console.error('[PositionService] Error getting market positions:', error);
      throw error;
    }
  }

  /**
   * Calculate unrealized P&L for a position
   */
  calculateUnrealizedPnL(position: Position, currentPrice: number): number {
    const currentValue = position.shares * currentPrice;
    const costBasis = position.shares * position.avgBuyPrice;
    return currentValue - costBasis;
  }

  /**
   * Calculate potential payout if market resolves in favor
   * Winning shares pay $1 each
   */
  calculatePotentialPayout(shares: number): number {
    return shares;
  }

  /**
   * Calculate current value of position at a given price
   */
  calculateCurrentValue(shares: number, currentPrice: number): number {
    return shares * currentPrice;
  }

  /**
   * Calculate return percentage
   */
  calculateReturnPercentage(position: Position, currentPrice: number): number {
    if (position.avgBuyPrice === 0) return 0;
    return ((currentPrice - position.avgBuyPrice) / position.avgBuyPrice) * 100;
  }
}

export const positionService = new PositionService();
