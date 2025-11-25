import { apiClient } from './api';

export interface SignupData {
  username: string;
  email: string;
  password: string;
  name: string;
  referralCode?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string | null;
  creditBalance: number;
  availableCredits: number;
  expendedCredits: number;
  consecutiveDaysOnline: number;
  referralCode: string;
  referralCount: number;
  referralCreditsEarned: number;
  totalVolume: number;
  overallPnL: number;
  lastDailyRewardAt: string | null;
  rankByPnL: number | null;
  rankByVolume: number | null;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken?: string;
  error?: string;
  details?: unknown;
}

class AuthService {
  private tokenKey = 'thisthat_access_token';

  async signup(payload: SignupData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/signup', payload);
    if (response.success && response.accessToken) {
      apiClient.setAuthToken(response.accessToken);
    }
    return response;
  }

  async login(payload: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', payload);
    if (response.success && response.accessToken) {
      apiClient.setAuthToken(response.accessToken);
    }
    return response;
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<{ success: boolean; user: User }>('/api/v1/auth/me');
      return response.user ?? null;
    } catch (error) {
      this.clearToken();
      return null;
    }
  }

  logout() {
    apiClient.clearAuthToken();
    localStorage.removeItem(this.tokenKey);
  }
}

export const authService = new AuthService();

