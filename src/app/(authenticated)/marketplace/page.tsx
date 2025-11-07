"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Star, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { getCategoryIcon } from "@/components/marketplace/categories-carousel";

interface ServiceCategory {
  key: string;
  name: string;
  description: string;
  icon: string;
  subcategories: string[];
  statistics: {
    totalServices: number;
    pricing: {
      average: number;
      min: number;
      max: number;
    } | null;
    rating: {
      average: number;
      totalRatings: number;
    } | null;
    popularSubcategories: Array<{
      subcategory: string;
      count: number;
    }>;
  };
}

interface CategoriesResponse {
  success: boolean;
  message?: string;
  data: ServiceCategory[];
  summary?: {
    totalCategories: number;
    totalServices: number;
    totalProviders: number;
    categoriesWithServices: number;
  };
}

export default function MarketplacePage() {
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.marketplaceServicesCategories}`,
        createAuthFetchOptions()
      );

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data: CategoriesResponse = await response.json();
      
      // Handle API response structure: {success: true, data: [...]}
      if (data.success && data.data && Array.isArray(data.data)) {
        setCategories(data.data);
      } else if (Array.isArray(data)) {
        // Fallback if response is directly an array - map to ServiceCategory structure
        const mappedCategories: ServiceCategory[] = (data as Array<{ id?: string; name: string; slug?: string; description?: string; icon?: string }>).map((item) => ({
          key: item.id || item.slug || item.name.toLowerCase().replace(/\s+/g, '-'),
          name: item.name,
          description: item.description || '',
          icon: item.icon || '',
          subcategories: [],
          statistics: {
            totalServices: 0,
            pricing: null,
            rating: null,
            popularSubcategories: []
          }
        }));
        setCategories(mappedCategories);
      } else {
        logger.warn("Unexpected categories response format", { hasData: !!data });
        setCategories([]);
      }
    } catch (error) {
      logger.error("Error fetching categories", error instanceof Error ? error : new Error(String(error)));
      setError(error instanceof Error ? error.message : "Failed to load categories");
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  if (loadingCategories) {
    return (
      <div className="p-4 space-y-4">
        <div className="mb-4">
          <div className="h-7 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse mb-2"></div>
                <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card interactive={false}>
          <EmptyState
            icon={RefreshCw}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
            title="Unable to Load Categories"
            description={error}
            actions={[
              {
                type: "button",
                onClick: fetchCategories,
                label: "Try Again",
                icon: RefreshCw,
                variant: "primary"
              }
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Categories Grid */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Browse by Category</h2>
        <p className="text-sm text-gray-500">Explore services by category</p>
      </div>
      
      {categories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {categories.map((category) => (
            <Link
              key={category.key}
              href={`/marketplace/services/category/${category.key}`}
              className="group p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all text-left block bg-white"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                {(() => {
                  const IconComponent = getCategoryIcon(category);
                  return (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center mb-2 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                      <IconComponent className="w-8 h-8" />
                    </div>
                  );
                })()}
                <h3 className="font-medium text-gray-700 group-hover:text-green-600 transition-colors">
                  {category.name}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 min-h-[2.5rem]">
                  {category.description}
                </p>
                {category.statistics.totalServices > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 w-full">
                    <div className="text-xs text-gray-600">
                      <span className="font-semibold text-green-600">
                        {category.statistics.totalServices}
                      </span>
                      {" "}service{category.statistics.totalServices !== 1 ? 's' : ''}
                    </div>
                    {category.statistics.pricing && (
                      <div className="text-xs text-gray-500 mt-1">
                        ${category.statistics.pricing.min} - ${category.statistics.pricing.max}
                      </div>
                    )}
                    {category.statistics.rating && category.statistics.rating.totalRatings > 0 && (
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-600">
                          {category.statistics.rating.average.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Card interactive={false}>
          <EmptyState
            icon={RefreshCw}
            iconColor="text-gray-400"
            iconBgColor="bg-gray-100"
            title="No Categories Available"
            description="Categories will appear here once they are available."
          />
        </Card>
      )}
    </div>
  );
}

