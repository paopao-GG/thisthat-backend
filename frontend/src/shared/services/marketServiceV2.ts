/**
 * Market Service V2 - Lazy Loading Architecture
 *
 * This service implements the new market fetching pattern:
 * 1. Static data (title, options, expiry) comes from PostgreSQL
 * 2. Live prices (odds, volume) are fetched on-demand from Polymarket API
 *
 * Benefits:
 * - Prices are always fresh (not stale database values)
 * - Reduced database storage and sync overhead
 * - Better user experience with real-time odds
 */

import { apiClient } from './api';

// Static market data from PostgreSQL (no prices)
export interface MarketStaticData {
  id: string;
  polymarketId: string | null;
  title: string;
  description: string | null;
  thisOption: string;
  thatOption: string;
  author: string | null;
  category: string | null;
  imageUrl: string | null;
  status: string;
  expiresAt: string | null;
}

// Live price data from Polymarket API
export interface MarketLiveData {
  polymarketId: string;
  thisOdds: number;
  thatOdds: number;
  liquidity: number;
  volume: number;
  volume24hr: number;
  acceptingOrders: boolean;
}

// Combined market data (static + live)
export interface MarketWithLiveData extends MarketStaticData {
  live: MarketLiveData | null;
}

// Response types
export interface RandomMarketsResponse {
  success: boolean;
  data: MarketStaticData[];
  count: number;
}

export interface LivePriceResponse {
  success: boolean;
  data: MarketLiveData;
  marketId: string;
}

export interface BatchLivePriceResponse {
  success: boolean;
  data: Record<string, MarketLiveData>;
  count: number;
}

export interface CategoriesResponse {
  success: boolean;
  data: string[];
}

export interface MarketFullResponse {
  success: boolean;
  data: MarketWithLiveData;
}

class MarketServiceV2 {
  private baseUrl = '/api/v1/markets/v2';

  /**
   * Get random open markets (static data only)
   * Call this first to get market IDs, then fetch live prices
   */
  async getRandomMarkets(count: number = 10): Promise<RandomMarketsResponse> {
    try {
      return await apiClient.get<RandomMarketsResponse>(
        `${this.baseUrl}/random`,
        { count: String(count) }
      );
    } catch (error) {
      console.error('[MarketServiceV2] Error getting random markets:', error);
      throw error;
    }
  }

  /**
   * Get markets by category (static data only)
   */
  async getMarketsByCategory(
    category: string,
    limit: number = 20
  ): Promise<RandomMarketsResponse> {
    try {
      return await apiClient.get<RandomMarketsResponse>(
        `${this.baseUrl}/category/${encodeURIComponent(category)}`,
        { limit: String(limit) }
      );
    } catch (error) {
      console.error('[MarketServiceV2] Error getting markets by category:', error);
      throw error;
    }
  }

  /**
   * Get all available categories
   */
  async getCategories(): Promise<CategoriesResponse> {
    try {
      return await apiClient.get<CategoriesResponse>(`${this.baseUrl}/categories`);
    } catch (error) {
      console.error('[MarketServiceV2] Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Get a single market (static data only)
   */
  async getMarketById(marketId: string): Promise<{ success: boolean; data: MarketStaticData }> {
    try {
      return await apiClient.get(`${this.baseUrl}/${marketId}`);
    } catch (error) {
      console.error('[MarketServiceV2] Error getting market:', error);
      throw error;
    }
  }

  /**
   * Fetch LIVE price data for a single market
   * This calls Polymarket API in real-time
   */
  async getLivePrice(marketId: string): Promise<LivePriceResponse> {
    try {
      return await apiClient.get<LivePriceResponse>(`${this.baseUrl}/${marketId}/live`);
    } catch (error) {
      console.error('[MarketServiceV2] Error getting live price:', error);
      throw error;
    }
  }

  /**
   * Fetch LIVE price data for multiple markets at once
   * More efficient than calling getLivePrice for each market
   */
  async getBatchLivePrices(marketIds: string[]): Promise<BatchLivePriceResponse> {
    if (marketIds.length === 0) {
      return { success: true, data: {}, count: 0 };
    }

    try {
      return await apiClient.get<BatchLivePriceResponse>(
        `${this.baseUrl}/batch-live`,
        { ids: marketIds.join(',') }
      );
    } catch (error) {
      console.error('[MarketServiceV2] Error getting batch live prices:', error);
      throw error;
    }
  }

  /**
   * Get market with both static data AND live prices
   * Convenience method that combines both calls
   */
  async getMarketFull(marketId: string): Promise<MarketFullResponse> {
    try {
      return await apiClient.get<MarketFullResponse>(`${this.baseUrl}/${marketId}/full`);
    } catch (error) {
      console.error('[MarketServiceV2] Error getting full market data:', error);
      throw error;
    }
  }

  /**
   * Helper: Fetch random markets with live prices
   * Combines getRandomMarkets + getBatchLivePrices
   */
  async getRandomMarketsWithPrices(count: number = 10): Promise<MarketWithLiveData[]> {
    // Step 1: Get random markets (static data)
    const staticResponse = await this.getRandomMarkets(count);
    const markets = staticResponse.data;

    if (markets.length === 0) {
      return [];
    }

    // Step 2: Get live prices for all markets
    const marketIds = markets.map((m) => m.id);
    const livePrices = await this.getBatchLivePrices(marketIds);

    // Step 3: Combine static + live data
    return markets.map((market) => ({
      ...market,
      live: livePrices.data[market.id] || null,
    }));
  }
}

export const marketServiceV2 = new MarketServiceV2();
