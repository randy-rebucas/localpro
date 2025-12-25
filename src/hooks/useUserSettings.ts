/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/user-settings/hooks/useUserSettings' instead.
 */
export * from '@/features/user-settings/hooks/useUserSettings';
import { useState, useRef, useCallback, useEffect } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { UserSettings } from "@/types/user-settings";
import { defaultUserSettings } from "@/types/user-settings";

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchSettings = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.settingsUser}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        // If settings don't exist, use defaults
        if (response.status === 404) {
          if (mountedRef.current) {
            setSettings(defaultUserSettings);
            setLoading(false);
          }
          return;
        }
        throw new Error(`Failed to fetch user settings: ${response.status}`);
      }

      const data = await response.json();
      const settingsData = data?.data || data?.settings || data;

      // Merge with defaults to ensure all required fields are present
      const mergedSettings: UserSettings = {
        ...defaultUserSettings,
        ...settingsData,
        privacy: {
          ...defaultUserSettings.privacy,
          ...(settingsData?.privacy || {}),
        },
        notifications: {
          push: {
            ...defaultUserSettings.notifications.push,
            ...(settingsData?.notifications?.push || {}),
          },
          email: {
            ...defaultUserSettings.notifications.email,
            ...(settingsData?.notifications?.email || {}),
          },
          sms: {
            ...defaultUserSettings.notifications.sms,
            ...(settingsData?.notifications?.sms || {}),
          },
        },
        communication: {
          ...defaultUserSettings.communication,
          ...(settingsData?.communication || {}),
          autoReply: {
            ...defaultUserSettings.communication.autoReply,
            ...(settingsData?.communication?.autoReply || {}),
          },
        },
        service: {
          ...defaultUserSettings.service,
          ...(settingsData?.service || {}),
          workingHours: {
            ...defaultUserSettings.service.workingHours,
            ...(settingsData?.service?.workingHours || {}),
          },
          emergencyService: {
            ...defaultUserSettings.service.emergencyService,
            ...(settingsData?.service?.emergencyService || {}),
          },
        },
        payment: {
          ...defaultUserSettings.payment,
          ...(settingsData?.payment || {}),
          autoWithdraw: {
            ...defaultUserSettings.payment.autoWithdraw,
            ...(settingsData?.payment?.autoWithdraw || {}),
          },
          invoiceSettings: {
            ...defaultUserSettings.payment.invoiceSettings,
            ...(settingsData?.payment?.invoiceSettings || {}),
          },
        },
        security: {
          ...defaultUserSettings.security,
          ...(settingsData?.security || {}),
          twoFactorAuth: {
            ...defaultUserSettings.security.twoFactorAuth,
            ...(settingsData?.security?.twoFactorAuth || {}),
          },
          loginAlerts: {
            ...defaultUserSettings.security.loginAlerts,
            ...(settingsData?.security?.loginAlerts || {}),
          },
          passwordChangeReminder: {
            ...defaultUserSettings.security.passwordChangeReminder,
            ...(settingsData?.security?.passwordChangeReminder || {}),
          },
        },
        app: {
          ...defaultUserSettings.app,
          ...(settingsData?.app || {}),
          soundEffects: {
            ...defaultUserSettings.app.soundEffects,
            ...(settingsData?.app?.soundEffects || {}),
          },
          hapticFeedback: {
            ...defaultUserSettings.app.hapticFeedback,
            ...(settingsData?.app?.hapticFeedback || {}),
          },
          autoSave: {
            ...defaultUserSettings.app.autoSave,
            ...(settingsData?.app?.autoSave || {}),
          },
          dataUsage: {
            ...defaultUserSettings.app.dataUsage,
            ...(settingsData?.app?.dataUsage || {}),
          },
        },
        analytics: {
          ...defaultUserSettings.analytics,
          ...(settingsData?.analytics || {}),
        },
      };

      if (mountedRef.current) {
        setSettings(mergedSettings);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching user settings", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        // Use defaults on error
        setSettings(defaultUserSettings);
        setLoading(false);
      }
    }
  }, []);

  const updateSettings = useCallback(async (settingsData: Partial<UserSettings>) => {
    if (!mountedRef.current) return null;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.settingsUser}`;
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
        throw new Error(errorData.message || errorData.error || `Failed to update user settings: ${response.status}`);
      }

      const data = await response.json();
      const updatedSettings = data?.data || data?.settings || data;

      // Merge with current settings to preserve structure
      const mergedSettings: UserSettings = settings
        ? {
            ...defaultUserSettings,
            ...settings,
            ...updatedSettings,
          }
        : (updatedSettings as UserSettings);

      if (mountedRef.current) {
        setSettings(mergedSettings);
        setLoading(false);
        return mergedSettings;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error updating user settings", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setLoading(false);
      }
      throw err;
    }
  }, [settings]);

  const updateCategory = useCallback(async (category: keyof UserSettings, categoryData: Partial<UserSettings[keyof UserSettings]>) => {
    if (!mountedRef.current || !settings) return null;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.settingsUserCategory}/${category}`;
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
        throw new Error(errorData.message || errorData.error || `Failed to update user settings category: ${response.status}`);
      }

      const data = await response.json();
      const updatedCategory = data?.data || data?.settings?.[category] || categoryData;

      // Merge with current settings
      const mergedSettings: UserSettings = {
        ...settings,
        [category]: {
          ...(settings[category] as object),
          ...updatedCategory,
        },
      } as UserSettings;

      if (mountedRef.current) {
        setSettings(mergedSettings);
        setLoading(false);
        return mergedSettings;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error updating user settings category", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setLoading(false);
      }
      throw err;
    }
  }, [settings]);

  const resetSettings = useCallback(async () => {
    if (!mountedRef.current) return null;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.settingsUserReset}`;
      const response = await fetch(url, {
        ...createAuthFetchOptions(),
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Failed to reset user settings: ${response.status}`);
      }

      const data = await response.json();
      const resetSettings = data?.data || data?.settings || defaultUserSettings;

      if (mountedRef.current) {
        setSettings(resetSettings);
        setLoading(false);
        return resetSettings;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error resetting user settings", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setLoading(false);
      }
      throw err;
    }
  }, []);

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
    resetSettings,
  };
}

