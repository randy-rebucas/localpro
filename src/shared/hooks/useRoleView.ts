"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRoleViewContext } from "@/contexts/role-view-context";

interface UseRoleViewOptions {
  userRoles: string[];
}

// Helper to get default roleView based on userRoles
function getDefaultRoleView(userRoles: string[]): string {
  if (userRoles.length > 0) {
    return userRoles.includes("client") ? "client" : userRoles[0];
  }
  return "client";
}

// Helper to validate roleView against userRoles
function isValidRoleView(roleView: string | null, userRoles: string[]): boolean {
  if (!roleView) return false;
  return userRoles.length > 0 && userRoles.includes(roleView);
}

/**
 * Hook that wraps the RoleViewContext with userRoles validation.
 * Ensures the roleView is always valid against the user's available roles.
 * Persists across browser reloads via localStorage and backend sync.
 */
export function useRoleView({ userRoles }: UseRoleViewOptions) {
  // Get base roleView state from context (handles storage, sync, etc.)
  const contextValue = useRoleViewContext();
  const { roleView: contextRoleView, setRoleView: contextSetRoleView, isLoading } = contextValue;
  
  // Track if we've initialized the default to avoid infinite loops
  const hasInitializedDefault = useRef(false);

  // Validate and normalize roleView against userRoles
  const validatedRoleView = useMemo(() => {
    // If context is still loading, return context value (might be from localStorage)
    if (isLoading) {
      return contextRoleView || (userRoles.length > 0 ? getDefaultRoleView(userRoles) : "client");
    }

    // If no userRoles available yet, return context value (will validate later)
    if (userRoles.length === 0) {
      return contextRoleView || "client";
    }

    // Validate context roleView against userRoles
    if (contextRoleView && isValidRoleView(contextRoleView, userRoles)) {
      return contextRoleView;
    }

    // Context roleView is invalid or null, return default
    return getDefaultRoleView(userRoles);
  }, [contextRoleView, userRoles, isLoading]);

  // Set default roleView if current one is invalid (only after context has loaded and userRoles are available)
  useEffect(() => {
    // Don't set default during initial load or if userRoles not available
    if (isLoading || userRoles.length === 0) {
      return;
    }

    // If context roleView is invalid or null, set the validated default
    if (!contextRoleView || !isValidRoleView(contextRoleView, userRoles)) {
      const defaultView = getDefaultRoleView(userRoles);
      // Only update if different from current context value and we haven't initialized yet
      if (contextRoleView !== defaultView && !hasInitializedDefault.current) {
        hasInitializedDefault.current = true;
        contextSetRoleView(defaultView);
      }
    } else {
      // RoleView is valid, mark as initialized
      hasInitializedDefault.current = true;
    }
  }, [isLoading, userRoles, contextRoleView, contextSetRoleView]);

  // Wrapped setter: validates against userRoles before setting
  // This ensures the roleView persists across reloads via context (which syncs to localStorage + backend)
  const setRoleView = (next: string) => {
    if (!isValidRoleView(next, userRoles)) {
      return; // Silently ignore invalid roleView
    }
    // Context setter will:
    // 1. Update localStorage immediately (persists across reloads)
    // 2. Sync to backend (persists across devices/sessions)
    // 3. Broadcast to other components
    contextSetRoleView(next);
  };

  // Determine if we're in client or provider view
  const isClientView = validatedRoleView === "client";
  const isProviderView = validatedRoleView !== "client" && 
    ["provider", "agency_owner", "agency_admin", "admin"].includes(validatedRoleView);

  return {
    roleView: validatedRoleView,
    setRoleView,
    isClientView,
    isProviderView,
  };
}
