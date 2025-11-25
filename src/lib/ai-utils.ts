import { API_BASE_URL, API_ENDPOINTS } from "./api";
import { createAuthFetchOptions } from "./auth-utils";
import { logger } from "./logger";

/**
 * AI Utilities for Marketplace Features
 * Provides helper functions for all AI-powered marketplace features
 */

// Natural Language Search
export interface NaturalLanguageSearchParams {
  query: string;
  location?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

interface Service {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  pricing?: {
    basePrice?: number;
    currency?: string;
  };
  provider?: {
    firstName?: string;
    name?: string;
  };
  rating?: {
    average?: number;
    count?: number;
  };
  location?: string;
  [key: string]: unknown;
}

export interface NaturalLanguageSearchResult {
  success?: boolean;
  message?: string;
  data?: {
    services?: Service[];
    aiAnalysis?: {
      estimatedPrice?: number;
      priceRange?: {
        min: number;
        max: number;
      };
      currency?: string;
      confidence?: number;
      factors?: string[];
    };
    query?: string;
    count?: number;
  };
  // Legacy format support
  filters?: {
    category?: string;
    subcategory?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    location?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    date?: string;
    time?: string;
  };
  interpretedQuery?: string;
  confidence?: number;
  services?: Service[];
}

export async function naturalLanguageSearch(
  params: NaturalLanguageSearchParams
): Promise<NaturalLanguageSearchResult> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.aiNaturalLanguageSearch}`,
      createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(params),
      })
    );

    if (!response.ok) {
      // Handle 404 gracefully (endpoint not implemented)
      if (response.status === 404) {
        logger.debug("AI natural language search endpoint not available", { status: 404 });
        throw new Error("AI search feature is not available yet. Please use the standard filters.");
      }
      throw new Error(`AI search failed: ${response.status}`);
    }

    const responseData = await response.json();
    
    // Transform the response to match expected format
    // Handle both new format (with data.aiAnalysis) and legacy format
    if (responseData.data) {
      // New format: extract filters from aiAnalysis and services
      const aiAnalysis = responseData.data.aiAnalysis;
      const services = responseData.data.services || [];
      
      // Extract filters from aiAnalysis or infer from services
      const filters: NaturalLanguageSearchResult['filters'] = {};
      
      if (aiAnalysis?.priceRange) {
        filters.minPrice = aiAnalysis.priceRange.min;
        filters.maxPrice = aiAnalysis.priceRange.max;
      }
      
      // Extract category from services if available
      if (services.length > 0 && services[0].category) {
        filters.category = services[0].category;
        if (services[0].subcategory) {
          filters.subcategory = services[0].subcategory;
        }
      }
      
      return {
        ...responseData,
        filters,
        interpretedQuery: responseData.data.query || responseData.interpretedQuery || params.query,
        confidence: aiAnalysis?.confidence || responseData.confidence || 0,
        services,
        aiAnalysis,
        count: responseData.data.count,
      };
    }
    
    // Legacy format - return as is
    return responseData;
  } catch (error) {
    // Only log non-404 errors
    if (error instanceof Error && !error.message.includes("404") && !error.message.includes("not available")) {
      logger.error("Natural language search error", error);
    }
    throw error;
  }
}

// Service Recommendations
export interface ServiceRecommendationParams {
  userId?: string;
  location?: string;
  lat?: number;
  lng?: number;
  limit?: number;
}

export interface ServiceRecommendation {
  service: Service;
  score: number;
  reasons: string[];
  matchFactors: {
    pastBookings?: number;
    location?: number;
    preferences?: number;
    similarUsers?: number;
  };
}

export async function getServiceRecommendations(
  params: ServiceRecommendationParams = {}
): Promise<ServiceRecommendation[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params.userId) queryParams.append("userId", params.userId);
    if (params.location) queryParams.append("location", params.location);
    if (params.lat) queryParams.append("lat", params.lat.toString());
    if (params.lng) queryParams.append("lng", params.lng.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.aiServiceRecommendations}?${queryParams}`,
      createAuthFetchOptions()
    );

    if (!response.ok) {
      // Silently handle 404s (endpoint not implemented yet)
      if (response.status === 404) {
        logger.debug("AI recommendations endpoint not available", { status: 404 });
        return [];
      }
      throw new Error(`Recommendations failed: ${response.status}`);
    }

    const data = await response.json();
    return data.recommendations || data.data || [];
  } catch (error) {
    // Only log non-404 errors
    if (error instanceof Error && !error.message.includes("404")) {
      logger.error("Service recommendations error", error);
    }
    return [];
  }
}

// Price Estimator
export interface PriceEstimateParams {
  serviceType: string;
  category: string;
  subcategory?: string;
  location?: string;
  duration?: number;
  propertySize?: number; // Legacy support
  propertyType?: string;
  complexity?: "simple" | "moderate" | "complex" | "standard"; // Added "standard"
  additionalInfo?: string; // New format - single string
  additionalRequirements?: string[]; // Legacy format - array
}

export interface PriceEstimate {
  // New API format
  success?: boolean;
  message?: string;
  data?: {
    estimate?: {
      estimatedPrice?: number;
      priceRange?: {
        min: number;
        max: number;
      };
      currency?: string;
      confidence?: number;
      factors?: string[]; // Array of factor strings
    };
    marketData?: {
      averagePrice?: number | null;
      priceRange?: { min: number; max: number } | null;
      sampleSize?: number;
    };
    aiConfidence?: "high" | "medium" | "low";
  };
  // Legacy format support
  estimatedPrice?: {
    min: number;
    max: number;
    average: number;
    currency: string;
  };
  factors?: Array<{
    factor: string;
    impact: "positive" | "negative" | "neutral";
    description: string;
  }> | string[];
  marketComparison?: {
    percentile25: number;
    percentile50: number;
    percentile75: number;
  };
  confidence?: number;
  aiConfidence?: "high" | "medium" | "low";
  marketData?: {
    averagePrice?: number | null;
    priceRange?: { min: number; max: number } | null;
    sampleSize?: number;
  };
}

export async function estimatePrice(
  params: PriceEstimateParams
): Promise<PriceEstimate> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.aiPriceEstimator}`,
      createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(params),
      })
    );

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug("AI price estimator endpoint not available", { status: 404 });
        throw new Error("Price estimation feature is not available yet.");
      }
      throw new Error(`Price estimation failed: ${response.status}`);
    }

    const responseData = await response.json();
    
    // Transform the response to match expected format
    // Handle both new format (with data.estimate) and legacy format
    if (responseData.data?.estimate) {
      const estimate = responseData.data.estimate;
      const marketData = responseData.data.marketData;
      
      // Transform to unified format
      return {
        ...responseData,
        estimatedPrice: {
          min: estimate.priceRange?.min || estimate.estimatedPrice || 0,
          max: estimate.priceRange?.max || estimate.estimatedPrice || 0,
          average: estimate.estimatedPrice || 0,
          currency: estimate.currency || "PHP",
        },
        confidence: estimate.confidence || 0,
        factors: estimate.factors || [],
        marketComparison: marketData?.priceRange ? {
          percentile25: marketData.priceRange.min,
          percentile50: marketData.averagePrice || (marketData.priceRange.min + marketData.priceRange.max) / 2,
          percentile75: marketData.priceRange.max,
        } : undefined,
        aiConfidence: responseData.data.aiConfidence,
        marketData,
      };
    }
    
    // Legacy format - return as is
    return responseData;
  } catch (error) {
    if (error instanceof Error && !error.message.includes("404") && !error.message.includes("not available")) {
      logger.error("Price estimation error", error);
    }
    throw error;
  }
}

// Service Matcher
export interface ServiceMatchParams {
  // New API format
  requirements?: {
    serviceType?: string;
    location?: string;
    budget?: number;
    preferredTime?: string; // e.g., "morning", "afternoon", "evening"
    specialRequirements?: string[];
  };
  filters?: {
    category?: string;
    location?: string;
    lat?: number;
    lng?: number;
  };
  // Legacy format support
  description?: string;
  location?: string;
  lat?: number;
  lng?: number;
  budget?: number;
  preferredDate?: string;
}

export interface ServiceMatch {
  // New API response format
  success?: boolean;
  message?: string;
  data?: {
    matches?: Array<{
      service: Service;
      matchScore?: number;
      reasons?: string[];
      estimatedPrice?: number;
      estimatedDuration?: number;
    }>;
    count?: number;
  };
  // Legacy format support
  service?: Service;
  matchScore?: number;
  reasons?: string[];
  estimatedPrice?: number;
  estimatedDuration?: number;
  // Metadata for component access
  _count?: number;
  _empty?: boolean;
}

export async function matchService(
  params: ServiceMatchParams
): Promise<ServiceMatch[]> {
  try {
    // Transform params to match API structure
    let payload: {
      requirements?: {
        serviceType?: string;
        location?: string;
        budget?: number;
        preferredTime?: string;
        specialRequirements?: string[];
      };
      filters?: {
        category?: string;
        location?: string;
        lat?: number;
        lng?: number;
      };
    };
    
    // If using new format (requirements/filters), use as-is
    if (params.requirements || params.filters) {
      payload = {
        requirements: params.requirements || {},
        filters: params.filters || {},
      };
    } else {
      // Legacy format: transform to new structure
      payload = {
        requirements: {
          serviceType: params.description,
          location: params.location,
          budget: params.budget,
          preferredTime: params.preferredDate ? new Date(params.preferredDate).toLocaleTimeString('en-US', { hour: 'numeric', hour12: false }) : undefined,
        },
        filters: {
          location: params.location,
          lat: params.lat,
          lng: params.lng,
        },
      };
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.aiServiceMatcher}`,
      createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug("AI service matcher endpoint not available", { status: 404 });
        return [];
      }
      throw new Error(`Service matching failed: ${response.status}`);
    }

    const responseData = await response.json();
    
    // Transform response to unified format
    if (responseData.data?.matches) {
      // New format: return matches array with count info
      const matches = responseData.data.matches.map((match: {
        service?: Service;
        matchScore?: number;
        reasons?: string[];
        estimatedPrice?: number;
        estimatedDuration?: number;
      }) => ({
        ...match,
        service: match.service || match,
        matchScore: match.matchScore || 0,
        reasons: match.reasons || [],
        // Include count in first match for component access
        _count: responseData.data.count,
      }));
      
      // If no matches but we have count info, return empty array with count
      if (matches.length === 0 && responseData.data.count !== undefined) {
        return [{ _count: responseData.data.count, _empty: true }] as ServiceMatch[];
      }
      
      return matches;
    }
    
    // Legacy format or direct matches array
    return responseData.matches || responseData.data || [];
  } catch (error) {
    if (error instanceof Error && !error.message.includes("404")) {
      logger.error("Service matching error", error);
    }
    return [];
  }
}

// Review Sentiment Analysis
export interface ReviewSentimentParams {
  serviceId: string;
  reviews?: Array<{
    text: string;
    rating: number;
    author?: string;
  }>;
}

export interface ReviewSentiment {
  overallSentiment: "positive" | "neutral" | "negative";
  sentimentScore: number;
  themes: Array<{
    theme: string;
    sentiment: "positive" | "neutral" | "negative";
    mentions: number;
    examples: string[];
  }>;
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

export async function analyzeReviewSentiment(
  params: ReviewSentimentParams
): Promise<ReviewSentiment> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.aiReviewSentiment}`,
      createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(params),
      })
    );

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug("AI review sentiment endpoint not available", { status: 404 });
        throw new Error("Sentiment analysis feature is not available yet.");
      }
      throw new Error(`Sentiment analysis failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && !error.message.includes("404") && !error.message.includes("not available")) {
      logger.error("Review sentiment analysis error", error);
    }
    throw error;
  }
}

// Booking Assistant
export interface BookingAssistantParams {
  serviceId: string;
  userId?: string;
  preferredDates?: string[];
  location?: string;
}

export interface BookingSuggestion {
  date: string;
  time: string;
  reason: string;
  confidence: number;
  providerAvailability?: boolean;
}

export async function getBookingSuggestions(
  params: BookingAssistantParams
): Promise<BookingSuggestion[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.aiBookingAssistant}`,
      createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(params),
      })
    );

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug("AI booking assistant endpoint not available", { status: 404 });
        return [];
      }
      throw new Error(`Booking assistant failed: ${response.status}`);
    }

    const data = await response.json();
    return data.suggestions || data.data || [];
  } catch (error) {
    if (error instanceof Error && !error.message.includes("404")) {
      logger.error("Booking assistant error", error);
    }
    return [];
  }
}

// Description Generator (Provider)
export interface DescriptionGeneratorParams {
  title?: string;
  serviceType: string;
  category: string;
  keyFeatures?: string[];
  pricing?: {
    type: string;
    basePrice: number;
  };
  location?: string;
}

export interface GeneratedDescription {
  title: string;
  description: string;
  shortDescription: string;
  keywords: string[];
  seoSuggestions: string[];
}

// Description From Title (Simplified)
export interface DescriptionFromTitleParams {
  title: string;
  category?: string;
  serviceType?: string;
}

export interface DescriptionFromTitleResponse {
  success: boolean;
  message: string;
  data: {
    title: string;
    description: string;
    keyFeatures?: string[];
    benefits?: string[];
    tags?: string[];
    wordCount?: number;
    options?: {
      length?: string;
      tone?: string;
      includeFeatures?: boolean;
      includeBenefits?: boolean;
    };
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };
}

export async function generateServiceDescription(
  params: DescriptionGeneratorParams
): Promise<GeneratedDescription> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.aiDescriptionGenerator}`,
      createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(params),
      })
    );

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug("AI description generator endpoint not available", { status: 404 });
        throw new Error("Description generation feature is not available yet.");
      }
      
      // Try to get error message from response
      let errorMessage = `Description generation failed: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && !error.message.includes("404") && !error.message.includes("not available")) {
      logger.error("Description generation error", error);
    }
    throw error;
  }
}

// Description From Title (Simplified - Just needs title)
export async function generateDescriptionFromTitle(
  params: DescriptionFromTitleParams
): Promise<DescriptionFromTitleResponse> {
  try {
    // Validate required params
    if (!params.title || params.title.trim() === "") {
      throw new Error("Title is required for description generation");
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.aiDescriptionFromTitle}`,
      createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(params),
      })
    );

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug("AI description from title endpoint not available", { status: 404 });
        throw new Error("Description generation feature is not available yet.");
      }
      
      // Try to get error message from response
      let errorMessage = `Description generation failed: ${response.status}`;
      let errorDetails: any = null;
      
      try {
        const errorData = await response.json();
        errorDetails = errorData;
        errorMessage = errorData.message || errorData.error || errorData.details || errorMessage;
      } catch (parseError) {
        // If response is not JSON, try to get text
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          } else {
            errorMessage = response.statusText || errorMessage;
          }
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
      }
      
      // Log detailed error for debugging
      logger.error("Description from title API error", new Error(errorMessage), {
        status: response.status,
        statusText: response.statusText,
        params,
        errorDetails
      });
      
      throw new Error(errorMessage);
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      const text = await response.text();
      throw new Error(`Invalid JSON response: ${text.substring(0, 200) || 'Empty response'}`);
    }
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error("Invalid response format from API");
    }
    
    // Handle wrapped response format (success, message, data)
    if (data.success !== undefined && data.data) {
      return data as DescriptionFromTitleResponse;
    } 
    // Handle direct data format
    else if (data.description || data.title) {
      // If response is direct data, wrap it in expected format
      return {
        success: true,
        message: "Description generated successfully",
        data: {
          title: data.title || "",
          description: data.description || "",
          keyFeatures: data.keyFeatures,
          benefits: data.benefits,
          tags: data.tags,
          wordCount: data.wordCount,
          options: data.options,
          usage: data.usage
        }
      };
    }
    // If it's already in the expected format
    else if (data.data && data.data.description) {
      return data as DescriptionFromTitleResponse;
    }
    
    // Log unexpected structure for debugging
    logger.error("Unexpected response structure", new Error("Response format not recognized"), { data });
    throw new Error("Unexpected response format from API");
  } catch (error) {
    // Re-throw if it's already an Error with a message
    if (error instanceof Error) {
      // Only log if it's not a user-facing error
      if (!error.message.includes("404") && 
          !error.message.includes("not available") &&
          !error.message.includes("Title is required")) {
        logger.error("Description from title generation error", error, { params });
      }
      throw error;
    }
    
    // Handle unexpected error types
    const errorMessage = String(error) || "Failed to generate description";
    logger.error("Unexpected error in description generation", new Error(errorMessage), { params });
    throw new Error(errorMessage);
  }
}

// Bio Generator (User Profile)
export interface BioGeneratorParams {
  skills: string[];
  experience?: number;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

export interface GeneratedBio {
  bio: string;
  suggestions?: string[];
}

export async function generateBio(
  params: BioGeneratorParams
): Promise<GeneratedBio> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.aiBioGenerator}`,
      createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(params),
      })
    );

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug("AI bio generator endpoint not available", { status: 404 });
        throw new Error("Bio generation feature is not available yet.");
      }
      
      // Try to extract error message from response
      let errorMessage = `Bio generation failed (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    // Handle both direct response and wrapped response
    if (result.data) {
      return result.data;
    }
    return result;
  } catch (error) {
    if (error instanceof Error && !error.message.includes("404") && !error.message.includes("not available")) {
      logger.error("Bio generation error", error);
    }
    throw error;
  }
}

// Pricing Optimizer (Provider)
interface CompetitorData {
  price?: number;
  rating?: number;
  reviewCount?: number;
  [key: string]: unknown;
}

export interface PricingOptimizerParams {
  serviceId?: string;
  category: string;
  currentPrice: number;
  location?: string;
  competitorData?: CompetitorData[];
}

export interface PricingRecommendation {
  recommendedPrice: {
    min: number;
    optimal: number;
    max: number;
    currency: string;
  };
  currentMarketAverage: number;
  competitiveness: "low" | "medium" | "high";
  factors: Array<{
    factor: string;
    impact: number;
    recommendation: string;
  }>;
  expectedImpact: {
    bookings: {
      change: number;
      percentage: number;
    };
    revenue: {
      change: number;
      percentage: number;
    };
  };
}

export async function optimizePricing(
  params: PricingOptimizerParams
): Promise<PricingRecommendation> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.aiPricingOptimizer}`,
      createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(params),
      })
    );

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug("AI pricing optimizer endpoint not available", { status: 404 });
        throw new Error("Pricing optimization feature is not available yet.");
      }
      throw new Error(`Pricing optimization failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && !error.message.includes("404") && !error.message.includes("not available")) {
      logger.error("Pricing optimization error", error);
    }
    throw error;
  }
}

// Demand Forecast (Provider)
export interface DemandForecastParams {
  serviceId?: string;
  category: string;
  location?: string;
  timeframe: "7d" | "30d" | "90d" | "1y";
}

export interface DemandForecast {
  forecast: Array<{
    date: string;
    predictedDemand: number;
    confidence: number;
    factors: string[];
  }>;
  trends: {
    overall: "increasing" | "stable" | "decreasing";
    seasonalFactors: string[];
    recommendations: string[];
  };
  peakPeriods: Array<{
    period: string;
    expectedDemand: number;
    recommendation: string;
  }>;
}

export async function getDemandForecast(
  params: DemandForecastParams
): Promise<DemandForecast> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.aiDemandForecast}`,
      createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(params),
      })
    );

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug("AI demand forecast endpoint not available", { status: 404 });
        throw new Error("Demand forecasting feature is not available yet.");
      }
      throw new Error(`Demand forecast failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && !error.message.includes("404") && !error.message.includes("not available")) {
      logger.error("Demand forecast error", error);
    }
    throw error;
  }
}

// Review Insights (Provider)
export interface ReviewInsightsParams {
  serviceId?: string;
  providerId?: string;
  timeframe?: "7d" | "30d" | "90d" | "1y";
}

export interface ReviewInsights {
  summary: {
    totalReviews: number;
    averageRating: number;
    sentimentTrend: "improving" | "stable" | "declining";
  };
  themes: Array<{
    theme: string;
    frequency: number;
    sentiment: "positive" | "neutral" | "negative";
    examples: string[];
  }>;
  strengths: Array<{
    strength: string;
    mentionCount: number;
    impact: "high" | "medium" | "low";
  }>;
  improvements: Array<{
    area: string;
    mentionCount: number;
    priority: "high" | "medium" | "low";
    suggestions: string[];
  }>;
  competitorComparison?: {
    averageRating: number;
    strengths: string[];
    weaknesses: string[];
  };
}

export async function getReviewInsights(
  params: ReviewInsightsParams
): Promise<ReviewInsights> {
  try {
    const queryParams = new URLSearchParams();
    if (params.serviceId) queryParams.append("serviceId", params.serviceId);
    if (params.providerId) queryParams.append("providerId", params.providerId);
    if (params.timeframe) queryParams.append("timeframe", params.timeframe);

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.aiReviewInsights}?${queryParams}`,
      createAuthFetchOptions()
    );

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug("AI review insights endpoint not available", { status: 404 });
        throw new Error("Review insights feature is not available yet.");
      }
      throw new Error(`Review insights failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && !error.message.includes("404") && !error.message.includes("not available")) {
      logger.error("Review insights error", error);
    }
    throw error;
  }
}

// Response Assistant (Provider)
export interface ResponseAssistantParams {
  message: string;
  context?: {
    bookingId?: string;
    serviceId?: string;
    previousMessages?: string[];
  };
  tone?: "professional" | "friendly" | "formal";
}

export interface GeneratedResponse {
  response: string;
  alternatives: string[];
  suggestedActions?: string[];
}

export async function generateResponse(
  params: ResponseAssistantParams
): Promise<GeneratedResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.aiResponseAssistant}`,
      createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(params),
      })
    );

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug("AI response assistant endpoint not available", { status: 404 });
        throw new Error("Response assistant feature is not available yet.");
      }
      throw new Error(`Response generation failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && !error.message.includes("404") && !error.message.includes("not available")) {
      logger.error("Response generation error", error);
    }
    throw error;
  }
}

// Listing Optimizer (Provider)
export interface ListingOptimizerParams {
  serviceId: string;
}

export interface ListingOptimization {
  currentScore: number;
  maxScore: number;
  improvements: Array<{
    area: string;
    current: string;
    suggested: string;
    impact: "high" | "medium" | "low";
    reason: string;
  }>;
  seoScore: {
    current: number;
    potential: number;
    keywords: string[];
  };
  visibilityScore: {
    current: number;
    potential: number;
    factors: string[];
  };
}

export async function optimizeListing(
  params: ListingOptimizerParams
): Promise<ListingOptimization> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.aiListingOptimizer}`,
      createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(params),
      })
    );

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug("AI listing optimizer endpoint not available", { status: 404 });
        throw new Error("Listing optimization feature is not available yet.");
      }
      throw new Error(`Listing optimization failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && !error.message.includes("404") && !error.message.includes("not available")) {
      logger.error("Listing optimization error", error);
    }
    throw error;
  }
}

// Scheduling Assistant (Provider)
export interface SchedulingAssistantParams {
  serviceId?: string;
  providerId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  existingBookings?: Array<{
    date: string;
    time: string;
    duration: number;
    location?: string;
  }>;
}

export interface SchedulingRecommendation {
  date: string;
  timeSlots: Array<{
    start: string;
    end: string;
    score: number;
    reason: string;
  }>;
  optimization: {
    travelTime: number;
    efficiency: number;
    revenue: number;
  };
  suggestions: string[];
}

export async function getSchedulingRecommendations(
  params: SchedulingAssistantParams
): Promise<SchedulingRecommendation[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.aiSchedulingAssistant}`,
      createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(params),
      })
    );

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug("AI scheduling assistant endpoint not available", { status: 404 });
        return [];
      }
      throw new Error(`Scheduling assistant failed: ${response.status}`);
    }

    const data = await response.json();
    return data.recommendations || data.data || [];
  } catch (error) {
    if (error instanceof Error && !error.message.includes("404")) {
      logger.error("Scheduling assistant error", error);
    }
    return [];
  }
}

// Form Prefiller (Service Creation)
export interface FormPrefillerParams {
  description: string;
  location?: string;
}

export interface PrefilledFormData {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  serviceType: string;
  teamSize: number;
  pricing: {
    type: string;
    basePrice: number;
    currency: string;
  };
  estimatedDuration: {
    min: number;
    max: number;
  };
  serviceArea: string[];
  features: string[];
  requirements: string[];
  equipmentProvided: boolean;
  materialsIncluded: boolean;
  warranty: {
    hasWarranty: boolean;
    duration: number;
    description: string;
  };
  insurance: {
    covered: boolean;
    coverageAmount: number;
  };
  emergencyService: {
    available: boolean;
    surcharge: number;
    responseTime: string;
  };
  servicePackages: Array<{
    name: string;
    description: string;
    price: number;
    features: string[];
    duration: number;
  }>;
  addOns: Array<{
    name: string;
    description: string;
    price: number;
    category: string;
  }>;
  availability: {
    timezone: string;
    schedule: Array<{
      day: string;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }>;
  };
}

export async function prefillServiceForm(
  params: FormPrefillerParams
): Promise<PrefilledFormData> {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.aiFormPrefiller}`,
      createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(params),
      })
    );

    if (!response.ok) {
      if (response.status === 404) {
        logger.debug("AI form prefiller endpoint not available", { status: 404 });
        throw new Error("Form prefiller feature is not available yet.");
      }
      throw new Error(`Form prefilling failed: ${response.status}`);
    }

    const data = await response.json();
    // Handle both direct response and wrapped response
    if (data.data) {
      return data.data;
    }
    return data;
  } catch (error) {
    if (error instanceof Error && !error.message.includes("404") && !error.message.includes("not available")) {
      logger.error("Form prefiller error", error);
    }
    throw error;
  }
}

