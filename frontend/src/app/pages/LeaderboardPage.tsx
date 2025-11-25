import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Medal, Trophy } from 'lucide-react';
import { leaderboardService, type LeaderboardEntry } from '../../shared/services/leaderboardService';
import { useAuth } from '../../shared/contexts/AuthContext';

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
  const { user } = useAuth();
  const [leaderboardType, setLeaderboardType] = useState<'pnl' | 'volume'>('pnl');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRanking, setUserRanking] = useState<{
    rank: number | null;
    totalUsers: number;
    overallPnL: number;
    totalVolume: number;
  } | null>(null);
  const [timeFilter, setTimeFilter] = useState<'today' | 'weekly' | 'monthly' | 'all'>('monthly');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'volume'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = leaderboardType === 'pnl'
          ? await leaderboardService.getPnLLeaderboard({ limit: 100 })
          : await leaderboardService.getVolumeLeaderboard({ limit: 100 });

        if (response.success) {
          setLeaderboard(response.leaderboard);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [leaderboardType]);

  // Fetch user's ranking
  useEffect(() => {
    const fetchUserRanking = async () => {
      if (!user) return;

      try {
        const response = await leaderboardService.getUserRanking(leaderboardType);
        if (response.success) {
          setUserRanking(response.ranking);
        }
      } catch (err) {
        console.error('Error fetching user ranking:', err);
      }
    };

    fetchUserRanking();
  }, [user, leaderboardType]);

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
    let filtered = leaderboard.filter((entry) => {
      if (searchQuery) {
        return entry.user.username.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });

    // Sort the filtered results
    filtered = [...filtered].sort((a, b) => {
      const aValue = leaderboardType === 'pnl' 
        ? (a.overallPnL || 0) 
        : (a.totalVolume || 0);
      const bValue = leaderboardType === 'pnl'
        ? (b.overallPnL || 0)
        : (b.totalVolume || 0);
      
      if (sortOrder === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

    return filtered;
  }, [leaderboard, searchQuery, sortOrder, leaderboardType]);

  // Calculate user's rank from leaderboard data (matches the list)
  const userRankFromLeaderboard = React.useMemo(() => {
    if (!user || !leaderboard.length) return null;
    
    const userEntry = leaderboard.find(entry => entry.user.id === user.id);
    return userEntry ? userEntry.rank : null;
  }, [user, leaderboard]);

  // Format ranking display text
  const getRankingText = () => {
    // Use rank from leaderboard if available (matches the list), otherwise fall back to stored ranking
    const rank = userRankFromLeaderboard ?? userRanking?.rank ?? null;
    
    if (rank === null) {
      return 'Not ranked yet';
    }
    
    const total = userRanking?.totalUsers ?? leaderboard.length;
    const value = leaderboardType === 'pnl' 
      ? (userRanking?.overallPnL ?? 0).toFixed(2)
      : (userRanking?.totalVolume ?? 0).toLocaleString();
    const label = leaderboardType === 'pnl' ? 'PnL' : 'Volume';
    
    return `Rank #${rank} of ${total} • ${label}: ${value}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-24">
      <div className="mb-6">
        {/* Leaderboard Type Toggle */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-md mb-4">
          <button
            className={`flex-1 py-3 px-4 text-sm transition-all font-semibold rounded ${
              leaderboardType === 'pnl'
                ? 'text-white'
                : 'text-white/60 bg-white/5 hover:text-white/80'
            }`}
            style={leaderboardType === 'pnl' ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } : {}}
            onClick={() => setLeaderboardType('pnl')}
          >
            PnL Leaderboard
          </button>
          <button
            className={`flex-1 py-3 px-4 text-sm transition-all font-semibold rounded ${
              leaderboardType === 'volume'
                ? 'text-white'
                : 'text-white/60 bg-white/5 hover:text-white/80'
            }`}
            style={leaderboardType === 'volume' ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } : {}}
            onClick={() => setLeaderboardType('volume')}
          >
            Volume Leaderboard
          </button>
        </div>

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
              const displayUsername = entry.user.username.length > 6 
                ? entry.user.username.substring(0, 5) + '...' 
                : entry.user.username;

              // Check if this is the current user
              const isCurrentUser = user && entry.user.id === user.id;

              const displayValue = leaderboardType === 'pnl'
                ? (entry.overallPnL || 0).toFixed(2)
                : (entry.totalVolume || 0).toLocaleString();

              return (
                <div
                  key={entry.user.id}
                  className={`flex items-center justify-between px-4 py-4 border-b transition-all hover:bg-white/5 ${
                    isCurrentUser 
                      ? 'bg-purple-500/20 border-purple-500/50' 
                      : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-8 text-left flex-shrink-0">
                      <span className={`text-sm font-medium ${isCurrentUser ? 'text-purple-300' : 'text-white'}`}>
                        {entry.rank}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div
                          className={`w-10 h-10 flex items-center justify-center text-white rounded-full ${
                            isCurrentUser ? 'ring-2 ring-purple-400' : ''
                          }`}
                          style={{ backgroundColor: avatarColor }}
                        >
                          <span className="text-base font-bold">{entry.user.username[0]}</span>
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
                      <span className={`text-sm font-medium truncate ${isCurrentUser ? 'text-purple-300' : 'text-white'}`}>
                        {displayUsername}
                        {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 sm:gap-12 flex-shrink-0">
                    <div className="text-right min-w-[100px] sm:min-w-[120px]">
                      <span className={`text-sm ${isCurrentUser ? 'text-purple-300 font-semibold' : 'text-white'}`}>
                        {displayValue}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Ranking Snackbar */}
      {user && userRanking && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-slideUp">
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-[90vw] border border-purple-400/30">
            <Trophy className="flex-shrink-0" size={20} />
            <div className="flex-1">
              <div className="text-sm font-semibold">Your Ranking</div>
              <div className="text-xs text-purple-100 mt-0.5">{getRankingText()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;


