"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Clock, 
  DollarSign,
  Briefcase,
  // User,
  Calendar,
  ChevronDown,
  X
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  duration: number;
  client: {
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
    avatar: string;
  };
  location: {
    city: string;
    state: string;
  };
  images: string[];
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  createdAt: string;
  deadline: string;
  skills: string[];
}

export default function BrowseJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [isFiltering, setIsFiltering] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    location: "",
    budget: [0, 5000],
    skills: [] as string[],
    availability: true
  });

  const categories = [
    "ALL",
    "WEB_DEVELOPMENT",
    "MOBILE_DEVELOPMENT", 
    "DESIGN",
    "WRITING",
    "MARKETING",
    "CONSULTING",
    "OTHER"
  ];

  const skills = [
    "React", "Node.js", "Python", "JavaScript", "TypeScript",
    "UI/UX Design", "Content Writing", "SEO", "Social Media",
    "Project Management", "Data Analysis", "Graphic Design"
  ];

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (filters.category) params.append("category", filters.category);
      if (filters.location) params.append("location", filters.location);
      if (filters.availability) params.append("available", "true");
      if (filters.budget[0] > 0) params.append("minBudget", filters.budget[0].toString());
      if (filters.budget[1] < 5000) params.append("maxBudget", filters.budget[1].toString());
      if (filters.skills.length > 0) params.append("skills", filters.skills.join(","));
      params.append("sort", sortBy);

      console.log("Fetching jobs with params:", params.toString());

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(`/api/jobs?${params.toString()}`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error:", errorData);
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch jobs`);
        }

        const data = await response.json();
        console.log("Jobs data:", data);
        
        // Handle both array and object responses
        let jobsData = [];
        if (Array.isArray(data)) {
          jobsData = data;
        } else if (data && typeof data === 'object') {
          jobsData = data.jobs || data.data || [];
        }
        
        // Ensure jobsData is always an array
        if (!Array.isArray(jobsData)) {
          console.warn("Jobs data is not an array:", jobsData);
          jobsData = [];
        }
        
        setJobs(jobsData);
        
        // Clear any previous errors on successful fetch
        setError(null);
        setIsFiltering(false);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error("Request timed out. Please try again.");
        }
        
        console.error("API fetch error:", fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setError(error instanceof Error ? error.message : "Failed to load jobs. Please try again.");
      setIsFiltering(false);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, sortBy]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchJobs();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchJobs]);

  const handleFilterChange = (key: string, value: string | number | boolean | number[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setIsFiltering(true);
  };

  const handleSkillToggle = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
    setIsFiltering(true);
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      location: "",
      budget: [0, 5000],
      skills: [],
      availability: true
    });
    setSearchQuery("");
  };

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }, []);

  const formatDuration = useCallback((days: number) => {
    if (days < 7) return `${days} days`;
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    return remainingDays > 0 ? `${weeks}w ${remainingDays}d` : `${weeks}w`;
  }, []);

  const renderStars = useCallback((rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>

        {/* Search and Filters Skeleton */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="w-24 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="w-20 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Jobs Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="flex items-center space-x-4">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-14"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Browse Jobs"
        subtitle="Find and apply to jobs from clients"
        actions={[
          {
            type: "link",
            href: "/marketplace/create-job",
            label: "Post a Service",
            icon: Briefcase,
            variant: "primary"
          }
        ]}
      />

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search jobs, skills, or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="relevance">Most Relevant</option>
            <option value="newest">Newest First</option>
            <option value="budget-high">Highest Budget</option>
            <option value="budget-low">Lowest Budget</option>
            <option value="deadline">Deadline</option>
          </select>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition-colors ${
              showFilters 
                ? "bg-green-50 border-green-300 text-green-700" 
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {isFiltering && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.slice(1).map(category => (
                    <option key={category} value={category}>
                      {category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  placeholder="City, State"
                  value={filters.location}
                  onChange={(e) => handleFilterChange("location", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Budget Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.budget[0] || ""}
                    onChange={(e) => handleFilterChange("budget", [Number(e.target.value) || 0, filters.budget[1]])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.budget[1] || ""}
                    onChange={(e) => handleFilterChange("budget", [filters.budget[0], Number(e.target.value) || 5000])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.availability}
                    onChange={(e) => handleFilterChange("availability", e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Available now</span>
                </label>
              </div>
            </div>

            {/* Skills Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
              <div className="flex flex-wrap gap-2">
                {skills.map(skill => (
                  <button
                    key={skill}
                    onClick={() => handleSkillToggle(skill)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filters.skills.includes(skill)
                        ? "bg-green-100 text-green-700 border border-green-300"
                        : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {error ? (
        <Card interactive={false}>
          <EmptyState
            icon={X}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
            title="Error Loading Jobs"
            description={error}
            actions={[
              {
                type: "button",
                onClick: fetchJobs,
                label: "Try Again",
                variant: "primary"
              },
              {
                type: "link",
                href: "/marketplace/create-job",
                label: "Post a Job",
                variant: "secondary"
              }
            ]}
          />
        </Card>
      ) : !Array.isArray(jobs) || jobs.length === 0 ? (
        <Card interactive={false}>
          <EmptyState
            icon={Briefcase}
            iconColor="text-orange-600"
            iconBgColor="bg-orange-100"
            title="No Jobs Found"
            description={
              searchQuery || Object.values(filters).some(v => v !== "" && v !== false && (Array.isArray(v) ? v.length > 0 : true))
                ? "We couldn't find any jobs matching your search criteria. Try adjusting your filters or search terms."
                : "There are no jobs available at the moment. Check back later or create a job posting to get started."
            }
            actions={[
              ...(searchQuery || Object.values(filters).some(v => v !== "" && v !== false && (Array.isArray(v) ? v.length > 0 : true)) ? [{
                type: "button" as const,
                onClick: clearFilters,
                label: "Clear Search & Filters",
                variant: "primary" as const
              }] : []),
              {
                type: "link",
                href: "/marketplace/create-job",
                label: "Post a Job",
                variant: "secondary"
              }
            ]}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(jobs) && jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2 line-clamp-2">
                      {job.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                      {job.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Budget and Duration */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-green-600 font-medium">
                      <DollarSign className="w-4 h-4 mr-1" />
                      {formatPrice(job.budget)}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDuration(job.duration)}
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1">
                    {job.skills.slice(0, 3).map(skill => (
                      <span
                        key={skill}
                        className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 3 && (
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        +{job.skills.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Client Info */}
                  <div className="flex items-center space-x-3 pt-3 border-t border-gray-100">
                    <Image
                      src={job.client.avatar}
                      alt={job.client.name}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {job.client.name}
                      </p>
                      <div className="flex items-center space-x-1">
                        <div className="flex">{renderStars(job.client.rating)}</div>
                        <span className="text-xs text-gray-500">
                          ({job.client.reviewCount})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Location and Deadline */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {job.location.city}, {job.location.state}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Due {new Date(job.deadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link
                    href={`/marketplace/jobs/${job.id}`}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-center block"
                  >
                    View Job Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
