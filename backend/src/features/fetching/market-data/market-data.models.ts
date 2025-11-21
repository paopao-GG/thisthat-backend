// Market data models with Zod validation
import { z } from 'zod';

// Zod schema for market validation
export const MarketDataSchema = z.object({
  conditionId: z.string(),
  question: z.string(),
  description: z.string().optional(),
  thisOption: z.string(),
  thatOption: z.string(),
  thisOdds: z.number().min(0).max(1),
  thatOdds: z.number().min(0).max(1),
  volume: z.number().optional(),
  volume24hr: z.number().optional(),
  liquidity: z.number().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['active', 'closed', 'archived']),
  featured: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MarketData = z.infer<typeof MarketDataSchema>;

// Flattened market structure for MongoDB
export interface FlattenedMarket {
  // Core identifiers
  conditionId: string;
  questionId?: string;
  marketSlug?: string;

  // Market content
  question: string;
  description?: string;

  // Binary options (THIS/THAT)
  thisOption: string;
  thatOption: string;

  // Odds (0-1 format, e.g., 0.65 = 65%)
  thisOdds: number;
  thatOdds: number;

  // Volume & liquidity
  volume?: number;
  volume24hr?: number;
  liquidity?: number;

  // Metadata
  category?: string;
  tags?: string[];
  status: 'active' | 'closed' | 'archived';
  featured?: boolean;

  // Dates
  startDate?: string;
  endDate?: string;

  // Source tracking
  source: 'polymarket';
  rawData?: any; // Original Polymarket data for debugging

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Statistics for market data
export interface MarketStats {
  totalMarkets: number;
  activeMarkets: number;
  closedMarkets: number;
  archivedMarkets: number;
  featuredMarkets: number;
  categoryCounts: Record<string, number>;
  lastUpdated: Date;
}
