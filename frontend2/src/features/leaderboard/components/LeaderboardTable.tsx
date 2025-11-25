import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';
import CategoryFilter from '@shared/components/CategoryFilter';
import type { LeaderboardEntry } from '@shared/types';
import '@/styles/leaderboard/style.css';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  timeFilter: 'today' | 'weekly' | 'monthly' | 'all';
  categoryFilter: string;
  searchQuery: string;
  sortOrder: 'asc' | 'desc';
  categories: string[];
  metricLabel: string;
  metricKey: 'volume' | 'pnl';
  secondaryLabel?: string;
  onTimeFilterChange: (filter: 'today' | 'weekly' | 'monthly' | 'all') => void;
  onCategoryFilterChange: (category: string) => void;
  onSearchChange: (query: string) => void;
  onSort: () => void;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  entries,
  timeFilter,
  categoryFilter,
  searchQuery,
  sortOrder,
  categories,
  metricLabel,
  metricKey,
  secondaryLabel = '$THIS',
  onTimeFilterChange,
  onCategoryFilterChange,
  onSearchChange,
  onSort,
}) => {
  const timeFilterContainerRef = useRef<HTMLDivElement>(null);
  const [sliderStyle, setSliderStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const updateSliderPosition = () => {
      if (!timeFilterContainerRef.current) return;
      const filterOrder: ('today' | 'weekly' | 'monthly' | 'all')[] = ['today', 'weekly', 'monthly', 'all'];
      const activeIndex = filterOrder.indexOf(timeFilter);
      if (activeIndex === -1) return;
      const container = timeFilterContainerRef.current;
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
  }, [timeFilter]);

  const filteredEntries = useMemo(() => {
    const filtered = entries.filter((entry) =>
      entry.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered.sort((a, b) => {
      const aValue = metricKey === 'volume' ? a.volume : a.pnl;
      const bValue = metricKey === 'volume' ? b.volume : b.pnl;
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });
  }, [entries, searchQuery, metricKey, sortOrder]);

  return (
    <>
      <div className="mb-6">
        <div ref={timeFilterContainerRef} className="flex gap-1 sm:gap-2 p-1 rounded-md mb-4 relative time-filter-container">
          <div className="absolute top-1 bottom-1 rounded pointer-events-none z-0 time-filter-slider" style={sliderStyle} />
          {(['today', 'weekly', 'monthly', 'all'] as const).map((filter) => (
            <button
              key={filter}
              className={`flex-1 py-2 sm:py-3 px-1.5 sm:px-4 text-xs sm:text-sm transition-all font-semibold rounded relative z-10 time-filter-button ${
                timeFilter === filter ? 'text-white' : 'text-[#f5f5f5]/60 hover:text-[#f5f5f5]/80'
              }`}
              onClick={() => onTimeFilterChange(filter)}
            >
              {filter.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <CategoryFilter categories={categories} selectedCategory={categoryFilter} onCategoryChange={onCategoryFilterChange} />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#f5f5f5]/50" size={20} />
          <input
            type="text"
            placeholder="Search by name"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm rounded-md transition-all focus:outline-none leaderboard-search-input"
          />
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0 leaderboard-table-container">
        <div className="rounded-lg overflow-hidden flex flex-col leaderboard-table-wrapper">
          <div className="flex items-center px-4 sm:px-6 py-3.5 sm:py-4 flex-shrink-0 leaderboard-table-header">
            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              <div className="flex-shrink-0 text-center leaderboard-rank-column">
                <span className="text-sm font-semibold uppercase tracking-wider leaderboard-header-text">RANK</span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 overflow-hidden leaderboard-user-column">
                <span className="text-sm font-semibold uppercase tracking-wider leaderboard-header-text">USER</span>
              </div>
            </div>
            <div className="flex items-center gap-5 sm:gap-8 md:gap-12 flex-shrink-0 ml-auto">
              <div className="text-right min-w-[90px]">
                <button
                  onClick={onSort}
                  className="text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ml-auto leaderboard-sort-button"
                >
                  {metricLabel.toUpperCase()}
                  {sortOrder === 'desc' ? (
                    <ArrowDown size={16} className="leaderboard-sort-icon" />
                  ) : (
                    <ArrowUp size={16} className="leaderboard-sort-icon" />
                  )}
                </button>
              </div>
              <div className="text-sm font-semibold uppercase text-right min-w-[90px] leaderboard-header-text">
                {secondaryLabel.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="flex flex-col overflow-y-auto flex-1 leaderboard-scrollable leaderboard-table-rows">
            {filteredEntries.map((entry, index) => (
              <div
                key={entry.userId}
                className="flex items-center px-4 sm:px-6 py-3.5 sm:py-4 transition-all group leaderboard-table-row leaderboard-table-row-animated"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                  <div className="flex-shrink-0 text-center leaderboard-rank-column">
                    <span className="text-sm text-[#f5f5f5]/70 font-semibold">{entry.rank}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 overflow-hidden leaderboard-user-column">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-[#f5f5f5] rounded-full leaderboard-avatar">
                      <span className="text-base font-bold">{entry.username[0]}</span>
                    </div>
                    <span className="text-sm font-semibold text-[#f5f5f5] truncate min-w-0">
                      {entry.username}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-5 sm:gap-8 md:gap-12 flex-shrink-0 ml-auto">
                  <div className="text-right min-w-[90px]">
                    <div className="text-white font-semibold">
                      {metricKey === 'volume'
                        ? `$${entry.volume.toLocaleString()}`
                        : `$${entry.pnl.toLocaleString()}`}
                    </div>
                  </div>
                  <div className="text-right min-w-[90px] text-[#f5f5f5]/70">
                    ${entry.tokenAllocation.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default LeaderboardTable;

