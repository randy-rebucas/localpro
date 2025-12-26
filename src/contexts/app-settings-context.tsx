"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useAppSettings } from "@/features/app-settings/hooks/useAppSettings";
import type { AppSettings } from "@/types/app-settings";

interface AppSettingsContextValue {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateSettings: (settingsData: Partial<AppSettings>) => Promise<AppSettings | null>;
  updateCategory: (category: string, categoryData: Partial<AppSettings>) => Promise<AppSettings | null>;
}

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);

/**
 * Provider that makes app settings available throughout the entire app.
 * Settings are fetched once and shared across all components.
 */
export function AppSettingsContextProvider({ children }: { children: React.ReactNode }) {
  const {
    settings,
    loading,
    error,
    refetch,
    updateSettings,
    updateCategory,
  } = useAppSettings({ usePublicEndpoint: true });

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      settings,
      loading,
      error,
      refetch,
      updateSettings,
      updateCategory,
    }),
    [settings, loading, error, refetch, updateSettings, updateCategory]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

/**
 * Hook to access the AppSettingsContext.
 * Use this to get app settings throughout the app.
 * 
 * @example
 * ```tsx
 * const { settings, loading } = useAppSettingsContext();
 * const isMarketplaceEnabled = settings?.features?.marketplace?.enabled;
 * ```
 */
export function useAppSettingsContext() {
  const ctx = useContext(AppSettingsContext);
  if (ctx === undefined) {
    throw new Error("useAppSettingsContext must be used within an AppSettingsContextProvider");
  }
  return ctx;
}

