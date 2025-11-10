"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

  const fetchSettings = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      // Use public endpoint by default (no auth required)
      // Only use authenticated endpoint if explicitly requested and user has token
      const useAuth = !usePublicEndpoint && getApiToken();
      const endpoint = useAuth ? API_ENDPOINTS.settingsApp : API_ENDPOINTS.settingsAppPublic;
      const url = `${API_BASE_URL}${endpoint}`;
      
      const fetchOptions = useAuth 
        ? createAuthFetchOptions()
        : { method: "GET" };

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        // If 403 and we tried auth endpoint, fall back to public
        if (response.status === 403 && useAuth) {
          logger.warn("Admin endpoint returned 403, falling back to public endpoint");
          const publicUrl = `${API_BASE_URL}${API_ENDPOINTS.settingsAppPublic}`;
          const publicResponse = await fetch(publicUrl, { method: "GET" });
          
          if (!publicResponse.ok) {
            throw new Error(`Failed to fetch app settings: ${publicResponse.status}`);
          }
          
          const publicData = await publicResponse.json();
          const publicSettingsData = publicData?.data || publicData?.settings || publicData;
          
          if (mountedRef.current) {
            setSettings(publicSettingsData);
            setLoading(false);
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
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // Only log as error if it's not a 403 (permission denied)
      // 403 is expected for non-admin users, so we log as warning
      if (errorMessage.includes("403")) {
        const error = err instanceof Error ? err : new Error(errorMessage);
        logger.warn("App settings endpoint requires admin access, using public endpoint", { error: error.message });
      } else {
        logger.error("Error fetching app settings", err instanceof Error ? err : new Error(errorMessage));
      }
      
      if (mountedRef.current) {
        setError(errorMessage);
        // Don't set settings to null on error - keep previous settings if available
        // This prevents UI from breaking if settings were previously loaded
        setLoading(false);
      }
    }
  }, [usePublicEndpoint]);

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

