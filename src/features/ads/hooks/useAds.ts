"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { AdCampaign } from "@/types/ads";

export interface AdsParams {
  category?: string;
  advertiserId?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  isActive?: boolean;
  isFeatured?: boolean;
}

interface AdsResponse {
  success?: boolean;
  data?: AdCampaign[];
  ads?: AdCampaign[];
  campaigns?: AdCampaign[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
    count: number;
  };
}

export function useAds(params: AdsParams = {}) {
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<AdsResponse["pagination"] | null>(null);
  const mountedRef = useRef(true);

  const fetchAds = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.category) queryParams.append("category", params.category);
      if (params.advertiserId) queryParams.append("advertiserId", params.advertiserId);
      if (params.status) queryParams.append("status", params.status);
      if (params.type) queryParams.append("type", params.type);
      if (params.isActive !== undefined) queryParams.append("isActive", params.isActive.toString());
      if (params.isFeatured !== undefined) queryParams.append("isFeatured", params.isFeatured.toString());
      
      const page = params.page || 1;
      const limit = params.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      const url = `${API_BASE_URL}${API_ENDPOINTS.ads}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch ads: ${response.status}`);
      }

      const data: AdsResponse | AdCampaign[] = await response.json();
      let adsData: AdCampaign[] = [];
      let paginationData = null;

      if (Array.isArray(data)) {
        adsData = data;
      } else if (data && typeof data === "object") {
        adsData = (data as AdsResponse).data || (data as AdsResponse).ads || (data as AdsResponse).campaigns || [];
        paginationData = (data as AdsResponse).pagination || null;
      }

      if (mountedRef.current) {
        setAds(adsData);
        setPagination(paginationData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching ads", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setAds([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAds();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAds]);

  return {
    ads,
    loading,
    error,
    pagination,
    refetch: fetchAds,
  };
}

export function useAd(id: string | null) {
  const [ad, setAd] = useState<AdCampaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAd = useCallback(async () => {
    if (!id || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.adsById.replace("[id]", id)}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch ad: ${response.status}`);
      }

      const data = await response.json();
      const adData = data?.data || data?.ad || data?.campaign || data;

      if (mountedRef.current) {
        setAd(adData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching ad", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setAd(null);
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAd();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAd]);

  return {
    ad,
    loading,
    error,
    refetch: fetchAd,
  };
}

