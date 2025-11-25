import { apiClient } from './api';

export type BetSide = 'this' | 'that';

export interface PlaceBetPayload {
  marketId: string;
  side: BetSide;
  amount: number;
}

export interface PlaceBetResponse {
  success: boolean;
  bet: any;
  newBalance: number;
  potentialPayout: number;
}

export interface UserBetsResponse {
  success: boolean;
  bets: any[];
  total: number;
  limit: number;
  offset: number;
}

class BetService {
  placeBet(payload: PlaceBetPayload) {
    return apiClient.post<PlaceBetResponse>('/api/v1/bets', payload);
  }

  getUserBets(params: { status?: string; limit?: number; offset?: number } = {}) {
    return apiClient.get<UserBetsResponse>('/api/v1/bets/me', params);
  }
}

export const betService = new BetService();

