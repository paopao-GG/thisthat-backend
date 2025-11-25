import { apiClient } from './api';

export interface ClaimDailyCreditsResponse {
  success: boolean;
  creditsAwarded: number;
  consecutiveDays: number;
  nextAvailableAt: string;
}

class EconomyService {
  claimDailyCredits() {
    return apiClient.post<ClaimDailyCreditsResponse>('/api/v1/economy/daily-credits');
  }
}

export const economyService = new EconomyService();

