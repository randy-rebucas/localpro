"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AppPackage } from "@/shared/types/app-package";
import { PACKAGE_IDS } from "@/shared/config/package-registry";

// Re-export for backward compatibility (existing imports expect this type here)
export type { AppPackage };

interface PackageSwitcherContextValue {
  activePackage: AppPackage;
  setActivePackage: (pkg: AppPackage) => void;
  clearActivePackage: () => void;
  hasActivePackage: boolean;
  isLoading: boolean;
}

// Keep the same key used by the previous "preferred feature" implementation for compatibility.
const PACKAGE_SWITCHER_KEY = "localpro_preferred_feature";
const PACKAGE_SWITCHER_EVENT = "localpro:package-switcher:changed";

const PackageSwitcherContext = createContext<PackageSwitcherContextValue | undefined>(undefined);

const VALID_PACKAGES: Set<Exclude<AppPackage, null>> = new Set(PACKAGE_IDS);

function normalizePackage(raw: string | null): AppPackage {
  if (!raw) return null;
  return VALID_PACKAGES.has(raw as Exclude<AppPackage, null>) ? (raw as AppPackage) : null;
}

function readFromStorage(): AppPackage {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PACKAGE_SWITCHER_KEY);
    const normalized = normalizePackage(raw);
    if (normalized) return normalized;
  } catch {
    // ignore storage errors
  }

  // Migration / fallback: if an older build stored the value in sessionStorage,
  // read it once and persist into localStorage.
  try {
    const raw = sessionStorage.getItem(PACKAGE_SWITCHER_KEY);
    const normalized = normalizePackage(raw);
    if (normalized) {
      try {
        localStorage.setItem(PACKAGE_SWITCHER_KEY, normalized);
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

function writeToStorage(pkg: AppPackage): void {
  if (typeof window === "undefined") return;
  try {
    if (pkg) {
      localStorage.setItem(PACKAGE_SWITCHER_KEY, pkg);
    } else {
      localStorage.removeItem(PACKAGE_SWITCHER_KEY);
    }
  } catch {
    // ignore storage errors (private mode, quota, etc.)
  }
}

export function PackageSwitcherProvider({ children }: { children: React.ReactNode }) {
  const [activePackage, setActivePackageState] = useState<AppPackage>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial load
  useEffect(() => {
    setActivePackageState(readFromStorage());
    setIsLoading(false);
  }, []);

  // Cross-component sync within the same tab.
  // Also listen to `storage` for cross-tab updates.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ activePackage?: AppPackage }>;
      const next = custom.detail?.activePackage ?? readFromStorage();
      setActivePackageState(next);
    };

    window.addEventListener(PACKAGE_SWITCHER_EVENT, handler);

    const storageHandler = (e: StorageEvent) => {
      if (e.key !== PACKAGE_SWITCHER_KEY) return;
      const next = normalizePackage(e.newValue);
      setActivePackageState(next);
    };
    window.addEventListener("storage", storageHandler);

    return () => {
      window.removeEventListener(PACKAGE_SWITCHER_EVENT, handler);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  const setActivePackage = useCallback((pkg: AppPackage) => {
    writeToStorage(pkg);
    setActivePackageState(pkg);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(PACKAGE_SWITCHER_EVENT, { detail: { activePackage: pkg } }));
    }
  }, []);

  const clearActivePackage = useCallback(() => setActivePackage(null), [setActivePackage]);

  const value = useMemo<PackageSwitcherContextValue>(() => {
    const hasActivePackage = activePackage !== null;
    return {
      activePackage,
      setActivePackage,
      clearActivePackage,
      hasActivePackage,
      isLoading,
    };
  }, [activePackage, clearActivePackage, isLoading, setActivePackage]);

  return <PackageSwitcherContext.Provider value={value}>{children}</PackageSwitcherContext.Provider>;
}

export function usePackageSwitcher() {
  const ctx = useContext(PackageSwitcherContext);
  if (ctx === undefined) {
    throw new Error("usePackageSwitcher must be used within a PackageSwitcherProvider");
  }
  return ctx;
}


