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

      let response;
      try {
        response = await fetch(`/api/jobs?${params.toString()}`, {
          signal: controller.signal
        });
      } catch (fetchError) {
        console.log("Primary API failed, using mock data:", fetchError);
        // Use mock data as fallback
        const mockJobs: Job[] = [
          {
            id: "1",
            title: "E-commerce Website Development",
            description: "Need a full-stack developer to build a modern e-commerce platform with React and Node.js. Must include payment integration, user authentication, and admin dashboard.",
            category: "WEB_DEVELOPMENT",
            budget: 5000,
            duration: 30,
            client: {
              id: "client-1",
              name: "Sarah Johnson",
              rating: 4.8,
              reviewCount: 45,
              avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
            },
            location: {
              city: "New York",
              state: "NY"
            },
            images: [
              "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop"
            ],
            rating: 4.8,
            reviewCount: 45,
            isAvailable: true,
            createdAt: "2024-01-15T10:00:00Z",
            deadline: "2024-02-15T23:59:59Z",
            skills: ["React", "Node.js", "JavaScript", "E-commerce"]
          },
          {
            id: "2",
            title: "Mobile App UI/UX Design",
            description: "Looking for a talented UI/UX designer to create wireframes and high-fidelity designs for a fitness tracking mobile app.",
            category: "DESIGN",
            budget: 2500,
            duration: 14,
            client: {
              id: "client-2",
              name: "Mike Rodriguez",
              rating: 4.9,
              reviewCount: 32,
              avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
            },
            location: {
              city: "Los Angeles",
              state: "CA"
            },
            images: [
              "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop"
            ],
            rating: 4.9,
            reviewCount: 32,
            isAvailable: true,
            createdAt: "2024-01-10T14:30:00Z",
            deadline: "2024-01-25T23:59:59Z",
            skills: ["UI/UX Design", "Figma", "Mobile Design", "Prototyping"]
          }
        ];

        setJobs(mockJobs);
        return;
      }

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch jobs`);
      }

      const data = await response.json();
      console.log("Jobs data:", data);
      setJobs(Array.isArray(data) ? data : data.jobs || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setError("Failed to load jobs. Please try again.");
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
  };

  const handleSkillToggle = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-700">Browse Jobs</h1>
          <p className="text-gray-600 mt-1">Find and apply to jobs from clients</p>
        </div>
        <Link
          href="/marketplace/create-service"
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Briefcase className="w-4 h-4 mr-2" />
          Post a Service
        </Link>
      </div>

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
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={fetchJobs}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No jobs found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || Object.values(filters).some(v => v !== "" && v !== false && (Array.isArray(v) ? v.length > 0 : true))
              ? "Try adjusting your search or filters"
              : "No jobs are currently available"
            }
          </p>
          {(searchQuery || Object.values(filters).some(v => v !== "" && v !== false && (Array.isArray(v) ? v.length > 0 : true))) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Clear Search & Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
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
