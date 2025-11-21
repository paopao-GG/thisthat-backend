import type { Market } from '../types';
import type { BackendMarket } from '../services/marketService';

/**
 * Convert backend market format to frontend Market format
 */
export function convertBackendMarketToMarket(backendMarket: BackendMarket): Market {
  return {
    id: backendMarket.conditionId,
    title: backendMarket.question,
    description: backendMarket.description || '',
    thisOption: backendMarket.thisOption,
    thatOption: backendMarket.thatOption,
    thisOdds: backendMarket.thisOdds > 1 ? backendMarket.thisOdds : 1 / backendMarket.thisOdds, // Convert probability to odds
    thatOdds: backendMarket.thatOdds > 1 ? backendMarket.thatOdds : 1 / backendMarket.thatOdds,
    expiryDate: backendMarket.endDate ? new Date(backendMarket.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
    category: backendMarket.category || 'Uncategorized',
    liquidity: backendMarket.liquidity || backendMarket.volume || 0,
  };
}

