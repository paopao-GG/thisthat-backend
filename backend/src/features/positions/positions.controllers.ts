/**
 * Position Trading Controllers
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import * as positionsService from './positions.services.js';

/**
 * POST /api/v1/positions/buy
 * Buy shares in a market outcome
 */
export async function buySharesHandler(
  request: FastifyRequest<{
    Body: {
      marketId: string;
      side: 'this' | 'that';
      amount: number;
      currentPrice: number;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const userId = (request.user as any)?.id;
    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    const { marketId, side, amount, currentPrice } = request.body;

    if (!marketId || !side || !amount || !currentPrice) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required fields: marketId, side, amount, currentPrice',
      });
    }

    const result = await positionsService.buyShares(userId, {
      marketId,
      side,
      amount,
      currentPrice,
    });

    return reply.status(200).send({
      success: true,
      position: result.position,
      trade: result.trade,
      newBalance: result.newBalance,
      sharesBought: result.sharesBought,
    });
  } catch (error: any) {
    console.error('[Positions Controller] Error buying shares:', error);
    return reply.status(400).send({
      success: false,
      error: error.message || 'Failed to buy shares',
    });
  }
}

/**
 * POST /api/v1/positions/sell
 * Sell shares from a position
 */
export async function sellSharesHandler(
  request: FastifyRequest<{
    Body: {
      positionId: string;
      shares: number;
      currentPrice: number;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const userId = (request.user as any)?.id;
    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    const { positionId, shares, currentPrice } = request.body;

    if (!positionId || !shares || !currentPrice) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required fields: positionId, shares, currentPrice',
      });
    }

    const result = await positionsService.sellShares(userId, {
      positionId,
      shares,
      currentPrice,
    });

    return reply.status(200).send({
      success: true,
      position: result.position,
      trade: result.trade,
      newBalance: result.newBalance,
      creditsReceived: result.creditsReceived,
      realizedPnL: result.realizedPnL,
    });
  } catch (error: any) {
    console.error('[Positions Controller] Error selling shares:', error);
    return reply.status(400).send({
      success: false,
      error: error.message || 'Failed to sell shares',
    });
  }
}

/**
 * GET /api/v1/positions/me
 * Get user's positions
 */
export async function getUserPositionsHandler(
  request: FastifyRequest<{
    Querystring: {
      status?: 'open' | 'closed' | 'settled';
      marketId?: string;
      limit?: string;
      offset?: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const userId = (request.user as any)?.id;
    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    const { status, marketId, limit, offset } = request.query;

    const positions = await positionsService.getUserPositions(userId, {
      status,
      marketId,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return reply.status(200).send({
      success: true,
      data: positions,
      count: positions.length,
    });
  } catch (error: any) {
    console.error('[Positions Controller] Error getting positions:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to get positions',
    });
  }
}

/**
 * GET /api/v1/positions/:positionId
 * Get a single position
 */
export async function getPositionByIdHandler(
  request: FastifyRequest<{
    Params: { positionId: string };
  }>,
  reply: FastifyReply
) {
  try {
    const userId = (request.user as any)?.id;
    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    const { positionId } = request.params;

    const position = await positionsService.getPositionById(userId, positionId);

    if (!position) {
      return reply.status(404).send({
        success: false,
        error: 'Position not found',
      });
    }

    return reply.status(200).send({
      success: true,
      data: position,
    });
  } catch (error: any) {
    console.error('[Positions Controller] Error getting position:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to get position',
    });
  }
}

/**
 * GET /api/v1/positions/market/:marketId
 * Get user's positions for a specific market
 */
export async function getPositionsForMarketHandler(
  request: FastifyRequest<{
    Params: { marketId: string };
  }>,
  reply: FastifyReply
) {
  try {
    const userId = (request.user as any)?.id;
    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    const { marketId } = request.params;

    const positions = await positionsService.getUserPositions(userId, {
      marketId,
      status: 'open',
    });

    return reply.status(200).send({
      success: true,
      data: positions,
      count: positions.length,
    });
  } catch (error: any) {
    console.error('[Positions Controller] Error getting market positions:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to get positions',
    });
  }
}
