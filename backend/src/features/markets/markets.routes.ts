/**
 * Markets Routes
 *
 * Client-facing API routes for market data.
 *
 * Architecture:
 * - Static data (title, options, expiry) comes from PostgreSQL
 * - Live prices (odds, volume) are fetched on-demand from Polymarket API
 *
 * This follows "lazy loading" pattern - prices change every second,
 * so we don't store them. Instead, fetch when the client needs them.
 */

import type { FastifyInstance } from 'fastify';
import * as controller from './markets.controllers.js';

export async function marketsRoutes(fastify: FastifyInstance) {
  // ============================================
  // STATIC DATA ENDPOINTS (from PostgreSQL)
  // ============================================

  /**
   * GET /api/v1/markets/random
   * Get random open markets (static data only, no prices)
   * @query count - Number of markets (default: 10, max: 50)
   */
  fastify.get('/random', controller.getRandomMarketsHandler);

  /**
   * GET /api/v1/markets/categories
   * Get all available market categories
   */
  fastify.get('/categories', controller.getCategoriesHandler);

  /**
   * GET /api/v1/markets/category/:category
   * Get markets by category (static data only)
   * @param category - Category name
   * @query limit - Max results (default: 20, max: 100)
   */
  fastify.get('/category/:category', controller.getMarketsByCategoryHandler);

  /**
   * GET /api/v1/markets/:id
   * Get a single market (static data only)
   * @param id - Market UUID
   */
  fastify.get('/:id', controller.getMarketByIdHandler);

  // ============================================
  // LIVE DATA ENDPOINTS (from Polymarket API)
  // These fetch fresh price data on-demand
  // ============================================

  /**
   * GET /api/v1/markets/:id/live
   * Get LIVE price data for a market (fetches from Polymarket)
   * @param id - Market UUID
   * @returns { thisOdds, thatOdds, liquidity, volume, volume24hr, acceptingOrders }
   */
  fastify.get('/:id/live', controller.getMarketLivePriceHandler);

  /**
   * GET /api/v1/markets/batch-live
   * Get LIVE price data for multiple markets at once
   * @query ids - Comma-separated market UUIDs (max: 20)
   * @returns Map of marketId -> live price data
   */
  fastify.get('/batch-live', controller.getBatchLivePriceHandler);

  /**
   * GET /api/v1/markets/:id/full
   * Get market with BOTH static data AND live prices
   * Combines static data from DB + live prices from Polymarket
   * @param id - Market UUID
   */
  fastify.get('/:id/full', controller.getMarketFullHandler);
}
