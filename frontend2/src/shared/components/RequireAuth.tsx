import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@shared/contexts/AuthContext';

interface RequireAuthProps {
  children: React.ReactElement;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#f5f5f5]/70 bg-black">
        Connecting to THISTHAT...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth;

