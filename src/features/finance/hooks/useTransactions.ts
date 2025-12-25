"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { Transaction } from "@/features/finance/types";

export interface TransactionsParams {
  type?: string;
  status?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface TransactionsResponse {
  success?: boolean;
  data?: Transaction[];
  transactions?: Transaction[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
    count: number;
  };
}

export function useTransactions(params: TransactionsParams = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<TransactionsResponse["pagination"] | null>(null);
  const mountedRef = useRef(true);

  const fetchTransactions = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.type) queryParams.append("type", params.type);
      if (params.status) queryParams.append("status", params.status);
      if (params.category) queryParams.append("category", params.category);
      if (params.startDate) queryParams.append("startDate", params.startDate);
      if (params.endDate) queryParams.append("endDate", params.endDate);
      
      const page = params.page || 1;
      const limit = params.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      const url = `${API_BASE_URL}${API_ENDPOINTS.financeTransactions}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }

      const data: TransactionsResponse | Transaction[] = await response.json();
      let transactionsData: Transaction[] = [];
      let paginationData = null;

      if (Array.isArray(data)) {
        transactionsData = data;
      } else if (data && typeof data === "object") {
        transactionsData = (data as TransactionsResponse).data || (data as TransactionsResponse).transactions || [];
        paginationData = (data as TransactionsResponse).pagination || null;
      }

      if (mountedRef.current) {
        setTransactions(transactionsData);
        setPagination(paginationData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching transactions", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setTransactions([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchTransactions();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    pagination,
    refetch: fetchTransactions,
  };
}

export function useTransaction(id: string | null) {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchTransaction = useCallback(async () => {
    if (!id || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.financeTransactions}/${id}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch transaction: ${response.status}`);
      }

      const data = await response.json();
      const transactionData = data?.data || data;

      if (mountedRef.current) {
        setTransaction(transactionData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching transaction", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setTransaction(null);
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    fetchTransaction();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchTransaction]);

  return {
    transaction,
    loading,
    error,
    refetch: fetchTransaction,
  };
}

