import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppTitle from '@shared/components/AppTitle';
import Logo from '@shared/components/Logo';
import { useAuth } from '@shared/contexts/AuthContext';

const PreLogin: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/app', { replace: true });
    }
  }, [user, navigate]);
  return (
    <div 
      className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden"
      style={{ 
        background: 'radial-gradient(ellipse at left, rgba(30, 30, 45, 0.5) 0%, transparent 50%), radial-gradient(ellipse at right, rgba(30, 30, 45, 0.5) 0%, transparent 50%), #0a0a0a'
      }}
    >
      {/* Welcome To header */}
      <div className="absolute top-8 left-0 right-0 flex justify-between items-center px-6 z-10">
        <span className="text-white/70 text-lg font-light">Welcome</span>
        <span className="text-white/70 text-lg font-light">To</span>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 py-20">
        {/* This or That */}
        <AppTitle className="mb-12" showTagline={false} />

        {/* Logo */}
        <Logo className="mt-8" />
      </div>

      {/* CTA buttons at bottom */}
      <div className="relative z-10 w-full px-6 pb-12 pt-8 space-y-3">
        <button
          onClick={() => navigate('/login')}
          className="btn-premium w-full max-w-md mx-auto py-5 px-10 text-sm font-light text-white rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] block tracking-wider"
        >
          <span className="relative z-10">Sign in</span>
          <div className="btn-premium-glow" />
        </button>
        <button
          onClick={() => navigate('/signup')}
          className="w-full max-w-md mx-auto py-4 px-8 text-sm font-semibold text-white rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200 block tracking-wide"
          style={{ background: 'rgba(26, 26, 26, 0.7)' }}
        >
          Create account
        </button>
      </div>
    </div>
  );
};

export default PreLogin;

