/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/marketplace/hooks/useProviderSkills' instead.
 */
export * from '@/features/marketplace/hooks/useProviderSkills';
import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

// Skill interface matching the API response
export interface SkillCategory {
  id?: string;
  key?: string;
  name?: string;
  description?: string;
  metadata?: {
    color?: string;
    tags?: string[];
  };
}

export interface ProviderSkill {
  id?: string;
  _id?: string;
  name: string;
  description?: string;
  category?: string | SkillCategory;
  displayOrder?: number;
  metadata?: {
    icon?: string;
    tags?: string[];
    [key: string]: unknown;
  };
}

// Global request deduplication and caching per category
interface CachedSkills {
  skills: ProviderSkill[];
  category: string;
  timestamp: number;
}

const skillsCache = new Map<string, CachedSkills>();
const activeSkillsRequests = new Map<string, Promise<CachedSkills | null>>();
// Disable caching in development mode
const CACHE_DURATION = process.env.NODE_ENV === 'development' ? 0 : 300000; // 5 minutes cache (skills change less frequently)

// Clear any existing cache data
skillsCache.clear();
activeSkillsRequests.clear();

interface ProviderSkillsResponse {
  success?: boolean;
  message?: string;
  data?: {
    skills?: ProviderSkill[];
    count?: number;
  } | ProviderSkill[];
  skills?: ProviderSkill[];
  count?: number;
}

export function useProviderSkills(category?: string | null) {
  const cacheKey = category || "all";
  const cached = skillsCache.get(cacheKey);
  
  const [skills, setSkills] = useState<ProviderSkill[]>(cached?.skills || []);
  const [count, setCount] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchSkills = useCallback(async () => {
    if (!category) {
      // If no category provided, clear skills
      if (mountedRef.current) {
        setSkills([]);
        setLoading(false);
        setError(null);
      }
      return;
    }

    const now = Date.now();
    const cached = skillsCache.get(cacheKey);

    // Check cache first
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      if (mountedRef.current) {
        setSkills(cached.skills);
        setLoading(false);
        setError(null);
      }
      return;
    }

    // Check if there's already a request in progress for this category
    const activeRequest = activeSkillsRequests.get(cacheKey);
    if (activeRequest) {
      try {
        const cachedResult = await activeRequest;
        if (cachedResult && mountedRef.current) {
          setSkills(cachedResult.skills);
          setLoading(false);
          setError(null);
        }
        return;
      } catch {
        // If the request failed, continue to make a new one
      }
    }

    // Create new request
    const requestPromise = (async (): Promise<CachedSkills | null> => {
      try {
        if (!mountedRef.current) return null;

        // Re-check cache in case it was updated while waiting
        const recheckCache = skillsCache.get(cacheKey);
        if (recheckCache && (Date.now() - recheckCache.timestamp) < CACHE_DURATION) {
          if (mountedRef.current) {
            setSkills(recheckCache.skills);
            setLoading(false);
            setError(null);
          }
          return recheckCache;
        }

        if (mountedRef.current) {
          setLoading(true);
          setError(null);
        }

        // Build URL with category query parameter
        const endpoint = API_ENDPOINTS.providersSkillsByCategory;
        const queryParams = new URLSearchParams();
        if (category && category.trim() !== '') {
          queryParams.append("category", category.trim());
        }
        const fullUrl = `${API_BASE_URL}${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        
        logger.debug(`Fetching provider skills`, { 
          endpoint, 
          category,
          categoryKey: category,
          queryString: queryParams.toString(),
          fullUrl
        });
        
        const response = await fetch(
          fullUrl,
          createAuthFetchOptions()
        );
        
        logger.debug(`Response status for provider skills`, { 
          status: response.status, 
          ok: response.ok,
          statusText: response.statusText,
          category
        });

        if (!response.ok) {
          // Handle 429 rate limit gracefully - return cached data if available
          if (response.status === 429) {
            logger.warn("Rate limited on skills fetch, using cached data if available", { category });
            const staleCache = skillsCache.get(cacheKey);
            if (staleCache && mountedRef.current) {
              setSkills(staleCache.skills);
              setLoading(false);
              setError(null);
              return staleCache;
            }
            // If no cache, throw error but don't log it as a critical error
            throw new Error("Too many requests. Please try again in a moment.");
          }
          throw new Error(`Failed to fetch provider skills: ${response.status} ${response.statusText}`);
        }

        const data: ProviderSkillsResponse = await response.json();
        
        logger.debug(`Received provider skills response`, { 
          success: data.success,
          hasData: !!data.data,
          hasSkills: !!data.skills,
          category,
          dataKeys: data ? Object.keys(data) : [],
          dataDataType: data.data ? typeof data.data : 'undefined',
          dataDataIsArray: Array.isArray(data.data),
          dataDataKeys: data.data && typeof data.data === 'object' && !Array.isArray(data.data) ? Object.keys(data.data) : []
        });
        
        let skillsData: ProviderSkill[] = [];
        let skillsCount: number | undefined = undefined;

        // Handle API response structure: {success: true, data: {skills: [...], count: number}}
        if (data.success && data.data) {
          if (Array.isArray(data.data)) {
            // Fallback: data is directly an array
            logger.debug("Skills data is directly an array", { count: data.data.length });
            skillsData = data.data;
          } else if (typeof data.data === 'object' && data.data !== null && 'skills' in data.data) {
            // Expected structure: data.skills array with count
            const dataObj = data.data as { skills?: ProviderSkill[]; count?: number };
            if (Array.isArray(dataObj.skills)) {
              logger.debug("Found skills in data.skills", { 
                skillsCount: dataObj.skills.length,
                totalCount: dataObj.count 
              });
              skillsData = dataObj.skills;
              skillsCount = dataObj.count;
            } else {
              logger.warn("data.skills is not an array", { 
                dataObjKeys: Object.keys(dataObj),
                skillsType: typeof dataObj.skills
              });
            }
          }
        } else if (data.skills && Array.isArray(data.skills)) {
          // Alternative structure: skills at root level
          logger.debug("Found skills at root level", { count: data.skills.length });
          skillsData = data.skills;
          skillsCount = data.count;
        } else if (Array.isArray(data)) {
          // Fallback if response is directly an array
          logger.debug("Response is directly an array", { count: data.length });
          skillsData = data as unknown as ProviderSkill[];
        } else {
          logger.warn("Unexpected provider skills response format", { 
            hasData: !!data, 
            dataType: typeof data,
            isArray: Array.isArray(data),
            dataKeys: data ? Object.keys(data) : [],
            category,
            rawData: JSON.stringify(data).substring(0, 200) // First 200 chars for debugging
          });
        }

        // Normalize skills to ensure they have a name property
        const normalizedSkills: ProviderSkill[] = skillsData.map((skill: ProviderSkill | string) => {
          if (typeof skill === 'string') {
            return { name: skill, category: category || undefined };
          }
          return {
            ...skill,
            name: skill.name || (skill as unknown as { value?: string }).value || '',
            // If category is a string, keep it; if it's an object, keep the object
            category: skill.category || category || undefined,
          };
        }).filter(skill => skill.name); // Filter out skills without names
        
        logger.debug(`Processed provider skills`, { 
          count: normalizedSkills.length,
          category
        });

        // Update cache
        const cachedResult: CachedSkills = {
          skills: normalizedSkills,
          category: cacheKey,
          timestamp: Date.now(),
        };
        skillsCache.set(cacheKey, cachedResult);

        // Update state if component is still mounted
        if (mountedRef.current) {
          setSkills(normalizedSkills);
          setCount(skillsCount);
          setLoading(false);
          setError(null);
        }

        return cachedResult;
      } catch (error) {
        // Only log as error if it's not a 429 (which we already handled)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes("Too many requests")) {
          logger.error("Error fetching provider skills", error instanceof Error ? error : new Error(errorMessage), { category });
        }

        // Try to use cached data on error
        const staleCache = skillsCache.get(cacheKey);
        if (staleCache && mountedRef.current) {
          setSkills(staleCache.skills);
          setLoading(false);
          setError(null);
          return staleCache;
        }

        if (mountedRef.current) {
          setError(errorMessage);
          setSkills([]);
          setLoading(false);
        }

        return null;
      } finally {
        activeSkillsRequests.delete(cacheKey);
      }
    })();

    activeSkillsRequests.set(cacheKey, requestPromise);
    await requestPromise;
  }, [category, cacheKey]);

  useEffect(() => {
    mountedRef.current = true;
    fetchSkills();
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchSkills]);

  return {
    skills,
    count,
    loading,
    error,
    refetch: fetchSkills,
  };
}

