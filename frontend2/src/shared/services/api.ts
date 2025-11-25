/**
 * API client for THISTHAT backend (V1 credits)
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const TOKEN_STORAGE_KEY = 'thisthat_access_token';

export interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}

class ApiClient {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  setAuthToken(token: string) {
    this.headers['Authorization'] = `Bearer ${token}`;
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  clearAuthToken() {
    delete this.headers['Authorization'];
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  getStoredToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorBody: any = {};
      try {
        errorBody = await response.json();
      } catch {
        errorBody = { error: response.statusText };
      }

      const error: ApiError = new Error(errorBody.error || errorBody.message || 'Request failed');
      error.statusCode = response.status;
      error.details = errorBody.details;
      throw error;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) {
    let url = endpoint;
    if (params) {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          search.append(key, String(value));
        }
      });
      const qs = search.toString();
      if (qs) {
        url += `?${qs}`;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: any) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Automatically hydrate stored token on load
const storedToken = apiClient.getStoredToken();
if (storedToken) {
  apiClient.setAuthToken(storedToken);
}

