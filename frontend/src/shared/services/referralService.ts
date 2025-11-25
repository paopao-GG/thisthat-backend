import { apiClient } from './api';

export interface ReferralStatsResponse {
  success: boolean;
  referralCode: string;
  referralCount: number;
  referralCreditsEarned: number;
  referredUsers: Array<{
    id: string;
    username: string;
    joinedAt: string;
  }>;
}

class ReferralService {
  async getReferralStats(): Promise<ReferralStatsResponse> {
    return apiClient.get<ReferralStatsResponse>('/api/v1/referrals/me');
  }
}

export const referralService = new ReferralService();

