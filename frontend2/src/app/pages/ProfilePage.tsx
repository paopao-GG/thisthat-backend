import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { UserStats } from '@shared/types';
import ProfileSummaryCard from '@features/profile/components/ProfileSummaryCard';
import WalletSection from '@features/profile/wallet/components/WalletSection';
import PositionsTable from '@features/profile/components/PositionsTable';
import ReferralModal from '@features/profile/components/ReferralModal';
import { useAuth } from '@shared/contexts/AuthContext';
import { betService } from '@shared/services/betService';
import { referralService } from '@shared/services/referralService';
import { purchaseService, type CreditPackage } from '@shared/services/purchaseService';

interface PositionRow {
  id: string;
  market: string;
  prediction: string;
  shares: string;
  avgPrice: string;
  currentPrice: string;
  value: number;
  pnl: number;
  pnlPercent: number;
  status: string;
}

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'positions' | 'activity'>('positions');
  const [positionFilter, setPositionFilter] = useState<'active' | 'closed'>('active');
  const [timeFilter, setTimeFilter] = useState<'1D' | '1W' | '1M' | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [referralStats, setReferralStats] = useState<{
    count: number;
    credits: number;
    users: Array<{ id: string; username: string; joinedAt: string }>;
  } | null>(null);
  const [purchaseOptions, setPurchaseOptions] = useState<CreditPackage[]>([]);
  const [purchaseLoadingId, setPurchaseLoadingId] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [winRate, setWinRate] = useState(0);
  const [recentBetsCount, setRecentBetsCount] = useState(0);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        setLoadingData(true);
        const [betsResponse, referralResponse] = await Promise.all([
          betService.getUserBets({ limit: 50 }),
          referralService.getReferralStats().catch(() => null),
        ]);

        const mappedPositions: PositionRow[] = betsResponse.bets.map((bet) => {
          const amount = Number(bet.amount);
          const potential = Number(bet.potentialPayout);
          const actual = bet.actualPayout !== null ? Number(bet.actualPayout) : null;
          const pnl =
            bet.status === 'won'
              ? (actual ?? potential) - amount
              : bet.status === 'lost'
              ? -amount
              : 0;
          const pnlPercent = amount > 0 ? (pnl / amount) * 100 : 0;
          const prediction =
            bet.side === 'this' ? bet.market?.thisOption ?? 'THIS' : bet.market?.thatOption ?? 'THAT';

          return {
            id: bet.id,
            market: bet.market?.title ?? 'Market',
            prediction,
            shares: `${amount.toLocaleString()} credits`,
            avgPrice: `${bet.oddsAtBet.toFixed(2)}x`,
            currentPrice:
              bet.status === 'won'
                ? (actual ?? potential).toLocaleString()
                : bet.status === 'pending'
                ? potential.toLocaleString()
                : '—',
            value: bet.status === 'won' ? actual ?? potential : potential,
            pnl,
            pnlPercent,
            status: bet.status,
          };
        });

        setPositions(mappedPositions);
        setRecentBetsCount(betsResponse.total ?? mappedPositions.length);
        const wins = mappedPositions.filter((p) => p.pnl > 0).length;
        setWinRate(mappedPositions.length ? (wins / mappedPositions.length) * 100 : 0);

        if (referralResponse?.success) {
          setReferralStats({
            count: referralResponse.referralCount,
            credits: referralResponse.referralCreditsEarned,
            users: referralResponse.referredUsers,
          });
          setReferralCode(referralResponse.referralCode);
          setReferralLink(`https://thisthat.app/ref/${referralResponse.referralCode}`);
        } else {
          setReferralCode(user.referralCode);
          setReferralLink(`https://thisthat.app/ref/${user.referralCode}`);
        }
      } catch (error) {
        console.error('Failed to load profile data:', error);
        setReferralCode(user.referralCode);
        setReferralLink(`https://thisthat.app/ref/${user.referralCode}`);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const response = await purchaseService.getPackages();
        if (response.success) {
          setPurchaseOptions(response.packages);
        }
      } catch (error) {
        console.error('Failed to load credit packages:', error);
      }
    };
    loadPackages();
  }, []);

  useEffect(() => {
    const updateSliderPosition = () => {
      if (!tabsContainerRef.current) return;
      const activeIndex = activeTab === 'positions' ? 0 : 1;
      const container = tabsContainerRef.current;
      const buttons = container.querySelectorAll('button');
      const activeButton = buttons[activeIndex] as HTMLElement;
      if (!activeButton) return;
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();
      setSliderStyle({
        left: `${buttonRect.left - containerRect.left}px`,
        width: `${buttonRect.width}px`,
      });
    };

    const rafId = requestAnimationFrame(() => {
      updateSliderPosition();
      requestAnimationFrame(updateSliderPosition);
    });
    window.addEventListener('resize', updateSliderPosition);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateSliderPosition);
    };
  }, [activeTab]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
  };

  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join THIS<THAT',
        text: 'Prediction markets that feel like swiping a feed.',
        url: referralLink,
      });
    } else {
      navigator.clipboard.writeText(referralLink);
    }
  };

  const userStats: UserStats | null = useMemo(() => {
    if (!user) return null;
    return {
      userId: user.id,
      username: user.username,
      credits: user.availableCredits,
      totalVolume: user.totalVolume,
      totalPnL: user.overallPnL,
      rank: user.rankByVolume ?? user.rankByPnL ?? null,
      winRate,
      totalBets: recentBetsCount,
      dailyStreak: user.consecutiveDaysOnline,
      tokenAllocation: 0,
      lockedTokens: 0,
      lastClaimDate: user.lastDailyRewardAt ? new Date(user.lastDailyRewardAt) : null,
    };
  }, [user, winRate, recentBetsCount]);

  const filteredPositions = positions.filter((position) => {
    const matchesFilter =
      positionFilter === 'active'
        ? position.status === 'pending'
        : position.status === 'won' || position.status === 'lost' || position.status === 'cancelled';
    const matchesSearch =
      !searchQuery ||
      position.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
      position.prediction.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const biggestWin = positions.reduce((max, p) => (p.pnl > max ? p.pnl : max), 0);

  const handlePurchase = async (packageId: string) => {
    try {
      setPurchaseLoadingId(packageId);
      setPurchaseError(null);
      setPurchaseSuccess(null);
      const response = await purchaseService.createPurchase(packageId);
      if (response.success) {
        setPurchaseSuccess(
          `Added ${response.purchase.creditsGranted.toLocaleString()} credits to your balance`
        );
        await refreshUser();
      }
    } catch (err: any) {
      const message = err?.message || 'Unable to complete purchase.';
      setPurchaseError(message);
    } finally {
      setPurchaseLoadingId(null);
      setTimeout(() => {
        setPurchaseSuccess(null);
        setPurchaseError(null);
      }, 4000);
    }
  };

  if (!userStats) {
    return (
      <div className="p-6 text-center text-white/60">
        {loadingData ? 'Loading profile...' : 'Unable to load profile. Please try again.'}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto pb-8">
      <WalletSection userStats={userStats} />

      <ProfileSummaryCard
        userStats={userStats}
        positions={positions}
        biggestWin={biggestWin}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        onReferralClick={() => setIsModalOpen(true)}
      />

      <div className="mb-8">
        <h2 className="text-xl font-extrabold m-0 mb-2 text-white">Purchase Credits</h2>
        <p className="text-sm text-white/60 m-0 mb-6">Support the platform and boost your betting power</p>
        {purchaseSuccess && (
          <div className="p-3 mb-4 border border-green-500/40 text-green-300 text-sm" style={{ background: 'rgba(0, 40, 0, 0.4)' }}>
            {purchaseSuccess}
          </div>
        )}
        {purchaseError && (
          <div className="p-3 mb-4 border border-red-500/40 text-red-300 text-sm" style={{ background: 'rgba(40, 0, 0, 0.4)' }}>
            {purchaseError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(purchaseOptions.length
            ? purchaseOptions
            : [
                { id: 'starter', label: 'Starter', credits: 500, usd: 4.99 },
                { id: 'boost', label: 'Boost', credits: 1000, usd: 9.99 },
                { id: 'pro', label: 'Pro', credits: 2500, usd: 19.99 },
                { id: 'whale', label: 'Whale', credits: 5000, usd: 34.99 },
              ]
          ).map((option, index) => (
            <div
              key={option.id ?? index}
              className={`flex flex-col items-center gap-4 p-6 border transition-all relative hover:border-white/20 ${
                option.label === 'Pro' ? 'border-white/20' : 'border-white/10'
              }`}
              style={{ background: 'rgba(30, 30, 30, 0.8)' }}
            >
              {option.label === 'Pro' && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 border border-white/20 text-white text-xs font-semibold uppercase tracking-wide" style={{ background: 'rgba(30, 30, 30, 0.9)' }}>
                  Most Popular
                </div>
              )}
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-white/50 uppercase tracking-wide">{option.label ?? 'Bundle'}</span>
                <span className="text-3xl font-semibold text-white">{option.credits.toLocaleString()}</span>
                <span className="text-xs text-white/50 uppercase tracking-wide">Credits</span>
              </div>
              <div className="text-2xl font-semibold text-white">${option.usd.toFixed(2)}</div>
              <button
                className="w-full py-2 border border-white/10 text-white font-medium transition-all hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'transparent' }}
                onClick={() => handlePurchase(option.id)}
                disabled={purchaseLoadingId === option.id}
              >
                {purchaseLoadingId === option.id ? 'Processing...' : 'Purchase'}
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
          Share your referral code and earn 200 credits for each friend who joins. Rewards credit immediately after they create an account.
        </p>
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center gap-3 p-4 border border-white/10" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
            <div className="flex-1">
              <span className="text-xs text-white/50 uppercase tracking-wide">Referral Code</span>
              <div className="text-xl font-semibold text-white tracking-[0.4em]">
                {referralCode || '--------'}
              </div>
            </div>
            <button
              className="px-6 py-2 border border-white/10 text-white font-medium hover:border-white/20 transition-all"
              style={{ background: 'transparent' }}
              onClick={handleCopyCode}
              disabled={!referralCode}
            >
              Copy
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-center gap-1 p-4 border border-white/10" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
            <span className="text-2xl font-semibold text-white">{referralStats?.count ?? '--'}</span>
            <span className="text-xs text-white/50 uppercase tracking-wide text-center">Friends Referred</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-4 border border-white/10" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
            <span className="text-2xl font-semibold text-white">
              {(referralStats?.credits ?? 0).toLocaleString()}
            </span>
            <span className="text-xs text-white/50 uppercase tracking-wide text-center">Credits Earned</span>
          </div>
        </div>
      </div>

      <div
        ref={tabsContainerRef}
        className="flex items-center gap-6 mb-4 relative"
        style={{ borderBottom: '1px solid rgba(245, 245, 245, 0.08)' }}
      >
        <div
          className="absolute bottom-0 h-0.5 pointer-events-none z-0"
          style={{
            ...sliderStyle,
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            transition: 'left 250ms cubic-bezier(0.4, 0, 0.2, 1), width 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        <button
          type="button"
          onClick={() => setActiveTab('positions')}
          className={`pb-3 px-1 text-sm font-semibold transition-all relative border-none z-10 ${
            activeTab === 'positions' ? 'text-[#f5f5f5]' : 'text-[#f5f5f5]/60 hover:text-[#f5f5f5]/80'
          }`}
        >
          Positions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`pb-3 px-1 text-sm font-semibold transition-all relative border-none z-10 ${
            activeTab === 'activity' ? 'text-[#f5f5f5]' : 'text-[#f5f5f5]/60 hover:text-[#f5f5f5]/80'
          }`}
        >
          Previous Activity
        </button>
      </div>

      {activeTab === 'positions' && (
        <PositionsTable
          positions={filteredPositions}
          positionFilter={positionFilter}
          searchQuery={searchQuery}
          onFilterChange={setPositionFilter}
          onSearchChange={setSearchQuery}
        />
      )}

      {activeTab === 'activity' && (
        <div className="text-center py-12 text-[#f5f5f5]/50 text-sm">
          Activity history coming soon
        </div>
      )}

      {referralCode && (
        <ReferralModal
          isOpen={isModalOpen}
          referralCode={referralCode}
          referralLink={referralLink}
          onClose={() => setIsModalOpen(false)}
          onCopyCode={handleCopyCode}
          onShareLink={handleShareLink}
        />
      )}
    </div>
  );
};

export default ProfilePage;

