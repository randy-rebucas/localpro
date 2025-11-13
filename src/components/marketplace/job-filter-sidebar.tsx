"use client";

import React from "react";
import {
  Filter,
  X,
  DollarSign,
  Briefcase,
  MapPin,
  Building2,
  Sparkles,
} from "lucide-react";

const jobTypes = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
  { value: "temporary", label: "Temporary" },
];

const experienceLevels = [
  { value: "entry", label: "Entry Level" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "executive", label: "Executive" },
];

interface JobFilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  search: string;
  onSearchChange: (search: string) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  subcategory: string;
  onSubcategoryChange: (subcategory: string) => void;
  jobType: string;
  onJobTypeChange: (jobType: string) => void;
  experienceLevel: string;
  onExperienceLevelChange: (level: string) => void;
  location: string;
  onLocationChange: (location: string) => void;
  isRemote: boolean;
  onRemoteChange: (isRemote: boolean) => void;
  salaryRange: [number, number];
  maxSalary?: number;
  onSalaryRangeChange: (range: [number, number]) => void;
  company: string;
  onCompanyChange: (company: string) => void;
  featured: boolean;
  onFeaturedChange: (featured: boolean) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function JobFilterSidebar({
  isOpen,
  onClose,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  subcategory,
  onSubcategoryChange,
  jobType,
  onJobTypeChange,
  experienceLevel,
  onExperienceLevelChange,
  location,
  onLocationChange,
  isRemote,
  onRemoteChange,
  salaryRange,
  maxSalary = 200000,
  onSalaryRangeChange,
  company,
  onCompanyChange,
  featured,
  onFeaturedChange,
  hasActiveFilters,
  onClearFilters,
}: JobFilterSidebarProps) {
  return (
    <aside
      className={`lg:w-64 flex-shrink-0 ${isOpen ? "block" : "hidden lg:block"}`}
    >
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24 ${
          isOpen
            ? "fixed right-0 top-0 h-full w-80 z-50 overflow-y-auto lg:relative lg:w-auto lg:h-auto lg:z-auto"
            : ""
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-md">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Job Filters</h2>
                <p className="text-xs text-gray-600">Refine your search</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-white/50 transition-colors"
              aria-label="Close filters"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Filter Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search jobs..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              placeholder="e.g., Technology"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Subcategory */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">Subcategory</label>
            <input
              type="text"
              value={subcategory}
              onChange={(e) => onSubcategoryChange(e.target.value)}
              placeholder="e.g., Software Development"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Job Type */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-green-600" />
              <label className="text-sm font-semibold text-gray-900">Job Type</label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onJobTypeChange("")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  jobType === ""
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                All
              </button>
              {jobTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => onJobTypeChange(type.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    jobType === type.value
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Experience Level */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-green-600" />
              <label className="text-sm font-semibold text-gray-900">Experience Level</label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onExperienceLevelChange("")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  experienceLevel === ""
                    ? "bg-green-600 text-white shadow-md"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                All
              </button>
              {experienceLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => onExperienceLevelChange(level.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    experienceLevel === level.value
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" />
              <label className="text-sm font-semibold text-gray-900">Location</label>
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="City, State"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Remote Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
            <div>
              <span className="text-sm font-semibold text-gray-900 block">Remote Only</span>
              <span className="text-xs text-gray-500">Show only remote jobs</span>
            </div>
            <button
              onClick={() => onRemoteChange(!isRemote)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ${
                isRemote ? "bg-green-600 shadow-lg shadow-green-200" : "bg-gray-300"
              }`}
              role="switch"
              aria-checked={isRemote}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                  isRemote ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Salary Range */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <label className="text-sm font-semibold text-gray-900">Salary Range</label>
            </div>
            <div className="space-y-5">
              {/* Salary Display */}
              <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3 border border-green-100">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Min</p>
                  <span className="text-base font-bold text-green-700">
                    ${salaryRange[0].toLocaleString()}
                  </span>
                </div>
                <div className="w-px h-8 bg-green-200"></div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Max</p>
                  <span className="text-base font-bold text-green-700">
                    ${salaryRange[1].toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Dual Range Slider Container */}
              <div className="relative py-2">
                {/* Track Background */}
                <div className="absolute inset-0 h-2 bg-gray-200 rounded-full top-1/2 transform -translate-y-1/2"></div>
                {/* Active Range */}
                <div
                  className="absolute h-2 bg-green-500 rounded-full top-1/2 transform -translate-y-1/2"
                  style={{
                    left: `${(salaryRange[0] / maxSalary) * 100}%`,
                    width: `${((salaryRange[1] - salaryRange[0]) / maxSalary) * 100}%`,
                  }}
                ></div>

                {/* Min Slider */}
                <input
                  type="range"
                  min="0"
                  max={maxSalary}
                  step={Math.max(1000, Math.floor(maxSalary / 100))}
                  value={salaryRange[0]}
                  onChange={(e) => {
                    const newMin = parseInt(e.target.value);
                    onSalaryRangeChange([
                      Math.min(newMin, salaryRange[1] - 1000),
                      salaryRange[1],
                    ]);
                  }}
                  className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb z-10 top-1/2 transform -translate-y-1/2"
                  style={{
                    zIndex: salaryRange[0] > salaryRange[1] - (maxSalary * 0.05) ? 20 : 10,
                  }}
                />

                {/* Max Slider */}
                <input
                  type="range"
                  min="0"
                  max={maxSalary}
                  step={Math.max(1000, Math.floor(maxSalary / 100))}
                  value={salaryRange[1]}
                  onChange={(e) => {
                    const newMax = parseInt(e.target.value);
                    onSalaryRangeChange([
                      salaryRange[0],
                      Math.max(newMax, salaryRange[0] + 1000),
                    ]);
                  }}
                  className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb z-10 top-1/2 transform -translate-y-1/2"
                  style={{
                    zIndex: salaryRange[1] < salaryRange[0] + (maxSalary * 0.05) ? 20 : 10,
                  }}
                />
              </div>
            </div>

            {/* Custom Slider Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
              .slider-thumb::-webkit-slider-thumb {
                appearance: none;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #16a34a;
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              }
              .slider-thumb::-moz-range-thumb {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background: #16a34a;
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              }
              .slider-thumb:focus {
                outline: none;
              }
              .slider-thumb:focus::-webkit-slider-thumb {
                box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2);
              }
              .slider-thumb:focus::-moz-range-thumb {
                box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.2);
              }
            ` }} />
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Company */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-green-600" />
              <label className="text-sm font-semibold text-gray-900">Company</label>
            </div>
            <input
              type="text"
              value={company}
              onChange={(e) => onCompanyChange(e.target.value)}
              placeholder="Company name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="border-t border-gray-100"></div>

          {/* Featured Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-green-600" />
              <div>
                <span className="text-sm font-semibold text-gray-900 block">Featured Jobs</span>
                <span className="text-xs text-gray-500">Show only featured jobs</span>
              </div>
            </div>
            <button
              onClick={() => onFeaturedChange(!featured)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ${
                featured ? "bg-green-600 shadow-lg shadow-green-200" : "bg-gray-300"
              }`}
              role="switch"
              aria-checked={featured}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                  featured ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <>
              <div className="border-t border-gray-100"></div>
              <button
                onClick={onClearFilters}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all border-2 border-transparent hover:border-gray-300 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear All Filters
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

