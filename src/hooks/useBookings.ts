/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/marketplace/hooks/useBookings' instead.
 */
export * from '@/features/marketplace/hooks/useBookings';
import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
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

  const fetchBookings = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append("status", params.status);
      if (params.serviceId) queryParams.append("serviceId", params.serviceId);
      if (params.clientId) queryParams.append("clientId", params.clientId);
      if (params.providerId) queryParams.append("providerId", params.providerId);
      if (params.startDate) queryParams.append("startDate", params.startDate);
      if (params.endDate) queryParams.append("endDate", params.endDate);
      
      const page = params.page || 1;
      const limit = params.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

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
      logger.error("Error fetching bookings", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setBookings([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchBookings();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchBookings]);

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

