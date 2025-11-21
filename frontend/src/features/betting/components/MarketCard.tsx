import React, { useEffect } from 'react';
import type { Market } from '../../../shared/types';

interface MarketCardProps {
  market: Market;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

const MarketCard: React.FC<MarketCardProps> = ({ market, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight }) => {
  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && onSwipeUp) {
        e.preventDefault();
        onSwipeUp();
      } else if (e.key === 'ArrowDown' && onSwipeDown) {
        e.preventDefault();
        onSwipeDown();
      } else if (e.key === 'ArrowLeft' && onSwipeLeft) {
        e.preventDefault();
        onSwipeLeft();
      } else if (e.key === 'ArrowRight' && onSwipeRight) {
        e.preventDefault();
        onSwipeRight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight]);

  return (
    <div className="w-full max-w-md mx-auto border border-white/10 rounded-lg relative" style={{ background: 'transparent' }}>
      {/* Navigation buttons - Up/Down for markets */}
      {onSwipeDown && (
        <button
          onClick={onSwipeDown}
          className="absolute left-1/2 -translate-x-1/2 -top-3 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all"
          aria-label="Previous market"
        >
          ↑
        </button>
      )}

      {onSwipeUp && (
        <button
          onClick={onSwipeUp}
          className="absolute left-1/2 -translate-x-1/2 -bottom-3 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all"
          aria-label="Next market"
        >
          ↓
        </button>
      )}

      {/* Navigation buttons - Left/Right for events */}
      {onSwipeLeft && (
        <button
          onClick={onSwipeLeft}
          className="absolute top-1/2 -translate-y-1/2 -left-3 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all"
          aria-label="Previous event"
        >
          ←
        </button>
      )}

      {onSwipeRight && (
        <button
          onClick={onSwipeRight}
          className="absolute top-1/2 -translate-y-1/2 -right-3 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all"
          aria-label="Next event"
        >
          →
        </button>
      )}

      {market.imageUrl && (
        <div
          className="w-full h-48 bg-cover bg-center relative rounded-t-lg"
          style={{ backgroundImage: `url(${market.imageUrl})` }}
        >
          <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: 'linear-gradient(to bottom, transparent, rgba(10, 10, 15, 0.9))' }} />
        </div>
      )}

      <div className="px-5 py-6">
        {/* Market question only */}
        <h2 className="text-2xl font-semibold leading-tight text-white tracking-tight text-center">
          {market.title}
        </h2>
      </div>
    </div>
  );
};

export default MarketCard;


