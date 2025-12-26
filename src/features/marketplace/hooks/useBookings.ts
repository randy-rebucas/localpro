"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { Booking } from "@/types/bookings";

export interface BookingsParams {
  status?: string;
  serviceId?: string;
  clientId?: string;
  providerId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  startDate?: string;
  endDate?: string;
}

interface BookingsResponse {
  success?: boolean;
  data?: Booking[];
  bookings?: Booking[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
    count: number;
  };
}

export function useBookings(params: BookingsParams = {}) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<BookingsResponse["pagination"] | null>(null);
  const mountedRef = useRef(true);
  const paramsRef = useRef(params);
  const hasFetchedRef = useRef(false);
  const previousParamsKeyRef = useRef<string | null>(null);

  // Create a stable key from params to detect actual changes
  const paramsKey = useMemo(() => {
    return JSON.stringify({
      status: params.status,
      serviceId: params.serviceId,
      clientId: params.clientId,
      providerId: params.providerId,
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      startDate: params.startDate,
      endDate: params.endDate,
    });
  }, [
    params.status,
    params.serviceId,
    params.clientId,
    params.providerId,
    params.page,
    params.limit,
    params.sortBy,
    params.sortOrder,
    params.startDate,
    params.endDate,
  ]);

  const fetchBookings = useCallback(async () => {
    // Use params from ref to avoid dependency issues
    const currentParams = paramsRef.current;
    if (!mountedRef.current) return;

    // Check for authentication token before making request
    if (!getApiToken()) {
      if (mountedRef.current) {
        setError(null);
        setBookings([]);
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (currentParams.status) queryParams.append("status", currentParams.status);
      if (currentParams.serviceId) queryParams.append("serviceId", currentParams.serviceId);
      if (currentParams.clientId) queryParams.append("clientId", currentParams.clientId);
      if (currentParams.providerId) queryParams.append("providerId", currentParams.providerId);
      if (currentParams.startDate) queryParams.append("startDate", currentParams.startDate);
      if (currentParams.endDate) queryParams.append("endDate", currentParams.endDate);
      
      const page = currentParams.page || 1;
      const limit = currentParams.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      
      if (currentParams.sortBy) queryParams.append("sortBy", currentParams.sortBy);
      if (currentParams.sortOrder) queryParams.append("sortOrder", currentParams.sortOrder);

      const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceBookings}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status}`);
      }

      const data: BookingsResponse | Booking[] = await response.json();
      let bookingsData: Booking[] = [];
      let paginationData = null;

      if (Array.isArray(data)) {
        bookingsData = data;
      } else if (data && typeof data === "object") {
        bookingsData = (data as BookingsResponse).data || (data as BookingsResponse).bookings || [];
        paginationData = (data as BookingsResponse).pagination || null;
      }

      if (mountedRef.current) {
        setBookings(bookingsData);
        setPagination(paginationData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      // Only log network errors at debug level to reduce console noise
      // Critical errors (like 401, 403) are still logged as errors
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        logger.debug("Network error fetching bookings", { error: errorMessage });
      } else {
        logger.error("Error fetching bookings", err instanceof Error ? err : new Error(errorMessage));
      }
      if (mountedRef.current) {
        setError(errorMessage);
        setBookings([]);
        setLoading(false);
      }
    }
  }, []); // Empty deps - params accessed via ref

  // Update params ref when params change
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    
    // Only fetch if params actually changed or this is the first fetch
    if (!hasFetchedRef.current || previousParamsKeyRef.current !== paramsKey) {
      previousParamsKeyRef.current = paramsKey;
      hasFetchedRef.current = true;
      fetchBookings();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [paramsKey, fetchBookings]); // Use paramsKey instead of params object

  return {
    bookings,
    loading,
    error,
    pagination,
    refetch: fetchBookings,
  };
}

export function useBooking(id: string | null) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchBooking = useCallback(async () => {
    if (!id || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceBookings}/${id}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch booking: ${response.status}`);
      }

      const data = await response.json();
      const bookingData = data?.data || data?.booking || data;

      if (mountedRef.current) {
        setBooking(bookingData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching booking", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setBooking(null);
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    fetchBooking();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchBooking]);

  return {
    booking,
    loading,
    error,
    refetch: fetchBooking,
  };
}

