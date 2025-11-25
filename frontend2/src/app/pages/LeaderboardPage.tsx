import React, { useMemo, useState, useEffect } from 'react';
import type { LeaderboardEntry } from '@shared/types';
import LeaderboardTable from '@features/leaderboard/components/LeaderboardTable';
import { leaderboardService } from '@shared/services/leaderboardService';

const CATEGORIES = ['All', 'Crypto', 'Politics', 'Sports', 'Entertainment', 'Technology', 'Finance', 'Other'];

const LeaderboardPage: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'today' | 'weekly' | 'monthly' | 'all'>('monthly');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [boardType, setBoardType] = useState<'volume' | 'pnl'>('volume');
  const [volumeEntries, setVolumeEntries] = useState<LeaderboardEntry[]>([]);
  const [pnlEntries, setPnlEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const loadLeaderboards = async () => {
      try {
        const [volumeRes, pnlRes] = await Promise.all([
          leaderboardService.getVolumeLeaderboard(),
          leaderboardService.getPnlLeaderboard(),
        ]);

        const mapEntries = (data: LeaderboardEntry[]): LeaderboardEntry[] =>
          data.map((entry) => ({ ...entry }));

        setVolumeEntries(mapEntries(volumeRes.leaderboard.map((item) => ({
          rank: item.rank,
          userId: item.user.id,
          username: item.user.username,
          volume: Number(item.totalVolume),
          pnl: Number(item.overallPnL),
          winRate: 0,
          totalBets: 0,
          tokenAllocation: Number(item.overallPnL),
        }))));

        setPnlEntries(mapEntries(pnlRes.leaderboard.map((item) => ({
          rank: item.rank,
          userId: item.user.id,
          username: item.user.username,
          volume: Number(item.totalVolume),
          pnl: Number(item.overallPnL),
          winRate: 0,
          totalBets: 0,
          tokenAllocation: Number(item.totalVolume),
        }))));
      } catch (error) {
        console.error('Failed to load leaderboard data:', error);
      }
    };

    loadLeaderboards();
  }, []);

  const currentEntries = useMemo(() => {
    if (boardType === 'volume') {
      return volumeEntries.map((entry) => ({
        ...entry,
        tokenAllocation: entry.pnl,
      }));
    }
    return pnlEntries.map((entry) => ({
      ...entry,
      tokenAllocation: entry.volume,
    }));
  }, [boardType, volumeEntries, pnlEntries]);

  const handleSort = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-6xl mx-auto space-y-6">
      <div className="flex gap-2">
        {(['volume', 'pnl'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setBoardType(type)}
            className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all ${
              boardType === type
                ? 'text-white border-white/20'
                : 'text-white/60 border-white/10 hover:border-white/20'
            }`}
            style={{ background: 'rgba(26, 26, 26, 0.6)' }}
          >
            {type === 'volume' ? 'Volume' : 'PnL'}
          </button>
        ))}
      </div>

      <LeaderboardTable
        entries={currentEntries}
        timeFilter={timeFilter}
        categoryFilter={categoryFilter}
        searchQuery={searchQuery}
        sortOrder={sortOrder}
        categories={CATEGORIES}
        metricLabel={boardType === 'volume' ? 'Volume' : 'PnL'}
        metricKey={boardType === 'volume' ? 'volume' : 'pnl'}
        secondaryLabel={boardType === 'volume' ? 'PnL' : 'Volume'}
        onTimeFilterChange={setTimeFilter}
        onCategoryFilterChange={setCategoryFilter}
        onSearchChange={setSearchQuery}
        onSort={handleSort}
      />
    </div>
  );
};

export default LeaderboardPage;


