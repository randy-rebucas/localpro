"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { Finance } from "@/features/finance/types";

export interface FinanceOverview {
  totalEarnings?: number;
  totalExpenses?: number;
  netIncome?: number;
  pendingBalance?: number;
  availableBalance?: number;
  currency?: string;
  period?: {
    start?: Date;
    end?: Date;
  };
}

export interface FinanceParams {
  startDate?: string;
  endDate?: string;
  period?: "day" | "week" | "month" | "year";
}

export function useFinance(params: FinanceParams = {}) {
  const [finance, setFinance] = useState<Finance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchFinance = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append("startDate", params.startDate);
      if (params.endDate) queryParams.append("endDate", params.endDate);
      if (params.period) queryParams.append("period", params.period);

      const url = `${API_BASE_URL}${API_ENDPOINTS.financeOverview}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch finance data: ${response.status}`);
      }

      const data = await response.json();
      const financeData = data?.data || data;

      if (mountedRef.current) {
        setFinance(financeData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching finance data", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setFinance(null);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchFinance();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchFinance]);

  return {
    finance,
    loading,
    error,
    refetch: fetchFinance,
  };
}

export function useFinanceOverview(params: FinanceParams = {}) {
  const [overview, setOverview] = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchOverview = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.startDate) queryParams.append("startDate", params.startDate);
      if (params.endDate) queryParams.append("endDate", params.endDate);
      if (params.period) queryParams.append("period", params.period);

      const url = `${API_BASE_URL}${API_ENDPOINTS.financeOverview}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch finance overview: ${response.status}`);
      }

      const data = await response.json();
      const overviewData = data?.data || data;

      if (mountedRef.current) {
        setOverview(overviewData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching finance overview", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setOverview(null);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchOverview();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchOverview]);

  return {
    overview,
    loading,
    error,
    refetch: fetchOverview,
  };
}

