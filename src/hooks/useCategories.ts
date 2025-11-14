"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { ServiceCategory } from "@/components/marketplace/categories-carousel";
import { JobCategory } from "@/types/jobs";

export type CategoryType = 'service' | 'job';

// Global request deduplication and caching - separate caches for each type
interface CachedCategories {
  categories: ServiceCategory[];
  timestamp: number;
}

const categoriesCache: Map<CategoryType, CachedCategories> = new Map();
const activeCategoriesRequests: Map<CategoryType, Promise<CachedCategories | null>> = new Map();
const CACHE_DURATION = 60000; // 60 seconds cache (categories change less frequently)

interface CategoriesResponse {
  success?: boolean;
  message?: string;
  data?: ServiceCategory[] | JobCategory[];
  categories?: ServiceCategory[] | JobCategory[];
  summary?: {
    totalCategories: number;
    totalServices?: number;
    totalJobs?: number;
    totalProviders?: number;
    categoriesWithServices?: number;
  };
}

interface UseCategoriesOptions {
  type?: CategoryType;
}

// Convert JobCategory to ServiceCategory format for compatibility
function convertJobCategoryToServiceCategory(jobCat: JobCategory): ServiceCategory {
  return {
    key: jobCat._id || jobCat.name.toLowerCase().replace(/\s+/g, '-'),
    id: jobCat._id,
    name: jobCat.name,
    description: jobCat.description,
    icon: jobCat.metadata?.icon,
    slug: jobCat.name.toLowerCase().replace(/\s+/g, '-'),
  };
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const categoryType: CategoryType = options.type || 'service';
  const cached = categoriesCache.get(categoryType);
  
  const [categories, setCategories] = useState<ServiceCategory[]>(cached?.categories || []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchCategories = useCallback(async () => {
    const now = Date.now();
    const cached = categoriesCache.get(categoryType);

    // Check cache first
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      if (mountedRef.current) {
        setCategories(cached.categories);
        setLoading(false);
        setError(null);
      }
      return;
    }

    // Check if there's already a request in progress for this category type
    const activeRequest = activeCategoriesRequests.get(categoryType);
    if (activeRequest) {
      try {
        const cachedResult = await activeRequest;
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
        const recheckCache = categoriesCache.get(categoryType);
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

        // Determine endpoint based on category type
        const endpoint = categoryType === 'job' 
          ? API_ENDPOINTS.jobsCategories 
          : API_ENDPOINTS.marketplaceServicesCategories;
      
        const fullUrl = `${API_BASE_URL}${endpoint}`;
        logger.debug(`Fetching ${categoryType} categories`, { 
          endpoint, 
          fullUrl,
          categoryType 
        });
        
        const response = await fetch(
          fullUrl,
          createAuthFetchOptions()
        );
        
        logger.debug(`Response status for ${categoryType} categories`, { 
          status: response.status, 
          ok: response.ok,
          statusText: response.statusText 
        });

        if (!response.ok) {
          // Handle 429 rate limit gracefully - return cached data if available
          if (response.status === 429) {
            logger.warn("Rate limited on categories fetch, using cached data if available", { categoryType });
            const staleCache = categoriesCache.get(categoryType);
            if (staleCache && mountedRef.current) {
              setCategories(staleCache.categories);
              setLoading(false);
              setError(null);
              return staleCache;
            }
            // If no cache, throw error but don't log it as a critical error
            throw new Error("Too many requests. Please try again in a moment.");
          }
          throw new Error(`Failed to fetch ${categoryType} categories: ${response.status} ${response.statusText}`);
        }

        const data: CategoriesResponse | ServiceCategory[] | JobCategory[] = await response.json();
        
        logger.debug(`Received ${categoryType} categories response`, { 
          isArray: Array.isArray(data),
          hasData: !!(data && typeof data === 'object'),
          dataKeys: !Array.isArray(data) && data ? Object.keys(data) : [],
          dataLength: Array.isArray(data) ? data.length : (data && typeof data === 'object' && 'data' in data && Array.isArray((data as CategoriesResponse).data)) ? ((data as CategoriesResponse).data?.length ?? 0) : 0
        });
        
        let categoriesData: ServiceCategory[] = [];

        // Handle API response structure: {success: true, data: [...]} or {categories: [...]}
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
          const responseData = data as CategoriesResponse;
          
          // Check for data array
          if (responseData.data && Array.isArray(responseData.data)) {
            logger.debug(`Found ${categoryType} categories in response.data`, { count: responseData.data.length });
            // Convert JobCategory[] to ServiceCategory[] if needed
            if (categoryType === 'job') {
              categoriesData = (responseData.data as JobCategory[])
                .filter(cat => cat.isActive !== false)
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .map(convertJobCategoryToServiceCategory);
            } else {
              categoriesData = responseData.data as ServiceCategory[];
            }
          } 
          // Check for categories array
          else if (responseData.categories && Array.isArray(responseData.categories)) {
            logger.debug(`Found ${categoryType} categories in response.categories`, { count: responseData.categories.length });
            // Convert JobCategory[] to ServiceCategory[] if needed
            if (categoryType === 'job') {
              categoriesData = (responseData.categories as JobCategory[])
                .filter(cat => cat.isActive !== false)
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .map(convertJobCategoryToServiceCategory);
            } else {
              categoriesData = responseData.categories as ServiceCategory[];
            }
          } 
          // Check for direct array in response (some APIs might return { categories: [...] } or { jobs: [...] })
          else {
            // Try to find any array property in the response
            const responseDataRecord = responseData as Record<string, unknown>;
            const arrayKey = Object.keys(responseDataRecord).find(key => 
              Array.isArray(responseDataRecord[key])
            );
            
            if (arrayKey) {
              const arrayValue = responseDataRecord[arrayKey];
              logger.debug(`Found ${categoryType} categories in response.${arrayKey}`, { 
                count: Array.isArray(arrayValue) ? arrayValue.length : 0
              });
              if (categoryType === 'job' && Array.isArray(arrayValue)) {
                categoriesData = (arrayValue as JobCategory[])
                  .filter(cat => cat.isActive !== false)
                  .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                  .map(convertJobCategoryToServiceCategory);
              } else if (Array.isArray(arrayValue)) {
                categoriesData = arrayValue as ServiceCategory[];
              }
            } else {
              logger.warn("Categories response data is not an array", { 
                data: responseData, 
                categoryType,
                availableKeys: Object.keys(responseData)
              });
            }
          }
        } else if (Array.isArray(data)) {
          // Fallback if response is directly an array
          logger.debug(`Received ${categoryType} categories as direct array`, { count: data.length });
          if (categoryType === 'job') {
            categoriesData = (data as JobCategory[])
              .filter(cat => cat.isActive !== false)
              .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
              .map(convertJobCategoryToServiceCategory);
          } else {
            categoriesData = data as ServiceCategory[];
          }
        } else {
          logger.warn("Unexpected categories response format", { 
            hasData: !!data, 
            categoryType,
            dataType: typeof data,
            isArray: Array.isArray(data)
          });
        }
        
        logger.debug(`Processed ${categoryType} categories`, { count: categoriesData.length });

        // Update cache
        const cachedResult: CachedCategories = {
          categories: categoriesData,
          timestamp: Date.now(),
        };
        categoriesCache.set(categoryType, cachedResult);

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
          logger.error("Error fetching categories", error instanceof Error ? error : new Error(errorMessage), { categoryType });
        }

        // Try to use cached data on error
        const staleCache = categoriesCache.get(categoryType);
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
        activeCategoriesRequests.delete(categoryType);
      }
    })();

    activeCategoriesRequests.set(categoryType, requestPromise);
    await requestPromise;
  }, [categoryType]);

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

