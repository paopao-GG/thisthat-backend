// Market data controllers
import type { FastifyRequest, FastifyReply } from 'fastify';
import * as marketService from './market-data.services.js';

/**
 * Fetch markets from Polymarket and save to MongoDB
 */
export async function fetchMarkets(
  request: FastifyRequest<{
    Querystring: {
      active?: string;
      limit?: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    // If active query param is not provided, it will be undefined and default to true in service
    // If active=false is explicitly passed, it will fetch all markets
    const active = request.query.active !== undefined
      ? request.query.active === 'true'
      : undefined;
    const limit = request.query.limit ? parseInt(request.query.limit) : 100;

    const result = await marketService.fetchAndSaveMarkets({ active, limit });

    return reply.send({
      success: true,
      message: `Fetched and saved ${result.saved} markets`,
      data: result,
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch markets',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get all markets from MongoDB
 */
export async function getMarkets(
  request: FastifyRequest<{
    Querystring: {
      status?: 'active' | 'closed' | 'archived';
      category?: string;
      featured?: string;
      limit?: string;
      skip?: string;
    };
  }>,
  reply: FastifyReply
) {
  try {
    const filter = {
      status: request.query.status,
      category: request.query.category,
      featured: request.query.featured === 'true' ? true : undefined,
      limit: request.query.limit ? parseInt(request.query.limit) : 100,
      skip: request.query.skip ? parseInt(request.query.skip) : 0,
    };

    const markets = await marketService.getAllMarkets(filter);

    return reply.send({
      success: true,
      count: markets.length,
      data: markets,
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: 'Failed to get markets',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get market statistics
 */
export async function getMarketStats(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const stats = await marketService.getMarketStats();

    return reply.send({
      success: true,
      data: stats,
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: 'Failed to get market stats',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
