/**
 * Real Supplies API Service
 * Implements actual API calls to backend supplies services
 * Falls back to mock data when backend is unavailable or in development mode
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL, API_ENDPOINTS } from './api';
import { createAuthFetchOptions } from './auth-utils';
import { logger } from './logger';
import { DEV_CONFIG } from './env';

// API Error class
export class SuppliesAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'SuppliesAPIError';
  }
}

// Generic API request wrapper with error handling
async function suppliesApiRequest<T>(
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
        let errorMessage = `Supplies API request failed: ${response.status} ${response.statusText}`;
        let errorCode: string | undefined;

        // Try to parse error response
        if (contentType?.includes('application/json')) {
          try {
            const errorData = await response.json();
            if (errorData.message) errorMessage = errorData.message;
            if (errorData.error) errorMessage = errorData.error;
            if (errorData.code) errorCode = errorData.code;
          } catch (parseError) {
            logger.warn('Failed to parse supplies error response', { parseError });
          }
        } else {
          try {
            const text = await response.text();
            if (text) errorMessage = text.substring(0, 200);
          } catch (textError) {
            logger.warn('Failed to read supplies error response text', { textError });
          }
        }

        throw new SuppliesAPIError(errorMessage, response.status, errorCode);
      }

      // Parse successful response
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        throw new SuppliesAPIError('Expected JSON response', response.status);
      }

    } catch (error) {
      const isLastAttempt = attempt === retries;

      if (error instanceof SuppliesAPIError) {
        // Don't retry API errors (4xx, 5xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Retry 5xx errors and network errors
        if (!isLastAttempt) {
          logger.warn(`Supplies API request failed (attempt ${attempt}/${retries}), retrying...`, {
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
          logger.warn(`Supplies Network error (attempt ${attempt}/${retries}), retrying...`, {
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

  throw new Error('Unexpected error in supplies API request');
}

// Supplies API Service
export class RealSuppliesService {
  // Supplies Management
  async getSupplies(params?: {
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

      const endpoint = `${API_ENDPOINTS.supplies}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await suppliesApiRequest<{ data: any[]; total: number; hasMore: boolean }>(endpoint);

      return response;
    } catch (error) {
      logger.error('Real supplies get supplies failed', error);
      return { data: [], total: 0, hasMore: false };
    }
  }

  async getSupplyById(supplyId: string): Promise<any> {
    try {
      const response = await suppliesApiRequest<{ data: any }>(
        `${API_ENDPOINTS.suppliesById}/${supplyId}`
      );
      return response.data;
    } catch (error) {
      logger.error('Real supplies get supply by ID failed', error);
      throw error;
    }
  }

  async getMySupplies(): Promise<any[]> {
    try {
      const response = await suppliesApiRequest<{ data: any[] }>(
        API_ENDPOINTS.suppliesMySupplies
      );
      return response.data;
    } catch (error) {
      logger.error('Real supplies get my supplies failed', error);
      return [];
    }
  }

  async createSupply(supplyData: any): Promise<any> {
    try {
      const response = await suppliesApiRequest<{ data: any }>(
        API_ENDPOINTS.suppliesCreate,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(supplyData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real supplies create supply failed', error);
      throw error;
    }
  }

  async updateSupply(supplyId: string, supplyData: any): Promise<any> {
    try {
      const response = await suppliesApiRequest<{ data: any }>(
        `${API_ENDPOINTS.suppliesUpdate}/${supplyId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(supplyData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real supplies update supply failed', error);
      throw error;
    }
  }

  async deleteSupply(supplyId: string): Promise<void> {
    try {
      await suppliesApiRequest(
        `${API_ENDPOINTS.suppliesDelete}/${supplyId}`,
        {
          method: 'DELETE',
        }
      );
    } catch (error) {
      logger.error('Real supplies delete supply failed', error);
      throw error;
    }
  }

  // Categories and Types
  async getCategories(): Promise<any[]> {
    try {
      const response = await suppliesApiRequest<{ data: any[] }>(
        API_ENDPOINTS.suppliesCategories
      );
      return response.data;
    } catch (error) {
      logger.error('Real supplies get categories failed', error);
      return [];
    }
  }

  async getTypes(): Promise<any[]> {
    try {
      const response = await suppliesApiRequest<{ data: any[] }>(
        API_ENDPOINTS.suppliesTypes
      );
      return response.data;
    } catch (error) {
      logger.error('Real supplies get types failed', error);
      return [];
    }
  }

  async getStatuses(): Promise<any[]> {
    try {
      const response = await suppliesApiRequest<{ data: any[] }>(
        API_ENDPOINTS.suppliesStatuses
      );
      return response.data;
    } catch (error) {
      logger.error('Real supplies get statuses failed', error);
      return [];
    }
  }

  // Featured and Nearby
  async getFeatured(): Promise<any[]> {
    try {
      const response = await suppliesApiRequest<{ data: any[] }>(
        API_ENDPOINTS.suppliesFeatured
      );
      return response.data;
    } catch (error) {
      logger.error('Real supplies get featured failed', error);
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

      const response = await suppliesApiRequest<{ data: any[] }>(
        `${API_ENDPOINTS.suppliesNearby}?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      logger.error('Real supplies get nearby failed', error);
      return [];
    }
  }

  // Orders
  async getMyOrders(): Promise<any[]> {
    try {
      const response = await suppliesApiRequest<{ data: any[] }>(
        API_ENDPOINTS.suppliesMyOrders
      );
      return response.data;
    } catch (error) {
      logger.error('Real supplies get my orders failed', error);
      return [];
    }
  }

  async createOrder(orderData: any): Promise<any> {
    try {
      const response = await suppliesApiRequest<{ data: any }>(
        API_ENDPOINTS.suppliesOrder,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real supplies create order failed', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<any> {
    try {
      const response = await suppliesApiRequest<{ data: any }>(
        `${API_ENDPOINTS.suppliesOrderStatus}/${orderId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real supplies update order status failed', error);
      throw error;
    }
  }

  // Images
  async uploadImages(supplyId: string, images: File[]): Promise<any> {
    try {
      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append(`images`, image);
      });

      const response = await suppliesApiRequest<{ data: any }>(
        `${API_ENDPOINTS.suppliesImages}/${supplyId}/images`,
        {
          method: 'POST',
          body: formData,
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real supplies upload images failed', error);
      throw error;
    }
  }

  async deleteImage(supplyId: string, imageId: string): Promise<void> {
    try {
      await suppliesApiRequest(
        `${API_ENDPOINTS.suppliesImageDelete}/${supplyId}/images/${imageId}`,
        {
          method: 'DELETE',
        }
      );
    } catch (error) {
      logger.error('Real supplies delete image failed', error);
      throw error;
    }
  }

  // Reviews
  async getReviews(supplyId: string): Promise<any[]> {
    try {
      const response = await suppliesApiRequest<{ data: any[] }>(
        `${API_ENDPOINTS.suppliesReviews}/${supplyId}/reviews`
      );
      return response.data;
    } catch (error) {
      logger.error('Real supplies get reviews failed', error);
      return [];
    }
  }

  async addReview(supplyId: string, reviewData: any): Promise<any> {
    try {
      const response = await suppliesApiRequest<{ data: any }>(
        `${API_ENDPOINTS.suppliesReviews}/${supplyId}/reviews`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reviewData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real supplies add review failed', error);
      throw error;
    }
  }

  // Statistics
  async getStatistics(): Promise<any> {
    try {
      const response = await suppliesApiRequest<{ data: any }>(
        API_ENDPOINTS.suppliesStatistics
      );
      return response.data;
    } catch (error) {
      logger.error('Real supplies get statistics failed', error);
      return {};
    }
  }

  // Products (Alternative endpoint)
  async getProducts(params?: {
    category?: string;
    type?: string;
    limit?: number;
    offset?: number;
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

      const endpoint = `${API_ENDPOINTS.suppliesProducts}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await suppliesApiRequest<{ data: any[]; total: number; hasMore: boolean }>(endpoint);

      return response;
    } catch (error) {
      logger.error('Real supplies get products failed', error);
      return { data: [], total: 0, hasMore: false };
    }
  }

  async getProductById(productId: string): Promise<any> {
    try {
      const response = await suppliesApiRequest<{ data: any }>(
        `${API_ENDPOINTS.suppliesProductsById}/${productId}`
      );
      return response.data;
    } catch (error) {
      logger.error('Real supplies get product by ID failed', error);
      throw error;
    }
  }
}

// Singleton instance
export const realSuppliesService = new RealSuppliesService();



