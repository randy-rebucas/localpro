"use client";

import React, { useState, useEffect, useMemo } from "react";
import { GlobalHeader } from "@/components/global-header";
import { useSession } from "@/hooks/useAuth";
import { MarketplaceHero } from "./marketplace-hero";
import { FilterSidebar } from "./filter-sidebar";
import { ServiceGrid } from "./service-grid";
import { MarketplaceFooter } from "./marketplace-footer";
import { ServiceCategory } from "./categories-carousel";
import { LocationAutocomplete } from "./location-autocomplete";
import { Navigation, MapPin } from "lucide-react";
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
  const [locationCoordinates, setLocationCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(5000); // Default 5km in meters
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
  }, [categoryKey, subcategory, location, locationCoordinates, radius, priceRange, minRating, isAvailable]);

  // Build query parameters for services fetch
  const servicesParams = useMemo(() => ({
    categoryKey: categoryKey || undefined,
    subcategory: subcategory || undefined,
    location: location.trim() || undefined,
    lat: locationCoordinates?.lat,
    lng: locationCoordinates?.lng,
    radius: locationCoordinates ? radius : undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < maxPrice ? priceRange[1] : undefined,
    rating: minRating > 0 ? minRating : undefined,
    isActive: isAvailable ? true : undefined, // Only filter if explicitly enabled
    page: currentPage,
    limit: 10, // Items per page
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
    groupByCategory: false,
  }), [categoryKey, subcategory, location, locationCoordinates, radius, priceRange, minRating, maxPrice, isAvailable, currentPage]);

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
           locationCoordinates !== null ||
           subcategory !== null;
  }, [priceRange, maxPrice, minRating, isAvailable, location, locationCoordinates, subcategory]);

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setCategoryKey(null);
    setSubcategory(null);
    setPriceRange([0, maxPrice]);
    setMinRating(0);
    setIsAvailable(false);
    setLocation("");
    setLocationCoordinates(null);
    setRadius(5000); // Reset to default 5km
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
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
            />

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {/* Location Selector - Above Service Results */}
              <div className="mb-6 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <label className="text-sm font-semibold text-gray-900">Location</label>
                  </div>
                  
                  {/* Location Autocomplete */}
                  <LocationAutocomplete
                    value={location}
                    onChange={setLocation}
                    onCoordinatesChange={setLocationCoordinates}
                    placeholder="Search location..."
                  />

                  {/* Nearby Filter with Radius Slider */}
                  {locationCoordinates && (
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Navigation className="w-4 h-4 text-green-600" />
                        <label className="text-sm font-semibold text-gray-900">Search Radius</label>
                      </div>
                      
                      {/* Radius Display */}
                      <div className="bg-green-50 rounded-xl px-4 py-3 border border-green-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Radius</span>
                          <span className="text-base font-bold text-green-700">
                            {(radius / 1000).toFixed(1)} km
                          </span>
                        </div>
                      </div>

                      {/* Radius Slider */}
                      <div className="relative py-2">
                        <input
                          type="range"
                          min="1000"
                          max="50000"
                          step="1000"
                          value={radius}
                          onChange={(e) => setRadius(Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                          style={{
                            background: `linear-gradient(to right, #16a34a 0%, #16a34a ${((radius - 1000) / (50000 - 1000)) * 100}%, #e5e7eb ${((radius - 1000) / (50000 - 1000)) * 100}%, #e5e7eb 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>1 km</span>
                          <span>50 km</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
