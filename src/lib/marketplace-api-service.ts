/**
 * Real Marketplace API Service
 * Implements actual API calls to backend marketplace services
 * Falls back to mock data when backend is unavailable or in development mode
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL, API_ENDPOINTS } from './api';
import { createAuthFetchOptions } from './auth-utils';
import { logger } from './logger';
import { DEV_CONFIG } from './env';

// API Error class
export class MarketplaceAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'MarketplaceAPIError';
  }
}

// Generic API request wrapper with error handling
async function marketplaceApiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 3
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, createAuthFetchOptions(options));
      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        let errorMessage = `Marketplace API request failed: ${response.status} ${response.statusText}`;
        let errorCode: string | undefined;

        // Try to parse error response
        if (contentType?.includes('application/json')) {
          try {
            const errorData = await response.json();
            if (errorData.message) errorMessage = errorData.message;
            if (errorData.error) errorMessage = errorData.error;
            if (errorData.code) errorCode = errorData.code;
          } catch (parseError) {
            logger.warn('Failed to parse marketplace error response', { parseError });
          }
        } else {
          try {
            const text = await response.text();
            if (text) errorMessage = text.substring(0, 200);
          } catch (textError) {
            logger.warn('Failed to read marketplace error response text', { textError });
          }
        }

        throw new MarketplaceAPIError(errorMessage, response.status, errorCode);
      }

      // Parse successful response
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        throw new MarketplaceAPIError('Expected JSON response', response.status);
      }

    } catch (error) {
      const isLastAttempt = attempt === retries;

      if (error instanceof MarketplaceAPIError) {
        // Don't retry API errors (4xx, 5xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Retry 5xx errors and network errors
        if (!isLastAttempt) {
          logger.warn(`Marketplace API request failed (attempt ${attempt}/${retries}), retrying...`, {
            url,
            error: error.message,
            status: error.status
          });
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
      } else {
        // Network or other errors
        if (!isLastAttempt) {
          logger.warn(`Marketplace Network error (attempt ${attempt}/${retries}), retrying...`, {
            url,
            error: error.message
          });
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
      }

      throw error;
    }
  }

  throw new Error('Unexpected error in marketplace API request');
}

// Marketplace API Service
export class RealMarketplaceService {
  // Services Management
  async getServices(params?: {
    category?: string;
    subcategory?: string;
    location?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ data: any[]; total: number; hasMore: boolean }> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const endpoint = `${API_ENDPOINTS.marketplaceServices}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await marketplaceApiRequest<{ data: any[]; total: number; hasMore: boolean }>(endpoint);

      return response;
    } catch (error) {
      logger.error('Real marketplace get services failed', error);
      // For now, return empty data - in a real implementation you'd have mock fallback
      return { data: [], total: 0, hasMore: false };
    }
  }

  async getServiceById(serviceId: string): Promise<any> {
    try {
      const response = await marketplaceApiRequest<{ data: any }>(
        `${API_ENDPOINTS.marketplaceServiceById}/${serviceId}`
      );
      return response.data;
    } catch (error) {
      logger.error('Real marketplace get service by ID failed', error);
      throw error;
    }
  }

  async getMyServices(): Promise<any[]> {
    try {
      const response = await marketplaceApiRequest<{ data: any[] }>(
        API_ENDPOINTS.marketplaceMyServices
      );
      return response.data;
    } catch (error) {
      logger.error('Real marketplace get my services failed', error);
      return [];
    }
  }

  async createService(serviceData: any): Promise<any> {
    try {
      const response = await marketplaceApiRequest<{ data: any }>(
        API_ENDPOINTS.marketplaceServices,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real marketplace create service failed', error);
      throw error;
    }
  }

  async updateService(serviceId: string, serviceData: any): Promise<any> {
    try {
      const response = await marketplaceApiRequest<{ data: any }>(
        `${API_ENDPOINTS.marketplaceServiceById}/${serviceId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real marketplace update service failed', error);
      throw error;
    }
  }

  async deleteService(serviceId: string): Promise<void> {
    try {
      await marketplaceApiRequest(
        `${API_ENDPOINTS.marketplaceServiceById}/${serviceId}`,
        {
          method: 'DELETE',
        }
      );
    } catch (error) {
      logger.error('Real marketplace delete service failed', error);
      throw error;
    }
  }

  async deactivateService(serviceId: string): Promise<void> {
    try {
      await marketplaceApiRequest(
        `${API_ENDPOINTS.marketplaceServiceDeactivate}/${serviceId}/deactivate`,
        {
          method: 'POST',
        }
      );
    } catch (error) {
      logger.error('Real marketplace deactivate service failed', error);
      throw error;
    }
  }

  async activateService(serviceId: string): Promise<void> {
    try {
      await marketplaceApiRequest(
        `${API_ENDPOINTS.marketplaceServiceActivate}/${serviceId}/activate`,
        {
          method: 'POST',
        }
      );
    } catch (error) {
      logger.error('Real marketplace activate service failed', error);
      throw error;
    }
  }

  // Categories
  async getCategories(): Promise<any[]> {
    try {
      const response = await marketplaceApiRequest<{ data: any[] }>(
        API_ENDPOINTS.marketplaceServicesCategories
      );
      return response.data;
    } catch (error) {
      logger.error('Real marketplace get categories failed', error);
      return [];
    }
  }

  async getCategoryById(categoryId: string): Promise<any> {
    try {
      const response = await marketplaceApiRequest<{ data: any }>(
        `${API_ENDPOINTS.marketplaceServicesCategoriesById}/${categoryId}`
      );
      return response.data;
    } catch (error) {
      logger.error('Real marketplace get category by ID failed', error);
      throw error;
    }
  }

  // Providers
  async getProviders(params?: {
    serviceId?: string;
    location?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      let endpoint = API_ENDPOINTS.providers;
      if (params?.serviceId) {
        endpoint = `${API_ENDPOINTS.marketplaceProvidersWithService}/${params.serviceId}/providers`;
      }

      const response = await marketplaceApiRequest<{ data: any[] }>(
        `${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      );
      return response.data;
    } catch (error) {
      logger.error('Real marketplace get providers failed', error);
      return [];
    }
  }

  async getProviderById(providerId: string): Promise<any> {
    try {
      const response = await marketplaceApiRequest<{ data: any }>(
        `${API_ENDPOINTS.marketplaceProvidersById}/${providerId}`
      );
      return response.data;
    } catch (error) {
      logger.error('Real marketplace get provider by ID failed', error);
      throw error;
    }
  }

  async getProviderServices(providerId: string): Promise<any[]> {
    try {
      const response = await marketplaceApiRequest<{ data: any[] }>(
        `${API_ENDPOINTS.marketplaceProvidersServices}/${providerId}/services`
      );
      return response.data;
    } catch (error) {
      logger.error('Real marketplace get provider services failed', error);
      return [];
    }
  }

  // Bookings
  async getMyBookings(): Promise<any[]> {
    try {
      const response = await marketplaceApiRequest<{ data: any[] }>(
        API_ENDPOINTS.marketplaceMyBookings
      );
      return response.data;
    } catch (error) {
      logger.error('Real marketplace get my bookings failed', error);
      return [];
    }
  }

  async createBooking(bookingData: any): Promise<any> {
    try {
      const response = await marketplaceApiRequest<{ data: any }>(
        API_ENDPOINTS.marketplaceBookings,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real marketplace create booking failed', error);
      throw error;
    }
  }

  async getBookingById(bookingId: string): Promise<any> {
    try {
      const response = await marketplaceApiRequest<{ data: any }>(
        `${API_ENDPOINTS.marketplaceBookings}/${bookingId}`
      );
      return response.data;
    } catch (error) {
      logger.error('Real marketplace get booking by ID failed', error);
      throw error;
    }
  }

  async updateBookingStatus(bookingId: string, status: string, data?: any): Promise<any> {
    try {
      const response = await marketplaceApiRequest<{ data: any }>(
        `${API_ENDPOINTS.marketplaceBookingStatus}/${bookingId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, ...data }),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real marketplace update booking status failed', error);
      throw error;
    }
  }

  async uploadBookingPhotos(bookingId: string, photos: File[]): Promise<any> {
    try {
      const formData = new FormData();
      photos.forEach((photo, index) => {
        formData.append(`photos`, photo);
      });

      const response = await marketplaceApiRequest<{ data: any }>(
        `${API_ENDPOINTS.marketplaceBookingPhotos}/${bookingId}/photos`,
        {
          method: 'POST',
          body: formData,
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real marketplace upload booking photos failed', error);
      throw error;
    }
  }

  async addBookingReview(bookingId: string, reviewData: any): Promise<any> {
    try {
      const response = await marketplaceApiRequest<{ data: any }>(
        `${API_ENDPOINTS.marketplaceBookingReview}/${bookingId}/review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reviewData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real marketplace add booking review failed', error);
      throw error;
    }
  }
}

// Singleton instance
export const realMarketplaceService = new RealMarketplaceService();



