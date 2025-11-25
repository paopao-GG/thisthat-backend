/**
 * Position Trading Service
 *
 * Implements tradeable shares system like Polymarket:
 * - Users buy shares at current market price
 * - Shares can be sold anytime before resolution
 * - P&L calculated based on buy/sell price difference
 * - On resolution: winning shares pay $1, losing shares pay $0
 */

import { prisma } from '../../lib/database.js';
import { Decimal } from '@prisma/client/runtime/library';

// Constants
const MIN_TRADE_AMOUNT = 1; // Minimum 1 credit
const MAX_TRADE_AMOUNT = 100000; // Maximum 100k credits
const MIN_SHARES = 0.0001; // Minimum share quantity

export interface BuySharesInput {
  marketId: string;
  side: 'this' | 'that';
  amount: number; // Credits to spend
  currentPrice: number; // Current price from Polymarket (0-1)
}

export interface SellSharesInput {
  positionId: string;
  shares: number; // Shares to sell
  currentPrice: number; // Current price from Polymarket (0-1)
}

export interface PositionWithTrades {
  id: string;
  userId: string;
  marketId: string;
  side: string;
  shares: Decimal;
  avgBuyPrice: Decimal;
  totalInvested: Decimal;
  status: string;
  realizedPnL: Decimal;
  createdAt: Date;
  updatedAt: Date;
  market: {
    id: string;
    title: string;
    thisOption: string;
    thatOption: string;
    status: string;
    resolution: string | null;
  };
  trades: Array<{
    id: string;
    type: string;
    shares: Decimal;
    pricePerShare: Decimal;
    totalAmount: Decimal;
    realizedPnL: Decimal | null;
    createdAt: Date;
  }>;
}

/**
 * Calculate shares from amount and price
 * shares = amount / price
 * Example: 100 credits at $0.50 = 200 shares
 */
function calculateShares(amount: number, price: number): number {
  if (price <= 0 || price >= 1) {
    throw new Error('Price must be between 0 and 1');
  }
  return amount / price;
}

/**
 * Calculate weighted average price when adding to position
 */
function calculateNewAvgPrice(
  existingShares: number,
  existingAvgPrice: number,
  newShares: number,
  newPrice: number
): number {
  const totalShares = existingShares + newShares;
  if (totalShares === 0) return 0;

  const totalValue = (existingShares * existingAvgPrice) + (newShares * newPrice);
  return totalValue / totalShares;
}

/**
 * Buy shares in a market outcome
 */
export async function buyShares(
  userId: string,
  input: BuySharesInput
): Promise<{
  position: PositionWithTrades;
  trade: any;
  newBalance: number;
  sharesBought: number;
}> {
  const { marketId, side, amount, currentPrice } = input;

  // Validate inputs
  if (amount < MIN_TRADE_AMOUNT) {
    throw new Error(`Minimum trade amount is ${MIN_TRADE_AMOUNT} credits`);
  }
  if (amount > MAX_TRADE_AMOUNT) {
    throw new Error(`Maximum trade amount is ${MAX_TRADE_AMOUNT} credits`);
  }
  if (currentPrice <= 0 || currentPrice >= 1) {
    throw new Error('Price must be between 0 and 1');
  }
  if (side !== 'this' && side !== 'that') {
    throw new Error('Side must be "this" or "that"');
  }

  // Calculate shares to buy
  const sharesToBuy = calculateShares(amount, currentPrice);

  // Execute in transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Verify user has enough credits
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, availableCredits: true, creditBalance: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const availableCredits = Number(user.availableCredits);
    if (availableCredits < amount) {
      throw new Error(`Insufficient credits. Available: ${availableCredits}, Required: ${amount}`);
    }

    // 2. Verify market is open
    const market = await tx.market.findUnique({
      where: { id: marketId },
      select: { id: true, status: true, expiresAt: true },
    });

    if (!market) {
      throw new Error('Market not found');
    }
    if (market.status !== 'open') {
      throw new Error('Market is not open for trading');
    }
    if (market.expiresAt && new Date(market.expiresAt) < new Date()) {
      throw new Error('Market has expired');
    }

    // 3. Find or create position
    let position = await tx.position.findUnique({
      where: {
        userId_marketId_side: { userId, marketId, side },
      },
    });

    let newAvgPrice: number;
    let newTotalInvested: number;
    let newShares: number;

    if (position) {
      // Update existing position
      const existingShares = Number(position.shares);
      const existingAvgPrice = Number(position.avgBuyPrice);
      const existingInvested = Number(position.totalInvested);

      newShares = existingShares + sharesToBuy;
      newAvgPrice = calculateNewAvgPrice(existingShares, existingAvgPrice, sharesToBuy, currentPrice);
      newTotalInvested = existingInvested + amount;

      position = await tx.position.update({
        where: { id: position.id },
        data: {
          shares: newShares,
          avgBuyPrice: newAvgPrice,
          totalInvested: newTotalInvested,
          status: 'open',
        },
      });
    } else {
      // Create new position
      newShares = sharesToBuy;
      newAvgPrice = currentPrice;
      newTotalInvested = amount;

      position = await tx.position.create({
        data: {
          userId,
          marketId,
          side,
          shares: sharesToBuy,
          avgBuyPrice: currentPrice,
          totalInvested: amount,
          status: 'open',
        },
      });
    }

    // 4. Deduct credits from user
    const newBalance = availableCredits - amount;
    await tx.user.update({
      where: { id: userId },
      data: {
        availableCredits: { decrement: amount },
        expendedCredits: { increment: amount },
        totalVolume: { increment: amount },
      },
    });

    // 5. Create trade record
    const trade = await tx.positionTrade.create({
      data: {
        positionId: position.id,
        userId,
        type: 'buy',
        shares: sharesToBuy,
        pricePerShare: currentPrice,
        totalAmount: amount,
        balanceBefore: availableCredits,
        balanceAfter: newBalance,
      },
    });

    // 6. Create credit transaction audit entry
    await tx.creditTransaction.create({
      data: {
        userId,
        amount: -amount,
        transactionType: 'position_buy',
        referenceId: trade.id,
        balanceAfter: newBalance,
      },
    });

    // 7. Fetch full position with market and trades
    const fullPosition = await tx.position.findUnique({
      where: { id: position.id },
      include: {
        market: {
          select: {
            id: true,
            title: true,
            thisOption: true,
            thatOption: true,
            status: true,
            resolution: true,
          },
        },
        trades: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return {
      position: fullPosition as PositionWithTrades,
      trade,
      newBalance,
      sharesBought: sharesToBuy,
    };
  });

  return result;
}

/**
 * Sell shares from a position
 */
export async function sellShares(
  userId: string,
  input: SellSharesInput
): Promise<{
  position: PositionWithTrades;
  trade: any;
  newBalance: number;
  creditsReceived: number;
  realizedPnL: number;
}> {
  const { positionId, shares: sharesToSell, currentPrice } = input;

  // Validate inputs
  if (sharesToSell < MIN_SHARES) {
    throw new Error(`Minimum shares to sell is ${MIN_SHARES}`);
  }
  if (currentPrice <= 0 || currentPrice >= 1) {
    throw new Error('Price must be between 0 and 1');
  }

  // Execute in transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Get position and verify ownership
    const position = await tx.position.findUnique({
      where: { id: positionId },
      include: { market: true },
    });

    if (!position) {
      throw new Error('Position not found');
    }
    if (position.userId !== userId) {
      throw new Error('Not authorized to sell this position');
    }
    if (position.status !== 'open') {
      throw new Error('Position is not open for trading');
    }
    if (position.market.status !== 'open') {
      throw new Error('Market is not open for trading');
    }

    const currentShares = Number(position.shares);
    if (sharesToSell > currentShares) {
      throw new Error(`Cannot sell ${sharesToSell} shares. You only have ${currentShares}`);
    }

    // 2. Calculate sale proceeds and P&L
    const creditsReceived = sharesToSell * currentPrice;
    const costBasis = sharesToSell * Number(position.avgBuyPrice);
    const realizedPnL = creditsReceived - costBasis;

    // 3. Update position
    const remainingShares = currentShares - sharesToSell;
    const isFullSale = remainingShares < MIN_SHARES;

    let updatedPosition;
    if (isFullSale) {
      // Close position entirely
      updatedPosition = await tx.position.update({
        where: { id: positionId },
        data: {
          shares: 0,
          status: 'closed',
          realizedPnL: { increment: realizedPnL },
        },
      });
    } else {
      // Partial sale - keep position open
      const remainingInvested = Number(position.totalInvested) * (remainingShares / currentShares);
      updatedPosition = await tx.position.update({
        where: { id: positionId },
        data: {
          shares: remainingShares,
          totalInvested: remainingInvested,
          realizedPnL: { increment: realizedPnL },
        },
      });
    }

    // 4. Get user's current balance
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { availableCredits: true },
    });
    const balanceBefore = Number(user!.availableCredits);
    const newBalance = balanceBefore + creditsReceived;

    // 5. Credit user
    await tx.user.update({
      where: { id: userId },
      data: {
        availableCredits: { increment: creditsReceived },
        creditBalance: { increment: creditsReceived },
        overallPnL: { increment: realizedPnL },
        totalVolume: { increment: creditsReceived },
      },
    });

    // 6. Create trade record
    const trade = await tx.positionTrade.create({
      data: {
        positionId,
        userId,
        type: 'sell',
        shares: sharesToSell,
        pricePerShare: currentPrice,
        totalAmount: creditsReceived,
        realizedPnL,
        balanceBefore,
        balanceAfter: newBalance,
      },
    });

    // 7. Create credit transaction audit entry
    await tx.creditTransaction.create({
      data: {
        userId,
        amount: creditsReceived,
        transactionType: 'position_sell',
        referenceId: trade.id,
        balanceAfter: newBalance,
      },
    });

    // 8. Fetch full position with market and trades
    const fullPosition = await tx.position.findUnique({
      where: { id: positionId },
      include: {
        market: {
          select: {
            id: true,
            title: true,
            thisOption: true,
            thatOption: true,
            status: true,
            resolution: true,
          },
        },
        trades: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return {
      position: fullPosition as PositionWithTrades,
      trade,
      newBalance,
      creditsReceived,
      realizedPnL,
    };
  });

  return result;
}

/**
 * Get user's positions
 */
export async function getUserPositions(
  userId: string,
  options: {
    status?: 'open' | 'closed' | 'settled';
    marketId?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<PositionWithTrades[]> {
  const { status, marketId, limit = 50, offset = 0 } = options;

  const where: any = { userId };
  if (status) where.status = status;
  if (marketId) where.marketId = marketId;

  const positions = await prisma.position.findMany({
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
        },
      },
      trades: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    skip: offset,
  });

  return positions as PositionWithTrades[];
}

/**
 * Get a single position by ID
 */
export async function getPositionById(
  userId: string,
  positionId: string
): Promise<PositionWithTrades | null> {
  const position = await prisma.position.findUnique({
    where: { id: positionId },
    include: {
      market: {
        select: {
          id: true,
          title: true,
          thisOption: true,
          thatOption: true,
          status: true,
          resolution: true,
        },
      },
      trades: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!position || position.userId !== userId) {
    return null;
  }

  return position as PositionWithTrades;
}

/**
 * Calculate unrealized P&L for a position
 */
export function calculateUnrealizedPnL(
  shares: number,
  avgBuyPrice: number,
  currentPrice: number
): number {
  const currentValue = shares * currentPrice;
  const costBasis = shares * avgBuyPrice;
  return currentValue - costBasis;
}

/**
 * Calculate potential payout if market resolves in favor
 * Winning shares pay $1 each
 */
export function calculatePotentialPayout(shares: number): number {
  return shares; // Each winning share pays $1
}

/**
 * Settle positions when market resolves
 * Called by market janitor job
 */
export async function settlePositionsForMarket(
  marketId: string,
  resolution: 'this' | 'that' | 'invalid'
): Promise<{ settled: number; totalPayout: number }> {
  let settled = 0;
  let totalPayout = 0;

  // Get all open positions for this market
  const positions = await prisma.position.findMany({
    where: {
      marketId,
      status: 'open',
    },
    include: { user: true },
  });

  for (const position of positions) {
    try {
      await prisma.$transaction(async (tx) => {
        let payout = 0;
        const shares = Number(position.shares);

        if (resolution === 'invalid') {
          // Refund: return total invested
          payout = Number(position.totalInvested);
        } else if (position.side === resolution) {
          // Won: each share pays $1
          payout = shares;
        } else {
          // Lost: shares worth nothing
          payout = 0;
        }

        const profitLoss = payout - Number(position.totalInvested);

        // Update position
        await tx.position.update({
          where: { id: position.id },
          data: {
            status: 'settled',
            settlementPayout: payout,
            settledAt: new Date(),
            realizedPnL: { increment: profitLoss },
          },
        });

        // Credit user if payout > 0
        if (payout > 0) {
          await tx.user.update({
            where: { id: position.userId },
            data: {
              availableCredits: { increment: payout },
              creditBalance: { increment: payout },
              overallPnL: { increment: profitLoss },
            },
          });

          // Create credit transaction
          await tx.creditTransaction.create({
            data: {
              userId: position.userId,
              amount: payout,
              transactionType: resolution === 'invalid' ? 'position_refund' : 'position_settlement',
              referenceId: position.id,
              balanceAfter: Number(position.user.availableCredits) + payout,
            },
          });
        } else {
          // Update P&L for losing positions
          await tx.user.update({
            where: { id: position.userId },
            data: {
              overallPnL: { increment: profitLoss },
            },
          });
        }

        settled++;
        totalPayout += payout;
      });
    } catch (error) {
      console.error(`Error settling position ${position.id}:`, error);
    }
  }

  return { settled, totalPayout };
}
