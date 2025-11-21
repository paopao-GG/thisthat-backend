import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative flex items-center justify-center min-h-screen p-8" style={{ background: 'radial-gradient(ellipse at left, rgba(30, 30, 45, 0.5) 0%, transparent 50%), radial-gradient(ellipse at right, rgba(30, 30, 45, 0.5) 0%, transparent 50%), #0a0a0a' }}>
      <button 
        className="absolute top-6 right-6 flex items-center justify-center w-10 h-10 rounded-full text-white border border-white/10 hover:border-white/20 transition-all"
        style={{ background: 'rgba(30, 30, 30, 0.8)' }}
        onClick={() => navigate('/profile')}
        aria-label="Profile"
      >
        <User size={18} className="text-white" />
      </button>

      <div className="flex flex-col items-center justify-center max-w-md w-full gap-10">
        <h1 className="text-white text-center tracking-tight font-light">
          <span className="text-6xl md:text-7xl">THIS</span>
          <span className="text-xl md:text-2xl mx-4 text-white/40">or</span>
          <span className="text-6xl md:text-7xl">THAT</span>
        </h1>

        <p className="text-sm text-white/50 text-center font-normal -mt-2 tracking-wide uppercase">
          Place your bets
        </p>
        
        <div className="flex flex-col gap-3 w-full mt-2">
          <button 
            className="w-full px-6 py-3.5 text-sm font-semibold text-white border border-white/10 hover:border-white/20 transition-all tracking-wide uppercase"
            style={{ background: 'rgba(30, 30, 30, 0.8)' }}
            onClick={() => navigate('/signup')}
          >
            Sign Up
          </button>
          
          <button 
            className="w-full px-6 py-3.5 text-sm font-semibold text-white border border-white/10 hover:border-white/20 transition-all tracking-wide uppercase"
            style={{ background: 'rgba(30, 30, 30, 0.8)' }}
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          
          <button 
            className="w-full px-6 py-3.5 text-sm font-semibold text-white border border-white/10 hover:border-white/20 transition-all tracking-wide uppercase"
            style={{ background: 'rgba(30, 30, 30, 0.8)' }}
            onClick={() => navigate('/play')}
          >
            Play
          </button>
          
          <button 
            className="w-full px-6 py-3.5 text-sm font-semibold text-white border border-white/10 hover:border-white/20 transition-all tracking-wide uppercase"
            style={{ background: 'rgba(30, 30, 30, 0.8)' }}
            onClick={() => navigate('/leaderboard')}
          >
            Leaderboards
          </button>
          
          <button 
            className="w-full px-6 py-3.5 text-sm font-semibold text-white border border-white/10 hover:border-white/20 transition-all tracking-wide uppercase"
            style={{ background: 'rgba(30, 30, 30, 0.8)' }}
            onClick={() => navigate('/stocks')}
          >
            Stock Market
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

