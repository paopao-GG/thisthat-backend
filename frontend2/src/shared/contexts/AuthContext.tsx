import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { authService, type LoginData, type SignupData, type User } from '@shared/services/authService';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signup: (data: SignupData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const current = await authService.getCurrentUser();
        if (current) {
          setUser(current);
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    const response = await authService.signup(data);
    if (response.success) {
      setUser(response.user);
    } else {
      throw new Error(response.error || 'Failed to create account');
    }
  }, []);

  const login = useCallback(async (data: LoginData) => {
    const response = await authService.login(data);
    if (response.success) {
      setUser(response.user);
    } else {
      throw new Error(response.error || 'Failed to login');
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const current = await authService.getCurrentUser();
    if (current) {
      setUser(current);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

