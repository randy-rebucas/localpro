/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/trust-verification/hooks/useTrustVerification' instead.
 */
export * from '@/features/trust-verification/hooks/useTrustVerification';
import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { VerificationRequest } from "@/types/trust-verification";

export interface TrustVerificationParams {
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface TrustVerificationResponse {
  success?: boolean;
  data?: VerificationRequest[];
  requests?: VerificationRequest[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
    count: number;
  };
}

export function useTrustVerificationRequests(params: TrustVerificationParams = {}) {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<TrustVerificationResponse["pagination"] | null>(null);
  const mountedRef = useRef(true);

  const fetchRequests = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.type) queryParams.append("type", params.type);
      if (params.status) queryParams.append("status", params.status);
      
      const page = params.page || 1;
      const limit = params.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      const url = `${API_BASE_URL}${API_ENDPOINTS.trustVerificationRequests}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch verification requests: ${response.status}`);
      }

      const data: TrustVerificationResponse | VerificationRequest[] = await response.json();
      let requestsData: VerificationRequest[] = [];
      let paginationData = null;

      if (Array.isArray(data)) {
        requestsData = data;
      } else if (data && typeof data === "object") {
        requestsData = (data as TrustVerificationResponse).data || (data as TrustVerificationResponse).requests || [];
        paginationData = (data as TrustVerificationResponse).pagination || null;
      }

      if (mountedRef.current) {
        setRequests(requestsData);
        setPagination(paginationData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching verification requests", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setRequests([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchRequests();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchRequests]);

  return {
    requests,
    loading,
    error,
    pagination,
    refetch: fetchRequests,
  };
}

export function useMyVerificationRequests() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchRequests = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.trustVerificationMyRequests}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch my verification requests: ${response.status}`);
      }

      const data = await response.json();
      const requestsData = data?.data || data?.requests || [];

      if (mountedRef.current) {
        setRequests(requestsData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching my verification requests", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setRequests([]);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchRequests();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchRequests]);

  return {
    requests,
    loading,
    error,
    refetch: fetchRequests,
  };
}

