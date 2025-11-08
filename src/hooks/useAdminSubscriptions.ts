"use client";

import { useState, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { UserSubscription } from "@/types/subscriptions";

export interface CreateManualSubscriptionPayload {
  userId: string;
  planId: string;
  billingCycle?: "monthly" | "yearly";
  startDate?: string;
  endDate?: string;
  reason?: string;
  notes?: string;
}

export interface UpdateManualSubscriptionPayload {
  planId?: string;
  status?: "active" | "cancelled" | "expired" | "suspended" | "pending";
  startDate?: string;
  endDate?: string;
  billingCycle?: "monthly" | "yearly";
  reason?: string;
  notes?: string;
}

export interface SubscriptionFilters {
  page?: number;
  limit?: number;
  status?: string;
  planId?: string;
  isManual?: boolean;
}

export interface SubscriptionsResponse {
  success: boolean;
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
  data?: UserSubscription[];
  message?: string;
}

export function useAdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    count: 0,
  });
  const mountedRef = useRef(true);

  const fetchSubscriptions = useCallback(async (filters: SubscriptionFilters = {}) => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters.page) queryParams.append("page", filters.page.toString());
      if (filters.limit) queryParams.append("limit", filters.limit.toString());
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.planId) queryParams.append("planId", filters.planId);
      if (filters.isManual !== undefined) queryParams.append("isManual", filters.isManual.toString());

      const url = `${API_BASE_URL}${API_ENDPOINTS.localProPlusAdminSubscriptions}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch subscriptions: ${response.status}`);
      }

      const data: SubscriptionsResponse = await response.json();

      if (mountedRef.current) {
        if (data.success && data.data) {
          setSubscriptions(data.data);
          setPagination({
            page: data.page || 1,
            pages: data.pages || 1,
            total: data.total || 0,
            count: data.count || 0,
          });
        } else {
          setSubscriptions([]);
        }
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching subscriptions", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setSubscriptions([]);
        setLoading(false);
      }
    }
  }, []);

  const fetchSubscriptionByUser = useCallback(async (userId: string) => {
    if (!mountedRef.current) return null;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.localProPlusAdminSubscriptionByUser}/${userId}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch subscription: ${response.status}`);
      }

      const data = await response.json();

      if (mountedRef.current) {
        setLoading(false);
        return data.success ? data.data : null;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching subscription by user", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setLoading(false);
      }
      return null;
    }
  }, []);

  const createManualSubscription = useCallback(async (payload: CreateManualSubscriptionPayload) => {
    if (!mountedRef.current) return null;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.localProPlusAdminSubscriptions}`;
      const response = await fetch(url, {
        ...createAuthFetchOptions(),
        method: "POST",
        headers: {
          ...createAuthFetchOptions().headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create subscription: ${response.status}`);
      }

      const data = await response.json();

      if (mountedRef.current) {
        setLoading(false);
        return data.success ? data.data : null;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error creating manual subscription", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setLoading(false);
      }
      throw err;
    }
  }, []);

  const updateManualSubscription = useCallback(async (subscriptionId: string, payload: UpdateManualSubscriptionPayload) => {
    if (!mountedRef.current) return null;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.localProPlusAdminSubscriptionById}/${subscriptionId}`;
      const response = await fetch(url, {
        ...createAuthFetchOptions(),
        method: "PUT",
        headers: {
          ...createAuthFetchOptions().headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update subscription: ${response.status}`);
      }

      const data = await response.json();

      if (mountedRef.current) {
        setLoading(false);
        return data.success ? data.data : null;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error updating manual subscription", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setLoading(false);
      }
      throw err;
    }
  }, []);

  const cancelManualSubscription = useCallback(async (subscriptionId: string, reason?: string) => {
    if (!mountedRef.current) return null;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.localProPlusAdminSubscriptionById}/${subscriptionId}`;
      const response = await fetch(url, {
        ...createAuthFetchOptions(),
        method: "DELETE",
        headers: {
          ...createAuthFetchOptions().headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: reason || "Admin cancellation" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to cancel subscription: ${response.status}`);
      }

      const data = await response.json();

      if (mountedRef.current) {
        setLoading(false);
        return data.success ? data.data : null;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error cancelling manual subscription", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setLoading(false);
      }
      throw err;
    }
  }, []);

  return {
    subscriptions,
    loading,
    error,
    pagination,
    fetchSubscriptions,
    fetchSubscriptionByUser,
    createManualSubscription,
    updateManualSubscription,
    cancelManualSubscription,
  };
}

