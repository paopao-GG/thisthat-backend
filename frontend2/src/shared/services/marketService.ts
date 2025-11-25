import { apiClient } from './api';
import type { Market } from '@shared/types';

interface MarketsResponse {
  success: boolean;
  data: MarketStatic[];
  count?: number;
}

interface MarketStatic {
  id: string;
  polymarketId: string | null;
  title: string;
  description: string | null;
  thisOption: string;
  thatOption: string;
  category: string | null;
  imageUrl: string | null;
  status: string;
  expiresAt: string | null;
}

export interface LiveMarketData {
  thisOdds: number;
  thatOdds: number;
  liquidity: number;
  volume: number;
  volume24hr: number;
  acceptingOrders: boolean;
}

class MarketService {
  async getRandomMarkets(count = 10) {
    return apiClient.get<MarketsResponse>('/api/v1/markets/random', { count });
  }

  async getMarketsByCategory(category: string, limit = 20) {
    return apiClient.get<MarketsResponse>(`/api/v1/markets/category/${encodeURIComponent(category)}`, {
      limit,
    });
  }

  async getCategories() {
    return apiClient.get<{ success: boolean; data: string[] }>('/api/v1/markets/categories');
  }

  async getBatchLivePrices(marketIds: string[]) {
    if (marketIds.length === 0) {
      return { success: true, data: {} as Record<string, LiveMarketData> };
    }
    return apiClient.get<{ success: boolean; data: Record<string, LiveMarketData> }>(
      '/api/v1/markets/batch-live',
      { ids: marketIds.join(',') }
    );
  }
}

export const marketService = new MarketService();

export function mapStaticMarketToMarket(entry: MarketStatic): Market {
  return {
    id: entry.id,
    title: entry.title,
    description: entry.description ?? '',
    thisOption: entry.thisOption,
    thatOption: entry.thatOption,
    thisOdds: 0.5,
    thatOdds: 0.5,
    expiryDate: entry.expiresAt ? new Date(entry.expiresAt) : undefined,
    category: entry.category ?? 'Other',
    liquidity: undefined,
    imageUrl: entry.imageUrl ?? undefined,
    marketType: 'binary',
    polymarketId: entry.polymarketId ?? undefined,
  };
}

