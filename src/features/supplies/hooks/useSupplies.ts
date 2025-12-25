"use client";

import useSWR from "swr";
import { API_ENDPOINTS } from "@/lib/api";
import { createSWRKey, swrFetcher } from "@/lib/swr-config";
import { Product, Order } from "@/types/supplies";

export interface SuppliesParams {
  category?: string;
  subcategory?: string;
  supplierId?: string;
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

interface SuppliesResponse {
  success?: boolean;
  data?: Product[];
  products?: Product[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
    count: number;
  };
}

export function useSupplies(params: SuppliesParams = {}) {
  // Build SWR key with query parameters
  const swrKey = createSWRKey(API_ENDPOINTS.supplies, {
    category: params.category,
    subcategory: params.subcategory,
    supplierId: params.supplierId,
    location: params.location,
    lat: params.lat,
    lng: params.lng,
    radius: params.radius,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    page: params.page || 1,
    limit: params.limit || 10,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    isActive: params.isActive,
    isFeatured: params.isFeatured,
  });

  const { data, error, isLoading, isValidating, mutate } = useSWR<SuppliesResponse | Product[]>(
    swrKey,
    swrFetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false, // Disable focus revalidation for list views
    }
  );

  // Normalize response data
  let supplies: Product[] = [];
  let pagination: SuppliesResponse["pagination"] | null = null;

  if (data) {
    if (Array.isArray(data)) {
      supplies = data;
    } else if (data && typeof data === "object") {
      supplies = (data as SuppliesResponse).data || (data as SuppliesResponse).products || [];
      pagination = (data as SuppliesResponse).pagination || null;
    }
  }

  return {
    supplies,
    loading: isLoading,
    isValidating,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    pagination,
    refetch: mutate,
  };
}

export function useSupply(id: string | null) {
  // Only fetch if id is provided
  const swrKey = id ? API_ENDPOINTS.suppliesById.replace("[id]", id) : null;

  const { data, error, isLoading, mutate } = useSWR<{ data?: Product; product?: Product } | Product>(
    swrKey,
    swrFetcher,
    {
      revalidateOnFocus: false, // Don't revalidate on focus for single items
      revalidateOnReconnect: false,
    }
  );

  // Normalize response data
  const supply = data ? ((data as { data?: Product; product?: Product }).data || 
                         (data as { data?: Product; product?: Product }).product || 
                         (data as Product)) : null;

  return {
    supply,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch: mutate,
  };
}

export function useMyOrders(params: { status?: string; page?: number; limit?: number } = {}) {
  const swrKey = createSWRKey(API_ENDPOINTS.suppliesMyOrders, {
    status: params.status,
    page: params.page || 1,
    limit: params.limit || 10,
  });

  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    data?: Order[];
    orders?: Order[];
    pagination?: { current: number; pages: number; total: number; limit: number; count: number };
  }>(
    swrKey,
    swrFetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  const orders = data?.data || data?.orders || [];
  const pagination = data?.pagination || null;

  return {
    orders,
    loading: isLoading,
    isValidating,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    pagination,
    refetch: mutate,
  };
}

