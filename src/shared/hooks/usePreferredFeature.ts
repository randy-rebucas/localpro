"use client";

import { AppPackage, usePackageSwitcher } from "@/contexts/package-switcher-context";

export type PreferredFeature = AppPackage;

export function usePreferredFeature() {
  const {
    activePackage,
    setActivePackage,
    clearActivePackage,
    hasActivePackage,
    isLoading,
  } = usePackageSwitcher();

  return {
    preferredFeature: activePackage,
    setPreferredFeature: setActivePackage,
    clearPreferredFeature: clearActivePackage,
    hasPreferredFeature: hasActivePackage,
    isLoading,
  };
}

