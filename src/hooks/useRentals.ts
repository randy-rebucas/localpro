"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { RentalItem } from "@/types/rentals";

export interface RentalsParams {
  category?: string;
  subcategory?: string;
  ownerId?: string;
  location?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  isActive?: boolean;
  isFeatured?: boolean;
}

interface RentalsResponse {
  success?: boolean;
  data?: RentalItem[];
  rentals?: RentalItem[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
    count: number;
  };
}

export function useRentals(params: RentalsParams = {}) {
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<RentalsResponse["pagination"] | null>(null);
  const mountedRef = useRef(true);

  const fetchRentals = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.category) queryParams.append("category", params.category);
      if (params.subcategory) queryParams.append("subcategory", params.subcategory);
      if (params.ownerId) queryParams.append("ownerId", params.ownerId);
      if (params.location) queryParams.append("location", params.location);
      if (params.lat !== undefined) queryParams.append("lat", params.lat.toString());
      if (params.lng !== undefined) queryParams.append("lng", params.lng.toString());
      if (params.radius) queryParams.append("radius", params.radius.toString());
      if (params.minPrice !== undefined) queryParams.append("minPrice", params.minPrice.toString());
      if (params.maxPrice !== undefined) queryParams.append("maxPrice", params.maxPrice.toString());
      if (params.isActive !== undefined) queryParams.append("isActive", params.isActive.toString());
      if (params.isFeatured !== undefined) queryParams.append("isFeatured", params.isFeatured.toString());
      
      const page = params.page || 1;
      const limit = params.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      const url = `${API_BASE_URL}${API_ENDPOINTS.rentals}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch rentals: ${response.status}`);
      }

      const data: RentalsResponse | RentalItem[] = await response.json();
      let rentalsData: RentalItem[] = [];
      let paginationData = null;

      if (Array.isArray(data)) {
        rentalsData = data;
      } else if (data && typeof data === "object") {
        rentalsData = (data as RentalsResponse).data || (data as RentalsResponse).rentals || [];
        paginationData = (data as RentalsResponse).pagination || null;
      }

      if (mountedRef.current) {
        setRentals(rentalsData);
        setPagination(paginationData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching rentals", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setRentals([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchRentals();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchRentals]);

  return {
    rentals,
    loading,
    error,
    pagination,
    refetch: fetchRentals,
  };
}

export function useRental(id: string | null) {
  const [rental, setRental] = useState<RentalItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchRental = useCallback(async () => {
    if (!id || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.rentalsById.replace("[id]", id)}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch rental: ${response.status}`);
      }

      const data = await response.json();
      const rentalData = data?.data || data?.rental || data;

      if (mountedRef.current) {
        setRental(rentalData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching rental", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setRental(null);
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    fetchRental();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchRental]);

  return {
    rental,
    loading,
    error,
    refetch: fetchRental,
  };
}

