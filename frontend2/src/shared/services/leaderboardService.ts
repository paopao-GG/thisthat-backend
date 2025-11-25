import { apiClient } from './api';

export interface LeaderboardEntryResponse {
  rank: number;
  user: {
    id: string;
    username: string;
  };
  overallPnL: number;
  totalVolume: number;
}

export interface LeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardEntryResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface UserRankingResponse {
  success: boolean;
  rank: number | null;
  totalUsers: number;
  overallPnL: number;
  totalVolume: number;
}

class LeaderboardService {
  getPnlLeaderboard(limit = 100, offset = 0) {
    return apiClient.get<LeaderboardResponse>('/api/v1/leaderboard/pnl', { limit, offset });
  }

  getVolumeLeaderboard(limit = 100, offset = 0) {
    return apiClient.get<LeaderboardResponse>('/api/v1/leaderboard/volume', { limit, offset });
  }

  getUserRanking(type: 'pnl' | 'volume' = 'pnl') {
    return apiClient.get<UserRankingResponse>('/api/v1/leaderboard/me', { type });
  }
}

export const leaderboardService = new LeaderboardService();

