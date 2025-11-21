import { apiClient } from './api';
import type { ApiError } from './api';
import type { BackendMarket } from './marketService';

// Backend event-market group structure
export interface EventMarketGroup {
  eventId: string;
  eventTitle: string;
  eventDescription?: string;
  eventSlug: string;
  eventImage?: string;
  eventIcon?: string;
  category?: string;
  status: 'active' | 'closed' | 'archived';
  markets: BackendMarket[];
  totalLiquidity: number;
  totalVolume: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventMarketGroupFetchResponse {
  success: boolean;
  message: string;
  data: {
    saved: number;
    errors: number;
  };
}

export interface EventMarketGroupListResponse {
  success: boolean;
  count: number;
  data: EventMarketGroup[];
}

export interface EventMarketGroupStatsResponse {
  success: boolean;
  data: {
    totalEvents: number;
    activeEvents: number;
    closedEvents: number;
    archivedEvents: number;
    categoryCounts: Record<string, number>;
    lastUpdated: string;
  };
}

export interface EventMarketGroupServiceError extends ApiError {
  operation: 'fetch' | 'list' | 'stats' | 'get';
}

class EventMarketGroupService {
  /**
   * Fetch event-market groups from Polymarket and save to backend
   */
  async fetchEventMarketGroups(options: {
    active?: boolean;
    limit?: number;
  } = {}): Promise<EventMarketGroupFetchResponse> {
    try {
      const params: Record<string, string> = {};
      if (options.active !== undefined) {
        params.active = String(options.active);
      }
      if (options.limit !== undefined) {
        params.limit = String(options.limit);
      }

      return await apiClient.post<EventMarketGroupFetchResponse>('/api/v1/event-market-groups/fetch', params);
    } catch (error) {
      const apiError = error as ApiError;
      const serviceError: EventMarketGroupServiceError = {
        ...apiError,
        operation: 'fetch',
      };
      console.error('[EventMarketGroupService] Error fetching:', serviceError);
      throw serviceError;
    }
  }

  /**
   * Get event-market groups from backend
   */
  async getEventMarketGroups(options: {
    status?: 'active' | 'closed' | 'archived';
    category?: string;
    limit?: number;
    skip?: number;
  } = {}): Promise<EventMarketGroupListResponse> {
    try {
      const params: Record<string, string> = {};
      if (options.status) params.status = options.status;
      if (options.category) params.category = options.category;
      if (options.limit !== undefined) params.limit = String(options.limit);
      if (options.skip !== undefined) params.skip = String(options.skip);

      return await apiClient.get<EventMarketGroupListResponse>('/api/v1/event-market-groups', params);
    } catch (error) {
      const apiError = error as ApiError;
      const serviceError: EventMarketGroupServiceError = {
        ...apiError,
        operation: 'list',
      };
      console.error('[EventMarketGroupService] Error getting:', serviceError);
      throw serviceError;
    }
  }

  /**
   * Get a single event-market group by ID
   */
  async getEventMarketGroup(eventId: string): Promise<{ success: boolean; data: EventMarketGroup }> {
    try {
      return await apiClient.get<{ success: boolean; data: EventMarketGroup }>(`/api/v1/event-market-groups/${eventId}`);
    } catch (error) {
      const apiError = error as ApiError;
      const serviceError: EventMarketGroupServiceError = {
        ...apiError,
        operation: 'get',
      };
      console.error('[EventMarketGroupService] Error getting single group:', serviceError);
      throw serviceError;
    }
  }

  /**
   * Get event-market group statistics
   */
  async getStats(): Promise<EventMarketGroupStatsResponse> {
    try {
      return await apiClient.get<EventMarketGroupStatsResponse>('/api/v1/event-market-groups/stats');
    } catch (error) {
      const apiError = error as ApiError;
      const serviceError: EventMarketGroupServiceError = {
        ...apiError,
        operation: 'stats',
      };
      console.error('[EventMarketGroupService] Error getting stats:', serviceError);
      throw serviceError;
    }
  }
}

export const eventMarketGroupService = new EventMarketGroupService();
