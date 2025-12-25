/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/activity/hooks/useActivity' instead.
 */
export * from '@/features/activity/hooks/useActivity';
import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { Activity } from "@/types/activity";

export interface ActivityParams {
  userId?: string;
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface ActivityResponse {
  success?: boolean;
  data?: Activity[];
  activities?: Activity[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
    count: number;
  };
}

export function useActivity(params: ActivityParams = {}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ActivityResponse["pagination"] | null>(null);
  const mountedRef = useRef(true);

  const fetchActivities = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.userId) queryParams.append("userId", params.userId);
      if (params.type) queryParams.append("type", params.type);
      if (params.category) queryParams.append("category", params.category);
      if (params.startDate) queryParams.append("startDate", params.startDate);
      if (params.endDate) queryParams.append("endDate", params.endDate);
      
      const page = params.page || 1;
      const limit = params.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      const url = `${API_BASE_URL}${API_ENDPOINTS.activitiesFeed}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }

      const data: ActivityResponse | Activity[] = await response.json();
      let activitiesData: Activity[] = [];
      let paginationData = null;

      if (Array.isArray(data)) {
        activitiesData = data;
      } else if (data && typeof data === "object") {
        activitiesData = (data as ActivityResponse).data || (data as ActivityResponse).activities || [];
        paginationData = (data as ActivityResponse).pagination || null;
      }

      if (mountedRef.current) {
        setActivities(activitiesData);
        setPagination(paginationData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching activities", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setActivities([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchActivities();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    pagination,
    refetch: fetchActivities,
  };
}

export function useMyActivity(params: { type?: string; category?: string; page?: number; limit?: number } = {}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{ current: number; pages: number; total: number; limit: number; count: number } | null>(null);
  const mountedRef = useRef(true);

  const fetchActivities = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.type) queryParams.append("type", params.type);
      if (params.category) queryParams.append("category", params.category);
      const page = params.page || 1;
      const limit = params.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      const url = `${API_BASE_URL}${API_ENDPOINTS.activitiesMy}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch my activities: ${response.status}`);
      }

      const data = await response.json();
      const activitiesData = data?.data || data?.activities || [];
      const paginationData = data?.pagination || null;

      if (mountedRef.current) {
        setActivities(activitiesData);
        setPagination(paginationData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching my activities", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setActivities([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchActivities();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    pagination,
    refetch: fetchActivities,
  };
}

