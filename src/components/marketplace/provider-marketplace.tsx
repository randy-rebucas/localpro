"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter, Users, Store, ArrowLeft } from "lucide-react";
import { SkillsCarousel } from "@/components/marketplace/skills-carousel";
import { ProviderFilterSidebar } from "@/components/marketplace/provider-filter-sidebar";
import { ProviderGrid } from "@/components/marketplace/provider-grid";
import { useProviders } from "@/hooks/useProviders";
import { useProviderFilters } from "@/hooks/useProviderFilters";
import { ProviderControlsBar } from "@/components/marketplace/provider-controls-bar";

interface ProviderMarketplaceProps {
  userName?: string;
}

export function ProviderMarketplace({ userName }: ProviderMarketplaceProps) {
  const router = useRouter();
  
  // Manage filters
  const filters = useProviderFilters({
    limit: 20,
  });

  // Fetch providers with filters applied
  const { 
    providers, 
    loading: loadingProviders, 
    error: providersError,
    pagination: providersPagination 
  } = useProviders(filters.providersParams);

  // UI state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Memoized page change handler
  const handlePageChange = useCallback((page: number) => {
    filters.setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters]);

  // Memoized filter drawer handlers
  const handleOpenFilters = useCallback(() => {
    setFilterDrawerOpen(true);
  }, []);

  const handleCloseFilters = useCallback(() => {
    setFilterDrawerOpen(false);
  }, []);

  // Memoized active filters count for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.status) count++;
    if (filters.providerType) count++;
    if (filters.location?.trim()) count++;
    if (filters.category || filters.categoryId) count++;
    if (filters.skills.length > 0) count += filters.skills.length;
    return count;
  }, [filters.status, filters.providerType, filters.location, filters.category, filters.categoryId, filters.skills]);

  // Back button handler
  const handleBack = useCallback(() => {
    router.push('/marketplace');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Header Section */}
        <div className="mb-8">
          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back to marketplace"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Marketplace</span>
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Providers</h1>
                <p className="text-sm text-gray-500 mt-0.5">Discover trusted service providers in your area</p>
              </div>
            </div>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg"
            >
              <Store className="w-4 h-4" />
              Browse Services
            </Link>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Sidebar - Filters */}
          <ProviderFilterSidebar
            isOpen={filterDrawerOpen}
            onClose={handleCloseFilters}
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

            {/* Skills Carousel - shown when a category is selected */}
            {filters.category && (
              <div className="mb-6">
                <SkillsCarousel
                  category={filters.category}
                  selectedSkills={filters.skills}
                  onSkillToggle={filters.toggleSkill}
                  onClearSkills={filters.clearSkills}
                />
              </div>
            )}

            {/* Controls Bar */}
            <div className="mb-6">
              <ProviderControlsBar
                sortBy={filters.sortBy}
                onSortByChange={filters.setSortBy}
                sortOrder={filters.sortOrder}
                onSortOrderChange={filters.setSortOrder}
                viewMode={filters.viewMode}
                onViewModeChange={filters.setViewMode}
              />
            </div>

            {/* Error State */}
            {providersError && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-medium text-red-800 mb-1">
                  Error loading providers
                </p>
                <p className="text-xs text-red-600">
                  {providersError}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Please try refreshing the page or adjusting your filters.
                </p>
              </div>
            )}

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
    </div>
  );
}

