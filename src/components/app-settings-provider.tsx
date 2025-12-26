"use client";

import { MaintenanceMode } from "@/components/maintenance-mode";
import { ForceUpdate } from "@/components/force-update";
import { AppSettingsContextProvider } from "@/contexts/app-settings-context";

/**
 * AppSettingsProvider: Makes app settings available throughout the entire app
 * - Wraps the app with AppSettingsContextProvider for settings access
 * - Renders global components: MaintenanceMode and ForceUpdate
 * - Available in all routes: authenticated, public, admin, auth
 * - Use via: useAppSettingsContext() or useAppSettings()
 */
export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppSettingsContextProvider>
      {children}
      <MaintenanceMode />
      <ForceUpdate />
    </AppSettingsContextProvider>
  );
}

