import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';
import type { UserStats, Bet } from '../../shared/types';

// Mock data for stats that aren't in user profile yet
const getDefaultStats = (username: string): UserStats => ({
  userId: '',
  username,
  credits: 1000,
  totalVolume: 0,
  totalPnL: 0,
  rank: null,
  winRate: 0,
  totalBets: 0,
  dailyStreak: 0,
  tokenAllocation: 0,
  lockedTokens: 0,
});

// Mock recent bets - will be replaced with actual API call later
const mockRecentBets: Bet[] = [];

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, refreshUser } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  useEffect(() => {
    if (user) {
      const stats = getDefaultStats(user.username);
      stats.userId = user.id;
      stats.credits = user.creditBalance;
      setUserStats(stats);
      refreshUser(); // Refresh user data
    } else if (!loading) {
      // Redirect to signup if not authenticated
      navigate('/signup');
    }
  }, [user, loading, navigate, refreshUser]);

  const purchaseOptions = [
    { credits: 500, price: 4.99, popular: false },
    { credits: 1000, price: 9.99, popular: false },
    { credits: 2500, price: 19.99, popular: true },
    { credits: 5000, price: 34.99, popular: false },
  ];

  const handlePurchase = (credits: number, price: number) => {
    console.log(`Purchasing ${credits} credits for $${price}`);
    // TODO: Implement actual purchase logic
    alert(`Purchase initiated: ${credits} credits for $${price}`);
  };

  if (loading || !user || !userStats) {
    return (
      <div className="p-6 md:p-4 max-w-4xl mx-auto pb-8 flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-4 max-w-4xl mx-auto pb-8">
      <div className="flex flex-col items-center gap-4 mb-8 p-8 border border-white/10" style={{ background: 'transparent' }}>
        <div 
          className="w-25 h-25 rounded-full flex items-center justify-center text-5xl font-semibold text-white border border-white/20"
          style={{ background: 'rgba(30, 30, 30, 0.8)', width: '100px', height: '100px' }}
        >
          {user.username[0].toUpperCase()}
        </div>
        <h1 className="text-3xl font-semibold m-0 text-white">{user.name || user.username}</h1>
        {userStats.rank && (
          <div className="px-4 py-2 border border-white/10 text-sm font-semibold text-white" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
            Rank #{userStats.rank}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] md:grid-cols-2 gap-4 mb-8">
        <div className="flex items-center gap-4 p-5 border border-white/10 transition-all hover:border-white/20" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-white/50 uppercase tracking-wide">Credits</span>
            <span className="text-xl font-semibold text-white">{userStats.credits.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 border border-white/10 transition-all hover:border-white/20" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-white/50 uppercase tracking-wide">Volume</span>
            <span className="text-xl font-semibold text-white">{userStats.totalVolume.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 border border-white/10 transition-all hover:border-white/20" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-white/50 uppercase tracking-wide">PnL</span>
            <span className={`text-xl font-semibold ${userStats.totalPnL >= 0 ? 'text-white' : 'text-white/70'}`}>
              {userStats.totalPnL >= 0 ? '+' : ''}{userStats.totalPnL.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 border border-white/10 transition-all hover:border-white/20" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-white/50 uppercase tracking-wide">Win Rate</span>
            <span className="text-xl font-semibold text-white">{userStats.winRate}%</span>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 border border-white/10 transition-all hover:border-white/20" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-white/50 uppercase tracking-wide">Day Streak</span>
            <span className="text-xl font-semibold text-white">{userStats.dailyStreak}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 p-5 border border-white/10 transition-all hover:border-white/20" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-white/50 uppercase tracking-wide">Total Bets</span>
            <span className="text-xl font-semibold text-white">{userStats.totalBets}</span>
          </div>
        </div>
      </div>

      <div className="p-6 border border-white/10 mb-8" style={{ background: 'transparent' }}>
        <h2 className="text-xl font-semibold m-0 mb-4 text-white">$THIS Token Allocation</h2>
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex justify-between items-center p-3 border border-white/10" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
            <span className="text-sm text-white/50 font-medium">Total Allocated</span>
            <span className="text-base font-semibold text-white">{userStats.tokenAllocation.toLocaleString()} $THIS</span>
          </div>
          <div className="flex justify-between items-center p-3 border border-white/10" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
            <span className="text-sm text-white/50 font-medium">Locked</span>
            <span className="text-base font-semibold text-white/70">{userStats.lockedTokens.toLocaleString()} $THIS</span>
          </div>
          <div className="flex justify-between items-center p-3 border border-white/10" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
            <span className="text-sm text-white/50 font-medium">Unlocked</span>
            <span className="text-base font-semibold text-white">
              {(userStats.tokenAllocation - userStats.lockedTokens).toLocaleString()} $THIS
            </span>
          </div>
        </div>
        <p className="m-0 text-sm text-white/50 text-center">
          Use your credits to unlock more $THIS tokens. The higher you rank, the more tokens you earn!
        </p>
      </div>

      <div className="p-6 border border-white/10 mb-8" style={{ background: 'transparent' }}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🎁</span>
          <h2 className="text-xl font-semibold m-0 text-white">Daily Rewards</h2>
        </div>
        <p className="m-0 mb-4 text-white/60 text-sm">
          Log in daily to earn free credits and maintain your streak!
        </p>
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔥</span>
            <span className="font-medium text-white">{userStats.dailyStreak} Day Streak</span>
          </div>
          <button className="px-6 py-3 text-white font-semibold transition-all border border-white/10 hover:border-white/20" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
            Claim Today's Reward (+100)
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-extrabold m-0 mb-2 text-white">Purchase Credits</h2>
        <p className="text-sm text-white/60 m-0 mb-6">
          Support the platform and boost your betting power
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {purchaseOptions.map((option, index) => (
            <div
              key={index}
              className={`flex flex-col items-center gap-4 p-6 border transition-all relative hover:border-white/20 ${
                option.popular ? 'border-white/20' : 'border-white/10'
              }`}
              style={{ background: 'rgba(30, 30, 30, 0.8)' }}
            >
              {option.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 border border-white/20 text-white text-xs font-semibold uppercase tracking-wide" style={{ background: 'rgba(30, 30, 30, 0.9)' }}>
                  Most Popular
                </div>
              )}
              <div className="flex flex-col items-center gap-1">
                <span className="text-3xl font-semibold text-white">{option.credits.toLocaleString()}</span>
                <span className="text-xs text-white/50 uppercase tracking-wide">Credits</span>
              </div>
              <div className="text-2xl font-semibold text-white">${option.price}</div>
              <button
                className="w-full py-2 border border-white/10 text-white font-medium transition-all hover:border-white/20"
                style={{ background: 'transparent' }}
                onClick={() => handlePurchase(option.credits, option.price)}
              >
                Purchase
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 border border-white/10 mb-8" style={{ background: 'transparent' }}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🤝</span>
          <h2 className="text-xl font-semibold m-0 text-white">Refer Friends</h2>
        </div>
        <p className="m-0 mb-4 text-sm text-white/60">
          Share your referral code and earn 200 credits for each friend who joins!
        </p>
        <div className="flex items-center gap-3 p-4 border border-white/10 mb-4" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
          <span className="flex-1 text-xl font-semibold text-white tracking-widest">PLAYER123</span>
          <button className="px-6 py-2 border border-white/10 text-white font-medium hover:border-white/20 transition-all" style={{ background: 'transparent' }}>
            Copy
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center gap-1 p-4 border border-white/10" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
            <span className="text-2xl font-semibold text-white">5</span>
            <span className="text-xs text-white/50 uppercase tracking-wide text-center">Friends Referred</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-4 border border-white/10" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
            <span className="text-2xl font-semibold text-white">1,000</span>
            <span className="text-xs text-white/50 uppercase tracking-wide text-center">Credits Earned</span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-4 p-6 border border-white/10 mb-8" style={{ background: 'transparent' }}>
        <div className="text-3xl">🔒</div>
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold m-0 text-white">V2 Coming Soon</h3>
          <p className="m-0 text-sm text-white/60">
            Wallet integration with USDC is coming in V2. For now, enjoy betting with credits!
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold m-0 mb-4 text-white">Recent Bets</h2>
        <div className="flex flex-col gap-3">
          {mockRecentBets.map((bet) => (
            <div key={bet.id} className="flex items-center gap-4 p-4 border border-white/10 md:flex-wrap" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
              <div className="min-w-[60px]">
                <span className={`inline-block px-3 py-1.5 text-xs font-medium tracking-wide border ${
                  bet.option.toLowerCase() === 'this'
                    ? 'border-white/20 text-white'
                    : 'border-white/20 text-white'
                }`} style={{ background: 'transparent' }}>
                  {bet.option}
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <span className="text-sm font-medium text-white">{bet.amount} credits @ {bet.odds}x</span>
                <span className="text-xs text-white/50">
                  {bet.timestamp.toLocaleDateString()}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-3 py-1.5 text-xs font-medium border ${
                  bet.status === 'won'
                    ? 'border-white/20 text-white'
                    : bet.status === 'lost'
                    ? 'border-white/20 text-white/70'
                    : 'border-white/20 text-white/60'
                }`} style={{ background: 'transparent' }}>
                  {bet.status === 'won' && '✓ Won'}
                  {bet.status === 'lost' && '✗ Lost'}
                  {bet.status === 'pending' && '⏳ Pending'}
                </span>
                {bet.status === 'won' && bet.payout && (
                  <span className="text-sm font-semibold text-white">+{bet.payout.toFixed(0)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;


