import React, { useState } from 'react';
import { Search, ChevronDown, Medal } from 'lucide-react';
import type { LeaderboardEntry } from '../../shared/types';

// Mock data - replace with actual API calls
const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: '1',
    username: 'CryptoKing',
    volume: 125000,
    pnl: 45000,
    winRate: 68.5,
    totalBets: 342,
    tokenAllocation: 5000,
  },
  {
    rank: 2,
    userId: '2',
    username: 'MarketWhale',
    volume: 98000,
    pnl: 32000,
    winRate: 64.2,
    totalBets: 287,
    tokenAllocation: 4200,
  },
  {
    rank: 3,
    userId: '3',
    username: 'BettingPro',
    volume: 87500,
    pnl: 28000,
    winRate: 62.8,
    totalBets: 245,
    tokenAllocation: 3800,
  },
  {
    rank: 4,
    userId: '4',
    username: 'PredictionMaster',
    volume: 76000,
    pnl: 22000,
    winRate: 61.4,
    totalBets: 210,
    tokenAllocation: 3200,
  },
  {
    rank: 5,
    userId: '5',
    username: 'OddsGuru',
    volume: 65000,
    pnl: 18000,
    winRate: 59.7,
    totalBets: 189,
    tokenAllocation: 2800,
  },
];

const CATEGORIES = ['All', 'Crypto', 'Politics', 'Sports', 'Entertainment', 'Technology', 'Finance', 'Other'];

const LeaderboardPage: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<'today' | 'weekly' | 'monthly' | 'all'>('monthly');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'volume'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: 'volume') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Filter and sort leaderboard entries
  const filteredAndSortedLeaderboard = React.useMemo(() => {
    let filtered = mockLeaderboard.filter((entry) => {
      if (searchQuery) {
        return entry.username.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });

    // Sort the filtered results
    filtered = [...filtered].sort((a, b) => {
      const aValue = a.volume;
      const bValue = b.volume;
      
      if (sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

    return filtered;
  }, [searchQuery, sortOrder]);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex gap-1 sm:gap-2 p-1 bg-white/5 rounded-md mb-4">
          <button
            className={`flex-1 py-3 px-2 sm:px-4 text-xs sm:text-sm transition-all font-semibold rounded ${
              timeFilter === 'today'
                ? 'text-white'
                : 'text-white/60 bg-white/5 hover:text-white/80'
            }`}
            style={timeFilter === 'today' ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } : {}}
            onClick={() => setTimeFilter('today')}
          >
            Today
          </button>
          <button
            className={`flex-1 py-3 px-2 sm:px-4 text-xs sm:text-sm transition-all font-semibold rounded ${
              timeFilter === 'weekly'
                ? 'text-white'
                : 'text-white/60 bg-white/5 hover:text-white/80'
            }`}
            style={timeFilter === 'weekly' ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } : {}}
            onClick={() => setTimeFilter('weekly')}
          >
            Weekly
          </button>
          <button
            className={`flex-1 py-3 px-2 sm:px-4 text-xs sm:text-sm transition-all font-semibold rounded ${
              timeFilter === 'monthly'
                ? 'text-white'
                : 'text-white/60 bg-white/5 hover:text-white/80'
            }`}
            style={timeFilter === 'monthly' ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } : {}}
            onClick={() => setTimeFilter('monthly')}
          >
            Monthly
          </button>
          <button
            className={`flex-1 py-3 px-2 sm:px-4 text-xs sm:text-sm transition-all font-semibold rounded ${
              timeFilter === 'all'
                ? 'text-white'
                : 'text-white/60 bg-white/5 hover:text-white/80'
            }`}
            style={timeFilter === 'all' ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } : {}}
            onClick={() => setTimeFilter('all')}
          >
            All
          </button>
        </div>

        <div className="mb-4 relative">
          <select
            id="category-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full py-3 px-3 sm:px-4 pr-10 bg-white/10 border border-white/20 text-white rounded-md text-xs sm:text-sm font-medium cursor-pointer hover:bg-white/15 transition-all focus:outline-none focus:border-purple-500/50 appearance-none"
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category} className="bg-gray-800 text-white">
                {category === 'All' ? 'All Categories' : category}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 pointer-events-none" size={20} />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={20} />
          <input
            type="text"
            placeholder="Search by name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm bg-white/10 border border-white/20 text-white rounded-md placeholder:text-white/50 focus:outline-none focus:border-purple-500/50 transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Table Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-8 text-center flex-shrink-0">
              </div>
              <div className="flex items-center gap-3 flex-1 min-w-0">
              </div>
            </div>
            <div className="flex items-center gap-8 sm:gap-12 flex-shrink-0">
              <button
                onClick={() => handleSort('volume')}
                className={`text-sm font-medium hover:text-white/80 transition-colors cursor-pointer flex items-center gap-1 relative ${
                  sortBy === 'volume' ? 'text-white underline' : 'text-white/60'
                }`}
              >
                Volume
                {sortBy === 'volume' && (
                  <span className="text-xs">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                )}
              </button>
              <div className="text-sm text-white/60 font-medium min-w-[80px] sm:min-w-[100px] text-right">
                $THIS
              </div>
            </div>
          </div>

          {/* Table Rows */}
          <div className="flex flex-col">
            {filteredAndSortedLeaderboard.map((entry) => {
              // Avatar colors matching the image
              const avatarColors = [
                '#fbbf24', // yellow for rank 1
                '#14b8a6', // teal for rank 2
                '#a855f7', // purple for rank 3
                '#a78bfa', // light purple for rank 4
                '#fb923c', // orange for rank 5
              ];
              const avatarColor = avatarColors[entry.rank - 1] || '#6b7280';

              // Medal colors for top 3
              const medalColors = {
                1: '#fbbf24', // gold
                2: '#94a3b8', // silver
                3: '#cd7f32', // bronze
              };

              // Truncate username
              const displayUsername = entry.username.length > 6 
                ? entry.username.substring(0, 5) + '...' 
                : entry.username;

              return (
                <div
                  key={entry.userId}
                  className="flex items-center justify-between px-4 py-4 border-b border-white/10 transition-all hover:bg-white/5"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-8 text-left flex-shrink-0">
                      <span className="text-sm text-white font-medium">
                        {entry.rank}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div
                          className="w-10 h-10 flex items-center justify-center text-white rounded-full"
                          style={{ backgroundColor: avatarColor }}
                        >
                          <span className="text-base font-bold">{entry.username[0]}</span>
                        </div>
                        {entry.rank <= 3 && (
                          <div 
                            className="absolute -bottom-1 -left-1"
                            style={{ color: medalColors[entry.rank as 1 | 2 | 3] }}
                          >
                            <Medal size={16} fill="currentColor" />
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-white truncate">
                        {displayUsername}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 sm:gap-12 flex-shrink-0">
                    <div className="text-right min-w-[100px] sm:min-w-[120px]">
                      <span className="text-sm text-white">
                        {entry.volume.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right min-w-[80px] sm:min-w-[100px]">
                      <span className="text-sm font-medium text-amber-400">
                        {entry.tokenAllocation.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;


