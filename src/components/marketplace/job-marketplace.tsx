"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, X, Briefcase, FileText, Headphones, HelpCircle, Zap, ClipboardList } from "lucide-react";
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

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "salary-high", label: "Salary: High to Low" },
  { value: "salary-low", label: "Salary: Low to High" },
];

export function JobMarketplace({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userName: _userName 
}: JobMarketplaceProps) {
  const router = useRouter();
  const { isProvider, isAdmin, isClient } = useRoleAccess();
  const [sortBy, setSortBy] = useState("relevance");

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
  };

  const totalJobs = jobsPagination?.total || jobs.length;

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
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
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Post Job
            </button>
          )}
        </div>
      </div>

      {/* Subheader - Feature Links */}
      <div className="mb-6 flex items-center gap-6 border-b border-gray-200 pb-4">
        <Link 
          href="/marketplace/my-applications" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors group"
        >
          <FileText className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">My Applications</span>
        </Link>
        {(isAdmin || isProvider) && (
          <Link 
            href="/marketplace/my-jobs" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors group"
          >
            <ClipboardList className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Posted Jobs</span>
          </Link>
        )}
        <Link 
          href="/support" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors group"
        >
          <Headphones className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Support</span>
        </Link>
      </div>
        
      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search jobs, skills, or companies"
          value={filters.jobSearch}
          onChange={(e) => filters.setJobSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md bg-white"
        />
        {filters.jobSearch && (
          <button
            onClick={() => filters.setJobSearch("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar - Filters */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6 space-y-6 sticky top-24">
            {/* Filters Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              
              {/* Type Filter */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select
                  value={filters.jobType || "all"}
                  onChange={(e) => filters.setJobType(e.target.value === "all" ? "" : e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md bg-white font-medium"
                >
                  <option value="all">All Types</option>
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="internship">Internship</option>
                  <option value="temporary">Temporary</option>
                </select>
              </div>

              {/* Location Filter */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={filters.jobLocation}
                  onChange={(e) => filters.setJobLocation(e.target.value)}
                  placeholder="City or province"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md bg-white"
                />
              </div>

              {/* Salary Filter */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Salary Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.salaryRange[0] || ""}
                    onChange={(e) => filters.setSalaryRange([parseInt(e.target.value) || 0, filters.salaryRange[1]])}
                    placeholder="Min"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                  <span className="self-center text-gray-500">-</span>
                  <input
                    type="number"
                    value={filters.salaryRange[1] || ""}
                    onChange={(e) => filters.setSalaryRange([filters.salaryRange[0], parseInt(e.target.value) || maxSalary])}
                    placeholder="Max"
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Post a job Section - for clients */}
            {isClient && !isProvider && !isAdmin && (
              <div className="pt-6 border-t-2 border-gray-200">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-start gap-3 mb-3">
                    <Briefcase className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Want to Post Jobs?</h3>
                      <p className="text-xs text-gray-600 mt-1">Upgrade to a provider account to post job listings.</p>
                    </div>
                  </div>
                  <Link
                    href="/plus?upgrade=provider"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow-md font-medium text-sm"
                  >
                    Upgrade Now
                  </Link>
                </div>
              </div>
            )}

            {/* Top Skills */}
            <div className="pt-6 border-t-2 border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Top skills</h2>
              <div className="flex flex-wrap gap-2">
                {topSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => filters.setJobSearch(skill)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                      filters.jobSearch === skill
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Hiring Tips */}
            <div className="pt-6 border-t-2 border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Hiring tips</h2>
              <ul className="space-y-3">
                {hiringTips.map((tip, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Need Help Section */}
            <div className="pt-6 border-t-2 border-gray-200">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-start gap-3 mb-3">
                  <HelpCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Need Help?</h3>
                    <p className="text-xs text-gray-600 mt-1">Our team is here to help you find the right job.</p>
                  </div>
                </div>
                <Link
                  href="/support"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-all border border-green-200 font-medium text-sm"
                >
                  <Zap className="w-4 h-4" />
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Sort and Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-gray-600 text-sm">
              {totalJobs} job{totalJobs !== 1 ? 's' : ''} found
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white font-medium"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
  );
}
