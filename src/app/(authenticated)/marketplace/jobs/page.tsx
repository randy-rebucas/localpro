"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Search, 
  Filter, 
  MapPin, 
  Briefcase,
  Calendar,
  ChevronDown,
  X,
  Building2,
  Grid3x3,
  List
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { Job as JobType } from "@/types/jobs";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency, CURRENCY_CONFIGS } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";

export default function BrowseJobsPage() {
  const { settings: appSettings } = useAppSettings();
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [isFiltering, setIsFiltering] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [filters, setFilters] = useState({
    category: "",
    location: "",
    budget: [0, 5000],
    skills: [] as string[],
    availability: true
  });
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [skills, setSkills] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingSkills, setLoadingSkills] = useState(true);

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.jobsCategories}`,
        createAuthFetchOptions()
      );

      if (!response.ok) {
        logger.warn("Failed to fetch job categories", { status: response.status });
        return;
      }

      const data = await response.json();
      logger.debug("Job categories data", { data });
      // Handle different response formats
      interface CategoryItem {
        id?: string;
        _id?: string;
        value?: string;
        name?: string;
        [key: string]: unknown;
      }
      let categoriesData: (CategoryItem | string)[] = [];
      
      if (Array.isArray(data)) {
        categoriesData = data;
      } else if (data && typeof data === 'object') {
        // Check for nested structure: data.data.categories
        if (data.data && typeof data.data === 'object' && Array.isArray(data.data.categories)) {
          categoriesData = data.data.categories;
        } else if (Array.isArray(data.categories)) {
          categoriesData = data.categories;
        } else if (Array.isArray(data.data)) {
          categoriesData = data.data;
        }
      }
      
      // Ensure we have an array before mapping
      if (!Array.isArray(categoriesData)) {
        logger.warn("Job categories data is not an array", { data, categoriesData });
        categoriesData = [];
      }
      
      // Extract category objects with id and name
      // Store objects with id (for filtering) and name (for display)
      const categoryList = categoriesData.map((cat: CategoryItem | string) => {
        if (typeof cat === 'string') {
          // If it's already a string, use it as both id and name
          return { id: cat, name: cat };
        }
        // Extract id and name from the category object
        const id = cat.id || cat._id || cat.value || String(cat);
        const name = cat.name || cat.value || id;
        return { id, name };
      });
      
      setCategories(categoryList);
    } catch (error) {
      logger.error("Error fetching job categories", error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch skills from API
  const fetchSkills = useCallback(async () => {
    try {
      setLoadingSkills(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.providersSkills}`,
        createAuthFetchOptions()
      );

      if (!response.ok) {
        logger.warn("Failed to fetch skills", { status: response.status });
        return;
      }

      const data = await response.json();
      logger.debug("Skills data", { data });
      // Handle different response formats
      interface SkillItem {
        id?: string;
        _id?: string;
        value?: string;
        name?: string;
        [key: string]: unknown;
      }
      let skillsData: (SkillItem | string)[] = [];
      
      if (Array.isArray(data)) {
        skillsData = data;
      } else if (data && typeof data === 'object') {
        // Check for nested structure: data.data.skills
        if (data.data && typeof data.data === 'object' && Array.isArray(data.data.skills)) {
          skillsData = data.data.skills;
        } else if (Array.isArray(data.skills)) {
          skillsData = data.skills;
        } else if (Array.isArray(data.data)) {
          skillsData = data.data;
        }
      }
      
      // Ensure we have an array before mapping
      if (!Array.isArray(skillsData)) {
        logger.warn("Skills data is not an array", { data, skillsData });
        skillsData = [];
      }
      
      // Extract skill objects with id and name
      // Store objects with id (for filtering) and name (for display)
      const skillsList = skillsData.map((skill: SkillItem | string) => {
        if (typeof skill === 'string') {
          // If it's already a string, use it as both id and name
          return { id: skill, name: skill };
        }
        // Extract id and name from the skill object
        const id = skill.id || skill._id || skill.value || String(skill);
        const name = skill.name || skill.value || id;
        return { id, name };
      });
      
      setSkills(skillsList);
    } catch (error) {
      logger.error("Error fetching skills", error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoadingSkills(false);
    }
  }, []);

  // Normalize job data from API response to match Job type
  const normalizeJob = useCallback((jobData: Partial<JobType> & { _id?: string; id?: string }): JobType => {
    return {
      ...jobData,
      _id: jobData._id || jobData.id,
      company: jobData.company || { name: "Unknown Company" },
      salary: jobData.salary ? {
        min: jobData.salary.min,
        max: jobData.salary.max,
        currency: jobData.salary.currency,
        period: jobData.salary.period,
        isNegotiable: jobData.salary.isNegotiable,
        isConfidential: jobData.salary.isConfidential,
      } : undefined,
      requirements: jobData.requirements || {},
      applicationProcess: jobData.applicationProcess ? {
        deadline: jobData.applicationProcess.deadline ? new Date(jobData.applicationProcess.deadline) : undefined,
        startDate: jobData.applicationProcess.startDate ? new Date(jobData.applicationProcess.startDate) : undefined,
        applicationMethod: jobData.applicationProcess.applicationMethod,
        contactEmail: jobData.applicationProcess.contactEmail,
        contactPhone: jobData.applicationProcess.contactPhone,
        applicationUrl: jobData.applicationProcess.applicationUrl,
        instructions: jobData.applicationProcess.instructions,
      } : undefined,
    } as JobType;
  }, []);

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
      // Add skills filter - using skill IDs
      if (filters.skills.length > 0) {
        // Ensure we're using IDs (filter out empty strings)
        const skillIds = filters.skills.filter(id => id && id.trim() !== '');
        if (skillIds.length > 0) {
          params.append("skills", skillIds.join(","));
        }
      }
      params.append("sort", sortBy);

      logger.debug("Fetching jobs with params", { params: params.toString() });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.jobs}?${params.toString()}`, createAuthFetchOptions({
          signal: controller.signal,
        }));

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          logger.error("API Error", undefined, { errorData, status: response.status });
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch jobs`);
        }

        const data = await response.json();
        logger.debug("Jobs data", { hasData: !!data, isArray: Array.isArray(data) });
        
        // Handle both array and object responses
        let jobsData = [];
        if (Array.isArray(data)) {
          jobsData = data;
        } else if (data && typeof data === 'object') {
          jobsData = data.jobs || data.data || [];
        }
        
        // Ensure jobsData is always an array
        if (!Array.isArray(jobsData)) {
          logger.warn("Jobs data is not an array", { dataType: typeof jobsData });
          jobsData = [];
        }
        
        // Normalize job data to match Job type
        const normalizedJobs = jobsData.map((job: Partial<JobType> & { _id?: string; id?: string }) => normalizeJob(job));
        setJobs(normalizedJobs);
        
        // Clear any previous errors on successful fetch
        setError(null);
        setIsFiltering(false);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error("Request timed out. Please try again.");
        }
        
        logger.error("API fetch error", fetchError instanceof Error ? fetchError : new Error(String(fetchError)));
        throw fetchError;
      }
    } catch (error) {
      logger.error("Error fetching jobs", error instanceof Error ? error : new Error(String(error)));
      setError(error instanceof Error ? error.message : "Failed to load jobs. Please try again.");
      setIsFiltering(false);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, sortBy, normalizeJob]);

  // Fetch categories and skills on mount
  useEffect(() => {
    fetchCategories();
    fetchSkills();
  }, [fetchCategories, fetchSkills]);

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

  const handleSkillToggle = (skillId: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter(s => s !== skillId)
        : [...prev.skills, skillId]
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

  // Normalize currency to code for conversion base, then format with symbol
  const normalizeCurrencyCode = useCallback((currency: string | undefined | null): string => {
    if (!currency) return getDefaultCurrency(appSettings);
    
    // If it's already a valid currency code, return it
    if (CURRENCY_CONFIGS[currency.toUpperCase()]) {
      return currency.toUpperCase();
    }
    
    // Map currency symbols to codes
    const symbolToCode: Record<string, string> = {
      '₱': 'PHP',
      '$': 'USD',
      '€': 'EUR',
      '£': 'GBP',
      '¥': 'JPY',
      'A$': 'AUD',
      'C$': 'CAD',
      'S$': 'SGD',
    };
    
    // Check if it's a symbol
    const normalized = currency.trim();
    if (symbolToCode[normalized]) {
      return symbolToCode[normalized];
    }
    
    // Try to find by symbol in configs
    for (const [code, config] of Object.entries(CURRENCY_CONFIGS)) {
      if (config.symbol === normalized) {
        return code;
      }
    }
    
    // Default to app settings currency if not found
    return getDefaultCurrency(appSettings);
  }, [appSettings]);

  const formatPrice = useCallback((price: number, currency?: string) => {
    // Normalize currency to code for conversion base
    const currencyCode = normalizeCurrencyCode(currency);
    // Use formatCurrency which now uses symbols
    return formatCurrency(price, currencyCode, {
      appSettings,
      showSymbol: true,
    });
  }, [appSettings, normalizeCurrencyCode]);

  const formatSalary = useCallback((job: JobType) => {
    if (!job.salary) return "Salary not specified";
    
    if (job.salary.isConfidential) return "Confidential";
    if (job.salary.isNegotiable) {
      if (job.salary.min && job.salary.max) {
        return `${formatPrice(job.salary.min, job.salary.currency)} - ${formatPrice(job.salary.max, job.salary.currency)} (Negotiable)`;
      }
      return "Negotiable";
    }
    
    if (job.salary.min && job.salary.max) {
      const period = job.salary.period || 'monthly';
      const periodLabel = period === 'hourly' ? '/hr' : period === 'daily' ? '/day' : period === 'weekly' ? '/wk' : period === 'monthly' ? '/mo' : period === 'yearly' ? '/yr' : '';
      return `${formatPrice(job.salary.min, job.salary.currency)} - ${formatPrice(job.salary.max, job.salary.currency)}${periodLabel}`;
    }
    
    if (job.salary.min) {
      const period = job.salary.period || 'monthly';
      const periodLabel = period === 'hourly' ? '/hr' : period === 'daily' ? '/day' : period === 'weekly' ? '/wk' : period === 'monthly' ? '/mo' : period === 'yearly' ? '/yr' : '';
      return `${formatPrice(job.salary.min, job.salary.currency)}+${periodLabel}`;
    }
    
    return "Salary not specified";
  }, [formatPrice]);

  // Format date using locale from app settings (based on default currency)
  const formatDateWithAppSettings = useCallback((date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const defaultCurrency = getDefaultCurrency(appSettings);
    const currencyConfig = CURRENCY_CONFIGS[defaultCurrency] || CURRENCY_CONFIGS.PHP;
    const locale = currencyConfig.locale;
    
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  }, [appSettings]);


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
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grid View"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-green-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
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
                  disabled={loadingCategories}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
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
              {loadingSkills ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
                  ))}
                </div>
              ) : skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill: { id: string; name: string }) => (
                    <button
                      key={skill.id}
                      onClick={() => handleSkillToggle(skill.id)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        filters.skills.includes(skill.id)
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No skills available</p>
              )}
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
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "space-y-3"
        }>
          {Array.isArray(jobs) && jobs.map((job, index) => {
            const jobId = job._id || (job as Partial<JobType> & { id?: string }).id || `job-${index}`;
            const companyName = job.company?.name || "Company not specified";
            const companyLogo = job.company?.logo?.url;
            const location = job.company?.location;
            const skills = job.requirements?.skills || [];
            const deadline = job.applicationProcess?.deadline;
            const isRemote = job.isRemote || job.company?.location?.isRemote;
            
            return (
              <Link
                key={jobId}
                href={`/marketplace/jobs/${jobId}`}
                className={`group bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'flex gap-4 p-4' 
                    : 'p-4 transform hover:-translate-y-0.5'
                }`}
              >
                {/* List view: Company logo on the left */}
                {viewMode === 'list' && job.company && (
                  <div className="flex-shrink-0">
                    {companyLogo ? (
                      <Image
                        src={companyLogo}
                        alt={companyName}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200">
                        <Building2 className="w-7 h-7 text-gray-400" />
                      </div>
                    )}
                  </div>
                )}

                <div className={viewMode === 'list' ? 'flex-1 min-w-0' : 'w-full'}>
                  {/* Header: Title and Company (Grid view) */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-gray-900 mb-1.5 group-hover:text-green-700 transition-colors ${
                        viewMode === 'list' ? 'text-lg' : 'text-base line-clamp-2'
                      }`}>
                        {job.title}
                      </h3>
                      {viewMode === 'grid' && job.company && (
                        <div className="flex items-center gap-2 mb-2">
                          {companyLogo ? (
                            <Image
                              src={companyLogo}
                              alt={companyName}
                              width={24}
                              height={24}
                              className="w-6 h-6 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                              <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            </div>
                          )}
                          <span className="text-sm text-gray-600 truncate">{companyName}</span>
                        </div>
                      )}
                    </div>
                    {/* Job Type Badges */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {job.jobType && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                          {job.jobType.replace('_', ' ')}
                        </span>
                      )}
                      {job.experienceLevel && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-md border border-purple-100">
                          {job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className={`text-gray-600 text-sm mb-3 leading-relaxed ${
                    viewMode === 'list' ? 'line-clamp-2' : 'line-clamp-2'
                  }`}>
                    {job.description}
                  </p>

                  {/* Salary */}
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <span className="text-sm font-semibold text-green-700">
                      {formatSalary(job)}
                    </span>
                  </div>

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {skills.slice(0, viewMode === 'list' ? 4 : 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-50 text-gray-700 rounded-md border border-gray-200"
                        >
                          {skill}
                        </span>
                      ))}
                      {skills.length > (viewMode === 'list' ? 4 : 3) && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-md">
                          +{skills.length - (viewMode === 'list' ? 4 : 3)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer: Location, Deadline, Company (List view) */}
                  <div className="flex items-center justify-between gap-4 pt-2.5 border-t border-gray-100">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {isRemote ? (
                            <span className="text-green-600 font-medium">Remote</span>
                          ) : location ? (
                            <span>{location.city || "Unknown"}{location.state ? `, ${location.state}` : ""}</span>
                          ) : (
                            <span>Location not specified</span>
                          )}
                        </span>
                      </div>
                      {viewMode === 'list' && job.company && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate font-medium text-gray-600">{companyName}</span>
                        </div>
                      )}
                    </div>
                    {deadline && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Due {formatDateWithAppSettings(deadline)}</span>
                      </div>
                    )}
                  </div>

                  {/* View CTA */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100">
                    <div className="text-center">
                      <span className="text-sm font-medium text-green-600 group-hover:text-green-700 transition-colors">
                        View Details →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
