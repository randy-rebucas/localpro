/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/app-settings/hooks/useAppSettings' instead.
 */
export * from '@/features/app-settings/hooks/useAppSettings';
import { useState, useRef, useCallback, useEffect } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { AppSettings } from "@/types/app-settings";

interface UseAppSettingsOptions {
  usePublicEndpoint?: boolean; // Use public endpoint (no auth required)
}

export function useAppSettings(options: UseAppSettingsOptions = {}) {
  const { usePublicEndpoint = true } = options;
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchSettings = useCallback(async (retryAttempt = 0): Promise<void> => {
    if (!mountedRef.current) return;

    // Rate limiting: Don't fetch more than once per 5 seconds
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    if (timeSinceLastFetch < 5000 && retryAttempt === 0) {
      // If we recently fetched and this is not a retry, skip
      return;
    }

    // Capture endpoint info for error logging
    const useAuth = !usePublicEndpoint && getApiToken();
    const endpoint = useAuth ? API_ENDPOINTS.settingsApp : API_ENDPOINTS.settingsAppPublic;
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      setLoading(true);
      setError(null);
      
      // Validate API_BASE_URL before making request
      if (!API_BASE_URL || typeof API_BASE_URL !== 'string' || API_BASE_URL.trim() === '') {
        throw new Error('API base URL is not configured. Please check your environment variables.');
      }
      
      const fetchOptions = useAuth 
        ? createAuthFetchOptions()
        : { method: "GET" };

      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      let response: Response;
      try {
        response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // Handle network errors specifically
        if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
          // Network error - could be CORS, server down, or connectivity issue
          const errorMessage = `Unable to connect to the server. Please check your internet connection and ensure the API server is running at ${API_BASE_URL}`;
          throw new Error(errorMessage);
        } else if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Request timed out. The server may be slow or unavailable.');
        }
        // Re-throw other errors
        throw fetchError;
      }

      if (!response.ok) {
        // Handle 429 (Rate Limit) with exponential backoff retry
        if (response.status === 429) {
          const maxRetries = 3;
          if (retryAttempt < maxRetries) {
            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, retryAttempt) * 1000;
            logger.warn(`Rate limited (429), retrying in ${delay}ms (attempt ${retryAttempt + 1}/${maxRetries})`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            
            if (mountedRef.current) {
              return fetchSettings(retryAttempt + 1);
            }
            return;
          } else {
            // Max retries reached, use cached settings if available
            logger.warn("Rate limit exceeded, max retries reached. Using cached settings if available.");
            if (mountedRef.current && settings) {
              // Keep existing settings, don't show error
              setLoading(false);
              return;
            }
            throw new Error(`Rate limit exceeded. Please try again later.`);
          }
        }

        // If 403 and we tried auth endpoint, fall back to public
        if (response.status === 403 && useAuth) {
          logger.warn("Admin endpoint returned 403, falling back to public endpoint");
          const publicUrl = `${API_BASE_URL}${API_ENDPOINTS.settingsAppPublic}`;
          
          // Add timeout to fallback request too
          const fallbackController = new AbortController();
          const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 10000);
          
          let publicResponse: Response;
          try {
            publicResponse = await fetch(publicUrl, { 
              method: "GET",
              signal: fallbackController.signal,
            });
            clearTimeout(fallbackTimeoutId);
          } catch (fallbackError) {
            clearTimeout(fallbackTimeoutId);
            if (fallbackError instanceof TypeError && fallbackError.message === 'Failed to fetch') {
              throw new Error(`Unable to connect to the server at ${API_BASE_URL}. Please check your internet connection.`);
            } else if (fallbackError instanceof Error && fallbackError.name === 'AbortError') {
              throw new Error('Request timed out. The server may be slow or unavailable.');
            }
            throw fallbackError;
          }
          
          if (!publicResponse.ok) {
            // Handle 429 on fallback too
            if (publicResponse.status === 429) {
              throw new Error(`Rate limit exceeded. Please try again later.`);
            }
            throw new Error(`Failed to fetch app settings: ${publicResponse.status}`);
          }
          
          const publicData = await publicResponse.json();
          const publicSettingsData = publicData?.data || publicData?.settings || publicData;
          
          if (mountedRef.current) {
            setSettings(publicSettingsData);
            setLoading(false);
            lastFetchTimeRef.current = Date.now();
            retryCountRef.current = 0;
          }
          return;
        }
        
        throw new Error(`Failed to fetch app settings: ${response.status}`);
      }

      const data = await response.json();
      const settingsData = data?.data || data?.settings || data;

      if (mountedRef.current) {
        setSettings(settingsData);
        setLoading(false);
        lastFetchTimeRef.current = Date.now();
        retryCountRef.current = 0;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const error = err instanceof Error ? err : new Error(errorMessage);
      
      // Handle different error types
      if (errorMessage.includes("429") || errorMessage.includes("Rate limit")) {
        // Don't log 429 as critical error - it's expected in high traffic
        logger.warn("Rate limit hit when fetching app settings", { 
          retryAttempt,
          hasCachedSettings: !!settings 
        });
        
        if (mountedRef.current) {
          // If we have cached settings, don't show error
          if (settings) {
            setError(null);
            setLoading(false);
            return;
          }
          setError("Rate limit exceeded. Please try again in a moment.");
          setLoading(false);
        }
      } else if (errorMessage.includes("403")) {
        // 403 is expected for non-admin users, so we log as warning
        logger.warn("App settings endpoint requires admin access, using public endpoint", { error: error.message });
        
        if (mountedRef.current) {
          setError(errorMessage);
          setLoading(false);
        }
      } else if (errorMessage.includes("Unable to connect") || errorMessage.includes("timed out") || errorMessage.includes("Failed to fetch")) {
        // Network errors - log with context for debugging
        logger.error("Network error fetching app settings", error, {
          url,
          endpoint,
          apiBaseUrl: API_BASE_URL,
          retryAttempt,
          hasCachedSettings: !!settings,
        });
        
        if (mountedRef.current) {
          // If we have cached settings, don't show error to user
          if (settings) {
            logger.info("Using cached app settings due to network error");
            setError(null);
            setLoading(false);
            return;
          }
          setError(errorMessage);
          setLoading(false);
        }
      } else {
        // Other errors
        logger.error("Error fetching app settings", error, {
          url,
          endpoint,
          apiBaseUrl: API_BASE_URL,
          retryAttempt,
        });
        
        if (mountedRef.current) {
          setError(errorMessage);
          // Don't set settings to null on error - keep previous settings if available
          // This prevents UI from breaking if settings were previously loaded
          setLoading(false);
        }
      }
    }
  }, [usePublicEndpoint, settings]);

  const updateSettings = useCallback(async (settingsData: Partial<AppSettings>) => {
    if (!mountedRef.current) return null;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.settingsAppUpdate}`;
      const response = await fetch(url, {
        ...createAuthFetchOptions(),
        method: "PUT",
        headers: {
          ...createAuthFetchOptions().headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to update app settings: ${response.status}`);
      }

      const data = await response.json();
      const updatedSettings = data?.data || data?.settings || data;

      // Merge with existing settings if available
      const mergedSettings: AppSettings = settings
        ? {
            ...settings,
            ...updatedSettings,
          }
        : (updatedSettings as AppSettings);

      if (mountedRef.current) {
        setSettings(mergedSettings);
        setLoading(false);
        return mergedSettings;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error updating app settings", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setLoading(false);
      }
      throw err;
    }
  }, [settings]);

  const updateCategory = useCallback(async (category: string, categoryData: Partial<AppSettings>) => {
    if (!mountedRef.current) return null;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.settingsAppCategory}/${category}`;
      const response = await fetch(url, {
        ...createAuthFetchOptions(),
        method: "PATCH",
        headers: {
          ...createAuthFetchOptions().headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to update app settings category: ${response.status}`);
      }

      const data = await response.json();
      const updatedSettings = data?.data || data?.settings || data;

      // Merge with existing settings if available
      const mergedSettings: AppSettings = settings
        ? {
            ...settings,
            ...updatedSettings,
          }
        : (updatedSettings as AppSettings);

      if (mountedRef.current) {
        setSettings(mergedSettings);
        setLoading(false);
        return mergedSettings;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error updating app settings category", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setLoading(false);
      }
      throw err;
    }
  }, [settings]);

  useEffect(() => {
    mountedRef.current = true;
    fetchSettings();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    updateSettings,
    updateCategory,
  };
}

