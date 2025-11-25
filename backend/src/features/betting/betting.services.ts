import { prisma } from '../../lib/database.js';
import type { PlaceBetInput, BetQueryInput } from './betting.models.js';
import { fetchLivePriceData } from '../markets/markets.services.js';

const MIN_BET_AMOUNT = 10;
const MAX_BET_AMOUNT = 10000;

/**
 * Place a bet on a market
 */
export async function placeBet(
  userId: string,
  input: PlaceBetInput
): Promise<{
  bet: any;
  newBalance: number;
  potentialPayout: number;
}> {
  // Validate bet amount first
  if (input.amount < MIN_BET_AMOUNT) {
    throw new Error(`Minimum bet amount is ${MIN_BET_AMOUNT} credits`);
  }
  if (input.amount > MAX_BET_AMOUNT) {
    throw new Error(`Maximum bet amount is ${MAX_BET_AMOUNT} credits`);
  }

  // Step 1: Find market (outside transaction to avoid long-running tx)
  let market = await prisma.market.findUnique({
    where: { polymarketId: input.marketId },
  });

  // If not found by polymarketId, try finding by UUID id
  if (!market) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(input.marketId)) {
      market = await prisma.market.findUnique({ where: { id: input.marketId } });
    }
  }

  if (!market) throw new Error('Market not found');
  if (market.status !== 'open') throw new Error('Market is not open');

  // Check if market has expired
  if (market.expiresAt && new Date() > market.expiresAt) {
    throw new Error('Market has expired');
  }

  // Step 2: Fetch live odds from Polymarket API (outside transaction - external API call)
  let odds: number;
  if (market.polymarketId) {
    console.log(`[Betting] Fetching live prices for market: ${market.title} (${market.polymarketId})`);
    const liveData = await fetchLivePriceData(market.polymarketId);
    if (!liveData) {
      console.warn(`[Betting] Failed to fetch live prices for ${market.polymarketId}. Using fallback 50/50 odds. Market title: ${market.title}`);
      // Fallback to 50/50 odds if Polymarket API fails
      odds = 0.5;
    } else {
      odds = input.side === 'this' ? liveData.thisOdds : liveData.thatOdds;
      console.log(`[Betting] Live odds fetched - THIS: ${liveData.thisOdds}, THAT: ${liveData.thatOdds}`);
    }
  } else {
    // For non-Polymarket markets, use a default 50/50 odds
    console.log(`[Betting] Non-Polymarket market, using default 50/50 odds`);
    odds = 0.5;
  }

  if (odds <= 0 || odds > 1) {
    throw new Error('Invalid odds');
  }

  // Calculate potential payout: betAmount / odds
  const potentialPayout = input.amount / odds;

  // Step 3: Execute database operations in transaction
  return await prisma.$transaction(async (tx) => {
    // Get user with fresh data
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Check available credits
    const availableCredits = Number(user.availableCredits);
    if (availableCredits < input.amount) {
      throw new Error('Insufficient credits');
    }

    const balanceBefore = availableCredits;
    const balanceAfter = balanceBefore - input.amount;

    // Create bet record
    const bet = await tx.bet.create({
      data: {
        userId,
        marketId: market.id,
        amount: input.amount,
        side: input.side,
        oddsAtBet: odds,
        potentialPayout,
        status: 'pending',
      },
      include: {
        market: {
          select: {
            id: true,
            title: true,
            thisOption: true,
            thatOption: true,
            status: true,
          },
        },
      },
    });

    // Update user credits
    await tx.user.update({
      where: { id: userId },
      data: {
        availableCredits: balanceAfter,
        creditBalance: balanceAfter,
        expendedCredits: {
          increment: input.amount,
        },
        totalVolume: {
          increment: input.amount,
        },
      },
    });

    // Create credit transaction
    await tx.creditTransaction.create({
      data: {
        userId,
        amount: -input.amount,
        transactionType: 'bet_placed',
        referenceId: bet.id,
        balanceAfter,
      },
    });

    return {
      bet,
      newBalance: balanceAfter,
      potentialPayout,
    };
  });
}

/**
 * Get user's bets with filters and pagination
 */
export async function getUserBets(
  userId: string,
  query: BetQueryInput
): Promise<{
  bets: any[];
  total: number;
  limit: number;
  offset: number;
}> {
  const where: any = {
    userId,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.marketId) {
    where.marketId = query.marketId;
  }

  const [bets, total] = await Promise.all([
    prisma.bet.findMany({
      where,
      include: {
        market: {
          select: {
            id: true,
            title: true,
            thisOption: true,
            thatOption: true,
            status: true,
            resolution: true,
            resolvedAt: true,
          },
        },
      },
      orderBy: {
        placedAt: 'desc',
      },
      take: query.limit,
      skip: query.offset,
    }),
    prisma.bet.count({ where }),
  ]);

  return {
    bets,
    total,
    limit: query.limit,
    offset: query.offset,
  };
}

/**
 * Get bet by ID
 */
export async function getBetById(betId: string, userId: string): Promise<any | null> {
  const bet = await prisma.bet.findFirst({
    where: {
      id: betId,
      userId, // Ensure user can only access their own bets
    },
    include: {
      market: {
        select: {
          id: true,
          title: true,
          description: true,
          thisOption: true,
          thatOption: true,
          status: true,
          resolution: true,
          resolvedAt: true,
          expiresAt: true,
        },
      },
    },
  });

  return bet;
}

