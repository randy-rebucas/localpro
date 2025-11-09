"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
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
  const [supplies, setSupplies] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<SuppliesResponse["pagination"] | null>(null);
  const mountedRef = useRef(true);

  const fetchSupplies = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.category) queryParams.append("category", params.category);
      if (params.subcategory) queryParams.append("subcategory", params.subcategory);
      if (params.supplierId) queryParams.append("supplierId", params.supplierId);
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

      const url = `${API_BASE_URL}${API_ENDPOINTS.supplies}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch supplies: ${response.status}`);
      }

      const data: SuppliesResponse | Product[] = await response.json();
      let suppliesData: Product[] = [];
      let paginationData = null;

      if (Array.isArray(data)) {
        suppliesData = data;
      } else if (data && typeof data === "object") {
        suppliesData = (data as SuppliesResponse).data || (data as SuppliesResponse).products || [];
        paginationData = (data as SuppliesResponse).pagination || null;
      }

      if (mountedRef.current) {
        setSupplies(suppliesData);
        setPagination(paginationData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching supplies", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setSupplies([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchSupplies();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchSupplies]);

  return {
    supplies,
    loading,
    error,
    pagination,
    refetch: fetchSupplies,
  };
}

export function useSupply(id: string | null) {
  const [supply, setSupply] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchSupply = useCallback(async () => {
    if (!id || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.suppliesById.replace("[id]", id)}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch supply: ${response.status}`);
      }

      const data = await response.json();
      const supplyData = data?.data || data?.product || data;

      if (mountedRef.current) {
        setSupply(supplyData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching supply", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setSupply(null);
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    fetchSupply();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchSupply]);

  return {
    supply,
    loading,
    error,
    refetch: fetchSupply,
  };
}

export function useMyOrders(params: { status?: string; page?: number; limit?: number } = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{ current: number; pages: number; total: number; limit: number; count: number } | null>(null);
  const mountedRef = useRef(true);

  const fetchOrders = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append("status", params.status);
      const page = params.page || 1;
      const limit = params.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      const url = `${API_BASE_URL}${API_ENDPOINTS.suppliesMyOrders}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data = await response.json();
      const ordersData = data?.data || data?.orders || [];
      const paginationData = data?.pagination || null;

      if (mountedRef.current) {
        setOrders(ordersData);
        setPagination(paginationData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching orders", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setOrders([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchOrders();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    pagination,
    refetch: fetchOrders,
  };
}

