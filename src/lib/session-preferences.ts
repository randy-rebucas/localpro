/**
 * Utility functions for managing session preferences (roleView and package)
 * These preferences are stored in user settings and synced with the session
 */

import { API_BASE_URL, API_ENDPOINTS } from "./api";
import { createAuthFetchOptions } from "./auth-utils";
import { logger } from "./logger";
import type { AppPackage } from "@/shared/types/app-package";

/**
 * Update roleView preference in user settings
 */
export async function updateRoleViewPreference(roleView: string): Promise<void> {
  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.settingsUser}`;
    const response = await fetch(url, {
      ...createAuthFetchOptions({
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app: {
            roleView,
          },
        }),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `Failed to update roleView: ${response.status}`;
      logger.error("Failed to update roleView preference", new Error(errorMessage), { 
        status: response.status,
        roleView 
      });
      throw new Error(errorMessage);
    }

    logger.debug("RoleView preference updated successfully", { roleView });
  } catch (error) {
    // Log the error but don't throw - allow localStorage fallback to work
    logger.error("Error updating roleView preference", error instanceof Error ? error : new Error(String(error)), {
      roleView
    });
  }
}

/**
 * Update package preference in user settings
 */
export async function updatePackagePreference(pkg: AppPackage): Promise<void> {
  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.settingsUser}`;
    const response = await fetch(url, {
      ...createAuthFetchOptions({
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app: {
            package: pkg,
          },
        }),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Failed to update package: ${response.status}`);
    }

    logger.debug("Package preference updated", { package: pkg });
  } catch (error) {
    logger.error("Error updating package preference", error instanceof Error ? error : new Error(String(error)));
    // Don't throw - allow localStorage fallback to work
  }
}

/**
 * Update both roleView and package preferences in a single request
 */
export async function updateSessionPreferences(roleView?: string, pkg?: AppPackage): Promise<void> {
  try {
    const updates: { roleView?: string; package?: AppPackage } = {};
    if (roleView !== undefined) {
      updates.roleView = roleView;
    }
    if (pkg !== undefined) {
      updates.package = pkg;
    }

    if (Object.keys(updates).length === 0) {
      return; // Nothing to update
    }

    const url = `${API_BASE_URL}${API_ENDPOINTS.settingsUser}`;
    const response = await fetch(url, {
      ...createAuthFetchOptions({
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app: updates,
        }),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Failed to update session preferences: ${response.status}`);
    }

    logger.debug("Session preferences updated", updates);
  } catch (error) {
    logger.error("Error updating session preferences", error instanceof Error ? error : new Error(String(error)));
    // Don't throw - allow localStorage fallback to work
  }
}

/**
 * Get roleView and package from user settings
 */
export async function getSessionPreferences(): Promise<{ roleView?: string; package?: AppPackage } | null> {
  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.settingsUser}`;
    const response = await fetch(url, {
      ...createAuthFetchOptions({
        method: "GET",
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const settings = data?.data || data;
    const appSettings = settings?.app;

    if (!appSettings) {
      return null;
    }

    return {
      roleView: appSettings.roleView,
      package: appSettings.package ?? null,
    };
  } catch (error) {
    logger.error("Error fetching session preferences", error instanceof Error ? error : new Error(String(error)));
    return null;
  }
}

