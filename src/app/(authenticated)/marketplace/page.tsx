"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "@/hooks/useAuth";
import { MarketplaceHero } from "@/components/marketplace/marketplace-hero";
import { FilterSidebar } from "@/components/marketplace/filter-sidebar";
import { ServiceGrid } from "@/components/marketplace/service-grid";
import { ServiceCategory } from "@/components/marketplace/categories-carousel";
import { Navigation, MapPin, Grid3x3, List, Loader2, Sparkles, X } from "lucide-react";
import { useMarketplaceServices } from "@/hooks/useMarketplaceServices";
import { useCategories } from "@/hooks/useCategories";
import { API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { PreferredFeatureSelector } from "@/components/preferred-feature-selector";
import { AINaturalLanguageSearch } from "@/components/marketplace/ai-natural-language-search";
import { AIServiceRecommendations } from "@/components/marketplace/ai-service-recommendations";
import { AIPriceEstimator } from "@/components/marketplace/ai-price-estimator";
import { AIServiceMatcher } from "@/components/marketplace/ai-service-matcher";

export default function MarketplacePage() {
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
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [groupByCategory, setGroupByCategory] = useState<boolean>(false);
  const limit = 10; // Fixed limit per page
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [preferredFeatureSelectorOpen, setPreferredFeatureSelectorOpen] = useState(false);
  const [showAIFeatures, setShowAIFeatures] = useState({
    recommendations: true,
    priceEstimator: false,
    serviceMatcher: false,
  });

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
  }, [categoryKey, subcategory, location, locationCoordinates, radius, priceRange, minRating, isAvailable, sortBy, sortOrder, groupByCategory]);

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
    limit: limit,
    sortBy: sortBy,
    sortOrder: sortOrder,
    groupByCategory: groupByCategory,
  }), [categoryKey, subcategory, location, locationCoordinates, radius, priceRange, minRating, maxPrice, isAvailable, currentPage, limit, sortBy, sortOrder, groupByCategory]);

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

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      logger.warn("Geolocation is not supported by this browser");
      return;
    }

    setDetectingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setLocationCoordinates({ lat, lng });
        setLocation(""); // Clear text location when using coordinates
        
        // Try to reverse geocode to get location name
        try {
          const { API_ENDPOINTS } = await import("@/lib/api");
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
              setLocation(data.address);
            }
          }
        } catch (error) {
          logger.error("Error reverse geocoding", error instanceof Error ? error : new Error(String(error)));
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        logger.error("Error getting location", error instanceof Error ? error : new Error(String(error)));
        setDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
        {/* Hero / Header Section */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {/* Top Bar with Greeting */}
            <div className="flex items-start justify-between mb-6 lg:mb-8">
              {/* Welcome Text */}
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Hi {getUserName()}, what service do you need today?
                </h1>
                <p className="text-sm sm:text-base text-gray-600">Find the perfect service provider for your needs</p>
              </div>
            </div>
            <MarketplaceHero
              userName={getUserName()}
              selectedCategory={categoryKey}
              categories={categories}
              categoriesLoading={categoriesLoading}
              categoriesError={categoriesError}
              onCategorySelect={handleCategorySelect as (category: ServiceCategory | undefined) => void}
              onCategoriesRetry={refetchCategories}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* AI Natural Language Search */}
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Sparkles className="w-4 h-4 inline mr-1 text-green-600" />
                Discover Services
              </label>
              <AINaturalLanguageSearch
                onSearchResult={(filters) => {
                  if (filters.category) setCategoryKey(filters.category);
                  if (filters.subcategory) setSubcategory(filters.subcategory);
                  if (filters.minPrice !== undefined) setPriceRange([filters.minPrice, priceRange[1]]);
                  if (filters.maxPrice !== undefined) setPriceRange([priceRange[0], filters.maxPrice]);
                  if (filters.minRating !== undefined) setMinRating(filters.minRating);
                  if (filters.location) setLocation(filters.location);
                  if (filters.lat && filters.lng) {
                    setLocationCoordinates({ lat: filters.lat, lng: filters.lng });
                    if (filters.radius) setRadius(filters.radius);
                  }
                }}
                location={location}
                lat={locationCoordinates?.lat}
                lng={locationCoordinates?.lng}
                radius={radius}
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
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
              {/* Controls Bar - Location on Left, View/Sort Controls on Right */}
              <div className="mb-6 bg-white rounded-xl p-4 lg:p-5 shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Left Side - Location Detection */}
                  <div className="flex-1 w-full sm:w-auto">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleDetectLocation}
                        disabled={detectingLocation}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm hover:shadow-md"
                      >
                        {detectingLocation ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Detecting...</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4" />
                            <span>Detect Current Location</span>
                          </>
                        )}
                      </button>
                      
                      {locationCoordinates && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Navigation className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{(radius / 1000).toFixed(1)} km radius</span>
                          <button
                            onClick={() => {
                              setLocationCoordinates(null);
                              setLocation("");
                            }}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Radius Slider - Show when location is detected */}
                    {locationCoordinates && (
                      <div className="mt-3 space-y-2">
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
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>1 km</span>
                          <span>50 km</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side - Sort, Group, and View Mode Controls */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    {/* Sort By */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors hover:border-gray-400"
                    >
                      <option value="createdAt">Date Created</option>
                      <option value="basePrice">Price</option>
                      <option value="rating">Rating</option>
                      <option value="title">Title</option>
                    </select>

                    {/* Sort Order */}
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors hover:border-gray-400"
                    >
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>

                    {/* Group By Category Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer px-2 py-1 rounded-md hover:bg-gray-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={groupByCategory}
                        onChange={(e) => setGroupByCategory(e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700 whitespace-nowrap">Group by Category</span>
                    </label>

                    {/* View Mode Toggle - Moved to the right */}
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === 'grid'
                            ? 'bg-white text-green-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="Grid View"
                      >
                        <Grid3x3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === 'list'
                            ? 'bg-white text-green-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        title="List View"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Service Recommendations */}
              {showAIFeatures.recommendations && (
                <div className="mb-6">
                  <AIServiceRecommendations
                    location={location}
                    lat={locationCoordinates?.lat}
                    lng={locationCoordinates?.lng}
                    limit={5}
                  />
                </div>
              )}

              {/* AI Service Matcher */}
              {showAIFeatures.serviceMatcher && (
                <div className="mb-6">
                  <AIServiceMatcher
                    location={location}
                    lat={locationCoordinates?.lat}
                    lng={locationCoordinates?.lng}
                  />
                </div>
              )}

              {/* Service Listings */}
              <ServiceGrid 
                featuredServices={featuredServices}
                services={services}
                loading={loadingServices}
                hasActiveFilters={hasActiveFilters}
                pagination={pagination}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                viewMode={viewMode}
                selectedCategory={selectedCategory}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Price Estimator */}
      {showAIFeatures.priceEstimator && (
        <div className="fixed bottom-6 left-6 z-[9999] max-w-sm w-96">
          <AIPriceEstimator />
        </div>
      )}
      
      {/* Floating AI Features Toggle */}
      <div className="hidden lg:flex fixed bottom-6 right-6 z-[9998] flex-col gap-3">
        <button
          onClick={() => setShowAIFeatures({ ...showAIFeatures, priceEstimator: !showAIFeatures.priceEstimator })}
          className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          aria-label="Toggle AI Price Estimator"
          title="AI Price Estimator"
        >
          <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={() => setShowAIFeatures({ ...showAIFeatures, serviceMatcher: !showAIFeatures.serviceMatcher })}
          className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          aria-label="Toggle AI Service Matcher"
          title="AI Service Matcher"
        >
          <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={() => setPreferredFeatureSelectorOpen(!preferredFeatureSelectorOpen)}
          className="w-14 h-14 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          aria-label="Toggle preferred feature selector"
          title="Preferred Feature"
        >
          {preferredFeatureSelectorOpen ? (
            <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
          ) : (
            <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      {/* Floating Preferred Feature Selector - Right Side */}
      {preferredFeatureSelectorOpen && (
        <div className="hidden lg:block fixed right-6 top-24 z-[9997] max-w-sm w-80 transition-all duration-300 ease-in-out">
          <PreferredFeatureSelector />
        </div>
      )}
    </>
  );
}

