/**
 * Markets Controllers
 *
 * Client-facing API handlers for market data.
 * - Static data from PostgreSQL
 * - Live prices fetched on-demand from Polymarket
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import * as marketsService from './markets.services.js';

/**
 * GET /api/v1/markets/random
 * Get random open markets (static data only)
 * Query params: count (default: 10)
 */
export async function getRandomMarketsHandler(
  request: FastifyRequest<{
    Querystring: { count?: string };
  }>,
  reply: FastifyReply
) {
  try {
    const count = Math.min(parseInt(request.query.count || '10', 10), 50);

    const markets = await marketsService.getRandomMarkets(count);

    return reply.status(200).send({
      success: true,
      data: markets,
      count: markets.length,
    });
  } catch (error: any) {
    console.error('[Markets Controller] Error getting random markets:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to get random markets',
    });
  }
}

/**
 * GET /api/v1/markets/categories
 * Get all available categories
 */
export async function getCategoriesHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const categories = await marketsService.getCategories();

    return reply.status(200).send({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    console.error('[Markets Controller] Error getting categories:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to get categories',
    });
  }
}

/**
 * GET /api/v1/markets/category/:category
 * Get markets by category (static data only)
 */
export async function getMarketsByCategoryHandler(
  request: FastifyRequest<{
    Params: { category: string };
    Querystring: { limit?: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { category } = request.params;
    const limit = Math.min(parseInt(request.query.limit || '20', 10), 100);

    const markets = await marketsService.getMarketsByCategory(category, limit);

    return reply.status(200).send({
      success: true,
      data: markets,
      count: markets.length,
      category,
    });
  } catch (error: any) {
    console.error('[Markets Controller] Error getting markets by category:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to get markets by category',
    });
  }
}

/**
 * GET /api/v1/markets/:id
 * Get a single market (static data only)
 */
export async function getMarketByIdHandler(
  request: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;

    const market = await marketsService.getMarketById(id);

    if (!market) {
      return reply.status(404).send({
        success: false,
        error: 'Market not found',
      });
    }

    return reply.status(200).send({
      success: true,
      data: market,
    });
  } catch (error: any) {
    console.error('[Markets Controller] Error getting market:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to get market',
    });
  }
}

/**
 * GET /api/v1/markets/:id/live
 * Get LIVE price data for a market (fetched from Polymarket API)
 */
export async function getMarketLivePriceHandler(
  request: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;

    // First get the market to find its Polymarket ID
    const market = await marketsService.getMarketById(id);

    if (!market) {
      return reply.status(404).send({
        success: false,
        error: 'Market not found',
      });
    }

    if (!market.polymarketId) {
      return reply.status(400).send({
        success: false,
        error: 'Market does not have a Polymarket ID',
      });
    }

    // Fetch live price data from Polymarket
    const liveData = await marketsService.fetchLivePriceData(market.polymarketId);

    if (!liveData) {
      return reply.status(503).send({
        success: false,
        error: 'Failed to fetch live price data from Polymarket',
      });
    }

    return reply.status(200).send({
      success: true,
      data: liveData,
      marketId: id,
    });
  } catch (error: any) {
    console.error('[Markets Controller] Error getting live price:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to get live price data',
    });
  }
}

/**
 * GET /api/v1/markets/batch-live
 * Get LIVE price data for multiple markets
 * Query params: ids (comma-separated market IDs)
 */
export async function getBatchLivePriceHandler(
  request: FastifyRequest<{
    Querystring: { ids: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { ids } = request.query;

    if (!ids) {
      return reply.status(400).send({
        success: false,
        error: 'Missing ids parameter',
      });
    }

    const marketIds = ids.split(',').slice(0, 20); // Max 20 markets per request

    // Get Polymarket IDs for these markets
    const markets = await Promise.all(
      marketIds.map((id) => marketsService.getMarketById(id.trim()))
    );

    const polymarketIds = markets
      .filter((m) => m !== null && m.polymarketId)
      .map((m) => m!.polymarketId!);

    if (polymarketIds.length === 0) {
      return reply.status(200).send({
        success: true,
        data: {},
      });
    }

    // Fetch live prices in batch
    const livePrices = await marketsService.fetchBatchLivePriceData(polymarketIds);

    // Map back to market IDs
    const result: Record<string, any> = {};
    for (const market of markets) {
      if (market && market.polymarketId) {
        const liveData = livePrices.get(market.polymarketId);
        if (liveData) {
          result[market.id] = liveData;
        }
      }
    }

    return reply.status(200).send({
      success: true,
      data: result,
      count: Object.keys(result).length,
    });
  } catch (error: any) {
    console.error('[Markets Controller] Error getting batch live prices:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to get batch live price data',
    });
  }
}

/**
 * GET /api/v1/markets/:id/full
 * Get market with static data + live prices combined
 */
export async function getMarketFullHandler(
  request: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;

    const marketWithLive = await marketsService.getMarketWithLiveData(id);

    if (!marketWithLive) {
      return reply.status(404).send({
        success: false,
        error: 'Market not found',
      });
    }

    return reply.status(200).send({
      success: true,
      data: marketWithLive,
    });
  } catch (error: any) {
    console.error('[Markets Controller] Error getting full market data:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to get market data',
    });
  }
}
