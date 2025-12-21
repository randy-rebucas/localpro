/**
 * Real AI API Service
 * Implements actual API calls to backend AI services
 * Falls back to mock data when backend is unavailable or in development mode
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_BASE_URL, API_ENDPOINTS } from './api';
import { createAuthFetchOptions } from './auth-utils';
import { logger } from './logger';
import { DEV_CONFIG } from './env';

// Import mock functions for fallback
import {
  mockNaturalLanguageSearchResult,
  mockServiceRecommendations,
  mockPriceEstimate,
  mockServiceMatch,
  mockReviewSentiment,
  mockBookingSuggestions,
  mockGeneratedDescription,
  mockDescriptionFromTitleResponse,
  mockRentalDescriptionResponse,
  mockGeneratedBio,
  mockPricingRecommendation,
  mockDemandForecast,
  mockReviewInsights,
  mockGeneratedResponse,
  mockListingOptimization,
  mockSchedulingRecommendation,
  mockPrefilledFormData,
} from './ai-mock-service';

// Import types
import type {
  NaturalLanguageSearchParams,
  NaturalLanguageSearchResult,
  ServiceRecommendationParams,
  ServiceRecommendation,
  PriceEstimateParams,
  PriceEstimate,
  ServiceMatchParams,
  ServiceMatch,
  ReviewSentimentParams,
  ReviewSentiment,
  BookingAssistantParams,
  BookingSuggestion,
  DescriptionGeneratorParams,
  GeneratedDescription,
  DescriptionFromTitleParams,
  DescriptionFromTitleResponse,
  RentalDescriptionParams,
  RentalDescriptionResponse,
  BioGeneratorParams,
  GeneratedBio,
  PricingOptimizerParams,
  PricingRecommendation,
  DemandForecastParams,
  DemandForecast,
  ReviewInsightsParams,
  ReviewInsights,
  ResponseAssistantParams,
  GeneratedResponse,
  ListingOptimizerParams,
  ListingOptimization,
  SchedulingAssistantParams,
  SchedulingRecommendation,
  FormPrefillerParams,
  PrefilledFormData,
} from './ai-utils';

// API Error class
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Generic API request wrapper with error handling and retry logic
async function apiRequest<T>(
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
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        let errorCode: string | undefined;

        // Try to parse error response
        if (contentType?.includes('application/json')) {
          try {
            const errorData = await response.json();
            if (errorData.message) errorMessage = errorData.message;
            if (errorData.error) errorMessage = errorData.error;
            if (errorData.code) errorCode = errorData.code;
          } catch (parseError) {
            logger.warn('Failed to parse error response', { parseError });
          }
        } else {
          try {
            const text = await response.text();
            if (text) errorMessage = text.substring(0, 200);
          } catch (textError) {
            logger.warn('Failed to read error response text', { textError });
          }
        }

        throw new APIError(errorMessage, response.status, errorCode);
      }

      // Parse successful response
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        throw new APIError('Expected JSON response', response.status);
      }

    } catch (error) {
      const isLastAttempt = attempt === retries;

      if (error instanceof APIError) {
        // Don't retry API errors (4xx, 5xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Retry 5xx errors and network errors
        if (!isLastAttempt) {
          logger.warn(`API request failed (attempt ${attempt}/${retries}), retrying...`, {
            url,
            error: error.message,
            status: error.status
          });
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          continue;
        }
      } else {
        // Network or other errors
        if (!isLastAttempt) {
          logger.warn(`Network error (attempt ${attempt}/${retries}), retrying...`, {
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

  throw new Error('Unexpected error in API request');
}

// Real API implementations
export class RealAIService {
  async naturalLanguageSearch(params: NaturalLanguageSearchParams): Promise<NaturalLanguageSearchResult> {
    try {
      return await apiRequest<NaturalLanguageSearchResult>(
        API_ENDPOINTS.aiNaturalLanguageSearch,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );
    } catch (error) {
      logger.error('Real AI natural language search failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock AI service');
        return Promise.resolve(mockNaturalLanguageSearchResult(params));
      }
      throw error;
    }
  }

  async getServiceRecommendations(params: ServiceRecommendationParams): Promise<ServiceRecommendation[]> {
    try {
      const response = await apiRequest<{ data: ServiceRecommendation[] }>(
        API_ENDPOINTS.aiServiceRecommendations,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real AI service recommendations failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock AI service');
        return Promise.resolve(mockServiceRecommendations(params));
      }
      throw error;
    }
  }

  async estimatePrice(params: PriceEstimateParams): Promise<PriceEstimate> {
    try {
      const response = await apiRequest<{ data: PriceEstimate }>(
        API_ENDPOINTS.aiPriceEstimator,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real AI price estimation failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock AI service');
        return Promise.resolve(mockPriceEstimate(params));
      }
      throw error;
    }
  }

  async matchService(params: ServiceMatchParams): Promise<ServiceMatch> {
    try {
      const response = await apiRequest<{ data: ServiceMatch }>(
        API_ENDPOINTS.aiServiceMatcher,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real AI service matching failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock AI service');
        return Promise.resolve(mockServiceMatch(params));
      }
      throw error;
    }
  }

  async analyzeReviewSentiment(params: ReviewSentimentParams): Promise<ReviewSentiment> {
    try {
      const response = await apiRequest<{ data: ReviewSentiment }>(
        API_ENDPOINTS.aiReviewSentiment,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real AI review sentiment analysis failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock AI service');
        return Promise.resolve(mockReviewSentiment(params));
      }
      throw error;
    }
  }

  async getBookingSuggestions(params: BookingAssistantParams): Promise<BookingSuggestion[]> {
    try {
      const response = await apiRequest<{ data: BookingSuggestion[] }>(
        API_ENDPOINTS.aiBookingAssistant,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real AI booking suggestions failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock AI service');
        return Promise.resolve(mockBookingSuggestions(params));
      }
      throw error;
    }
  }

  async generateServiceDescription(params: DescriptionGeneratorParams): Promise<GeneratedDescription> {
    try {
      const response = await apiRequest<{ data: GeneratedDescription }>(
        API_ENDPOINTS.aiDescriptionGenerator,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real AI description generation failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock AI service');
        return Promise.resolve(mockGeneratedDescription(params));
      }
      throw error;
    }
  }

  async generateDescriptionFromTitle(params: DescriptionFromTitleParams): Promise<DescriptionFromTitleResponse> {
    try {
      const response = await apiRequest<{ data: DescriptionFromTitleResponse }>(
        API_ENDPOINTS.aiDescriptionFromTitle,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real AI title-based description generation failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock AI service');
        return Promise.resolve(mockDescriptionFromTitleResponse(params));
      }
      throw error;
    }
  }

  async generateRentalDescription(params: RentalDescriptionParams): Promise<RentalDescriptionResponse> {
    try {
      const response = await apiRequest<{ data: RentalDescriptionResponse }>(
        API_ENDPOINTS.aiRentalDescription,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real AI rental description generation failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock AI service');
        return Promise.resolve(mockRentalDescriptionResponse(params));
      }
      throw error;
    }
  }

  async generateBio(params: BioGeneratorParams): Promise<GeneratedBio> {
    try {
      const response = await apiRequest<{ data: GeneratedBio }>(
        API_ENDPOINTS.aiBioGenerator,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real AI bio generation failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock AI service');
        return Promise.resolve(mockGeneratedBio(params));
      }
      throw error;
    }
  }

  async optimizePricing(params: PricingOptimizerParams): Promise<PricingRecommendation> {
    try {
      const response = await apiRequest<{ data: PricingRecommendation }>(
        API_ENDPOINTS.aiPricingOptimizer,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real AI pricing optimization failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock AI service');
        return Promise.resolve(mockPricingRecommendation(params));
      }
      throw error;
    }
  }

  async getDemandForecast(params: DemandForecastParams): Promise<DemandForecast> {
    try {
      const response = await apiRequest<{ data: DemandForecast }>(
        API_ENDPOINTS.aiDemandForecast,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real AI demand forecast failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock AI service');
        return Promise.resolve(mockDemandForecast(params));
      }
      throw error;
    }
  }

  async getReviewInsights(params: ReviewInsightsParams): Promise<ReviewInsights> {
    try {
      const response = await apiRequest<{ data: ReviewInsights }>(
        API_ENDPOINTS.aiReviewInsights,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real AI review insights failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock AI service');
        return Promise.resolve(mockReviewInsights(params));
      }
      throw error;
    }
  }

  async generateResponse(params: ResponseAssistantParams): Promise<GeneratedResponse> {
    try {
      const response = await apiRequest<{ data: GeneratedResponse }>(
        API_ENDPOINTS.aiResponseAssistant,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real AI response generation failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock AI service');
        return Promise.resolve(mockGeneratedResponse(params));
      }
      throw error;
    }
  }

  async optimizeListing(params: ListingOptimizerParams): Promise<ListingOptimization> {
    try {
      const response = await apiRequest<{ data: ListingOptimization }>(
        API_ENDPOINTS.aiListingOptimizer,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real AI listing optimization failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock AI service');
        return Promise.resolve(mockListingOptimization(params));
      }
      throw error;
    }
  }

  async getSchedulingRecommendations(params: SchedulingAssistantParams): Promise<SchedulingRecommendation> {
    try {
      const response = await apiRequest<{ data: SchedulingRecommendation }>(
        API_ENDPOINTS.aiSchedulingAssistant,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real AI scheduling recommendations failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock AI service');
        return Promise.resolve(mockSchedulingRecommendation(params));
      }
      throw error;
    }
  }

  async prefillServiceForm(params: FormPrefillerParams): Promise<PrefilledFormData> {
    try {
      const response = await apiRequest<{ data: PrefilledFormData }>(
        API_ENDPOINTS.aiFormPrefiller,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Real AI form prefilling failed', error);
      if (DEV_CONFIG.enableMockData) {
        logger.debug('Falling back to mock AI service');
        return Promise.resolve(mockPrefilledFormData(params));
      }
      throw error;
    }
  }
}

// Singleton instance
export const realAIService = new RealAIService();



