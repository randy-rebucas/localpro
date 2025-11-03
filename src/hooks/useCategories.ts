"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { ServiceCategory } from "@/components/marketplace/categories-carousel";

// Global request deduplication and caching
interface CachedCategories {
  categories: ServiceCategory[];
  timestamp: number;
}

let categoriesCache: CachedCategories | null = null;
let activeCategoriesRequest: Promise<CachedCategories | null> | null = null;
const CACHE_DURATION = 60000; // 60 seconds cache (categories change less frequently)

interface CategoriesResponse {
  success?: boolean;
  message?: string;
  data?: ServiceCategory[];
  summary?: {
    totalCategories: number;
    totalServices: number;
    totalProviders: number;
    categoriesWithServices: number;
  };
}

export function useCategories() {
  const [categories, setCategories] = useState<ServiceCategory[]>(categoriesCache?.categories || []);
  const [loading, setLoading] = useState(!categoriesCache);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchCategories = useCallback(async () => {
    const now = Date.now();

    // Check cache first
    if (categoriesCache && (now - categoriesCache.timestamp) < CACHE_DURATION) {
      if (mountedRef.current) {
        setCategories(categoriesCache.categories);
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
        if (categoriesCache && (Date.now() - categoriesCache.timestamp) < CACHE_DURATION) {
          if (mountedRef.current) {
            setCategories(categoriesCache.categories);
            setLoading(false);
            setError(null);
          }
          return categoriesCache;
        }

        if (mountedRef.current) {
          setLoading(true);
          setError(null);
        }
      
        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.marketplaceServicesCategories}`,
          createAuthFetchOptions()
        );

        if (!response.ok) {
          // Handle 429 rate limit gracefully - return cached data if available
          if (response.status === 429) {
            logger.warn("Rate limited on categories fetch, using cached data if available");
            if (categoriesCache && mountedRef.current) {
              setCategories(categoriesCache.categories);
              setLoading(false);
              setError(null);
              return categoriesCache;
            }
            // If no cache, throw error but don't log it as a critical error
            throw new Error("Too many requests. Please try again in a moment.");
          }
          throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
        }

        const data: CategoriesResponse | ServiceCategory[] = await response.json();
        
        let categoriesData: ServiceCategory[] = [];

        // Handle API response structure: {success: true, data: [...]}
        if (typeof data === 'object' && data !== null && 'success' in data && (data as CategoriesResponse).success) {
          const responseData = data as CategoriesResponse;
          if (responseData.data && Array.isArray(responseData.data)) {
            categoriesData = responseData.data;
          } else {
            logger.warn("Categories response data is not an array", { data: responseData });
          }
        } else if (Array.isArray(data)) {
          // Fallback if response is directly an array
          categoriesData = data;
        } else {
          logger.warn("Unexpected categories response format", { hasData: !!data });
        }

        // Update cache
        const cachedResult: CachedCategories = {
          categories: categoriesData,
          timestamp: Date.now(),
        };
        categoriesCache = cachedResult;

        // Update state if component is still mounted
        if (mountedRef.current) {
          setCategories(categoriesData);
          setLoading(false);
          setError(null);
        }

        return cachedResult;
      } catch (error) {
        // Only log as error if it's not a 429 (which we already handled)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes("Too many requests")) {
          logger.error("Error fetching categories", error instanceof Error ? error : new Error(errorMessage));
        }

        // Try to use cached data on error
        if (categoriesCache && mountedRef.current) {
          setCategories(categoriesCache.categories);
          setLoading(false);
          setError(null);
          return categoriesCache;
        }

        if (mountedRef.current) {
          setError(errorMessage);
          setCategories([]);
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
    loading,
    error,
    refetch: fetchCategories,
  };
}

