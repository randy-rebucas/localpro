"use client";

import React, { useState } from "react";
import { MarketplaceHero } from "@/components/marketplace/marketplace-hero";
import { FilterSidebar } from "@/components/marketplace/filter-sidebar";
import { ServiceGrid } from "@/components/marketplace/service-grid";
import { ServiceCategory } from "@/components/marketplace/categories-carousel";
import { useMarketplaceServices } from "@/hooks/useMarketplaceServices";
import { useCategories } from "@/hooks/useCategories";
import { useMaxPrice } from "@/hooks/useMaxPrice";
import { useServiceFilters } from "@/hooks/useServiceFilters";
import { ServiceControlsBar } from "@/components/marketplace/service-controls-bar";
import { AISearchSection } from "@/components/marketplace/ai-search-section";
import { AIFeaturesSection } from "@/components/marketplace/ai-features-section";
import { AIFeaturesToggle } from "@/components/marketplace/ai-features-toggle";

interface ServiceMarketplaceProps {
  userName: string;
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

  // Location detection - integrated with filters
  // We'll use filters state directly and add location detection handlers
  const [detectingLocation, setDetectingLocation] = React.useState(false);
  
  const handleDetectLocation = React.useCallback(() => {
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
  const { featuredServices, services, loading: loadingServices, pagination: servicesPagination } = useMarketplaceServices(filters.servicesParams);

  const handlePageChange = (page: number) => {
    filters.setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // UI state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [preferredFeatureSelectorOpen, setPreferredFeatureSelectorOpen] = useState(false);
  const [showAIFeatures, setShowAIFeatures] = useState({
    recommendations: true,
    priceEstimator: false,
    serviceMatcher: false,
  });

  return (
    <>
      {/* Hero Section with Categories */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <MarketplaceHero
            userName={userName}
            selectedCategory={filters.categoryKey}
            categories={categories}
            categoriesLoading={categoriesLoading}
            categoriesError={categoriesError}
            onCategorySelect={filters.handleCategorySelect as (category: ServiceCategory | undefined) => void}
            onCategoriesRetry={refetchCategories}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* AI Natural Language Search */}
        <AISearchSection
          location={filters.location}
          lat={filters.locationCoordinates?.lat}
          lng={filters.locationCoordinates?.lng}
          radius={filters.radius}
          priceRange={filters.priceRange}
          onPriceRangeChange={filters.setPriceRange}
          onCategoryKeyChange={filters.setCategoryKey}
          onSubcategoryChange={filters.setSubcategory}
          onMinRatingChange={filters.setMinRating}
          onLocationChange={filters.setLocation}
          onLocationCoordinatesChange={filters.setLocationCoordinates}
          onRadiusChange={filters.setRadius}
        />

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Sidebar - Filters */}
          <FilterSidebar
            isOpen={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
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
            {/* Controls Bar */}
            <ServiceControlsBar
              locationCoordinates={filters.locationCoordinates}
              radius={filters.radius}
              detectingLocation={detectingLocation}
              onDetectLocation={handleDetectLocation}
              onClearLocation={() => {
                filters.setLocationCoordinates(null);
                filters.setLocation("");
              }}
              onRadiusChange={filters.setRadius}
              sortBy={filters.sortBy}
              onSortByChange={filters.setSortBy}
              sortOrder={filters.sortOrder}
              onSortOrderChange={filters.setSortOrder}
              groupByCategory={filters.groupByCategory}
              onGroupByCategoryChange={filters.setGroupByCategory}
              viewMode={filters.viewMode}
              onViewModeChange={filters.setViewMode}
            />

            {/* AI Features Section */}
            <AIFeaturesSection
              showAIFeatures={showAIFeatures}
              location={filters.location}
              lat={filters.locationCoordinates?.lat}
              lng={filters.locationCoordinates?.lng}
            />

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

      {/* AI Features Toggle */}
      <AIFeaturesToggle
        showAIFeatures={showAIFeatures}
        onToggleAIFeatures={setShowAIFeatures}
        preferredFeatureSelectorOpen={preferredFeatureSelectorOpen}
        onTogglePreferredFeatureSelector={setPreferredFeatureSelectorOpen}
      />
    </>
  );
}

