"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { Agency } from "@/types/agencies";

export interface AgenciesParams {
  status?: string;
  category?: string;
  location?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface AgenciesResponse {
  success?: boolean;
  data?: Agency[];
  agencies?: Agency[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
    count: number;
  };
}

export function useAgencies(params: AgenciesParams = {}) {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<AgenciesResponse["pagination"]>(null);
  const mountedRef = useRef(true);

  const fetchAgencies = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append("status", params.status);
      if (params.category) queryParams.append("category", params.category);
      if (params.location) queryParams.append("location", params.location);
      
      const page = params.page || 1;
      const limit = params.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      const url = `${API_BASE_URL}${API_ENDPOINTS.agencies}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch agencies: ${response.status}`);
      }

      const data: AgenciesResponse | Agency[] = await response.json();
      let agenciesData: Agency[] = [];
      let paginationData = null;

      if (Array.isArray(data)) {
        agenciesData = data;
      } else if (data && typeof data === "object") {
        agenciesData = (data as AgenciesResponse).data || (data as AgenciesResponse).agencies || [];
        paginationData = (data as AgenciesResponse).pagination || null;
      }

      if (mountedRef.current) {
        setAgencies(agenciesData);
        setPagination(paginationData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching agencies", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setAgencies([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAgencies();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAgencies]);

  return {
    agencies,
    loading,
    error,
    pagination,
    refetch: fetchAgencies,
  };
}

export function useAgency(id: string | null) {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAgency = useCallback(async () => {
    if (!id || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.agenciesById.replace("[id]", id)}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch agency: ${response.status}`);
      }

      const data = await response.json();
      const agencyData = data?.data || data?.agency || data;

      if (mountedRef.current) {
        setAgency(agencyData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching agency", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setAgency(null);
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAgency();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAgency]);

  return {
    agency,
    loading,
    error,
    refetch: fetchAgency,
  };
}

export function useMyAgencies() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAgencies = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.agenciesMyAgencies}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch my agencies: ${response.status}`);
      }

      const data = await response.json();
      const agenciesData = data?.data || data?.agencies || [];

      if (mountedRef.current) {
        setAgencies(agenciesData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching my agencies", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setAgencies([]);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchAgencies();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAgencies]);

  return {
    agencies,
    loading,
    error,
    refetch: fetchAgencies,
  };
}

