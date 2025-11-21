import React, { useState } from 'react';
import type { Market } from '../../../shared/types';

interface BettingControlsProps {
  market: Market;
  onPlaceBet: (option: 'THIS' | 'THAT', amount: number) => void;
  maxCredits: number;
}

const BettingControls: React.FC<BettingControlsProps> = ({ market, onPlaceBet, maxCredits }) => {
  const [betAmount, setBetAmount] = useState<number>(100);
  const [selectedOption, setSelectedOption] = useState<'THIS' | 'THAT' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleOptionSelect = (option: 'THIS' | 'THAT') => {
    setSelectedOption(option);
  };

  const handleBetAmountClick = () => {
    setIsModalOpen(true);
  };

  const handlePlaceBet = () => {
    if (selectedOption && betAmount > 0 && betAmount <= maxCredits) {
      onPlaceBet(selectedOption, betAmount);
      setSelectedOption(null);
      setBetAmount(100);
      setIsModalOpen(false);
    }
  };

  const calculatePotentialPayout = () => {
    if (!selectedOption) return 0;
    const odds = selectedOption === 'THIS' ? market.thisOdds : market.thatOdds;
    return betAmount * odds;
  };

  // Convert odds from 0-1 format to multiplier format
  const formatOddsMultiplier = (odds: number) => {
    // Odds from Polymarket are in decimal format (0-1 range representing probability)
    // Convert to multiplier: 1 / probability
    const multiplier = odds > 0 ? 1 / odds : 1;
    return `${multiplier.toFixed(2)}x`;
  };

  return (
    <>
      <div className="w-full max-w-md md:max-w-2xl mx-auto">
        {/* Side-by-side options with odds */}
        <div className="flex gap-3 mb-4">
          <button
            className={`flex-1 p-6 border rounded-lg transition-all focus:outline-none ${
              selectedOption === 'THIS'
                ? 'border-white/30 bg-white/10'
                : 'border-white/10 bg-transparent hover:border-white/20'
            }`}
            onClick={() => handleOptionSelect('THIS')}
          >
            <div className="text-center">
              <div className="text-xs text-white/50 uppercase font-semibold mb-1">THIS</div>
              <div className="text-base text-white font-medium mb-2">{market.thisOption}</div>
              <div className="text-sm text-white/70">
                <span className="text-xs text-white/50">Odds: </span>
                <span className="font-semibold">{formatOddsMultiplier(market.thisOdds)}</span>
              </div>
            </div>
          </button>

          <div className="flex items-center justify-center px-2">
            <span className="text-white/40 font-semibold">VS</span>
          </div>

          <button
            className={`flex-1 p-6 border rounded-lg transition-all focus:outline-none ${
              selectedOption === 'THAT'
                ? 'border-white/30 bg-white/10'
                : 'border-white/10 bg-transparent hover:border-white/20'
            }`}
            onClick={() => handleOptionSelect('THAT')}
          >
            <div className="text-center">
              <div className="text-xs text-white/50 uppercase font-semibold mb-1">THAT</div>
              <div className="text-base text-white font-medium mb-2">{market.thatOption}</div>
              <div className="text-sm text-white/70">
                <span className="text-xs text-white/50">Odds: </span>
                <span className="font-semibold">{formatOddsMultiplier(market.thatOdds)}</span>
              </div>
            </div>
          </button>
        </div>

        {/* Bet amount button - opens modal */}
        {selectedOption && (
          <button
            onClick={handleBetAmountClick}
            className="w-full p-5 md:p-6 border border-white/10 rounded-lg transition-all hover:border-white/20 relative min-h-[70px] md:min-h-[80px] focus:outline-none"
            style={{
              background: 'rgba(30, 30, 30, 0.8)'
            }}
          >
            <span className="absolute top-4 left-4 md:top-5 md:left-5 text-sm text-white/50 font-normal">Bet Amount</span>
            <div className="flex items-center justify-center h-full">
              <span className="text-2xl md:text-3xl font-semibold text-white">{betAmount} credits</span>
            </div>
            <div className="absolute bottom-3 right-4 text-xs text-white/40">
              Tap to adjust
            </div>
          </button>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200] p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="w-full max-w-md md:max-w-lg p-5 md:p-6 border border-white/10 backdrop-blur-sm animate-slideDown"
            style={{ background: 'rgba(10, 10, 10, 0.95)' }}
            onClick={(e) => e.stopPropagation()}
          >

            {/* Selection Buttons */}
            <div className="flex gap-3 mb-5">
              <button
                className={`flex-1 py-3 px-4 font-semibold transition-all text-sm border focus:outline-none ${
                  selectedOption === 'THIS'
                    ? 'border-green-400/60 shadow-[0_0_0_1px_rgba(34,197,94,0.4),0_0_15px_rgba(34,197,94,0.2)]'
                    : 'border-green-800/30 hover:border-green-700/50'
                }`}
                style={{
                  background: selectedOption === 'THIS'
                    ? 'rgba(20, 83, 45, 0.6)'
                    : 'rgba(20, 83, 45, 0.4)'
                }}
                onClick={() => handleOptionSelect('THIS')}
              >
                <span className={selectedOption === 'THIS' ? 'text-white' : 'text-green-200'}>
                  Yes {market.thisOdds.toFixed(2)}x
                </span>
              </button>

              <button
                className={`flex-1 py-3 px-4 font-semibold transition-all text-sm border focus:outline-none ${
                  selectedOption === 'THAT'
                    ? 'border-red-400/60 shadow-[0_0_0_1px_rgba(248,113,113,0.4),0_0_15px_rgba(248,113,113,0.2)]'
                    : 'border-red-800/30 hover:border-red-700/50'
                }`}
                style={{
                  background: selectedOption === 'THAT'
                    ? 'rgba(127, 29, 29, 0.6)'
                    : 'rgba(127, 29, 29, 0.4)'
                }}
                onClick={() => handleOptionSelect('THAT')}
              >
                <span className={selectedOption === 'THAT' ? 'text-white' : 'text-red-200'}>
                  No {market.thatOdds.toFixed(2)}x
                </span>
              </button>
            </div>

            {/* Amount Section */}
            <div className="mb-5">
              <div className="relative mb-3 p-4 border border-white/10 bg-transparent min-h-[70px] flex items-center justify-end">
                <span className="absolute top-3 left-4 text-sm text-white/50">Amount</span>
                <div className="flex items-center justify-end">
                  <span className="text-2xl font-semibold text-white">$</span>
                  <input
                    type="number"
                    min="1"
                    max={maxCredits}
                    value={betAmount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      if (value >= 0 && value <= maxCredits) {
                        setBetAmount(value);
                      }
                    }}
                    className="text-2xl font-semibold text-white bg-transparent border-none outline-none text-left focus:outline-none"
                    style={{ 
                      WebkitAppearance: 'none', 
                      MozAppearance: 'textfield',
                      width: `${String(betAmount).length * 20}px`,
                      minWidth: '40px',
                      maxWidth: '200px'
                    }}
                  />
                </div>
              </div>
              
              <div className="text-xs text-white/30 mb-3 text-right">
                Max: {maxCredits.toLocaleString()}
              </div>

              <div className="flex gap-2">
                <button
                  className="flex-1 py-2.5 px-3 border border-white/10 hover:border-white/20 text-white text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none"
                  style={{ background: 'rgba(30, 30, 30, 0.8)' }}
                  onClick={() => setBetAmount(Math.min(betAmount + 1, maxCredits))}
                  disabled={betAmount >= maxCredits}
                >
                  +$1
                </button>
                <button
                  className="flex-1 py-2.5 px-3 border border-white/10 hover:border-white/20 text-white text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none"
                  style={{ background: 'rgba(30, 30, 30, 0.8)' }}
                  onClick={() => setBetAmount(Math.min(betAmount + 250, maxCredits))}
                  disabled={betAmount >= maxCredits}
                >
                  +$250
                </button>
                <button
                  className="flex-1 py-2.5 px-3 border border-white/10 hover:border-white/20 text-white text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none"
                  style={{ background: 'rgba(30, 30, 30, 0.8)' }}
                  onClick={() => setBetAmount(Math.min(betAmount + 100, maxCredits))}
                  disabled={betAmount >= maxCredits}
                >
                  +$100
                </button>
                <button
                  className="flex-1 py-2.5 px-3 border border-white/10 hover:border-white/20 text-white text-sm font-medium transition-all focus:outline-none"
                  style={{ background: 'rgba(30, 30, 30, 0.8)' }}
                  onClick={() => setBetAmount(maxCredits)}
                >
                  Max
                </button>
              </div>
            </div>

            {/* Potential Payout */}
            {selectedOption && betAmount > 0 && (
              <div className="mb-4 p-3 border border-white/5 bg-transparent">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/50">Potential return</span>
                  <span className="font-semibold text-white">${calculatePotentialPayout().toFixed(0)}</span>
                </div>
              </div>
            )}

            {/* Trade Button */}
            <button
              className={`w-full py-3.5 md:py-4 px-4 md:px-6 text-white font-semibold uppercase tracking-wider transition-all text-sm md:text-base focus:outline-none disabled:cursor-not-allowed ${
                !selectedOption || betAmount === 0 || betAmount > maxCredits
                  ? ''
                  : 'border border-white shadow-[0_0_0_1px_rgba(255,255,255,0.5),0_0_20px_rgba(255,255,255,0.3)]'
              }`}
              style={{
                background: 'rgba(20, 20, 20, 0.9)'
              }}
              onClick={handlePlaceBet}
              disabled={!selectedOption || betAmount === 0 || betAmount > maxCredits}
            >
              {selectedOption ? 'Trade' : 'Select an option'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default BettingControls;


