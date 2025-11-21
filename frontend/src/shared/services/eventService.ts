import { apiClient } from './api';
import type { ApiError } from './api';

// Backend event data structure
export interface BackendEvent {
  eventId: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  status: 'active' | 'closed' | 'archived';
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventFetchResponse {
  success: boolean;
  message: string;
  data: {
    fetched: number;
    saved: number;
    skipped: number;
  };
}

export interface EventListResponse {
  success: boolean;
  count: number;
  data: BackendEvent[];
}

export interface EventStatsResponse {
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

export interface EventServiceError extends ApiError {
  operation: 'fetch' | 'list' | 'stats';
}

class EventService {
  /**
   * Fetch events from Polymarket and save to backend
   */
  async fetchEvents(options: {
    active?: boolean;
    limit?: number;
  } = {}): Promise<EventFetchResponse> {
    try {
      const params: Record<string, string> = {};
      if (options.active !== undefined) {
        params.active = String(options.active);
      }
      if (options.limit !== undefined) {
        params.limit = String(options.limit);
      }

      return await apiClient.post<EventFetchResponse>('/api/v1/events/fetch', params);
    } catch (error) {
      const apiError = error as ApiError;
      const eventError: EventServiceError = {
        ...apiError,
        operation: 'fetch',
      };
      console.error('[EventService] Error fetching events:', eventError);
      throw eventError;
    }
  }

  /**
   * Get events from backend
   */
  async getEvents(options: {
    status?: 'active' | 'closed' | 'archived';
    category?: string;
    limit?: number;
    skip?: number;
  } = {}): Promise<EventListResponse> {
    try {
      const params: Record<string, string> = {};
      if (options.status) params.status = options.status;
      if (options.category) params.category = options.category;
      if (options.limit !== undefined) params.limit = String(options.limit);
      if (options.skip !== undefined) params.skip = String(options.skip);

      return await apiClient.get<EventListResponse>('/api/v1/events', params);
    } catch (error) {
      const apiError = error as ApiError;
      const eventError: EventServiceError = {
        ...apiError,
        operation: 'list',
      };
      console.error('[EventService] Error getting events:', eventError);
      throw eventError;
    }
  }

  /**
   * Get event statistics
   */
  async getStats(): Promise<EventStatsResponse> {
    try {
      return await apiClient.get<EventStatsResponse>('/api/v1/events/stats');
    } catch (error) {
      const apiError = error as ApiError;
      const eventError: EventServiceError = {
        ...apiError,
        operation: 'stats',
      };
      console.error('[EventService] Error getting stats:', eventError);
      throw eventError;
    }
  }
}

export const eventService = new EventService();

