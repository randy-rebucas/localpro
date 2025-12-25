/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/shared/hooks/useAIFeatures' instead.
 */
export * from '@/shared/hooks/useAIFeatures';
import { useState, useCallback } from "react";
import {
  naturalLanguageSearch,
  getServiceRecommendations,
  estimatePrice,
  matchService,
  analyzeReviewSentiment,
  getBookingSuggestions,
  generateServiceDescription,
  optimizePricing,
  getDemandForecast,
  getReviewInsights,
  generateResponse,
  optimizeListing,
  getSchedulingRecommendations,
  type NaturalLanguageSearchParams,
  type ServiceRecommendationParams,
  type ServiceRecommendation as ServiceRecommendationType,
  type PriceEstimateParams,
  type ServiceMatchParams,
  type ReviewSentimentParams,
  type BookingAssistantParams,
  type DescriptionGeneratorParams,
  type PricingOptimizerParams,
  type DemandForecastParams,
  type ReviewInsightsParams,
  type ResponseAssistantParams,
  type ListingOptimizerParams,
  type SchedulingAssistantParams,
} from "@/lib/ai-utils";
import { logger } from "@/lib/logger";

/**
 * Hook for AI Natural Language Search
 */
export function useAINaturalLanguageSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (params: NaturalLanguageSearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await naturalLanguageSearch(params);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Search failed";
      setError(errorMessage);
      logger.error("AI natural language search error", err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { search, loading, error };
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

/**
 * Hook for AI Service Recommendations
 */
export function useAIServiceRecommendations() {
  const [recommendations, setRecommendations] = useState<ServiceRecommendationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async (params: ServiceRecommendationParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getServiceRecommendations(params);
      setRecommendations(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch recommendations";
      setError(errorMessage);
      logger.error("AI recommendations error", err instanceof Error ? err : new Error(String(err)));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { recommendations, fetchRecommendations, loading, error };
}

/**
 * Hook for AI Price Estimator
 */
export function useAIPriceEstimator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimate = useCallback(async (params: PriceEstimateParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await estimatePrice(params);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Price estimation failed";
      setError(errorMessage);
      logger.error("AI price estimation error", err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { estimate, loading, error };
}

/**
 * Hook for AI Service Matcher
 */
interface ServiceMatch {
  service?: Service;
  matchScore?: number;
  reasons?: string[];
  estimatedPrice?: number;
  estimatedDuration?: number;
  _count?: number;
  _empty?: boolean;
}

export function useAIServiceMatcher() {
  const [matches, setMatches] = useState<ServiceMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const match = useCallback(async (params: ServiceMatchParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await matchService(params);
      setMatches(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Service matching failed";
      setError(errorMessage);
      logger.error("AI service matching error", err instanceof Error ? err : new Error(String(err)));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { matches, match, loading, error };
}

/**
 * Hook for Review Sentiment Analysis
 */
export function useAIReviewSentiment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (params: ReviewSentimentParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeReviewSentiment(params);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Sentiment analysis failed";
      setError(errorMessage);
      logger.error("AI sentiment analysis error", err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyze, loading, error };
}

/**
 * Hook for AI Booking Assistant
 */
interface BookingSuggestion {
  date: string;
  time?: string;
  confidence?: number;
  providerAvailability?: boolean;
  reason?: string;
}

export function useAIBookingAssistant() {
  const [suggestions, setSuggestions] = useState<BookingSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSuggestions = useCallback(async (params: BookingAssistantParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getBookingSuggestions(params);
      setSuggestions(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get booking suggestions";
      setError(errorMessage);
      logger.error("AI booking assistant error", err instanceof Error ? err : new Error(String(err)));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { suggestions, getSuggestions, loading, error };
}

/**
 * Hook for AI Description Generator (Provider)
 */
export function useAIDescriptionGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (params: DescriptionGeneratorParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateServiceDescription(params);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Description generation failed";
      setError(errorMessage);
      logger.error("AI description generation error", err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generate, loading, error };
}

/**
 * Hook for AI Pricing Optimizer (Provider)
 */
export function useAIPricingOptimizer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimize = useCallback(async (params: PricingOptimizerParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await optimizePricing(params);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Pricing optimization failed";
      setError(errorMessage);
      logger.error("AI pricing optimization error", err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { optimize, loading, error };
}

/**
 * Hook for AI Demand Forecast (Provider)
 */
interface DemandForecast {
  overallTrend?: "increasing" | "decreasing" | "stable";
  trends?: {
    overall?: "increasing" | "decreasing" | "stable";
    seasonalFactors?: string[];
    recommendations?: string[];
  };
  peakPeriods?: Array<{
    period: string;
    expectedDemand: number;
    recommendation: string;
  }>;
  forecast?: Array<{
    date: string;
    predictedDemand: number;
    confidence: number;
    factors?: string[];
  }>;
}

export function useAIDemandForecast() {
  const [forecast, setForecast] = useState<DemandForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = useCallback(async (params: DemandForecastParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDemandForecast(params);
      setForecast(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Demand forecast failed";
      setError(errorMessage);
      logger.error("AI demand forecast error", err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { forecast, fetchForecast, loading, error };
}

/**
 * Hook for AI Review Insights (Provider)
 */
interface ReviewInsights {
  summary?: {
    totalReviews?: number;
    averageRating?: number;
    sentimentTrend?: "improving" | "declining" | "stable";
  };
  strengths?: Array<{
    strength: string;
    mentionCount: number;
    impact: "high" | "medium" | "low";
  }>;
  improvements?: Array<{
    area: string;
    mentionCount: number;
    priority: "high" | "medium" | "low";
    suggestions?: string[];
  }>;
  themes?: Array<{
    theme: string;
    sentiment: "positive" | "neutral" | "negative";
    frequency: number;
    examples?: string[];
  }>;
}

export function useAIReviewInsights() {
  const [insights, setInsights] = useState<ReviewInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async (params: ReviewInsightsParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getReviewInsights(params);
      setInsights(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Review insights failed";
      setError(errorMessage);
      logger.error("AI review insights error", err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { insights, fetchInsights, loading, error };
}

/**
 * Hook for AI Response Assistant (Provider)
 */
export function useAIResponseAssistant() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (params: ResponseAssistantParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateResponse(params);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Response generation failed";
      setError(errorMessage);
      logger.error("AI response generation error", err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generate, loading, error };
}

/**
 * Hook for AI Listing Optimizer (Provider)
 */
export function useAIListingOptimizer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimize = useCallback(async (params: ListingOptimizerParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await optimizeListing(params);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Listing optimization failed";
      setError(errorMessage);
      logger.error("AI listing optimization error", err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { optimize, loading, error };
}

/**
 * Hook for AI Scheduling Assistant (Provider)
 */
interface SchedulingRecommendation {
  date: string;
  timeSlots?: Array<{
    start: string;
    end: string;
    score?: number;
  }>;
  optimization?: {
    travelTime?: number;
    efficiency?: number;
    revenue?: number;
  };
  suggestions?: string[];
}

export function useAISchedulingAssistant() {
  const [recommendations, setRecommendations] = useState<SchedulingRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendations = useCallback(async (params: SchedulingAssistantParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSchedulingRecommendations(params);
      setRecommendations(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Scheduling recommendations failed";
      setError(errorMessage);
      logger.error("AI scheduling assistant error", err instanceof Error ? err : new Error(String(err)));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { recommendations, getRecommendations, loading, error };
}

