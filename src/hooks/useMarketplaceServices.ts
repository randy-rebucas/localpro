"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { MarketplaceService } from "./useCategoryServices";

// Global request deduplication and caching
interface CachedServices {
  services: MarketplaceService[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
    count: number;
  } | null;
  timestamp: number;
}

const servicesCache = new Map<string, CachedServices>();
const activeRequests = new Map<string, Promise<CachedServices | null>>();
const CACHE_DURATION = 30000; // 30 seconds cache

// Generate cache key from params
function getCacheKey(params: MarketplaceServicesParams): string {
  const parts = [
    params.categoryKey || '',
    params.subcategory || '',
    params.location || '',
    params.lat?.toString() || '',
    params.lng?.toString() || '',
    params.radius?.toString() || '',
    params.minPrice?.toString() || '',
    params.maxPrice?.toString() || '',
    params.rating?.toString() || '',
    params.page?.toString() || '1',
    params.limit?.toString() || '10',
    params.sortBy || '',
    params.sortOrder || '',
    params.groupByCategory?.toString() || '',
    params.isActive?.toString() || '',
  ];
  return parts.join('|');
}

export interface MarketplaceServicesParams {
  categoryKey?: string | null;
  subcategory?: string | null;
  location?: string;
  lat?: number;
  lng?: number;
  radius?: number; // Radius in meters
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  groupByCategory?: boolean;
  isActive?: boolean; // Filter for active services only
}

interface MarketplaceServicesResponse {
  success?: boolean;
  message?: string;
  data?: MarketplaceService[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
    count: number;
  };
}

export function useMarketplaceServices(params: MarketplaceServicesParams) {
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    current: number;
    pages: number;
    total: number;
    limit: number;
    count: number;
  } | null>(null);
  const mountedRef = useRef(true);

  const fetchServices = useCallback(async () => {
    const cacheKey = getCacheKey(params);
    const now = Date.now();

    // Check cache first
    let cached = servicesCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      if (mountedRef.current) {
        setServices(cached.services);
        setPagination(cached.pagination);
        setLoading(false);
        setError(null);
      }
      return;
    }

    // Check if there's already a request in progress for this cache key
    if (activeRequests.has(cacheKey)) {
      try {
        const cachedResult = await activeRequests.get(cacheKey);
        if (cachedResult && mountedRef.current) {
          setServices(cachedResult.services);
          setPagination(cachedResult.pagination);
          setLoading(false);
          setError(null);
        }
        return;
      } catch {
        // If the request failed, continue to make a new one
      }
    }

    // Create new request
    const requestPromise = (async (): Promise<CachedServices | null> => {
      try {
        if (!mountedRef.current) return null;

        // Re-check cache in case it was updated while waiting
        cached = servicesCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
          if (mountedRef.current) {
            setServices(cached.services);
            setPagination(cached.pagination);
            setLoading(false);
            setError(null);
          }
          return cached;
        }

        setLoading(true);
        setError(null);

      // Build query parameters
      const queryParams = new URLSearchParams();
      
      // Backend expects 'category' not 'categoryKey'
      if (params.categoryKey) {
        queryParams.append('category', params.categoryKey);
      }
      
      if (params.subcategory) {
        queryParams.append('subcategory', params.subcategory);
      }
      
      if (params.location?.trim()) {
        queryParams.append('location', params.location.trim());
      }
      
      // Nearby filter - include lat, lng, and radius if coordinates are provided
      if (params.lat !== undefined && params.lng !== undefined) {
        queryParams.append('lat', params.lat.toString());
        queryParams.append('lng', params.lng.toString());
        if (params.radius !== undefined && params.radius > 0) {
          queryParams.append('radius', params.radius.toString());
        }
      }
      
      if (params.minPrice !== undefined && params.minPrice > 0) {
        queryParams.append('minPrice', params.minPrice.toString());
      }
      
      if (params.maxPrice !== undefined && params.maxPrice > 0) {
        queryParams.append('maxPrice', params.maxPrice.toString());
      }
      
      if (params.rating !== undefined && params.rating > 0) {
        queryParams.append('rating', params.rating.toString());
      }
      
      // Always include page and limit (default to 1 and 10 if not provided)
      const page = params.page !== undefined && params.page > 0 ? params.page : 1;
      const limit = params.limit !== undefined && params.limit > 0 ? params.limit : 10;
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (params.sortBy) {
        queryParams.append('sortBy', params.sortBy);
      }
      
      if (params.sortOrder) {
        queryParams.append('sortOrder', params.sortOrder);
      }
      
      if (params.groupByCategory !== undefined) {
        queryParams.append('groupByCategory', params.groupByCategory.toString());
      }
      
      if (params.isActive !== undefined) {
        queryParams.append('isActive', params.isActive.toString());
      }

      const url = `${API_BASE_URL}/api/marketplace/services${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        // Handle 429 rate limit gracefully - return cached data if available
        if (response.status === 429) {
          logger.warn("Rate limited on services fetch, using cached data if available", { cacheKey });
          const cachedData = servicesCache.get(cacheKey);
          if (cachedData && mountedRef.current) {
            setServices(cachedData.services);
            setPagination(cachedData.pagination);
            setLoading(false);
            setError(null);
            return cachedData;
          }
          // If no cache, throw error but don't log it as a critical error
          throw new Error("Too many requests. Please try again in a moment.");
        }
        throw new Error(`Failed to fetch services: ${response.status} ${response.statusText}`);
      }

      const data: MarketplaceServicesResponse | MarketplaceService[] = await response.json();

      let servicesData: MarketplaceService[] = [];
      let paginationData: CachedServices['pagination'] = null;

      // Handle different response structures
      if (Array.isArray(data)) {
        servicesData = data;
        paginationData = null;
      } else if (typeof data === 'object' && data !== null) {
        if ('success' in data && (data as MarketplaceServicesResponse).success) {
          const responseData = data as MarketplaceServicesResponse;
          servicesData = responseData.data || [];
          paginationData = responseData.pagination || null;
        } else {
          // Fallback: try to extract data array
          const fallbackData = data as { data?: MarketplaceService[]; services?: MarketplaceService[]; pagination?: CachedServices['pagination'] };
          const servicesArray = fallbackData.data || fallbackData.services || [];
          servicesData = Array.isArray(servicesArray) ? servicesArray : [];
          paginationData = fallbackData.pagination || null;
        }
      } else {
        logger.warn("Unexpected services response format", { hasData: !!data });
      }

      // Update cache
      const cachedResult: CachedServices = {
        services: servicesData,
        pagination: paginationData,
        timestamp: Date.now(),
      };
      servicesCache.set(cacheKey, cachedResult);

      // Update state if component is still mounted
      if (mountedRef.current) {
        setServices(servicesData);
        setPagination(paginationData);
        setLoading(false);
        setError(null);
      }

      return cachedResult;
    } catch (error) {
      // Only log as error if it's not a 429 (which we already handled)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes("Too many requests")) {
        logger.error("Error fetching services", error instanceof Error ? error : new Error(errorMessage));
      }

      // Try to use cached data on error
      const cachedData = servicesCache.get(cacheKey);
      if (cachedData && mountedRef.current) {
        setServices(cachedData.services);
        setPagination(cachedData.pagination);
        setLoading(false);
        setError(null);
        return cachedData;
      }

      if (mountedRef.current) {
        setError(errorMessage);
        setServices([]);
        setPagination(null);
        setLoading(false);
      }

      return null;
    } finally {
      activeRequests.delete(cacheKey);
    }
    })();

    activeRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchServices();
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchServices]);

  // Separate featured and regular services
  const featuredServices = services.filter((service) => service.isFeatured === true);
  const regularServices = services.filter((service) => service.isFeatured !== true);

  return {
    services: regularServices,
    featuredServices,
    allServices: services,
    loading,
    error,
    pagination,
    refetch: fetchServices,
  };
}

