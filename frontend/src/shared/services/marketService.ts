import { apiClient } from './api';
import type { ApiError } from './api';

// Backend market data structure
export interface BackendMarket {
  conditionId: string;
  question: string;
  description?: string;
  thisOption: string;
  thatOption: string;
  thisOdds: number;
  thatOdds: number;
  volume?: number;
  volume24hr?: number;
  liquidity?: number;
  category?: string;
  tags?: string[];
  status: 'active' | 'closed' | 'archived';
  featured?: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketFetchResponse {
  success: boolean;
  message: string;
  data: {
    fetched: number;
    saved: number;
    skipped: number;
  };
}

export interface MarketListResponse {
  success: boolean;
  count: number;
  data: BackendMarket[];
}

export interface MarketStatsResponse {
  success: boolean;
  data: {
    totalMarkets: number;
    activeMarkets: number;
    closedMarkets: number;
    archivedMarkets: number;
    featuredMarkets: number;
    categoryCounts: Record<string, number>;
    lastUpdated: string;
  };
}

export interface MarketServiceError extends ApiError {
  operation: 'fetch' | 'list' | 'stats';
}

class MarketService {
  /**
   * Fetch markets from Polymarket and save to backend
   */
  async fetchMarkets(options: {
    active?: boolean;
    limit?: number;
  } = {}): Promise<MarketFetchResponse> {
    try {
      const params: Record<string, string> = {};
      if (options.active !== undefined) {
        params.active = String(options.active);
      }
      if (options.limit !== undefined) {
        params.limit = String(options.limit);
      }

      return await apiClient.post<MarketFetchResponse>('/api/v1/markets/fetch', params);
    } catch (error) {
      const apiError = error as ApiError;
      const marketError: MarketServiceError = {
        ...apiError,
        operation: 'fetch',
      };
      console.error('[MarketService] Error fetching markets:', marketError);
      throw marketError;
    }
  }

  /**
   * Get markets from backend
   */
  async getMarkets(options: {
    status?: 'active' | 'closed' | 'archived';
    category?: string;
    featured?: boolean;
    limit?: number;
    skip?: number;
  } = {}): Promise<MarketListResponse> {
    try {
      const params: Record<string, string> = {};
      if (options.status) params.status = options.status;
      if (options.category) params.category = options.category;
      if (options.featured !== undefined) params.featured = String(options.featured);
      if (options.limit !== undefined) params.limit = String(options.limit);
      if (options.skip !== undefined) params.skip = String(options.skip);

      return await apiClient.get<MarketListResponse>('/api/v1/markets', params);
    } catch (error) {
      const apiError = error as ApiError;
      const marketError: MarketServiceError = {
        ...apiError,
        operation: 'list',
      };
      console.error('[MarketService] Error getting markets:', marketError);
      throw marketError;
    }
  }

  /**
   * Get market statistics
   */
  async getStats(): Promise<MarketStatsResponse> {
    try {
      return await apiClient.get<MarketStatsResponse>('/api/v1/markets/stats');
    } catch (error) {
      const apiError = error as ApiError;
      const marketError: MarketServiceError = {
        ...apiError,
        operation: 'stats',
      };
      console.error('[MarketService] Error getting stats:', marketError);
      throw marketError;
    }
  }
}

export const marketService = new MarketService();

