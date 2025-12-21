/**
 * Real Ads API Service
 * Implements actual API calls to backend advertising services
 * Falls back to mock data when backend is unavailable or in development mode
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL, API_ENDPOINTS } from './api';
import { createAuthFetchOptions } from './auth-utils';
import { logger } from './logger';
import { DEV_CONFIG } from './env';

// API Error class
export class AdsAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AdsAPIError';
  }
}

// Generic API request wrapper with error handling
async function adsApiRequest<T>(
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
        let errorMessage = `Ads API request failed: ${response.status} ${response.statusText}`;
        let errorCode: string | undefined;

        // Try to parse error response
        if (contentType?.includes('application/json')) {
          try {
            const errorData = await response.json();
            if (errorData.message) errorMessage = errorData.message;
            if (errorData.error) errorMessage = errorData.error;
            if (errorData.code) errorCode = errorData.code;
          } catch (parseError) {
            logger.warn('Failed to parse ads error response', { parseError });
          }
        } else {
          try {
            const text = await response.text();
            if (text) errorMessage = text.substring(0, 200);
          } catch (textError) {
            logger.warn('Failed to read ads error response text', { textError });
          }
        }

        throw new AdsAPIError(errorMessage, response.status, errorCode);
      }

      // Parse successful response
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        throw new AdsAPIError('Expected JSON response', response.status);
      }

    } catch (error) {
      const isLastAttempt = attempt === retries;

      if (error instanceof AdsAPIError) {
        // Don't retry API errors (4xx, 5xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Retry 5xx errors and network errors
        if (!isLastAttempt) {
          logger.warn(`Ads API request failed (attempt ${attempt}/${retries}), retrying...`, {
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
          logger.warn(`Ads Network error (attempt ${attempt}/${retries}), retrying...`, {
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

  throw new Error('Unexpected error in ads API request');
}

// Ads API Service
export class RealAdsService {
  // Ads Management
  async getAds(params?: {
    category?: string;
    status?: string;
    location?: string;
    lat?: number;
    lng?: number;
    radius?: number;
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

      const endpoint = `${API_ENDPOINTS.ads}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await adsApiRequest<{ data: any[]; total: number; hasMore: boolean }>(endpoint);

      return response;
    } catch (error) {
      logger.error('Real ads get ads failed', error);
      return { data: [], total: 0, hasMore: false };
    }
  }

  async getAdById(adId: string): Promise<any> {
    try {
      const response = await adsApiRequest<{ data: any }>(
        `${API_ENDPOINTS.adsById}/${adId}`
      );
      return response.data;
    } catch (error) {
      logger.error('Real ads get ad by ID failed', error);
      throw error;
    }
  }

  async getMyAds(): Promise<any[]> {
    try {
      const response = await adsApiRequest<{ data: any[] }>(
        API_ENDPOINTS.adsMyAds
      );
      return response.data;
    } catch (error) {
      logger.error('Real ads get my ads failed', error);
      return [];
    }
  }

  async createAd(adData: any): Promise<any> {
    try {
      const response = await adsApiRequest<{ data: any }>(
        API_ENDPOINTS.adsCreate,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(adData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real ads create ad failed', error);
      throw error;
    }
  }

  async updateAd(adId: string, adData: any): Promise<any> {
    try {
      const response = await adsApiRequest<{ data: any }>(
        `${API_ENDPOINTS.adsUpdate}/${adId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(adData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real ads update ad failed', error);
      throw error;
    }
  }

  async deleteAd(adId: string): Promise<void> {
    try {
      await adsApiRequest(
        `${API_ENDPOINTS.adsDelete}/${adId}`,
        {
          method: 'DELETE',
        }
      );
    } catch (error) {
      logger.error('Real ads delete ad failed', error);
      throw error;
    }
  }

  // Categories
  async getCategories(): Promise<any[]> {
    try {
      const response = await adsApiRequest<{ data: any[] }>(
        API_ENDPOINTS.adsCategories
      );
      return response.data;
    } catch (error) {
      logger.error('Real ads get categories failed', error);
      return [];
    }
  }

  // Featured Ads
  async getFeatured(): Promise<any[]> {
    try {
      const response = await adsApiRequest<{ data: any[] }>(
        API_ENDPOINTS.adsFeatured
      );
      return response.data;
    } catch (error) {
      logger.error('Real ads get featured failed', error);
      return [];
    }
  }

  // Ad Clicks and Tracking
  async recordClick(adId: string, clickData?: any): Promise<void> {
    try {
      await adsApiRequest(
        `${API_ENDPOINTS.adsClick}/${adId}/click`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clickData || {}),
        }
      );
    } catch (error) {
      logger.error('Real ads record click failed', error);
      // Don't throw error for tracking failures
    }
  }

  // Promotion
  async promoteAd(adId: string, promotionData: any): Promise<any> {
    try {
      const response = await adsApiRequest<{ data: any }>(
        `${API_ENDPOINTS.adsPromote}/${adId}/promote`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promotionData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real ads promote ad failed', error);
      throw error;
    }
  }

  // Analytics
  async getAnalytics(adId?: string, params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: string;
  }): Promise<any> {
    try {
      let endpoint = API_ENDPOINTS.adsAnalytics;
      if (adId) {
        endpoint = `${API_ENDPOINTS.adsAnalytics}/${adId}`;
      }

      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }

      const fullEndpoint = `${endpoint}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await adsApiRequest<{ data: any }>(fullEndpoint);

      return response.data;
    } catch (error) {
      logger.error('Real ads get analytics failed', error);
      return {};
    }
  }

  // Images
  async uploadImages(adId: string, images: File[]): Promise<any> {
    try {
      const formData = new FormData();
      images.forEach((image, index) => {
        formData.append(`images`, image);
      });

      const response = await adsApiRequest<{ data: any }>(
        `${API_ENDPOINTS.adsImages}/${adId}/images`,
        {
          method: 'POST',
          body: formData,
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real ads upload images failed', error);
      throw error;
    }
  }

  async deleteImage(adId: string, imageId: string): Promise<void> {
    try {
      await adsApiRequest(
        `${API_ENDPOINTS.adsImageDelete}/${adId}/images/${imageId}`,
        {
          method: 'DELETE',
        }
      );
    } catch (error) {
      logger.error('Real ads delete image failed', error);
      throw error;
    }
  }

  // Statistics
  async getStatistics(): Promise<any> {
    try {
      const response = await adsApiRequest<{ data: any }>(
        API_ENDPOINTS.adsStatistics
      );
      return response.data;
    } catch (error) {
      logger.error('Real ads get statistics failed', error);
      return {};
    }
  }

  // Pending Ads (Admin)
  async getPendingAds(): Promise<any[]> {
    try {
      const response = await adsApiRequest<{ data: any[] }>(
        API_ENDPOINTS.adsPending
      );
      return response.data;
    } catch (error) {
      logger.error('Real ads get pending ads failed', error);
      return [];
    }
  }

  async approveAd(adId: string, approvalData?: any): Promise<any> {
    try {
      const response = await adsApiRequest<{ data: any }>(
        `${API_ENDPOINTS.adsApprove}/${adId}/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(approvalData || {}),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real ads approve ad failed', error);
      throw error;
    }
  }

  async rejectAd(adId: string, rejectionData: any): Promise<any> {
    try {
      const response = await adsApiRequest<{ data: any }>(
        `${API_ENDPOINTS.adsReject}/${adId}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rejectionData),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real ads reject ad failed', error);
      throw error;
    }
  }

  // Enum Values (for forms)
  async getEnumValues(): Promise<any> {
    try {
      const response = await adsApiRequest<{ data: any }>(
        API_ENDPOINTS.adsEnumValues
      );
      return response.data;
    } catch (error) {
      logger.error('Real ads get enum values failed', error);
      return {};
    }
  }
}

// Singleton instance
export const realAdsService = new RealAdsService();



