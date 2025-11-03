"use client";

import React, { useState, useEffect } from "react";
import { GlobalHeader } from "@/components/global-header";
import { useSession } from "@/hooks/useAuth";
import { MarketplaceHero } from "./marketplace-hero";
import { FilterSidebar } from "./filter-sidebar";
import { ServiceGrid } from "./service-grid";
import { MarketplaceFooter } from "./marketplace-footer";
import { ServiceCategory } from "./categories-carousel";
import { CategoriesProvider, useCategoriesContext } from "./categories-context";
import { useCategoryServices } from "@/hooks/useCategoryServices";

function MarketplaceLayoutContent() {
  const { data: session } = useSession();
  const { categories } = useCategoriesContext();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [sidebarCategory, setSidebarCategory] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [minRating, setMinRating] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [location, setLocation] = useState("");

  // Fetch services for the selected category
  const { featuredServices, services, loading: loadingServices } = useCategoryServices(categoryKey);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const hasActiveFilters =
    priceRange[0] !== 0 ||
    priceRange[1] !== 10000 ||
    minRating !== 0 ||
    isAvailable ||
    location !== "";

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setCategoryKey(null);
    setSidebarCategory("");
    setPriceRange([0, 10000]);
    setMinRating(0);
    setIsAvailable(false);
    setLocation("");
  };

  const handleCategoryChange = (categoryKey: string) => {
    setSidebarCategory(categoryKey);
    // Find the category object from the categories context
    if (categoryKey) {
      const category = categories.find((cat) => {
        const key = cat.key || cat.id || cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
        return key === categoryKey;
      });
      if (category) {
        handleCategorySelect(category);
      }
    } else {
      handleCategorySelect(null);
    }
  };

  const handleCategorySelect = (category: ServiceCategory | null) => {
    setSelectedCategory(category);
    const key = getCategoryKey(category);
    setCategoryKey(key);
    // Update sidebar category to match
    if (category) {
      const key = getCategoryKey(category);
      setSidebarCategory(key || "");
    } else {
      setSidebarCategory("");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
        <GlobalHeader
          showRoleNavigation={false}
          showFavorites={true}
          showMessages={true}
          notificationsDropdown={true}
          logoHref="/"
          showFilter={true}
          onFilterClick={() => setFilterDrawerOpen(true)}
        />

        {/* Hero / Header Section */}
        <MarketplaceHero
          userName={getUserName()}
          selectedCategory={categoryKey}
          onCategorySelect={handleCategorySelect as (category: ServiceCategory | undefined) => void}
        />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar - Filters */}
            <FilterSidebar
              isOpen={filterDrawerOpen}
              onClose={() => setFilterDrawerOpen(false)}
              priceRange={priceRange}
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
  return (
    <CategoriesProvider>
      <MarketplaceLayoutContent />
    </CategoriesProvider>
  );
}
