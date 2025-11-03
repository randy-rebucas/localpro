"use client";

import React, { useState, useEffect, useMemo } from "react";
import { GlobalHeader } from "@/components/global-header";
import { useSession } from "@/hooks/useAuth";
import { MarketplaceHero } from "./marketplace-hero";
import { FilterSidebar } from "./filter-sidebar";
import { ServiceGrid } from "./service-grid";
import { MarketplaceFooter } from "./marketplace-footer";
import { ServiceCategory } from "./categories-carousel";
import { useMarketplaceServices } from "@/hooks/useMarketplaceServices";
import { useCategories } from "@/hooks/useCategories";
import { API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

function MarketplaceLayoutContent() {
  const { data: session } = useSession();
  const { categories, loading: categoriesLoading, error: categoriesError, refetch: refetchCategories } = useCategories();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [minRating, setMinRating] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [location, setLocation] = useState("");
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch max price once on initial load (without filters) to set the price range
  useEffect(() => {
    const fetchMaxPrice = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/marketplace/services?limit=1&sortBy=basePrice&sortOrder=desc`,
          createAuthFetchOptions()
        );
        if (response.ok) {
          const data = await response.json();
          const services = Array.isArray(data) ? data : (data.data || []);
          if (services.length > 0) {
            const service = services[0];
            const price = service.pricing?.basePrice || service.basePrice || service.price || 0;
            if (price > 0) {
              const calculatedMax = Math.ceil(price / 1000) * 1000;
              setMaxPrice(calculatedMax);
              setPriceRange((prev) => prev[1] === 10000 ? [0, calculatedMax] : prev);
            }
          }
        }
      } catch (error) {
        logger.error("Error fetching max price", error instanceof Error ? error : new Error(String(error)));
      }
    };
    fetchMaxPrice();
  }, []);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryKey, subcategory, location, priceRange, minRating, isAvailable]);

  // Build query parameters for services fetch
  const servicesParams = useMemo(() => ({
    categoryKey: categoryKey || undefined,
    subcategory: subcategory || undefined,
    location: location.trim() || undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < maxPrice ? priceRange[1] : undefined,
    rating: minRating > 0 ? minRating : undefined,
    isActive: isAvailable ? true : undefined, // Only filter if explicitly enabled
    page: currentPage,
    limit: 10, // Items per page
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
    groupByCategory: false,
  }), [categoryKey, subcategory, location, priceRange, minRating, maxPrice, isAvailable, currentPage]);

  // Fetch services with filters applied via query parameters
  const { featuredServices, services, loading: loadingServices, pagination } = useMarketplaceServices(servicesParams);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getUserName = () => {
    if (session?.user?.firstName) {
      return session.user.firstName;
    }
    if (session?.user?.name) {
      return session.user.name.split(" ")[0];
    }
    return "there";
  };

  // Get category key from selected category
  const getCategoryKey = (category: ServiceCategory | null): string | null => {
    if (!category) return null;
    return category.key || category.id || category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
  };

  // Update category key when selected category changes
  useEffect(() => {
    const key = getCategoryKey(selectedCategory);
    setCategoryKey(key);
  }, [selectedCategory]);

  const hasActiveFilters = useMemo(() => {
    return priceRange[0] !== 0 ||
           priceRange[1] !== maxPrice ||
           minRating !== 0 ||
           isAvailable ||
           location.trim() !== "" ||
           subcategory !== null;
  }, [priceRange, maxPrice, minRating, isAvailable, location, subcategory]);

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setCategoryKey(null);
    setSubcategory(null);
    setPriceRange([0, maxPrice]);
    setMinRating(0);
    setIsAvailable(false);
    setLocation("");
    setCurrentPage(1);
  };

  const handleCategorySelect = (category: ServiceCategory | null) => {
    setSelectedCategory(category);
    const key = getCategoryKey(category);
    setCategoryKey(key);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
        <GlobalHeader
          showRoleNavigation={false}
          showFavorites={true}
          notificationsDropdown={true}
          logoHref="/"
          showFilter={true}
          onFilterClick={() => setFilterDrawerOpen(true)}
        />

        {/* Hero / Header Section */}
        <MarketplaceHero
          userName={getUserName()}
          selectedCategory={categoryKey}
          categories={categories}
          categoriesLoading={categoriesLoading}
          categoriesError={categoriesError}
          onCategorySelect={handleCategorySelect as (category: ServiceCategory | undefined) => void}
          onCategoriesRetry={refetchCategories}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar - Filters */}
            <FilterSidebar
              isOpen={filterDrawerOpen}
              onClose={() => setFilterDrawerOpen(false)}
              priceRange={priceRange}
              maxPrice={maxPrice}
              onPriceRangeChange={setPriceRange}
              minRating={minRating}
              onMinRatingChange={setMinRating}
              isAvailable={isAvailable}
              onAvailabilityChange={setIsAvailable}
              location={location}
              onLocationChange={setLocation}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {/* Service Listings */}
              <ServiceGrid 
                featuredServices={featuredServices}
                services={services}
                loading={loadingServices}
                hasActiveFilters={hasActiveFilters}
                pagination={pagination}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <MarketplaceFooter />
      </div>
  );
}

export function MarketplaceLayout() {
  return <MarketplaceLayoutContent />;
}
