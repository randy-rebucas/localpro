/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/subscriptions/hooks/useSubscriptions' instead.
 */
export * from '@/features/subscriptions/hooks/useSubscriptions';
import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { SubscriptionPlan, UserSubscription } from "@/types/subscriptions";

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchPlans = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.localProPlusPlans}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch subscription plans: ${response.status}`);
      }

      const data = await response.json();
      const plansData = data?.data || data?.plans || [];

      if (mountedRef.current) {
        setPlans(plansData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching subscription plans", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setPlans([]);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchPlans();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchPlans]);

  return {
    plans,
    loading,
    error,
    refetch: fetchPlans,
  };
}

export function useMySubscription() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchSubscription = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.localProPlusMySubscription}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        if (response.status === 404) {
          // No subscription found is not an error
          if (mountedRef.current) {
            setSubscription(null);
            setLoading(false);
          }
          return;
        }
        throw new Error(`Failed to fetch subscription: ${response.status}`);
      }

      const data = await response.json();
      const subscriptionData = data?.data || data?.subscription || data;

      if (mountedRef.current) {
        setSubscription(subscriptionData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching subscription", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setSubscription(null);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchSubscription();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchSubscription]);

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
  };
}

export function useAdminSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchPlans = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.localProPlusPlans}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch subscription plans: ${response.status}`);
      }

      const data = await response.json();
      const plansData = data?.data || data?.plans || [];

      if (mountedRef.current) {
        setPlans(plansData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching subscription plans", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setPlans([]);
        setLoading(false);
      }
    }
  }, []);

  const createPlan = useCallback(async (planData: Partial<SubscriptionPlan>) => {
    if (!mountedRef.current) return null;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.localProPlusPlans}`;
      const response = await fetch(url, {
        ...createAuthFetchOptions(),
        method: "POST",
        headers: {
          ...createAuthFetchOptions().headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create plan: ${response.status}`);
      }

      const data = await response.json();

      if (mountedRef.current) {
        setLoading(false);
        // Refresh plans list
        await fetchPlans();
        return data.success ? data.data : null;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error creating plan", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setLoading(false);
      }
      throw err;
    }
  }, [fetchPlans]);

  const updatePlan = useCallback(async (planId: string, planData: Partial<SubscriptionPlan>) => {
    if (!mountedRef.current) return null;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.localProPlusPlanById}/${planId}`;
      const response = await fetch(url, {
        ...createAuthFetchOptions(),
        method: "PUT",
        headers: {
          ...createAuthFetchOptions().headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update plan: ${response.status}`);
      }

      const data = await response.json();

      if (mountedRef.current) {
        setLoading(false);
        // Refresh plans list
        await fetchPlans();
        return data.success ? data.data : null;
      }
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error updating plan", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setLoading(false);
      }
      throw err;
    }
  }, [fetchPlans]);

  const deletePlan = useCallback(async (planId: string) => {
    if (!mountedRef.current) return null;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.localProPlusPlanById}/${planId}`;
      const response = await fetch(url, {
        ...createAuthFetchOptions(),
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete plan: ${response.status}`);
      }

      const data = await response.json();

      if (mountedRef.current) {
        setLoading(false);
        // Refresh plans list
        await fetchPlans();
        return data.success;
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error deleting plan", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setLoading(false);
      }
      throw err;
    }
  }, [fetchPlans]);

  useEffect(() => {
    mountedRef.current = true;
    fetchPlans();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchPlans]);

  return {
    plans,
    loading,
    error,
    refetch: fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
  };
}

export interface SubscriptionAnalytics {
  totalSubscriptions?: number;
  activeSubscriptions?: number;
  cancelledSubscriptions?: number;
  expiredSubscriptions?: number;
  totalRevenue?: number;
  monthlyRevenue?: number;
  yearlyRevenue?: number;
  subscriptionsByPlan?: Array<{
    planId: string;
    planName: string;
    count: number;
  }>;
  subscriptionsByStatus?: Array<{
    status: string;
    count: number;
  }>;
  recentSubscriptions?: UserSubscription[];
  upcomingRenewals?: UserSubscription[];
}

export function useSubscriptionAnalytics() {
  const [analytics, setAnalytics] = useState<SubscriptionAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAnalytics = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.localProPlusAnalytics}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch subscription analytics: ${response.status}`);
      }

      const data = await response.json();
      const analyticsData = data?.data || data;

      if (mountedRef.current) {
        setAnalytics(analyticsData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching subscription analytics", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setAnalytics(null);
        setLoading(false);
      }
    }
  }, []);

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

