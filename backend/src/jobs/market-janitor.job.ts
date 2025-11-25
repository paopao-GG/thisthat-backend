/**
 * Market Janitor Job
 *
 * Background job that cleans up stale and overdue markets:
 * - Closes markets past their expiry date
 * - Checks Polymarket for resolved markets
 * - Processes bet payouts
 *
 * Runs every 1 minute.
 */

import * as janitorService from '../services/market-janitor.service.js';

let jobInterval: NodeJS.Timeout | null = null;
const INTERVAL_MS = 1 * 60 * 1000; // 1 minute

/**
 * Run the janitor task
 */
async function runJanitor() {
  try {
    console.log('[Market Janitor Job] Starting cleanup...');
    const startTime = Date.now();

    const result = await janitorService.runJanitorTasks();

    const duration = Date.now() - startTime;

    // Only log if there was activity
    if (result.closedMarkets > 0 || result.resolvedMarkets > 0 || result.processedPayouts > 0) {
      console.log(
        `[Market Janitor Job] Completed in ${duration}ms: ` +
        `${result.closedMarkets} closed, ${result.resolvedMarkets} resolved, ` +
        `${result.processedPayouts} payouts, ${result.errors} errors`
      );
    } else {
      console.log(`[Market Janitor Job] No action needed (checked ${result.checkedMarkets} markets)`);
    }
  } catch (error: any) {
    console.error('[Market Janitor Job] Fatal error:', error.message);
  }
}

/**
 * Start the market janitor job scheduler
 */
export function startMarketJanitorJob() {
  if (jobInterval) {
    console.log('[Market Janitor Job] Job already running');
    return;
  }

  console.log('[Market Janitor Job] Starting scheduler (runs every 1 minute)...');

  // Run immediately on start
  runJanitor();

  // Then run every minute
  jobInterval = setInterval(() => {
    runJanitor();
  }, INTERVAL_MS);

  console.log('[Market Janitor Job] Scheduler started');
}

/**
 * Stop the market janitor job scheduler
 */
export function stopMarketJanitorJob() {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
    console.log('[Market Janitor Job] Scheduler stopped');
  }
}
