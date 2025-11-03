"use client";

import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

export interface MarketplaceService {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  categoryKey?: string;
  location?: string;
  basePrice?: number;
  price?: number;
  currency?: string;
  rating?: number | { 
    average?: number; 
    count?: number; 
    rating?: number; 
    totalRatings?: number;
    totalReviews?: number;
  };
  reviewCount?: number;
  totalRatings?: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  provider?: {
    _id?: string;
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    isVerified?: boolean;
    profile?: {
      rating?: number;
    };
  };
  pricing?: {
    type?: string;
    basePrice?: number;
    currency?: string;
  };
  serviceArea?: string[];
  features?: string[];
  requirements?: string[];
  serviceType?: string;
  estimatedDuration?: {
    min?: number;
    max?: number;
  };
  teamSize?: number;
  equipmentProvided?: boolean;
  materialsIncluded?: boolean;
  warranty?: {
    hasWarranty?: boolean;
  };
  insurance?: {
    covered?: boolean;
  };
  emergencyService?: {
    available?: boolean;
  };
  images?: Array<{
    url?: string;
    thumbnail?: string;
    alt?: string;
    publicId?: string;
  }>;
  servicePackages?: Array<unknown>;
  addOns?: Array<unknown>;
  createdAt?: string;
  updatedAt?: string;
}

interface CategoryServicesResponse {
  success?: boolean;
  message?: string;
  data?: {
    featuredServices?: MarketplaceService[];
    services?: MarketplaceService[];
  };
  featuredServices?: MarketplaceService[];
  services?: MarketplaceService[];
}

export function useCategoryServices(categoryKey: string | null) {
  const [featuredServices, setFeaturedServices] = useState<MarketplaceService[]>([]);
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategoryServices = useCallback(async () => {
    if (!categoryKey) {
      setFeaturedServices([]);
      setServices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/api/marketplace/services/categories/${categoryKey}`,
        createAuthFetchOptions()
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch category services: ${response.status} ${response.statusText}`);
      }

      const data: CategoryServicesResponse | MarketplaceService[] = await response.json();

      // Handle different response structures
      if (Array.isArray(data)) {
        // If response is directly an array, separate featured and regular services
        const featured = data.filter((service) => service.isFeatured === true);
        const regular = data.filter((service) => service.isFeatured !== true);
        setFeaturedServices(featured);
        setServices(regular);
      } else if (typeof data === 'object' && data !== null) {
        if ('success' in data && (data as CategoryServicesResponse).success) {
          const responseData = data as CategoryServicesResponse;
          // Handle nested data structure
          if (responseData.data) {
            setFeaturedServices(responseData.data.featuredServices || []);
            setServices(responseData.data.services || []);
          } else {
            // Handle flat structure
            setFeaturedServices(responseData.featuredServices || []);
            setServices(responseData.services || []);
          }
        } else {
          // Fallback: treat as array of services
          const fallbackData = data as { services?: MarketplaceService[]; data?: MarketplaceService[] };
          const servicesArray = fallbackData.services || fallbackData.data || [];
          const featured = servicesArray.filter((service: MarketplaceService) => service.isFeatured === true);
          const regular = servicesArray.filter((service: MarketplaceService) => service.isFeatured !== true);
          setFeaturedServices(featured);
          setServices(regular);
        }
      } else {
        logger.warn("Unexpected category services response format", { hasData: !!data });
        setFeaturedServices([]);
        setServices([]);
      }
    } catch (error) {
      logger.error("Error fetching category services", error instanceof Error ? error : new Error(String(error)));
      setError(error instanceof Error ? error.message : "Failed to load services");
      setFeaturedServices([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [categoryKey]);

  useEffect(() => {
    fetchCategoryServices();
  }, [fetchCategoryServices]);

  return {
    featuredServices,
    services,
    loading,
    error,
    refetch: fetchCategoryServices,
  };
}

