"use client";

import { useState, useEffect, useCallback } from "react";

export type PreferredFeature = 
  | "marketplace"
  | "academy"
  | "ads"
  | "supplies"
  | "rentals"
  | "finance"
  | "facility"
  | "plus"
  | null;

const PREFERRED_FEATURE_KEY = "localpro_preferred_feature";

// Session storage utilities for preferred feature
function getPreferredFeatureFromSession(): PreferredFeature {
  if (typeof window === "undefined") return null;
  
  try {
    const feature = sessionStorage.getItem(PREFERRED_FEATURE_KEY);
    return feature as PreferredFeature;
  } catch {
    return null;
  }
}

function setPreferredFeatureInSession(feature: PreferredFeature): void {
  if (typeof window === "undefined") return;
  
  try {
    if (feature) {
      sessionStorage.setItem(PREFERRED_FEATURE_KEY, feature);
    } else {
      sessionStorage.removeItem(PREFERRED_FEATURE_KEY);
    }
  } catch (error) {
    console.error("Failed to save preferred feature to sessionStorage", error);
  }
}

export function usePreferredFeature() {
  const [preferredFeature, setPreferredFeature] = useState<PreferredFeature>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferred feature from sessionStorage on mount
  useEffect(() => {
    const feature = getPreferredFeatureFromSession();
    setPreferredFeature(feature);
    setIsLoading(false);
  }, []);

  // Set preferred feature
  const setFeature = useCallback((feature: PreferredFeature) => {
    setPreferredFeatureInSession(feature);
    setPreferredFeature(feature);
  }, []);

  // Clear preferred feature
  const clearFeature = useCallback(() => {
    setPreferredFeatureInSession(null);
    setPreferredFeature(null);
  }, []);

  // Check if a feature is selected
  const hasPreferredFeature = preferredFeature !== null;

  return {
    preferredFeature,
    setPreferredFeature: setFeature,
    clearPreferredFeature: clearFeature,
    hasPreferredFeature,
    isLoading,
  };
}

