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
}

export interface AuthResponse {
  success: boolean;
  user: User;
  accessToken: string;
  error?: string;
  details?: any;
}

class AuthService {
  private tokenKey = 'thisthat_access_token';

  /**
   * Sign up a new user
   */
  async signup(data: SignupData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/v1/auth/signup', data);
      
      if (response.success && response.accessToken) {
        this.setToken(response.accessToken);
      }
      
      return response;
    } catch (error: any) {
      // If the error has a response with error details, include them
      throw error;
    }
  }

  /**
   * Log in a user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/v1/auth/login', data);
    
    if (response.success && response.accessToken) {
      this.setToken(response.accessToken);
    }
    
    return response;
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<{ success: boolean; user: User }>('/api/v1/auth/me');
      return response.user || null;
    } catch (error) {
      this.clearToken();
      return null;
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token);
    apiClient.setAuthToken(token);
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    localStorage.removeItem(this.tokenKey);
    apiClient.clearAuthToken();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }
}

export const authService = new AuthService();

