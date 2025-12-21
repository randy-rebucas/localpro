/**
 * Real Rentals API Service
 * Implements actual API calls to backend rentals services
 * Falls back to mock data when backend is unavailable or in development mode
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL, API_ENDPOINTS } from './api';
import { createAuthFetchOptions } from './auth-utils';
import { logger } from './logger';
import { DEV_CONFIG } from './env';

// API Error class
export class RentalsAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'RentalsAPIError';
  }
}

// Generic API request wrapper with error handling
async function rentalsApiRequest<T>(
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
        let errorMessage = `Rentals API request failed: ${response.status} ${response.statusText}`;
        let errorCode: string | undefined;

        // Try to parse error response
        if (contentType?.includes('application/json')) {
          try {
            const errorData = await response.json();
            if (errorData.message) errorMessage = errorData.message;
            if (errorData.error) errorMessage = errorData.error;
            if (errorData.code) errorCode = errorData.code;
          } catch (parseError) {
            logger.warn('Failed to parse rentals error response', { parseError });
          }
        } else {
          try {
            const text = await response.text();
            if (text) errorMessage = text.substring(0, 200);
          } catch (textError) {
            logger.warn('Failed to read rentals error response text', { textError });
          }
        }

        throw new RentalsAPIError(errorMessage, response.status, errorCode);
      }

      // Parse successful response
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        throw new RentalsAPIError('Expected JSON response', response.status);
      }

    } catch (error) {
      const isLastAttempt = attempt === retries;

      if (error instanceof RentalsAPIError) {
        // Don't retry API errors (4xx, 5xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Retry 5xx errors and network errors
        if (!isLastAttempt) {
          logger.warn(`Rentals API request failed (attempt ${attempt}/${retries}), retrying...`, {
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
          logger.warn(`Rentals Network error (attempt ${attempt}/${retries}), retrying...`, {
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

  throw new Error('Unexpected error in rentals API request');
}

// Rentals API Service
export class RealRentalsService {
  // Rentals Management
  async getRentals(params?: {
    category?: string;
    type?: string;
    location?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
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

      const endpoint = `${API_ENDPOINTS.rentals}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await rentalsApiRequest<{ data: any[]; total: number; hasMore: boolean }>(endpoint);

      return response;
    } catch (error) {
      logger.error('Real rentals get rentals failed', error);
      return { data: [], total: 0, hasMore: false };
    }
  }

  async getRentalById(rentalId: string): Promise<any> {
    try {
      const response = await rentalsApiRequest<{ data: any }>(
        `${API_ENDPOINTS.rentalsById}/${rentalId}`
      );
      return response.data;
    } catch (error) {
      logger.error('Real rentals get rental by ID failed', error);
      throw error;
    }
  }

  async getMyRentals(): Promise<any[]> {
    try {
      const response = await rentalsApiRequest<{ data: any[] }>(
        API_ENDPOINTS.rentalsMyRentals
      );
      return response.data;
    } catch (error) {
      logger.error('Real rentals get my rentals failed', error);
      return [];
    }
  }

  async createRental(rentalData: any): Promise<any> {
    try {
      const response = await rentalsApiRequest<{ data: any }>(
        API_ENDPOINTS.rentalsCreate,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rentalData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real rentals create rental failed', error);
      throw error;
    }
  }

  async updateRental(rentalId: string, rentalData: any): Promise<any> {
    try {
      const response = await rentalsApiRequest<{ data: any }>(
        `${API_ENDPOINTS.rentalsUpdate}/${rentalId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rentalData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real rentals update rental failed', error);
      throw error;
    }
  }

  async deleteRental(rentalId: string): Promise<void> {
    try {
      await rentalsApiRequest(
        `${API_ENDPOINTS.rentalsDelete}/${rentalId}`,
        {
          method: 'DELETE',
        }
      );
    } catch (error) {
      logger.error('Real rentals delete rental failed', error);
      throw error;
    }
  }

  // Categories and Types
  async getCategories(): Promise<any[]> {
    try {
      const response = await rentalsApiRequest<{ data: any[] }>(
        API_ENDPOINTS.rentalsCategories
      );
      return response.data;
    } catch (error) {
      logger.error('Real rentals get categories failed', error);
      return [];
    }
  }

  async getTypes(): Promise<any[]> {
    try {
      const response = await rentalsApiRequest<{ data: any[] }>(
        API_ENDPOINTS.rentalsItems
      );
      return response.data;
    } catch (error) {
      logger.error('Real rentals get types failed', error);
      return [];
    }
  }

  // Featured and Nearby
  async getFeatured(): Promise<any[]> {
    try {
      const response = await rentalsApiRequest<{ data: any[] }>(
        API_ENDPOINTS.rentalsFeatured
      );
      return response.data;
    } catch (error) {
      logger.error('Real rentals get featured failed', error);
      return [];
    }
  }

  async getNearby(params: {
    lat: number;
    lng: number;
    radius?: number;
    limit?: number;
  }): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await rentalsApiRequest<{ data: any[] }>(
        `${API_ENDPOINTS.rentalsNearby}?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      logger.error('Real rentals get nearby failed', error);
      return [];
    }
  }

  // Bookings
  async getMyBookings(): Promise<any[]> {
    try {
      const response = await rentalsApiRequest<{ data: any[] }>(
        API_ENDPOINTS.rentalsMyBookings
      );
      return response.data;
    } catch (error) {
      logger.error('Real rentals get my bookings failed', error);
      return [];
    }
  }

  async createBooking(bookingData: any): Promise<any> {
    try {
      const response = await rentalsApiRequest<{ data: any }>(
        API_ENDPOINTS.rentalsBook,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real rentals create booking failed', error);
      throw error;
    }
  }

  async updateBookingStatus(bookingId: string, status: string): Promise<any> {
    try {
      const response = await rentalsApiRequest<{ data: any }>(
        `${API_ENDPOINTS.rentalsBookingStatus}/${bookingId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real rentals update booking status failed', error);
      throw error;
    }
  }

  // Images
  async uploadImages(rentalId: string, images: File[]): Promise<any> {
    try {
      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append(`images`, image);
      });

      const response = await rentalsApiRequest<{ data: any }>(
        `${API_ENDPOINTS.rentalsImages}/${rentalId}/images`,
        {
          method: 'POST',
          body: formData,
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real rentals upload images failed', error);
      throw error;
    }
  }

  async deleteImage(rentalId: string, imageId: string): Promise<void> {
    try {
      await rentalsApiRequest(
        `${API_ENDPOINTS.rentalsImageDelete}/${rentalId}/images/${imageId}`,
        {
          method: 'DELETE',
        }
      );
    } catch (error) {
      logger.error('Real rentals delete image failed', error);
      throw error;
    }
  }

  // Reviews
  async getReviews(rentalId: string): Promise<any[]> {
    try {
      const response = await rentalsApiRequest<{ data: any[] }>(
        `${API_ENDPOINTS.rentalsReviews}/${rentalId}/reviews`
      );
      return response.data;
    } catch (error) {
      logger.error('Real rentals get reviews failed', error);
      return [];
    }
  }

  async addReview(rentalId: string, reviewData: any): Promise<any> {
    try {
      const response = await rentalsApiRequest<{ data: any }>(
        `${API_ENDPOINTS.rentalsReviews}/${rentalId}/reviews`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reviewData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real rentals add review failed', error);
      throw error;
    }
  }

  // Statistics
  async getStatistics(): Promise<any> {
    try {
      const response = await rentalsApiRequest<{ data: any }>(
        API_ENDPOINTS.rentalsStatistics
      );
      return response.data;
    } catch (error) {
      logger.error('Real rentals get statistics failed', error);
      return {};
    }
  }

  // Generate Description (AI Feature)
  async generateDescription(descriptionData: any): Promise<any> {
    try {
      const response = await rentalsApiRequest<{ data: any }>(
        API_ENDPOINTS.rentalsGenerateDescription,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(descriptionData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real rentals generate description failed', error);
      throw error;
    }
  }
}

// Singleton instance
export const realRentalsService = new RealRentalsService();



