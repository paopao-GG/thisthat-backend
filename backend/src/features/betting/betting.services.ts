import { prisma } from '../../lib/database.js';
import type { PlaceBetInput, BetQueryInput } from './betting.models.js';

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
  return await prisma.$transaction(async (tx) => {
    // Get user
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Try to find market by polymarketId (conditionId) first, then by UUID id
    // This handles both MongoDB conditionIds and PostgreSQL UUIDs
    let market = await tx.market.findUnique({ 
      where: { polymarketId: input.marketId } 
    });
    
    // If not found by polymarketId, try finding by UUID id
    if (!market) {
      // Only try UUID lookup if the string looks like a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(input.marketId)) {
        market = await tx.market.findUnique({ where: { id: input.marketId } });
      }
    }

    if (!market) throw new Error('Market not found');
    if (market.status !== 'open') throw new Error('Market is not open');
    
    // Check if market has expired
    if (market.expiresAt && new Date() > market.expiresAt) {
      throw new Error('Market has expired');
    }

    // Validate bet amount
    if (input.amount < MIN_BET_AMOUNT) {
      throw new Error(`Minimum bet amount is ${MIN_BET_AMOUNT} credits`);
    }
    if (input.amount > MAX_BET_AMOUNT) {
      throw new Error(`Maximum bet amount is ${MAX_BET_AMOUNT} credits`);
    }

    // Check available credits
    const availableCredits = Number(user.availableCredits);
    if (availableCredits < input.amount) {
      throw new Error('Insufficient credits');
    }

    // Get odds for selected side
    const odds = input.side === 'this' ? Number(market.thisOdds) : Number(market.thatOdds);
    if (odds <= 0 || odds > 1) {
      throw new Error('Invalid odds');
    }

    // Calculate potential payout: betAmount / odds
    const potentialPayout = input.amount / odds;

    const balanceBefore = availableCredits;
    const balanceAfter = balanceBefore - input.amount;

    // Create bet record
    // Use the PostgreSQL market.id (UUID), not the input.marketId (conditionId)
    const bet = await tx.bet.create({
      data: {
        userId,
        marketId: market.id, // Use the PostgreSQL market UUID, not conditionId
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
        creditBalance: balanceAfter, // Also update main balance
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
        amount: -input.amount, // Negative for debit
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

