"use client";

import useSWR from "swr";
import { API_ENDPOINTS } from "@/lib/api";
import { createSWRKey, swrFetcher } from "@/lib/swr-config";
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
  const swrKey = createSWRKey(API_ENDPOINTS.rentals, {
    category: params.category,
    subcategory: params.subcategory,
    ownerId: params.ownerId,
    location: params.location,
    lat: params.lat,
    lng: params.lng,
    radius: params.radius,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    isActive: params.isActive,
    isFeatured: params.isFeatured,
    page: params.page || 1,
    limit: params.limit || 10,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  const { data, error, isLoading, isValidating, mutate } = useSWR<RentalsResponse | RentalItem[]>(
    swrKey,
    swrFetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  // Normalize response data
  let rentals: RentalItem[] = [];
  let pagination: RentalsResponse["pagination"] | null = null;

  if (data) {
    if (Array.isArray(data)) {
      rentals = data;
    } else if (data && typeof data === "object") {
      rentals = (data as RentalsResponse).data || (data as RentalsResponse).rentals || [];
      pagination = (data as RentalsResponse).pagination || null;
    }
  }

  return {
    rentals,
    loading: isLoading,
    isValidating,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    pagination,
    refetch: mutate,
  };
}

export function useRental(id: string | null) {
  const swrKey = id ? API_ENDPOINTS.rentalsById.replace("[id]", id) : null;

  const { data, error, isLoading, mutate } = useSWR<{ data?: RentalItem; rental?: RentalItem } | RentalItem>(
    swrKey,
    swrFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const rental = data ? ((data as { data?: RentalItem; rental?: RentalItem }).data || 
                         (data as { data?: RentalItem; rental?: RentalItem }).rental || 
                         (data as RentalItem)) : null;

  return {
    rental,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch: mutate,
  };
}

