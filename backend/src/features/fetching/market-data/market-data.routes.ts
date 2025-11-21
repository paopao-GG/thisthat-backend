// Market data routes
import type { FastifyInstance } from 'fastify';
import * as controller from './market-data.controllers.js';

export default async function marketDataRoutes(fastify: FastifyInstance) {
  // Fetch markets from Polymarket and save to MongoDB
  // Changed to GET to match Polymarket API (POST was causing 415 error)
  fastify.get('/fetch', controller.fetchMarkets);
  // Keep POST for backward compatibility
  fastify.post('/fetch', controller.fetchMarkets);

  // Get markets from MongoDB
  fastify.get('/', controller.getMarkets);

  // Get market statistics
  fastify.get('/stats', controller.getMarketStats);
}
