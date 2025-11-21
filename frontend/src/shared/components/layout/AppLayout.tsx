import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopBar from './TopBar';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="flex flex-col h-screen w-full text-white overflow-hidden" style={{ background: 'radial-gradient(ellipse at left, rgba(30, 30, 45, 0.5) 0%, transparent 50%), radial-gradient(ellipse at right, rgba(30, 30, 45, 0.5) 0%, transparent 50%), #0a0a0a' }}>
      {!isHomePage && <TopBar />}
      <main className={`flex-1 overflow-x-hidden relative ${isHomePage ? 'overflow-hidden p-0' : 'overflow-y-auto'}`} style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;


