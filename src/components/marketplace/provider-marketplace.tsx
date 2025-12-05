"use client";

import React, { useState } from "react";
import { MarketplaceHero } from "@/components/marketplace/marketplace-hero";
import { SkillsCarousel } from "@/components/marketplace/skills-carousel";
import { ProviderFilterSidebar } from "@/components/marketplace/provider-filter-sidebar";
import { ProviderGrid } from "@/components/marketplace/provider-grid";
import { useProviders } from "@/hooks/useProviders";
import { useCategories } from "@/hooks/useCategories";
import { useProviderFilters } from "@/hooks/useProviderFilters";
import { ProviderControlsBar } from "@/components/marketplace/provider-controls-bar";

interface ProviderMarketplaceProps {
  userName: string;
}

export function ProviderMarketplace({ userName }: ProviderMarketplaceProps) {
  // Fetch service categories (providers can be filtered by service category)
  const { 
    categories, 
    loading: categoriesLoading, 
    error: categoriesError, 
    refetch: refetchCategories 
  } = useCategories();

  // Manage filters
  const filters = useProviderFilters({
    limit: 20,
  });

  // Fetch providers with filters applied
  const { providers, loading: loadingProviders, pagination: providersPagination } = useProviders(filters.providersParams);

  const handlePageChange = (page: number) => {
    filters.setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // UI state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  return (
    <>
      {/* Hero Section with Categories */}
      <div className="bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-4">
          <MarketplaceHero
            userName={userName}
            selectedCategory={filters.category}
            categories={categories}
            categoriesLoading={categoriesLoading}
            categoriesError={categoriesError}
            onCategorySelect={(category) => {
              if (category) {
                // Pass both category key (for UI) and categoryId (ObjectId for API)
                const categoryWithId = category as { _id?: string; id?: string; key?: string; name?: string };
                const categoryId = categoryWithId._id || categoryWithId.id || categoryWithId.key;
                const categoryKey = category.key || category.name;
                filters.setCategory(categoryKey, categoryId);
              } else {
                filters.setCategory("", "");
              }
            }}
            onCategoriesRetry={refetchCategories}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="py-4 lg:py-5 bg-transparent">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
          {/* Left Sidebar - Filters */}
          <ProviderFilterSidebar
            isOpen={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            status={filters.status}
            onStatusChange={filters.setStatus}
            providerType={filters.providerType}
            onProviderTypeChange={filters.setProviderType}
            location={filters.location}
            onLocationChange={filters.setLocation}
            hasActiveFilters={filters.hasActiveFilters}
            onClearFilters={filters.clearFilters}
          />

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Skills Carousel - shown when a category is selected */}
            {filters.category && (
              <SkillsCarousel
                category={filters.category}
                selectedSkills={filters.skills}
                onSkillToggle={filters.toggleSkill}
                onClearSkills={filters.clearSkills}
              />
            )}

            {/* Controls Bar */}
            <ProviderControlsBar
              sortBy={filters.sortBy}
              onSortByChange={filters.setSortBy}
              sortOrder={filters.sortOrder}
              onSortOrderChange={filters.setSortOrder}
              viewMode={filters.viewMode}
              onViewModeChange={filters.setViewMode}
            />

            {/* Provider Listings */}
            <ProviderGrid 
              providers={providers}
              loading={loadingProviders}
              hasActiveFilters={filters.hasActiveFilters}
              pagination={providersPagination || null}
              currentPage={filters.currentPage}
              onPageChange={handlePageChange}
              viewMode={filters.viewMode}
              selectedCategory={filters.category}
              selectedSkills={filters.skills}
            />
          </div>
        </div>
      </div>
    </>
  );
}

