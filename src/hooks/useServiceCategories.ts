"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { ServiceCategory } from "@/components/marketplace/categories-carousel";

// Global request deduplication and caching
interface CachedCategories {
  categories: ServiceCategory[];
  summary?: {
    totalCategories?: number;
    totalServices?: number;
    totalProviders?: number;
    categoriesWithServices?: number;
  };
  timestamp: number;
}

let categoriesCache: CachedCategories | null = null;
let activeCategoriesRequest: Promise<CachedCategories | null> | null = null;
// Disable caching in development mode
const CACHE_DURATION = process.env.NODE_ENV === 'development' ? 0 : 60000; // 60 seconds cache (categories change less frequently)

// Clear any existing cache data
categoriesCache = null;
activeCategoriesRequest = null;

interface ServiceCategoriesResponse {
  success?: boolean;
  message?: string;
  data?: ServiceCategory[];
  summary?: {
    totalCategories?: number;
    totalServices?: number;
    totalProviders?: number;
    categoriesWithServices?: number;
  };
}

export function useServiceCategories() {
  const cached = categoriesCache;
  
  const [categories, setCategories] = useState<ServiceCategory[]>(cached?.categories || []);
  const [summary, setSummary] = useState<CachedCategories["summary"]>(cached?.summary);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchCategories = useCallback(async () => {
    const now = Date.now();
    const cached = categoriesCache;

    // Check cache first
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      if (mountedRef.current) {
        setCategories(cached.categories);
        setSummary(cached.summary);
        setLoading(false);
        setError(null);
      }
      return;
    }

    // Check if there's already a request in progress
    if (activeCategoriesRequest) {
      try {
        const cachedResult = await activeCategoriesRequest;
        if (cachedResult && mountedRef.current) {
          setCategories(cachedResult.categories);
          setSummary(cachedResult.summary);
          setLoading(false);
          setError(null);
        }
        return;
      } catch {
        // If the request failed, continue to make a new one
      }
    }

    // Create new request
    const requestPromise = (async (): Promise<CachedCategories | null> => {
      try {
        if (!mountedRef.current) return null;

        // Re-check cache in case it was updated while waiting
        const recheckCache = categoriesCache;
        if (recheckCache && (Date.now() - recheckCache.timestamp) < CACHE_DURATION) {
          if (mountedRef.current) {
            setCategories(recheckCache.categories);
            setSummary(recheckCache.summary);
            setLoading(false);
            setError(null);
          }
          return recheckCache;
        }

        if (mountedRef.current) {
          setLoading(true);
          setError(null);
        }

        const endpoint = API_ENDPOINTS.marketplaceServicesCategories;
        const fullUrl = `${API_BASE_URL}${endpoint}`;
        logger.debug(`Fetching service categories`, { 
          endpoint, 
          fullUrl
        });
        
        const response = await fetch(
          fullUrl,
          createAuthFetchOptions()
        );
        
        logger.debug(`Response status for service categories`, { 
          status: response.status, 
          ok: response.ok,
          statusText: response.statusText 
        });

        if (!response.ok) {
          // Handle 429 rate limit gracefully - return cached data if available
          if (response.status === 429) {
            logger.warn("Rate limited on categories fetch, using cached data if available");
            const staleCache = categoriesCache;
            if (staleCache && mountedRef.current) {
              setCategories(staleCache.categories);
              setSummary(staleCache.summary);
              setLoading(false);
              setError(null);
              return staleCache;
            }
            // If no cache, throw error but don't log it as a critical error
            throw new Error("Too many requests. Please try again in a moment.");
          }
          throw new Error(`Failed to fetch service categories: ${response.status} ${response.statusText}`);
        }

        const data: ServiceCategoriesResponse = await response.json();
        
        logger.debug(`Received service categories response`, { 
          success: data.success,
          hasData: !!data.data,
          dataLength: data.data?.length ?? 0,
          hasSummary: !!data.summary
        });
        
        let categoriesData: ServiceCategory[] = [];

        // Handle API response structure: {success: true, message: "...", data: [...], summary: {...}}
        if (data.success && data.data && Array.isArray(data.data)) {
          categoriesData = data.data;
          logger.debug(`Found service categories in response.data`, { count: categoriesData.length });
        } else if (Array.isArray(data)) {
          // Fallback if response is directly an array
          logger.debug(`Received service categories as direct array`, { count: data.length });
          categoriesData = data as unknown as ServiceCategory[];
        } else {
          logger.warn("Unexpected service categories response format", { 
            hasData: !!data, 
            dataType: typeof data,
            isArray: Array.isArray(data),
            dataKeys: data ? Object.keys(data) : []
          });
        }
        
        logger.debug(`Processed service categories`, { count: categoriesData.length });

        // Update cache
        const cachedResult: CachedCategories = {
          categories: categoriesData,
          summary: data.summary,
          timestamp: Date.now(),
        };
        categoriesCache = cachedResult;

        // Update state if component is still mounted
        if (mountedRef.current) {
          setCategories(categoriesData);
          setSummary(data.summary);
          setLoading(false);
          setError(null);
        }

        return cachedResult;
      } catch (error) {
        // Only log as error if it's not a 429 (which we already handled)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes("Too many requests")) {
          logger.error("Error fetching service categories", error instanceof Error ? error : new Error(errorMessage));
        }

        // Try to use cached data on error
        const staleCache = categoriesCache;
        if (staleCache && mountedRef.current) {
          setCategories(staleCache.categories);
          setSummary(staleCache.summary);
          setLoading(false);
          setError(null);
          return staleCache;
        }

        if (mountedRef.current) {
          setError(errorMessage);
          setCategories([]);
          setSummary(undefined);
          setLoading(false);
        }

        return null;
      } finally {
        activeCategoriesRequest = null;
      }
    })();

    activeCategoriesRequest = requestPromise;
    await requestPromise;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchCategories();
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchCategories]);

  return {
    categories,
    summary,
    loading,
    error,
    refetch: fetchCategories,
  };
}

