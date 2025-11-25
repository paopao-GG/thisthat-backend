// Shared type definitions across the application

export interface Market {
  id: string;
  polymarketId?: string | null;
  title: string;
  description?: string | null;
  thisOption: string;
  thatOption: string;
  thisOdds: number;
  thatOdds: number;
  expiryDate?: Date | null;
  category?: string | null;
  liquidity?: number;
  imageUrl?: string | null;
  thisImageUrl?: string;
  thatImageUrl?: string;
  marketType?: 'binary' | 'two-image';
}

export interface Bet {
  id: string;
  marketId: string;
  market: {
    id: string;
    title: string;
    thisOption: string;
    thatOption: string;
    status: string;
    resolution?: string | null;
  };
  amount: number;
  side: 'this' | 'that';
  oddsAtBet: number;
  potentialPayout: number;
  actualPayout?: number | null;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  placedAt: string;
}

export interface UserStats {
  userId: string;
  username: string;
  credits: number;
  totalVolume: number;
  totalPnL: number;
  rank?: number | null;
  winRate?: number;
  totalBets: number;
  dailyStreak: number;
  tokenAllocation?: number;
  lockedTokens?: number;
  lastClaimDate?: Date | null;
}

export interface CreditPurchaseOption {
  id: string;
  credits: number;
  price: number;
  label?: string;
  popular?: boolean;
}

export interface BetConfig {
  minBet: number;
  maxBet: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  volume: number;
  pnl: number;
  winRate: number;
  totalBets: number;
  tokenAllocation: number;
}


