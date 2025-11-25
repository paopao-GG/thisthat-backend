import React, { useMemo, useState } from 'react';
import type { Market } from '@shared/types';
import { getImageUrlForMarket } from '@shared/utils/imageFetcher';
import '@/styles/betting/style.css';

interface SwipeableCardProps {
  market: Market;
  onNext: () => void;
  onPrev: () => void;
  availableCredits: number;
  minBet: number;
  maxBet: number;
  onPlaceBet: (params: { marketId: string; side: 'this' | 'that'; amount: number }) => Promise<void>;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  market,
  onNext,
  onPrev,
  availableCredits,
  minBet,
  maxBet,
  onPlaceBet,
}) => {
  const [selectedSide, setSelectedSide] = useState<'this' | 'that'>('this');
  const [amount, setAmount] = useState(minBet);
  const [placingBet, setPlacingBet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const imageUrl = useMemo(() => market.imageUrl ?? getImageUrlForMarket(market), [market]);
  const cappedMax = Math.min(maxBet, Math.max(minBet, availableCredits));

  const handleBet = async () => {
    if (amount < minBet) {
      setError(`Minimum bet is ${minBet.toLocaleString()} credits`);
      return;
    }
    if (amount > cappedMax) {
      setError(`You only have ${cappedMax.toLocaleString()} credits available`);
      return;
    }
    setError(null);
    setPlacingBet(true);
    try {
      await onPlaceBet({ marketId: market.id, side: selectedSide, amount });
      setSuccess(`Placed ${amount.toLocaleString()} credits on ${selectedSide === 'this' ? market.thisOption : market.thatOption}`);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      const message = err?.message || 'Unable to place bet. Please try again.';
      setError(message);
    } finally {
      setPlacingBet(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bet-card">
      <div className="flex justify-between items-center mb-4">
        <button type="button" onClick={onPrev} className="bet-nav-button">
          Prev
        </button>
        <div className="text-xs text-white/60 uppercase tracking-[0.3rem]">Swipe Stack</div>
        <button type="button" onClick={onNext} className="bet-nav-button">
          Next
        </button>
      </div>

      <div className="bet-card-body">
        <div className="bet-card-image-container">
          {imageUrl ? (
            <img src={imageUrl} alt={market.title} className="bet-card-image" />
          ) : (
            <div className="bet-card-placeholder">📷</div>
          )}
        </div>

        <div className="bet-card-content">
          <h2 className="bet-card-title">{market.title}</h2>
          {market.description && <p className="bet-card-description">{market.description}</p>}

          <div className="bet-options">
            <button
              type="button"
              className={`bet-option ${selectedSide === 'this' ? 'bet-option-active' : ''}`}
              onClick={() => setSelectedSide('this')}
            >
              <span className="bet-option-label">THIS</span>
              <span className="bet-option-text">{market.thisOption}</span>
              <span className="bet-option-odds">{market.thisOdds.toFixed(2)}x</span>
            </button>
            <button
              type="button"
              className={`bet-option ${selectedSide === 'that' ? 'bet-option-active' : ''}`}
              onClick={() => setSelectedSide('that')}
            >
              <span className="bet-option-label">THAT</span>
              <span className="bet-option-text">{market.thatOption}</span>
              <span className="bet-option-odds">{market.thatOdds.toFixed(2)}x</span>
            </button>
          </div>

          <div className="bet-amount-section">
            <div className="bet-amount-header">
              <span>Amount</span>
              <span className="text-white/50 text-xs">
                Available {availableCredits.toLocaleString()} credits
              </span>
            </div>
            <input
              type="number"
              min={minBet}
              max={cappedMax}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="bet-amount-input"
            />
            <div className="bet-amount-actions">
              {[minBet, minBet * 5, minBet * 10].map((val) => (
                <button
                  key={val}
                  type="button"
                  className="bet-quick-button"
                  onClick={() => setAmount(Math.min(val, cappedMax))}
                >
                  {val.toLocaleString()}
                </button>
              ))}
              <button type="button" className="bet-quick-button" onClick={() => setAmount(cappedMax)}>
                Max
              </button>
            </div>
          </div>

          {error && <div className="bet-error">{error}</div>}
          {success && <div className="bet-success">{success}</div>}

          <button
            type="button"
            disabled={placingBet}
            className="bet-submit-button"
            onClick={handleBet}
          >
            {placingBet ? 'Placing bet...' : 'Place Bet'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwipeableCard;

