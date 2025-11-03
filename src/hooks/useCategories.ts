"use client";

import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { ServiceCategory } from "@/components/marketplace/categories-carousel";

interface CategoriesResponse {
  success?: boolean;
  message?: string;
  data?: ServiceCategory[];
  summary?: {
    totalCategories: number;
    totalServices: number;
    totalProviders: number;
    categoriesWithServices: number;
  };
}

export function useCategories() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.marketplaceServicesCategories}`,
        createAuthFetchOptions()
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
      }

      const data: CategoriesResponse | ServiceCategory[] = await response.json();
      
      // Handle API response structure: {success: true, data: [...]}
      if (typeof data === 'object' && data !== null && 'success' in data && (data as CategoriesResponse).success) {
        const responseData = data as CategoriesResponse;
        if (responseData.data && Array.isArray(responseData.data)) {
          setCategories(responseData.data);
        } else {
          logger.warn("Categories response data is not an array", { data: responseData });
          setCategories([]);
        }
      } else if (Array.isArray(data)) {
        // Fallback if response is directly an array
        setCategories(data);
      } else {
        logger.warn("Unexpected categories response format", { hasData: !!data });
        setCategories([]);
      }
    } catch (error) {
      logger.error("Error fetching categories", error instanceof Error ? error : new Error(String(error)));
      setError(error instanceof Error ? error.message : "Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}

