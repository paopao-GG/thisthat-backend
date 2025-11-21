import { apiClient } from './api';

export interface PlaceBetData {
  marketId: string;
  side: 'this' | 'that';
  amount: number;
}

export interface Bet {
  id: string;
  userId: string;
  marketId: string;
  amount: number;
  side: 'this' | 'that';
  oddsAtBet: number;
  potentialPayout: number;
  actualPayout: number | null;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  placedAt: string;
  resolvedAt: string | null;
  market: {
    id: string;
    title: string;
    thisOption: string;
    thatOption: string;
    status: string;
    resolution?: string | null;
    resolvedAt?: string | null;
  };
}

export interface BetQueryParams {
  status?: 'pending' | 'won' | 'lost' | 'cancelled';
  marketId?: string;
  limit?: number;
  offset?: number;
}

class BetService {
  /**
   * Place a bet
   */
  async placeBet(data: PlaceBetData): Promise<{
    success: boolean;
    bet: Bet;
    newBalance: number;
    potentialPayout: number;
  }> {
    return apiClient.post('/api/v1/bets', data);
  }

  /**
   * Get user's bets
   */
  async getUserBets(params?: BetQueryParams): Promise<{
    success: boolean;
    bets: Bet[];
    total: number;
    limit: number;
    offset: number;
  }> {
    return apiClient.get('/api/v1/bets/me', params);
  }

  /**
   * Get bet by ID
   */
  async getBetById(betId: string): Promise<{
    success: boolean;
    bet: Bet;
  }> {
    return apiClient.get(`/api/v1/bets/${betId}`);
  }
}

export const betService = new BetService();

