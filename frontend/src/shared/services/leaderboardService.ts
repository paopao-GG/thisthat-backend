import { apiClient } from './api';

export interface LeaderboardEntry {
  rank: number;
  user: {
    id: string;
    username: string;
  };
  overallPnL?: number;
  totalVolume?: number;
}

export interface LeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface UserRankingResponse {
  success: boolean;
  ranking: {
    rank: number | null;
    totalUsers: number;
    overallPnL: number;
    totalVolume: number;
  };
}

class LeaderboardService {
  /**
   * Get PnL leaderboard
   */
  async getPnLLeaderboard(params?: {
    limit?: number;
    offset?: number;
  }): Promise<LeaderboardResponse> {
    return apiClient.get<LeaderboardResponse>('/api/v1/leaderboard/pnl', params);
  }

  /**
   * Get Volume leaderboard
   */
  async getVolumeLeaderboard(params?: {
    limit?: number;
    offset?: number;
  }): Promise<LeaderboardResponse> {
    return apiClient.get<LeaderboardResponse>('/api/v1/leaderboard/volume', params);
  }

  /**
   * Get current user's ranking
   */
  async getUserRanking(type: 'pnl' | 'volume' = 'pnl'): Promise<UserRankingResponse> {
    return apiClient.get<UserRankingResponse>('/api/v1/leaderboard/me', { type });
  }
}

export const leaderboardService = new LeaderboardService();

