import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, type User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (username: string, email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = authService.getToken();
      if (token) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Failed to load user:', error);
          authService.clearToken();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const signup = async (username: string, email: string, password: string, name: string) => {
    try {
      const response = await authService.signup({ username, email, password, name });
      if (response.success) {
        setUser(response.user);
      } else {
        throw new Error(response.error || 'Signup failed');
      }
    } catch (error: any) {
      // Re-throw with better error message
      throw new Error(error.message || 'Failed to create account. Please check your connection and try again.');
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    if (response.success) {
      setUser(response.user);
    } else {
      throw new Error('Login failed');
    }
  };

  const logout = () => {
    authService.clearToken();
    setUser(null);
  };

  const refreshUser = async () => {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

