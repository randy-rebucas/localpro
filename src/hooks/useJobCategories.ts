/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/jobs/hooks/useJobCategories' instead.
 */
export * from '@/features/jobs/hooks/useJobCategories';
import { useState, useCallback, useEffect } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { JobCategory } from "@/types/jobs";
import { ServiceCategory } from "@/components/marketplace/categories-carousel";

// Convert JobCategory to ServiceCategory format for MarketplaceHero compatibility
function convertJobCategoryToServiceCategory(jobCat: JobCategory & { subcategories?: string[] }): ServiceCategory {
  const categoryId = (jobCat as { id?: string; _id?: string }).id || jobCat._id;
  // Ensure id is always provided (required by ServiceCategory interface)
  if (!categoryId) {
    throw new Error(`Category "${jobCat.name}" is missing required id field`);
  }
  return {
    key: categoryId,
    id: categoryId,
    name: jobCat.name,
    description: jobCat.description,
    icon: jobCat.metadata?.icon,
    slug: jobCat.name.toLowerCase().replace(/\s+/g, '-'),
    displayOrder: jobCat.displayOrder,
    metadata: jobCat.metadata,
    subcategories: (jobCat as { subcategories?: string[] }).subcategories,
  };
}

interface UseJobCategoriesReturn {
  categories: ServiceCategory[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useJobCategories(): UseJobCategoriesReturn {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.jobsCategories}`,
        createAuthFetchOptions()
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch job categories: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let categoriesData: JobCategory[] = [];

      // Handle different response formats
      if (Array.isArray(data)) {
        categoriesData = data;
      } else if (data?.data?.categories && Array.isArray(data.data.categories)) {
        // Handle structure: { success: true, data: { categories: [...], count: number } }
        categoriesData = data.data.categories;
      } else if (data?.data && Array.isArray(data.data)) {
        // Handle structure: { success: true, data: [...] }
        categoriesData = data.data;
      } else if (data?.categories && Array.isArray(data.categories)) {
        // Handle structure: { categories: [...] }
        categoriesData = data.categories;
      }

      // Convert JobCategory[] to ServiceCategory[] for MarketplaceHero
      const serviceCategories = categoriesData
        .filter(cat => cat.isActive !== false)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .map(convertJobCategoryToServiceCategory);

      setCategories(serviceCategories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching job categories", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobCategories();
  }, [fetchJobCategories]);

  return {
    categories,
    loading,
    error,
    refetch: fetchJobCategories,
  };
}

