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
  data?: ServiceCategory[] | {
    categories?: ServiceCategory[];
    count?: number;
  };
  categories?: ServiceCategory[];
  summary?: {
    totalCategories: number;
    totalServices?: number;
    totalProviders?: number;
    categoriesWithServices?: number;
  };
}

export function useCategories() {
  const cached = categoriesCache;
  
  const [categories, setCategories] = useState<ServiceCategory[]>(cached?.categories || []);
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
        const recheckCache = categoriesCache;
        if (recheckCache && (Date.now() - recheckCache.timestamp) < CACHE_DURATION) {
          if (mountedRef.current) {
            setCategories(recheckCache.categories);
            setLoading(false);
            setError(null);
          }
          return recheckCache;
        }

        if (mountedRef.current) {
          setLoading(true);
          setError(null);
        }

        const endpoint = API_ENDPOINTS.jobsCategories;
        const fullUrl = `${API_BASE_URL}${endpoint}`;
        logger.debug(`Fetching job categories`, { 
          endpoint, 
          fullUrl
        });
        
        const response = await fetch(
          fullUrl,
          createAuthFetchOptions()
        );
        
        logger.debug(`Response status for job categories`, { 
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
              setLoading(false);
              setError(null);
              return staleCache;
            }
            // If no cache, throw error but don't log it as a critical error
            throw new Error("Too many requests. Please try again in a moment.");
          }
            throw new Error(`Failed to fetch job categories: ${response.status} ${response.statusText}`);
        }

        const data: CategoriesResponse | ServiceCategory[] = await response.json();
        
        // Calculate data length for logging
        let dataLength = 0;
        if (Array.isArray(data)) {
          dataLength = data.length;
        } else if (data && typeof data === 'object' && 'data' in data) {
          const responseData = data as CategoriesResponse;
          if (Array.isArray(responseData.data)) {
            dataLength = responseData.data.length;
          } else if (responseData.data && typeof responseData.data === 'object' && 'categories' in responseData.data) {
            dataLength = (responseData.data as { categories?: ServiceCategory[] }).categories?.length ?? 0;
          }
        }
        
        logger.debug(`Received job categories response`, { 
          isArray: Array.isArray(data),
          hasData: !!(data && typeof data === 'object'),
          dataKeys: !Array.isArray(data) && data ? Object.keys(data) : [],
          dataLength
        });
        
        let categoriesData: ServiceCategory[] = [];

        // Handle API response structure: {success: true, data: {categories: [...], count: number}} or {success: true, data: [...]} or {categories: [...]}
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
          const responseData = data as CategoriesResponse;
          
          // Check for nested structure: { success: true, data: { categories: [...], count: number } }
          if (responseData.data && typeof responseData.data === 'object' && !Array.isArray(responseData.data) && 'categories' in responseData.data) {
            const nestedData = responseData.data as { categories?: ServiceCategory[]; count?: number };
            if (nestedData.categories && Array.isArray(nestedData.categories)) {
              logger.debug(`Found job categories in response.data.categories`, { count: nestedData.categories.length });
              categoriesData = nestedData.categories as ServiceCategory[];
            }
          }
          // Check for data array: { success: true, data: [...] }
          else if (responseData.data && Array.isArray(responseData.data)) {
            logger.debug(`Found job categories in response.data`, { count: responseData.data.length });
            categoriesData = responseData.data as ServiceCategory[];
          } 
          // Check for categories array: { categories: [...] }
          else if (responseData.categories && Array.isArray(responseData.categories)) {
            logger.debug(`Found job categories in response.categories`, { count: responseData.categories.length });
            categoriesData = responseData.categories as ServiceCategory[];
          } 
          // Check for direct array in response
          else {
            // Try to find any array property in the response
            const responseDataRecord = responseData as Record<string, unknown>;
            const arrayKey = Object.keys(responseDataRecord).find(key => 
              Array.isArray(responseDataRecord[key])
            );
            
            if (arrayKey) {
              const arrayValue = responseDataRecord[arrayKey];
              logger.debug(`Found job categories in response.${arrayKey}`, { 
                count: Array.isArray(arrayValue) ? arrayValue.length : 0
              });
              if (Array.isArray(arrayValue)) {
                categoriesData = arrayValue as ServiceCategory[];
              }
            } else {
              logger.warn("Categories response data is not an array", { 
                data: responseData,
                availableKeys: Object.keys(responseData)
              });
            }
          }
        } else if (Array.isArray(data)) {
          // Fallback if response is directly an array
          logger.debug(`Received job categories as direct array`, { count: data.length });
          categoriesData = data as ServiceCategory[];
        } else {
          logger.warn("Unexpected categories response format", { 
            hasData: !!data, 
            dataType: typeof data,
            isArray: Array.isArray(data)
          });
        }
        
        logger.debug(`Processed job categories`, { count: categoriesData.length });

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
          logger.error("Error fetching job categories", error instanceof Error ? error : new Error(errorMessage));
        }

        // Try to use cached data on error
        const staleCache = categoriesCache;
        if (staleCache && mountedRef.current) {
          setCategories(staleCache.categories);
          setLoading(false);
          setError(null);
          return staleCache;
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

