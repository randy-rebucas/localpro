"use client";

import React from "react";
import { Loader2, ChevronLeft, ChevronRight, Search, FilterX, Briefcase } from "lucide-react";
import { JobCard } from "@/components/shared/job-card";
import { Job } from "@/types/jobs";

interface Pagination {
  current: number;
  pages: number;
  total: number;
  limit: number;
  count: number;
}

interface JobGridProps {
  featuredJobs?: Job[];
  jobs?: Job[];
  loading?: boolean;
  hasActiveFilters?: boolean;
  pagination?: Pagination | null;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  viewMode?: 'grid' | 'list';
}

export function JobGrid({ 
  featuredJobs = [], 
  jobs = [], 
  loading = false, 
  hasActiveFilters = false,
  pagination = null,
  onPageChange,
  viewMode = 'list',
}: JobGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
          <p className="text-sm text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  const allJobs = [...featuredJobs, ...jobs];

  if (allJobs.length === 0) {
    const EmptyIcon = hasActiveFilters ? FilterX : Briefcase;
    
    const title = hasActiveFilters 
      ? "No jobs found" 
      : "No jobs available";
    
    const description = hasActiveFilters
      ? "Try adjusting your filters to see more results"
      : "Check back later or explore other categories";

    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <EmptyIcon className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 text-center max-w-md mb-6">
          {description}
        </p>
        {hasActiveFilters && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Search className="w-4 h-4" />
            <span>Try removing some filters or expanding your search</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Featured Jobs Section */}
      {featuredJobs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-green-600 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900">Featured Jobs</h2>
            {featuredJobs.length > 0 && (
              <span className="text-sm text-gray-500">({featuredJobs.length})</span>
            )}
          </div>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {featuredJobs.map((job) => (
              <JobCard key={job._id || job.title} job={job} viewMode={viewMode} />
            ))}
          </div>
        </div>
      )}

      {/* Regular Jobs Section */}
      {jobs.length > 0 && (
        <div>
          {featuredJobs.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-gray-300 rounded-full"></div>
              <h2 className="text-xl font-bold text-gray-900">All Jobs</h2>
              {jobs.length > 0 && (
                <span className="text-sm text-gray-500">({jobs.length})</span>
              )}
            </div>
          )}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {jobs.map((job) => (
              <JobCard key={job._id || job.title} job={job} viewMode={viewMode} />
            ))}
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
          {/* Pagination Info */}
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{((pagination.current - 1) * pagination.limit) + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(pagination.current * pagination.limit, pagination.total)}
            </span>{" "}
            of <span className="font-medium">{pagination.total}</span> results
          </div>

          {/* Pagination Buttons */}
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => onPageChange && onPageChange(pagination.current - 1)}
              disabled={pagination.current === 1 || loading}
              className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                pagination.current === 1 || loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-green-500"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {(() => {
                const pages: number[] = [];
                
                if (pagination.pages <= 5) {
                  // Show all pages if 5 or less
                  for (let i = 1; i <= pagination.pages; i++) {
                    pages.push(i);
                  }
                } else if (pagination.current <= 3) {
                  // Show first 5 pages
                  for (let i = 1; i <= 5; i++) {
                    pages.push(i);
                  }
                } else if (pagination.current >= pagination.pages - 2) {
                  // Show last 5 pages
                  for (let i = pagination.pages - 4; i <= pagination.pages; i++) {
                    pages.push(i);
                  }
                } else {
                  // Show current page with 2 before and 2 after
                  for (let i = pagination.current - 2; i <= pagination.current + 2; i++) {
                    pages.push(i);
                  }
                }

                return pages.map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange && onPageChange(pageNum)}
                    disabled={loading}
                    className={`w-10 h-10 text-sm font-medium rounded-lg transition-all ${
                      pagination.current === pageNum
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-green-500"
                    } ${loading ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    {pageNum}
                  </button>
                ));
              })()}
            </div>

            {/* Next Button */}
            <button
              onClick={() => onPageChange && onPageChange(pagination.current + 1)}
              disabled={pagination.current === pagination.pages || loading}
              className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                pagination.current === pagination.pages || loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-green-500"
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

