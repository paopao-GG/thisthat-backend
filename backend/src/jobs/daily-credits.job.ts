/**
 * Daily Credit Allocation Job
 * Runs every 5 minutes for testing (normally 24 hours)
 */

import { prisma } from '../lib/database.js';
import * as economyService from '../features/economy/economy.services.js';

let jobInterval: NodeJS.Timeout | null = null;

/**
 * Process daily credits for all eligible users
 */
async function processDailyCreditsForAllUsers() {
  try {
    console.log('[Daily Credits Job] Starting daily credit allocation...');
    
    // Get all users who haven't claimed in the last 5 minutes (for testing)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { lastDailyRewardAt: null }, // Never claimed
          { lastDailyRewardAt: { lt: fiveMinutesAgo } }, // Last claim > 5 minutes ago (for testing)
        ],
      },
    });

    console.log(`[Daily Credits Job] Found ${users.length} eligible users`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        await economyService.processDailyCreditAllocation(user.id);
        successCount++;
      } catch (error: any) {
        console.error(`[Daily Credits Job] Error processing user ${user.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`[Daily Credits Job] Completed: ${successCount} successful, ${errorCount} errors`);
  } catch (error: any) {
    console.error('[Daily Credits Job] Fatal error:', error);
  }
}

/**
 * Start the daily credits job scheduler
 * Runs every 5 minutes for testing (normally 24 hours)
 */
export function startDailyCreditsJob() {
  if (jobInterval) {
    console.log('[Daily Credits Job] Job already running');
    return;
  }

  console.log('[Daily Credits Job] Starting scheduler (TESTING MODE: 5 minutes)...');
  
  // Run immediately on start
  processDailyCreditsForAllUsers();
  
  // Then run every 5 minutes (for testing)
  jobInterval = setInterval(() => {
    processDailyCreditsForAllUsers();
  }, 5 * 60 * 1000); // 5 minutes (for testing)

  console.log('[Daily Credits Job] Scheduler started (runs every 5 minutes - TESTING MODE)');
}

/**
 * Stop the daily credits job scheduler
 */
export function stopDailyCreditsJob() {
  if (jobInterval) {
    clearInterval(jobInterval);
    jobInterval = null;
    console.log('[Daily Credits Job] Scheduler stopped');
  }
}

