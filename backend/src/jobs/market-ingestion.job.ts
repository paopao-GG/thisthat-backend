/**
 * Market Ingestion Job
 *
 * Background job that periodically fetches markets from Polymarket
 * and saves STATIC data to PostgreSQL.
 *
 * Runs every 5 minutes.
 * Only saves static data (title, description, options, expiry).
 * Price data is fetched on-demand by client API.
 */

import * as marketIngestionService from '../services/market-ingestion.service.js';

let jobInterval: NodeJS.Timeout | null = null;
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Run the market ingestion task
 */
async function runIngestion() {
  try {
    console.log('[Market Ingestion Job] Starting ingestion...');
    const startTime = Date.now();

    const result = await marketIngestionService.ingestMarketsFromPolymarket({
      limit: 500,
      activeOnly: true,
    });

    const duration = Date.now() - startTime;
    console.log(`[Market Ingestion Job] Completed in ${duration}ms: ${result.created} new, ${result.updated} updated, ${result.errors} errors`);
  } catch (error: any) {
    console.error('[Market Ingestion Job] Fatal error:', error.message);
  }
}

/**
 * Start the market ingestion job scheduler
 */
export function startMarketIngestionJob() {
  if (jobInterval) {
    console.log('[Market Ingestion Job] Job already running');
    return;
  }

  console.log('[Market Ingestion Job] Starting scheduler (runs every 5 minutes)...');

  // Run immediately on start
  runIngestion();

  // Then run every 5 minutes
  jobInterval = setInterval(() => {
    runIngestion();
  }, INTERVAL_MS);

  console.log('[Market Ingestion Job] Scheduler started');
}

/**
 * Stop the market ingestion job scheduler
 */
export function stopMarketIngestionJob() {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
    console.log('[Market Ingestion Job] Scheduler stopped');
  }
}
