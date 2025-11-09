"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { Provider } from "@/types/providers";

export interface ProvidersParams {
  status?: string;
  providerType?: string;
  category?: string;
  location?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface ProvidersResponse {
  success?: boolean;
  data?: Provider[];
  providers?: Provider[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
    count: number;
  };
}

export function useProviders(params: ProvidersParams = {}) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ProvidersResponse["pagination"] | null>(null);
  const mountedRef = useRef(true);

  const fetchProviders = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append("status", params.status);
      if (params.providerType) queryParams.append("providerType", params.providerType);
      if (params.category) queryParams.append("category", params.category);
      if (params.location) queryParams.append("location", params.location);
      
      const page = params.page || 1;
      const limit = params.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      const url = `${API_BASE_URL}${API_ENDPOINTS.providers}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch providers: ${response.status}`);
      }

      const data: ProvidersResponse | Provider[] = await response.json();
      let providersData: Provider[] = [];
      let paginationData = null;

      if (Array.isArray(data)) {
        providersData = data;
      } else if (data && typeof data === "object") {
        providersData = (data as ProvidersResponse).data || (data as ProvidersResponse).providers || [];
        paginationData = (data as ProvidersResponse).pagination || null;
      }

      if (mountedRef.current) {
        setProviders(providersData);
        setPagination(paginationData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching providers", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setProviders([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchProviders();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchProviders]);

  return {
    providers,
    loading,
    error,
    pagination,
    refetch: fetchProviders,
  };
}

export function useProvider(id: string | null) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchProvider = useCallback(async () => {
    if (!id || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.providersById.replace("[id]", id)}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch provider: ${response.status}`);
      }

      const data = await response.json();
      const providerData = data?.data || data?.provider || data;

      if (mountedRef.current) {
        setProvider(providerData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching provider", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setProvider(null);
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    fetchProvider();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchProvider]);

  return {
    provider,
    loading,
    error,
    refetch: fetchProvider,
  };
}

