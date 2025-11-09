"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { PlatformAnalytics, ServiceAnalytics, UserAnalytics } from "@/types/analytics";

export interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  timeframe?: "1h" | "24h" | "7d" | "30d" | "90d" | "1y";
  userId?: string;
  serviceId?: string;
  category?: string;
}

export function useAnalytics(params: AnalyticsParams = {}) {
  const [analytics, setAnalytics] = useState<PlatformAnalytics | ServiceAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAnalytics = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append("startDate", params.startDate);
      if (params.endDate) queryParams.append("endDate", params.endDate);
      if (params.timeframe) queryParams.append("timeframe", params.timeframe);
      if (params.userId) queryParams.append("userId", params.userId);
      if (params.serviceId) queryParams.append("serviceId", params.serviceId);
      if (params.category) queryParams.append("category", params.category);

      const url = `${API_BASE_URL}${API_ENDPOINTS.analyticsOverview}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const data = await response.json();
      const analyticsData = data?.data || data;

      if (mountedRef.current) {
        setAnalytics(analyticsData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching analytics", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setAnalytics(null);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAnalytics();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}

export function useUserAnalytics(userId: string | null) {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAnalytics = useCallback(async () => {
    if (!userId || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.analyticsUser.replace("[userId]", userId)}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch user analytics: ${response.status}`);
      }

      const data = await response.json();
      const analyticsData = data?.data || data;

      if (mountedRef.current) {
        setAnalytics(analyticsData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching user analytics", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setAnalytics(null);
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAnalytics();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}

