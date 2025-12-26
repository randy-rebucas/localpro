"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { updateRoleViewPreference, getSessionPreferences } from "@/lib/session-preferences";

type RoleView = string;

interface RoleViewContextValue {
  roleView: RoleView | null;
  setRoleView: (view: RoleView | null) => void;
  clearRoleView: () => void;
  hasRoleView: boolean;
  isClientView: boolean;
  isProviderView: boolean;
  isLoading: boolean;
}

const ROLE_VIEW_KEY = "roleView";
const ROLE_VIEW_EVENT = "localpro:role-view:changed";

const RoleViewContext = createContext<RoleViewContextValue | undefined>(undefined);

function normalizeRoleView(raw: string | null): RoleView | null {
  if (!raw) return null;
  // Accept any non-empty string as valid roleView
  // Validation against userRoles should be done by consumers
  return raw.trim() || null;
}

async function readFromStorage(): Promise<RoleView | null> {
  if (typeof window === "undefined") return null;
  
  // First try to get from backend session preferences
  try {
    const preferences = await getSessionPreferences();
    if (preferences?.roleView) {
      const normalized = normalizeRoleView(preferences.roleView);
      if (normalized) {
        // Sync to localStorage for faster access
        writeToStorageSync(normalized);
        return normalized;
      }
    }
  } catch {
    // Fallback to localStorage if backend fetch fails
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(ROLE_VIEW_KEY);
    const normalized = normalizeRoleView(raw);
    if (normalized) return normalized;
  } catch {
    // ignore storage errors
  }

  // Migration / fallback: if an older build stored the value in sessionStorage,
  // read it once and persist into localStorage.
  try {
    const raw = sessionStorage.getItem(ROLE_VIEW_KEY);
    const normalized = normalizeRoleView(raw);
    if (normalized) {
      try {
        localStorage.setItem(ROLE_VIEW_KEY, normalized);
      } catch {
        // ignore
      }
      return normalized;
    }
  } catch {
    // ignore
  }

  return null;
}

function writeToStorageSync(roleView: RoleView | null): void {
  if (typeof window === "undefined") return;
  try {
    if (roleView) {
      localStorage.setItem(ROLE_VIEW_KEY, roleView);
    } else {
      localStorage.removeItem(ROLE_VIEW_KEY);
    }
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}

export function RoleViewProvider({ children }: { children: React.ReactNode }) {
  // Initialize synchronously from localStorage for immediate UI (before backend fetch)
  // This ensures roleView is available immediately on page load/refresh
  const [roleView, setRoleViewState] = useState<RoleView | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(ROLE_VIEW_KEY);
      return normalizeRoleView(saved);
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initial load from backend/localStorage (matches PackageSwitcherProvider pattern exactly)
  useEffect(() => {
    const initializeRoleView = async () => {
      const saved = await readFromStorage();
      setRoleViewState(saved);
      setIsLoading(false);
    };
    initializeRoleView();
  }, []);

  // Cross-component sync within the same tab.
  // Also listen to `storage` for cross-tab updates.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = async (event: Event) => {
      const custom = event as CustomEvent<{ roleView?: RoleView }>;
      const next = custom.detail?.roleView ?? await readFromStorage();
      setRoleViewState(next);
    };

    window.addEventListener(ROLE_VIEW_EVENT, handler);

    const storageHandler = async (e: StorageEvent) => {
      if (e.key !== ROLE_VIEW_KEY) return;
      // If localStorage changed, also check backend for consistency
      const next = normalizeRoleView(e.newValue);
      if (next) {
        setRoleViewState(next);
      } else {
        // If cleared locally, check backend
        const saved = await readFromStorage();
        setRoleViewState(saved);
      }
    };
    window.addEventListener("storage", storageHandler);

    return () => {
      window.removeEventListener(ROLE_VIEW_EVENT, handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const setRoleView = useCallback((view: RoleView | null) => {
    if (view === null) {
      // Clear role view
      if (typeof window !== "undefined") {
        localStorage.removeItem(ROLE_VIEW_KEY);
      }
      setRoleViewState(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(ROLE_VIEW_EVENT, { detail: { roleView: null } }));
      }
      return;
    }
    
    // Update localStorage immediately for responsive UI
    writeToStorageSync(view);
    setRoleViewState(view);
    
    // Sync with backend (non-blocking)
    updateRoleViewPreference(view).catch(() => {
      // Silently fail - localStorage is the source of truth for UI
    });
    
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(ROLE_VIEW_EVENT, { detail: { roleView: view } }));
    }
  }, []);

  const clearRoleView = useCallback(() => setRoleView(null), [setRoleView]);

  const value = useMemo<RoleViewContextValue>(() => {
    const hasRoleView = roleView !== null;
    const isClientView = roleView === "client";
    const isProviderView = roleView !== null && roleView !== "client" && 
      ["provider", "agency_owner", "agency_admin", "admin"].includes(roleView);
    
    return {
      roleView,
      setRoleView,
      clearRoleView,
      hasRoleView,
      isClientView,
      isProviderView,
      isLoading,
    };
  }, [roleView, setRoleView, clearRoleView, isLoading]);

  return <RoleViewContext.Provider value={value}>{children}</RoleViewContext.Provider>;
}

/**
 * Hook to access the RoleViewContext.
 * Use this directly only if you need the raw context value without userRoles validation.
 * For most use cases, prefer `useRoleView` from `@/shared/hooks/useRoleView` which includes validation.
 */
export function useRoleViewContext() {
  const ctx = useContext(RoleViewContext);
  if (ctx === undefined) {
    throw new Error("useRoleViewContext must be used within a RoleViewProvider");
  }
  return ctx;
}

// Export with the old name for backward compatibility (if needed)
// The shared hook imports this as useRoleViewContext, so this alias may not be necessary
export const useRoleView = useRoleViewContext;

