"use client";

import { useCallback, useEffect, useState } from "react";

interface UseRoleViewOptions {
  userRoles: string[];
}

export function useRoleView({ userRoles }: UseRoleViewOptions) {
  const isBrowser = typeof window !== "undefined";

  const getDefaultRoleView = useCallback(() => {
    if (userRoles.length > 0) {
      return userRoles.includes("client") ? "client" : userRoles[0];
    }
    return "client";
  }, [userRoles]);

  const readSavedRoleView = useCallback(() => {
    if (!isBrowser) return null;
    try {
      return localStorage.getItem("roleView");
    } catch {
      return null;
    }
  }, [isBrowser]);

  const persistRoleView = useCallback(
    (next: string) => {
    if (!isBrowser) return;
    try {
      localStorage.setItem("roleView", next);
    } catch {
      // ignore storage errors
    }
    },
    [isBrowser]
  );

  const broadcastRoleView = useCallback(
    (next: string) => {
    if (!isBrowser) return;
    window.dispatchEvent(new CustomEvent("roleViewChanged", { detail: { roleView: next } }));
    },
    [isBrowser]
  );

  // Role view state (single source of truth: localStorage('roleView') + in-memory state)
  const [roleView, setRoleView] = useState<string>(() => {
    const saved = readSavedRoleView();
    if (saved && userRoles.length > 0 && userRoles.includes(saved)) {
      return saved;
    }
    return getDefaultRoleView();
  });

  // Keep roleView valid if userRoles change (e.g. after login/upgrade)
  useEffect(() => {
    if (userRoles.length === 0) return;
    if (userRoles.includes(roleView)) return;
    const next = getDefaultRoleView();
    setRoleView(next);
  }, [getDefaultRoleView, userRoles, roleView]);

  // Persist roleView whenever it changes (so any component can call setRoleView).
  useEffect(() => {
    if (!userRoles.includes(roleView)) return;
    persistRoleView(roleView);
  }, [persistRoleView, roleView, userRoles]);

  // Listen for roleView changes from role switcher
  useEffect(() => {
    if (!isBrowser) return;

    const handleRoleViewChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ roleView: string }>;
      if (customEvent.detail?.roleView && userRoles.includes(customEvent.detail.roleView)) {
        setRoleView(customEvent.detail.roleView);
      }
    };

    const handleStorageChange = () => {
      const saved = readSavedRoleView();
      if (saved && userRoles.includes(saved)) {
        setRoleView(saved);
      }
    };

    window.addEventListener("roleViewChanged", handleRoleViewChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("roleViewChanged", handleRoleViewChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [isBrowser, readSavedRoleView, userRoles]);

  // Wrapped setter: validates + persists + broadcasts
  const setRoleViewSafe = (next: string) => {
    if (!userRoles.includes(next)) return;
    setRoleView(next);
    persistRoleView(next);
    broadcastRoleView(next);
  };

  // Determine if we're in client or provider view
  const isClientView = roleView === "client";
  const isProviderView = roleView !== "client" && ["provider", "agency_owner", "agency_admin", "admin"].includes(roleView);

  return {
    roleView,
    setRoleView: setRoleViewSafe,
    isClientView,
    isProviderView,
  };
}

