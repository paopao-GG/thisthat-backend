import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';

const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getTitle = () => {
    if (location.pathname === '/leaderboard' || location.pathname === '/test/leaderboard') {
      return 'Leaderboard';
    }
    if (location.pathname === '/profile' || location.pathname === '/test/profile') {
      return 'Profile';
    }
    return 'Play';
  };

  return (
    <header className="flex justify-between items-center px-6 py-4 border-b border-white/10 backdrop-blur-md z-[100]" style={{ background: 'rgba(10, 10, 15, 0.8)' }}>
      <div className="flex items-center">
        <button 
          onClick={() => navigate(-1)}
          className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
        </button>
      </div>
      <div className="flex items-center">
        <h2 className="text-xl font-bold text-white m-0">{getTitle()}</h2>
      </div>
      <div className="flex gap-3 items-center">
        <button
          onClick={() => navigate('/test/profile')}
          className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Profile"
        >
          <User size={24} />
        </button>
      </div>
    </header>
  );
};

export default TopBar;


