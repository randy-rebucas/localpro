"use client";

import React, { useState, useMemo } from "react";
import { MarketplaceHero } from "@/components/marketplace/marketplace-hero";
import { JobFilterSidebar } from "@/components/marketplace/job-filter-sidebar";
import { JobGrid } from "@/components/marketplace/job-grid";
import { ServiceCategory } from "@/components/marketplace/categories-carousel";
import { useJobs } from "@/hooks/useJobs";
import { useMaxSalary } from "@/hooks/useMaxSalary";
import { useJobFilters } from "@/hooks/useJobFilters";
import { useJobCategories } from "@/hooks/useJobCategories";
import { JobControlsBar } from "@/components/marketplace/job-controls-bar";
import { JobInfoBanner } from "@/components/marketplace/job-info-banner";

interface JobMarketplaceProps {
  userName: string;
}

export function JobMarketplace({ userName }: JobMarketplaceProps) {
  // Fetch job categories
  const { 
    categories, 
    loading: categoriesLoading, 
    error: categoriesError, 
    refetch: refetchCategories 
  } = useJobCategories();

  // Fetch max salary
  const maxSalary = useMaxSalary();

  // Manage filters
  const filters = useJobFilters({
    maxSalary,
    initialSalaryRange: [0, maxSalary],
    limit: 10,
  });

  // Fetch jobs with filters applied
  const { jobs, loading: loadingJobs, pagination: jobsPagination } = useJobs(filters.jobsParams);

  // Separate featured and regular jobs
  const featuredJobs = useMemo(() => {
    return jobs.filter(job => job.featured?.isFeatured === true);
  }, [jobs]);
  const regularJobs = useMemo(() => {
    return jobs.filter(job => !job.featured?.isFeatured);
  }, [jobs]);

  const handlePageChange = (page: number) => {
    filters.setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // UI state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

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
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Sidebar - Filters */}
          <JobFilterSidebar
            isOpen={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            search={filters.jobSearch}
            onSearchChange={filters.setJobSearch}
            category={filters.jobCategory}
            onCategoryChange={filters.setJobCategory}
            subcategory={filters.jobSubcategory}
            onSubcategoryChange={filters.setJobSubcategory}
            jobType={filters.jobType}
            onJobTypeChange={filters.setJobType}
            experienceLevel={filters.experienceLevel}
            onExperienceLevelChange={filters.setExperienceLevel}
            location={filters.jobLocation}
            onLocationChange={filters.setJobLocation}
            isRemote={filters.isRemote}
            onRemoteChange={filters.setIsRemote}
            salaryRange={filters.salaryRange}
            maxSalary={maxSalary}
            onSalaryRangeChange={filters.setSalaryRange}
            company={filters.company}
            onCompanyChange={filters.setCompany}
            featured={filters.featured}
            onFeaturedChange={filters.setFeatured}
            hasActiveFilters={filters.hasActiveFilters}
            onClearFilters={filters.clearFilters}
          />

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Controls Bar */}
            <JobControlsBar
              sortBy={filters.sortBy}
              onSortByChange={filters.setSortBy}
              sortOrder={filters.sortOrder}
              onSortOrderChange={filters.setSortOrder}
              viewMode={filters.viewMode}
              onViewModeChange={filters.setViewMode}
            />

            {/* Info about browsing jobs */}
            <JobInfoBanner />

            {/* Job Listings */}
            <JobGrid 
              featuredJobs={featuredJobs}
              jobs={regularJobs}
              loading={loadingJobs}
              hasActiveFilters={filters.hasActiveFilters}
              pagination={jobsPagination}
              currentPage={filters.currentPage}
              onPageChange={handlePageChange}
              viewMode={filters.viewMode}
            />
          </div>
        </div>
      </div>
    </>
  );
}

