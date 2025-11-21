import React, { useState, useEffect } from 'react';
import MarketCard from '../../features/betting/components/MarketCard';
import BettingControls from '../../features/betting/components/BettingControls';
import type { Market } from '../../shared/types';
import { eventMarketGroupService, type EventMarketGroup } from '../../shared/services/eventMarketGroupService';
import type { BackendMarket } from '../../shared/services/marketService';

const BettingPage: React.FC = () => {
  const [eventGroups, setEventGroups] = useState<EventMarketGroup[]>([]);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [currentMarketIndex, setCurrentMarketIndex] = useState(0);
  const [userCredits] = useState(1000); // TODO: Get from user context/auth
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch event-market groups on component mount
  useEffect(() => {
    const fetchEventGroups = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch active event-market groups from backend
        const response = await eventMarketGroupService.getEventMarketGroups({
          status: 'active',
          limit: 50,
        });

        setEventGroups(response.data);

        if (response.data.length === 0) {
          setError('No active events available. Please fetch events first.');
        }
      } catch (err) {
        console.error('Error fetching event groups:', err);
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEventGroups();
  }, []);

  const currentEvent = eventGroups[currentEventIndex];
  const currentMarkets = currentEvent?.markets || [];
  const currentBackendMarket = currentMarkets[currentMarketIndex];

  // Map backend market to frontend Market type
  const mapMarket = (backendMarket: BackendMarket): Market => ({
    id: backendMarket.conditionId,
    title: backendMarket.question,
    description: backendMarket.description || '',
    thisOption: backendMarket.thisOption,
    thatOption: backendMarket.thatOption,
    thisOdds: backendMarket.thisOdds,
    thatOdds: backendMarket.thatOdds,
    expiryDate: backendMarket.endDate ? new Date(backendMarket.endDate) : new Date(),
    category: backendMarket.category || currentEvent?.category || 'Uncategorized',
    liquidity: parseFloat(backendMarket.liquidity || '0') || 0,
    imageUrl: currentEvent?.eventImage,
  });

  const currentMarket = currentBackendMarket ? mapMarket(currentBackendMarket) : null;

  const handleSwipeUp = () => {
    if (currentMarkets.length > 0) {
      // Move to next market in current event
      if (currentMarketIndex < currentMarkets.length - 1) {
        setCurrentMarketIndex((prev) => prev + 1);
      } else {
        // Move to next event's first market
        setCurrentMarketIndex(0);
        setCurrentEventIndex((prev) => (prev + 1) % eventGroups.length);
      }
    }
  };

  const handleSwipeDown = () => {
    if (currentMarkets.length > 0) {
      // Move to previous market in current event
      if (currentMarketIndex > 0) {
        setCurrentMarketIndex((prev) => prev - 1);
      } else {
        // Move to previous event's last market
        const prevEventIndex = (currentEventIndex - 1 + eventGroups.length) % eventGroups.length;
        const prevEventMarkets = eventGroups[prevEventIndex]?.markets || [];
        setCurrentMarketIndex(Math.max(0, prevEventMarkets.length - 1));
        setCurrentEventIndex(prevEventIndex);
      }
    }
  };

  const handleSwipeLeft = () => {
    // Move to previous event, keep at first market
    const prevEventIndex = (currentEventIndex - 1 + eventGroups.length) % eventGroups.length;
    setCurrentEventIndex(prevEventIndex);
    setCurrentMarketIndex(0);
  };

  const handleSwipeRight = () => {
    // Move to next event, keep at first market
    setCurrentEventIndex((prev) => (prev + 1) % eventGroups.length);
    setCurrentMarketIndex(0);
  };

  const handlePlaceBet = (option: 'THIS' | 'THAT', amount: number) => {
    console.log(`Placing bet: ${option} with ${amount} credits on market ${currentMarket?.id}`);
    // TODO: Implement actual bet placement logic
    alert(`Bet placed: ${option} - ${amount} credits`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Loading events...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No events state
  if (eventGroups.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="text-center">
          <p className="text-white/60 mb-4">No events available</p>
          <p className="text-white/40 text-sm">Events will appear here once they're fetched from Polymarket</p>
        </div>
      </div>
    );
  }

  // No market in current event
  if (!currentMarket) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="text-center">
          <p className="text-white/60 mb-4">No markets in this event</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 md:p-4 min-h-full relative">
      {/* Event title header */}
      <div className="text-center mb-2">
        <h1 className="text-lg font-semibold text-white/80">{currentEvent.eventTitle}</h1>
        {currentMarkets.length > 1 && (
          <p className="text-xs text-white/40 mt-1">
            {currentMarkets.length} markets in this event
          </p>
        )}
      </div>

      <div className="w-full">
        <MarketCard
          market={currentMarket}
          onSwipeUp={handleSwipeUp}
          onSwipeDown={handleSwipeDown}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
        />
      </div>

      <div className="w-full">
        <BettingControls
          market={currentMarket}
          onPlaceBet={handlePlaceBet}
          maxCredits={userCredits}
        />
      </div>

      <div className="text-center p-2 opacity-50">
        <span className="text-sm text-white/60">
          Event {currentEventIndex + 1} of {eventGroups.length} • Market {currentMarketIndex + 1} of {currentMarkets.length}
        </span>
      </div>
    </div>
  );
};

export default BettingPage;
