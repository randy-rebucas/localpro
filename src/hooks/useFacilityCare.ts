"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { FacilityCareService } from "@/types/facility-care";

export interface FacilityCareParams {
  category?: string;
  providerId?: string;
  location?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
  isActive?: boolean;
}

interface FacilityCareResponse {
  success?: boolean;
  data?: FacilityCareService[];
  services?: FacilityCareService[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
    count: number;
  };
}

export function useFacilityCare(params: FacilityCareParams = {}) {
  const [services, setServices] = useState<FacilityCareService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<FacilityCareResponse["pagination"] | null>(null);
  const mountedRef = useRef(true);

  const fetchServices = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.category) queryParams.append("category", params.category);
      if (params.providerId) queryParams.append("providerId", params.providerId);
      if (params.location) queryParams.append("location", params.location);
      if (params.lat !== undefined) queryParams.append("lat", params.lat.toString());
      if (params.lng !== undefined) queryParams.append("lng", params.lng.toString());
      if (params.radius) queryParams.append("radius", params.radius.toString());
      if (params.isActive !== undefined) queryParams.append("isActive", params.isActive.toString());
      
      const page = params.page || 1;
      const limit = params.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      const url = `${API_BASE_URL}${API_ENDPOINTS.facilityCare}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch facility care services: ${response.status}`);
      }

      const data: FacilityCareResponse | FacilityCareService[] = await response.json();
      let servicesData: FacilityCareService[] = [];
      let paginationData = null;

      if (Array.isArray(data)) {
        servicesData = data;
      } else if (data && typeof data === "object") {
        servicesData = (data as FacilityCareResponse).data || (data as FacilityCareResponse).services || [];
        paginationData = (data as FacilityCareResponse).pagination || null;
      }

      if (mountedRef.current) {
        setServices(servicesData);
        setPagination(paginationData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching facility care services", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setServices([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchServices();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchServices]);

  return {
    services,
    loading,
    error,
    pagination,
    refetch: fetchServices,
  };
}

export function useFacilityCareService(id: string | null) {
  const [service, setService] = useState<FacilityCareService | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchService = useCallback(async () => {
    if (!id || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.facilityCareById.replace("[id]", id)}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch facility care service: ${response.status}`);
      }

      const data = await response.json();
      const serviceData = data?.data || data?.service || data;

      if (mountedRef.current) {
        setService(serviceData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching facility care service", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setService(null);
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    fetchService();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchService]);

  return {
    service,
    loading,
    error,
    refetch: fetchService,
  };
}

