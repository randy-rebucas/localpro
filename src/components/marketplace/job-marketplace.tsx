"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, X, Briefcase, FileText, Headphones, HelpCircle, Zap, ClipboardList, Filter, Grid3x3, List, ArrowUp, ArrowDown, Tag, DollarSign, MapPin } from "lucide-react";
import { JobGrid } from "@/components/marketplace/job-grid";
import { useJobs } from "@/hooks/useJobs";
import { useMaxSalary } from "@/hooks/useMaxSalary";
import { useJobFilters } from "@/hooks/useJobFilters";
import { useRoleAccess } from "@/components/role-guard";

interface JobMarketplaceProps {
  userName: string;
}

const topSkills = ["Plumbing", "Electrical", "Cleaning", "Catering", "Salon"];

const hiringTips = [
  "Use clear titles and expected rates",
  "Add a short pre-interview question",
  "Respond quickly to top applicants"
];

export function JobMarketplace({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userName: _userName 
}: JobMarketplaceProps) {
  const router = useRouter();
  const { isProvider, isAdmin, isClient } = useRoleAccess();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

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

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.jobType) count++;
    if (filters.jobLocation) count++;
    if (filters.salaryRange[0] > 0 || filters.salaryRange[1] < maxSalary) count++;
    return count;
  }, [filters.jobType, filters.jobLocation, filters.salaryRange, maxSalary]);

  const handlePageChange = (page: number) => {
    filters.setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateJob = () => {
    router.push('/marketplace/create-job');
  };

  const clearFilters = () => {
    filters.setJobType("");
    filters.setJobLocation("");
    filters.setSalaryRange([0, maxSalary]);
    filters.setJobSearch("");
    filters.setCurrentPage(1);
  };

  const totalJobs = jobsPagination?.total || jobs.length;

  return (
    <div className="relative z-10">
      {/* Header Section - Following Reference Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Jobs — Local Opportunities
            </h1>
            <p className="text-gray-600">
              Find the perfect job or post opportunities for your business.
            </p>
          </div>
          {(isAdmin || isProvider) && (
            <button
              onClick={handleCreateJob}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent/90 rounded-lg hover:from-accent/90 hover:to-accent transition-all shadow-lg shadow-accent/30 hover:shadow-xl hover:scale-105 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Post Job
            </button>
          )}
        </div>
      </div>

      {/* Quick Links Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-b border-gray-200 pb-4">
          <Link 
            href="/marketplace/my-applications" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
          >
            <FileText className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">My Applications</span>
          </Link>
          {(isAdmin || isProvider) && (
            <Link 
              href="/marketplace/my-jobs" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
            >
              <ClipboardList className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Posted Jobs</span>
            </Link>
          )}
          <Link 
            href="/support" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
          >
            <Headphones className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Support</span>
          </Link>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Sidebar - Filters */}
          <>
            {/* Mobile Filter Drawer Overlay */}
            {isFilterDrawerOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setIsFilterDrawerOpen(false)}
              />
            )}

            {/* Filter Sidebar */}
            <aside
              className={`bg-white rounded-2xl shadow-lg border border-gray-100 lg:w-[280px] flex-shrink-0 lg:sticky lg:top-24 ${
                isFilterDrawerOpen
                  ? "fixed right-0 top-0 h-full w-80 z-50 lg:relative lg:w-[280px] lg:h-auto"
                  : "hidden lg:block"
              }`}
            >
              {/* Header Section */}
              <div className="bg-gradient-to-r from-accent/10 to-emerald-50 px-6 py-4 border-b border-accent/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-md">
                      <Filter className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                      <p className="text-xs text-gray-600">Refine your search</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsFilterDrawerOpen(false)}
                    className="lg:hidden text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Filter Content Area */}
              <div className="p-6 space-y-8">
                {/* Type Filter */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-accent" />
                    <label className="text-sm font-semibold text-gray-900">Type</label>
                  </div>
                  <select
                    value={filters.jobType || ""}
                    onChange={(e) => filters.setJobType(e.target.value === "" ? "" : e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  >
                    <option value="">All Types</option>
                    <option value="full_time">Full-time</option>
                    <option value="part_time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                    <option value="internship">Internship</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </div>

                {/* Location Filter */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-accent" />
                    <label className="text-sm font-semibold text-gray-900">Location</label>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={filters.jobLocation}
                      onChange={(e) => filters.setJobLocation(e.target.value)}
                      placeholder="Enter location..."
                      className="w-full px-4 py-2.5 pr-11 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    />
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-accent text-white hover:bg-accent/90 flex items-center justify-center transition-colors"
                      title="Detect location"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Salary Filter */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-accent" />
                    <label className="text-sm font-semibold text-gray-900">Salary Range</label>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={filters.salaryRange[0] || ""}
                      onChange={(e) => filters.setSalaryRange([parseInt(e.target.value) || 0, filters.salaryRange[1]])}
                      placeholder="Min"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    />
                    <span className="self-center text-gray-500">-</span>
                    <input
                      type="number"
                      value={filters.salaryRange[1] || ""}
                      onChange={(e) => filters.setSalaryRange([filters.salaryRange[0], parseInt(e.target.value) || maxSalary])}
                      placeholder="Max"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 border-2 border-transparent hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Post a job Section - for clients */}
              {isClient && !isProvider && !isAdmin && (
                <div className="px-6 pb-6">
                  <div className="bg-gradient-to-br from-accent/10 to-emerald-50 rounded-lg p-4 border border-accent/20">
                    <div className="flex items-start gap-3 mb-3">
                      <Briefcase className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">Want to Post Jobs?</h3>
                        <p className="text-xs text-gray-600 mt-1">Upgrade to a provider account to post job listings.</p>
                      </div>
                    </div>
                    <Link
                      href="/plus?upgrade=provider"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-all shadow-sm hover:shadow-md font-medium text-sm"
                    >
                      Upgrade Now
                    </Link>
                  </div>
                </div>
              )}

              {/* Top Skills */}
              <div className="px-6 pb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Top skills</h2>
                <div className="flex flex-wrap gap-2">
                  {topSkills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => filters.setJobSearch(skill)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                        filters.jobSearch === skill
                          ? "bg-accent text-white border-accent"
                          : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hiring Tips */}
              <div className="px-6 pb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Hiring tips</h2>
                <ul className="space-y-3">
                  {hiringTips.map((tip, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-accent mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Need Help Section */}
              <div className="px-6 pb-6">
                <div className="bg-gradient-to-br from-accent/10 to-emerald-50 rounded-lg p-4 border border-accent/20">
                  <div className="flex items-start gap-3 mb-3">
                    <HelpCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Need Help?</h3>
                      <p className="text-xs text-gray-600 mt-1">Our team is here to help you find the right job.</p>
                    </div>
                  </div>
                  <Link
                    href="/support"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-accent rounded-lg hover:bg-accent/10 transition-all border border-accent/20 font-medium text-sm"
                  >
                    <Zap className="w-4 h-4" />
                    Contact Support
                  </Link>
                </div>
              </div>
            </aside>
          </>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Mobile Filters Button */}
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className="lg:hidden w-full px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center justify-center gap-2 text-gray-700 font-medium hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="px-2 py-0.5 bg-accent text-white text-xs font-medium rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Unified Controls Bar */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Search - 70% */}
                <div className="w-full sm:w-[70%] relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Search className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search jobs, skills, or companies"
                    value={filters.jobSearch}
                    onChange={(e) => filters.setJobSearch(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                  />
                  {filters.jobSearch && (
                    <button
                      onClick={() => filters.setJobSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Sort - 20% */}
                <div className="w-full sm:w-[20%] flex items-center gap-1.5">
                  <select
                    value={filters.sortBy === "createdAt" ? (filters.sortOrder === "desc" ? "newest" : "oldest") : filters.sortBy === "salary" ? (filters.sortOrder === "desc" ? "salary-high" : "salary-low") : "relevance"}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "relevance") {
                        filters.setSortBy("relevance");
                      } else if (value === "newest") {
                        filters.setSortBy("createdAt");
                        filters.setSortOrder("desc");
                      } else if (value === "oldest") {
                        filters.setSortBy("createdAt");
                        filters.setSortOrder("asc");
                      } else if (value === "salary-high") {
                        filters.setSortBy("salary");
                        filters.setSortOrder("desc");
                      } else if (value === "salary-low") {
                        filters.setSortBy("salary");
                        filters.setSortOrder("asc");
                      }
                    }}
                    className="flex-1 px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-white"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="newest">Date</option>
                    <option value="salary-high">Salary</option>
                  </select>
                  <button
                    onClick={() => {
                      if (filters.sortBy === "createdAt" || filters.sortBy === "salary") {
                        filters.setSortOrder(filters.sortOrder === "asc" ? "desc" : "asc");
                      }
                    }}
                    disabled={filters.sortBy === "relevance"}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={filters.sortOrder === "asc" ? "Ascending" : "Descending"}
                  >
                    {filters.sortOrder === "asc" ? (
                      <ArrowUp className="w-4 h-4 text-gray-600" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>

                {/* Display Mode - 10% */}
                <div className="w-full sm:w-[10%] flex items-center justify-end">
                  <div className="bg-gray-100 rounded-lg p-1 flex items-center gap-1">
                    <button
                      onClick={() => filters.setViewMode("grid")}
                      className={`p-1.5 rounded transition-all ${
                        filters.viewMode === "grid"
                          ? "bg-white text-accent shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      title="Grid view"
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => filters.setViewMode("list")}
                      className={`p-1.5 rounded transition-all ${
                        filters.viewMode === "list"
                          ? "bg-white text-accent shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                      title="List view"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              {totalJobs > 0 ? (
                <>
                  Showing {((filters.currentPage - 1) * 10) + 1} to {Math.min(filters.currentPage * 10, totalJobs)} of {totalJobs} results
                </>
              ) : (
                <>No results found</>
              )}
            </div>

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
    </div>
  );
}
