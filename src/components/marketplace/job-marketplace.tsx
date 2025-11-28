"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, X } from "lucide-react";
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
  const { isProvider, isAdmin } = useRoleAccess();

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

  const handleCreateJob = () => {
    router.push('/marketplace/create-job');
  };

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Jobs — Local Opportunities
        </h1>
        <p className="text-gray-600 mb-6">
          Find the perfect job or post opportunities for your business.
        </p>
        
        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search jobs, skills, or companies"
              value={filters.jobSearch}
              onChange={(e) => filters.setJobSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Trigger search
                }
              }}
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
          <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow-md font-medium text-sm">
            Search
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar - Filters */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6 space-y-6 sticky top-24">
            {/* Filters Section */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Filters</h2>
              
              {/* Type Filter */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select
                  value={filters.jobType || "all"}
                  onChange={(e) => filters.setJobType(e.target.value === "all" ? "" : e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md bg-white font-medium"
                >
                  <option value="all">All</option>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Salary</label>
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
            </div>

            {/* Post a job Section */}
            {(isAdmin || isProvider) && (
              <div className="pt-6 border-t-2 border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Post a job</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Employers can post and manage applicants from their dashboard.
                </p>
                <button
                  onClick={handleCreateJob}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow-md font-medium text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create job post
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
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

        {/* Right Sidebar - Top Skills and Hiring Tips */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="space-y-6 sticky top-24">
            {/* Top Skills */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Top skills</h2>
              <div className="flex flex-wrap gap-2">
                {topSkills.map((skill) => (
                  <button
                    key={skill}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium border border-gray-200"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Hiring Tips */}
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
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
          </div>
        </aside>
      </div>
    </div>
  );
}

