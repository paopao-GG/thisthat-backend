/**
 * Position Trading Routes
 *
 * API endpoints for tradeable shares:
 * - Buy shares in market outcomes
 * - Sell shares anytime before resolution
 * - View positions and trade history
 */

import type { FastifyInstance } from 'fastify';
import * as controller from './positions.controllers.js';

// Auth middleware helper
const authPreHandler = async (request: any, reply: any) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ success: false, error: 'Authentication required' });
  }
};

export async function positionsRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authPreHandler);

  /**
   * POST /api/v1/positions/buy
   * Buy shares in a market outcome
   * @body { marketId, side, amount, currentPrice }
   */
  fastify.post('/buy', controller.buySharesHandler);

  /**
   * POST /api/v1/positions/sell
   * Sell shares from a position
   * @body { positionId, shares, currentPrice }
   */
  fastify.post('/sell', controller.sellSharesHandler);

  /**
   * GET /api/v1/positions/me
   * Get user's positions
   * @query status - Filter by status (open, closed, settled)
   * @query marketId - Filter by market
   * @query limit - Pagination limit
   * @query offset - Pagination offset
   */
  fastify.get('/me', controller.getUserPositionsHandler);

  /**
   * GET /api/v1/positions/:positionId
   * Get a single position with trade history
   */
  fastify.get('/:positionId', controller.getPositionByIdHandler);

  /**
   * GET /api/v1/positions/market/:marketId
   * Get user's open positions for a specific market
   */
  fastify.get('/market/:marketId', controller.getPositionsForMarketHandler);
}
