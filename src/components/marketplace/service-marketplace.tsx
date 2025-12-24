"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Filter, Grid3x3, List } from "lucide-react";
import { FilterSidebar } from "@/components/marketplace/filter-sidebar";
import { ServiceGrid } from "@/components/marketplace/service-grid";
import { ServiceCategory } from "@/components/marketplace/categories-carousel";
import { useMarketplaceServices } from "@/hooks/useMarketplaceServices";
import { useCategories } from "@/hooks/useCategories";
import { useMaxPrice } from "@/hooks/useMaxPrice";
import { useServiceFilters } from "@/hooks/useServiceFilters";

interface ServiceMarketplaceProps {
  userName?: string;
}

export function ServiceMarketplace({ userName }: ServiceMarketplaceProps) {
  // Fetch service categories
  const { 
    categories, 
    loading: categoriesLoading, 
    error: categoriesError, 
    refetch: refetchCategories 
  } = useCategories();

  // Fetch max price
  const maxPrice = useMaxPrice();

  // Manage filters
  const filters = useServiceFilters({
    maxPrice,
    initialPriceRange: [0, maxPrice],
    limit: 10,
  });

  // UI state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Memoized handlers
  const handleOpenFilters = useCallback(() => {
    setFilterDrawerOpen(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setFilterDrawerOpen(false);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    filters.setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters]);
  
  const handleDetectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }

    setDetectingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        filters.setLocationCoordinates({ lat, lng });
        filters.setLocation("");
        
        try {
          const { API_ENDPOINTS } = await import("@/lib/api");
          const { API_BASE_URL } = await import("@/lib/api");
          const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.mapsReverseGeocode}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ lat, lng }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.address) {
              filters.setLocation(data.address);
            }
          }
        } catch {
          // Error handled silently
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [filters]);

  // Fetch services with filters applied
  const { 
    featuredServices, 
    services, 
    loading: loadingServices, 
    error: servicesError,
    pagination: servicesPagination 
  } = useMarketplaceServices(filters.servicesParams);

  // Memoized active filters count for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.selectedCategory) count++;
    if (filters.location?.trim()) count++;
    if (filters.locationCoordinates) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) count++;
    if (filters.minRating > 0) count++;
    if (filters.isAvailable) count++;
    return count;
  }, [filters.selectedCategory, filters.location, filters.locationCoordinates, filters.priceRange, filters.minRating, filters.isAvailable, maxPrice]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Sidebar - Filters */}
          <FilterSidebar
            isOpen={filterDrawerOpen}
            onClose={handleCloseFilters}
            categories={categories}
            categoriesLoading={categoriesLoading}
            selectedCategory={filters.selectedCategory}
            onCategorySelect={filters.handleCategorySelect as (category: ServiceCategory | null) => void}
            location={filters.location}
            locationCoordinates={filters.locationCoordinates}
            radius={filters.radius}
            onLocationChange={filters.setLocation}
            onLocationCoordinatesChange={filters.setLocationCoordinates}
            onRadiusChange={filters.setRadius}
            detectingLocation={detectingLocation}
            onDetectLocation={handleDetectLocation}
            priceRange={filters.priceRange}
            maxPrice={maxPrice}
            onPriceRangeChange={filters.setPriceRange}
            minRating={filters.minRating}
            onMinRatingChange={filters.setMinRating}
            isAvailable={filters.isAvailable}
            onAvailabilityChange={filters.setIsAvailable}
            hasActiveFilters={filters.hasActiveFilters}
            onClearFilters={filters.clearFilters}
          />

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filter Button */}
            <div className="lg:hidden mb-4">
              <button
                onClick={handleOpenFilters}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                aria-label="Open filters"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Controls Bar */}
            <div className="mb-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
                  {/* Left Side - Sort Controls */}
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-xs font-medium text-gray-700 hidden sm:block">Sort by:</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => filters.setSortBy(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-700"
                      aria-label="Sort services by"
                    >
                      <option value="createdAt">Date Created</option>
                      <option value="basePrice">Price</option>
                      <option value="rating">Rating</option>
                      <option value="title">Title</option>
                    </select>

                    <select
                      value={filters.sortOrder}
                      onChange={(e) => filters.setSortOrder(e.target.value as 'asc' | 'desc')}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-gray-700"
                      aria-label="Sort order"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>

                  {/* Right Side - View Mode Toggle */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => filters.setViewMode('grid')}
                      className={`p-2 rounded-md transition-all duration-200 ${
                        filters.viewMode === 'grid'
                          ? 'bg-white text-emerald-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="Grid View"
                      aria-label="Switch to grid view"
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => filters.setViewMode('list')}
                      className={`p-2 rounded-md transition-all duration-200 ${
                        filters.viewMode === 'list'
                          ? 'bg-white text-emerald-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title="List View"
                      aria-label="Switch to list view"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error State */}
            {servicesError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-medium text-red-800 mb-1">
                  Error loading services
                </p>
                <p className="text-xs text-red-600">
                  {servicesError}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Please try refreshing the page or adjusting your filters.
                </p>
              </div>
            )}

            {/* Service Listings */}
            <ServiceGrid 
              featuredServices={featuredServices}
              services={services}
              loading={loadingServices}
              hasActiveFilters={filters.hasActiveFilters}
              pagination={servicesPagination}
              currentPage={filters.currentPage}
              onPageChange={handlePageChange}
              viewMode={filters.viewMode}
              selectedCategory={filters.selectedCategory}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

