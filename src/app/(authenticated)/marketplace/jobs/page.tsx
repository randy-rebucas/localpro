"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  List,
  DollarSign,
  Award,
  GraduationCap,
  Globe,
  Tag,
  Clock,
  CheckCircle2,
  Users,
  ExternalLink
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { Job as JobType } from "@/types/jobs";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency, CURRENCY_CONFIGS, getCurrencySymbol } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";
import { useSession } from "@/hooks/useAuth";
import { useRoleView } from "@/hooks/useRoleView";

export default function BrowseJobsPage() {
  const { settings: appSettings } = useAppSettings();
  const { data: session } = useSession();

  // Get user roles
  const userRoles = useMemo(() => session?.user?.roles || [], [session?.user?.roles]);

  // Manage role view state
  const { roleView, isClientView, isProviderView } = useRoleView({ userRoles });
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
    
    // Normalize currency once at the beginning to ensure consistency
    const salaryCurrency = normalizeCurrencyCode(job.salary.currency);
    
    if (job.salary.isConfidential) return "Confidential";
    
    if (job.salary.isNegotiable) {
      if (job.salary.min && job.salary.max) {
        // Use normalized currency for both min and max
        return `${formatPrice(job.salary.min, salaryCurrency)} - ${formatPrice(job.salary.max, salaryCurrency)} (Negotiable)`;
      }
      return "Negotiable";
    }
    
    if (job.salary.min && job.salary.max) {
      const period = job.salary.period || 'monthly';
      const periodLabel = period === 'hourly' ? '/hr' : period === 'daily' ? '/day' : period === 'weekly' ? '/wk' : period === 'monthly' ? '/mo' : period === 'yearly' ? '/yr' : '';
      // Use normalized currency for both min and max
      return `${formatPrice(job.salary.min, salaryCurrency)} - ${formatPrice(job.salary.max, salaryCurrency)}${periodLabel}`;
    }
    
    if (job.salary.min) {
      const period = job.salary.period || 'monthly';
      const periodLabel = period === 'hourly' ? '/hr' : period === 'daily' ? '/day' : period === 'weekly' ? '/wk' : period === 'monthly' ? '/mo' : period === 'yearly' ? '/yr' : '';
      // Use normalized currency
      return `${formatPrice(job.salary.min, salaryCurrency)}+${periodLabel}`;
    }
    
    return "Salary not specified";
  }, [formatPrice, normalizeCurrencyCode]);

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

  // Format job type for display
  const formatJobType = useCallback((jobType: string | undefined) => {
    if (!jobType) return '';
    return jobType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }, []);

  // Format remote type for display
  const formatRemoteType = useCallback((remoteType: string | undefined) => {
    if (!remoteType) return '';
    return remoteType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }, []);

  // Format company size for display
  const formatCompanySize = useCallback((size: string | undefined) => {
    if (!size) return '';
    return size.charAt(0).toUpperCase() + size.slice(1);
  }, []);

  // Format education level for display
  const formatEducationLevel = useCallback((level: string | undefined) => {
    if (!level) return '';
    return level.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }, []);

  // Format language proficiency for display
  const formatProficiency = useCallback((proficiency: string | undefined) => {
    if (!proficiency) return '';
    return proficiency.charAt(0).toUpperCase() + proficiency.slice(1);
  }, []);


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10 p-6 space-y-6">
          {/* Header Skeleton */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>

          {/* Search and Filters Skeleton */}
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-4 backdrop-blur-sm">
            <div className="flex gap-4">
              <div className="flex-1 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-24 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              <div className="w-20 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>

          {/* Jobs Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm animate-pulse">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 p-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-1">
                {isClientView ? "Manage Your Jobs" : "Browse Jobs"}
              </h1>
              <p className="text-gray-600">
                {isClientView 
                  ? "View and manage your posted job listings" 
                  : "Find and apply to jobs from clients"}
              </p>
            </div>
            {isClientView && (
              <Link
                href="/marketplace/create-job"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105"
              >
                <Briefcase className="w-4 h-4" />
                Post a Job
              </Link>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-4 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={isClientView ? "Search your jobs..." : "Search jobs, skills, or locations..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white font-medium"
              >
                <option value="relevance">Most Relevant</option>
                <option value="newest">Newest First</option>
                <option value="budget-high">Highest Budget</option>
                <option value="budget-low">Lowest Budget</option>
                <option value="deadline">Deadline</option>
              </select>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-3 border-2 rounded-lg flex items-center gap-2 transition-all font-semibold shadow-sm hover:shadow-md hover:scale-105 ${
                  showFilters 
                    ? "bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300 text-emerald-700 shadow-emerald-500/20" 
                    : "border-gray-300 hover:border-emerald-300 bg-white text-gray-700 hover:bg-emerald-50/50"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {isFiltering && (
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-gradient-to-br from-gray-100 to-gray-50 rounded-lg p-1 border-2 border-gray-200 shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/30 scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                  title="Grid View"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/30 scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-6 space-y-6 backdrop-blur-sm animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange("category", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white font-medium"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    placeholder="City, State"
                    value={filters.location}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                  />
                </div>

                {/* Budget Range */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Budget Range
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      ({getCurrencySymbol(getDefaultCurrency(appSettings))})
                    </span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                        {getCurrencySymbol(getDefaultCurrency(appSettings))}
                      </div>
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.budget[0] || ""}
                        onChange={(e) => handleFilterChange("budget", [Number(e.target.value) || 0, filters.budget[1]])}
                        className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                      />
                    </div>
                    <span className="text-gray-500 font-medium">-</span>
                    <div className="relative flex-1">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                        {getCurrencySymbol(getDefaultCurrency(appSettings))}
                      </div>
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.budget[1] || ""}
                        onChange={(e) => handleFilterChange("budget", [filters.budget[0], Number(e.target.value) || 5000])}
                        className="w-full pl-8 pr-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm hover:shadow-md bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Availability</label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.availability}
                      onChange={(e) => handleFilterChange("availability", e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-2 cursor-pointer"
                    />
                    <span className="ml-2 text-sm text-gray-700 font-medium">Available now</span>
                  </label>
                </div>
              </div>

              {/* Skills Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Skills</label>
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
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 shadow-sm ${
                          filters.skills.includes(skill.id)
                            ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border-2 border-emerald-300 shadow-emerald-500/20"
                            : "bg-gradient-to-br from-gray-100 to-gray-50 text-gray-700 border-2 border-gray-300 hover:border-emerald-300 hover:bg-emerald-50/50"
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
              <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear all filters
                </button>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="px-4 py-2 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 font-semibold"
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
          <div className="bg-gradient-to-br from-white to-red-50/30 rounded-xl border-2 border-red-200 shadow-lg p-8 backdrop-blur-sm">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/20">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-2">Error Loading Jobs</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={fetchJobs}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 font-semibold"
                >
                  Try Again
                </button>
                {isClientView && (
                  <Link
                    href="/marketplace/create-job"
                    className="px-6 py-3 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md font-medium"
                  >
                    Post a Job
                  </Link>
                )}
              </div>
            </div>
          </div>
        ) : !Array.isArray(jobs) || jobs.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 shadow-lg p-8 backdrop-blur-sm">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
                <Briefcase className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-2">No Jobs Found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || Object.values(filters).some(v => v !== "" && v !== false && (Array.isArray(v) ? v.length > 0 : true))
                  ? isClientView
                    ? "We couldn't find any of your jobs matching your search criteria. Try adjusting your filters or search terms."
                    : "We couldn't find any jobs matching your search criteria. Try adjusting your filters or search terms."
                  : isClientView
                    ? "You haven't posted any jobs yet. Create your first job posting to get started."
                    : "There are no jobs available at the moment. Check back later to find new opportunities."}
              </p>
              <div className="flex items-center justify-center gap-3">
                {searchQuery || Object.values(filters).some(v => v !== "" && v !== false && (Array.isArray(v) ? v.length > 0 : true)) && (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 font-semibold"
                  >
                    Clear Search & Filters
                  </button>
                )}
                {isClientView && (
                  <Link
                    href="/marketplace/create-job"
                    className="px-6 py-3 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg hover:from-gray-50 hover:to-gray-100 transition-all shadow-sm hover:shadow-md font-medium"
                  >
                    Post a Job
                  </Link>
                )}
              </div>
            </div>
          </div>
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
            const startDate = job.applicationProcess?.startDate;
            const isRemote = job.isRemote || job.company?.location?.isRemote;
            const remoteType = job.company?.location?.remoteType;
            const benefits = job.benefits || [];
            const tags = job.tags || [];
            const certifications = job.requirements?.certifications || [];
            const languages = job.requirements?.languages || [];
            const responsibilities = job.responsibilities || [];
            const qualifications = job.qualifications || [];
            const education = job.requirements?.education;
            const experience = job.requirements?.experience;
            const companySize = job.company?.size;
            const companyIndustry = job.company?.industry;
            const companyWebsite = job.company?.website;
            const subcategory = job.subcategory;
            const status = job.status;
            const visibility = job.visibility;
            
            return (
              <Link
                key={jobId}
                href={`/marketplace/jobs/${jobId}`}
                className={`group bg-gradient-to-br from-white to-gray-50/50 rounded-xl border-2 border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 backdrop-blur-sm ${
                  viewMode === 'list' 
                    ? 'flex gap-4 p-4 hover:scale-[1.01]' 
                    : 'p-4 transform hover:-translate-y-1 hover:scale-[1.02]'
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
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center border-2 border-emerald-300 shadow-md shadow-emerald-500/20">
                        <Building2 className="w-7 h-7 text-emerald-600" />
                      </div>
                    )}
                  </div>
                )}

                <div className={viewMode === 'list' ? 'flex-1 min-w-0' : 'w-full'}>
                  {/* Header: Title and Company (Grid view) */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1.5 group-hover:from-emerald-600 group-hover:to-green-600 transition-all ${
                        viewMode === 'list' ? 'text-lg' : 'text-base line-clamp-2'
                      }`}>
                        {job.title}
                      </h3>
                      {viewMode === 'grid' && job.company && (
                        <div className="space-y-1 mb-2">
                          <div className="flex items-center gap-2">
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
                            <span className="text-sm text-gray-600 truncate font-medium">{companyName}</span>
                          </div>
                          {(companySize || companyIndustry) && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 pl-8">
                              {companySize && <span>{formatCompanySize(companySize)}</span>}
                              {companySize && companyIndustry && <span>•</span>}
                              {companyIndustry && <span className="truncate">{companyIndustry}</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Job Type Badges */}
                    <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                      {job.jobType && (
                        <span className="px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full border-2 border-blue-300 shadow-sm">
                          {formatJobType(job.jobType)}
                        </span>
                      )}
                      {job.experienceLevel && (
                        <span className="px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full border-2 border-purple-300 shadow-sm">
                          {job.experienceLevel.charAt(0).toUpperCase() + job.experienceLevel.slice(1)}
                        </span>
                      )}
                      {subcategory && (
                        <span className="px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full border-2 border-amber-300 shadow-sm">
                          {subcategory}
                        </span>
                      )}
                      {status && status !== 'active' && (
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border-2 shadow-sm ${
                          status === 'draft' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                          status === 'paused' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                          status === 'closed' ? 'bg-red-100 text-red-700 border-red-300' :
                          status === 'filled' ? 'bg-green-100 text-green-700 border-green-300' :
                          'bg-gray-100 text-gray-700 border-gray-300'
                        }`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      )}
                      {visibility === 'featured' && (
                        <span className="px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 rounded-full border-2 border-yellow-300 shadow-sm">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Company Details */}
                  {viewMode === 'list' && (companySize || companyIndustry || companyWebsite) && (
                    <div className="flex items-center gap-3 mb-2 text-xs text-gray-600">
                      {companySize && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {formatCompanySize(companySize)}
                        </span>
                      )}
                      {companyIndustry && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {companyIndustry}
                        </span>
                      )}
                      {companyWebsite && (
                        <a
                          href={companyWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Website
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <p className={`text-gray-600 text-sm mb-3 leading-relaxed ${
                    viewMode === 'list' ? 'line-clamp-2' : 'line-clamp-2'
                  }`}>
                    {job.description}
                  </p>

                  {/* Salary & Benefits Count */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="p-1.5 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-lg">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                        {formatSalary(job)}
                      </span>
                    </div>
                    {benefits.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        <span className="font-medium">{benefits.length} benefit{benefits.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {skills.slice(0, viewMode === 'list' ? 4 : 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-full border-2 border-gray-300 shadow-sm hover:shadow-md hover:scale-105 transition-all"
                        >
                          {skill}
                        </span>
                      ))}
                      {skills.length > (viewMode === 'list' ? 4 : 3) && (
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-full border-2 border-gray-400 shadow-sm">
                          +{skills.length - (viewMode === 'list' ? 4 : 3)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Benefits */}
                  {benefits.length > 0 && viewMode === 'list' && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {benefits.slice(0, 4).map((benefit, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-50 text-green-700 rounded-full border-2 border-green-300 shadow-sm"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {benefit.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                      ))}
                      {benefits.length > 4 && (
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-green-200 to-emerald-100 text-green-700 rounded-full border-2 border-green-400 shadow-sm">
                          +{benefits.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Education & Experience Requirements */}
                  {viewMode === 'list' && (education || experience) && (
                    <div className="flex flex-wrap gap-3 mb-2.5 text-xs text-gray-600">
                      {education && education.level && (
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-purple-600" />
                          <span>
                            {formatEducationLevel(education.level)}
                            {education.field && ` in ${education.field}`}
                            {education.isRequired && ' (Required)'}
                          </span>
                        </div>
                      )}
                      {experience && experience.years && (
                        <div className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-blue-600" />
                          <span>{experience.years}+ years{experience.description && `: ${experience.description}`}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Certifications */}
                  {certifications.length > 0 && viewMode === 'list' && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {certifications.slice(0, 3).map((cert, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-indigo-100 to-purple-50 text-indigo-700 rounded-full border-2 border-indigo-300 shadow-sm"
                        >
                          <Award className="w-3 h-3" />
                          {cert}
                        </span>
                      ))}
                      {certifications.length > 3 && (
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-indigo-200 to-purple-100 text-indigo-700 rounded-full border-2 border-indigo-400 shadow-sm">
                          +{certifications.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Languages */}
                  {languages.length > 0 && viewMode === 'list' && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {languages.slice(0, 3).map((lang, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-cyan-100 to-blue-50 text-cyan-700 rounded-full border-2 border-cyan-300 shadow-sm"
                        >
                          <Globe className="w-3 h-3" />
                          {lang.language}{lang.proficiency && ` (${formatProficiency(lang.proficiency)})`}
                        </span>
                      ))}
                      {languages.length > 3 && (
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-cyan-200 to-blue-100 text-cyan-700 rounded-full border-2 border-cyan-400 shadow-sm">
                          +{languages.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {tags.slice(0, viewMode === 'list' ? 5 : 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-50 text-gray-600 rounded-full border border-gray-300 shadow-sm"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                      {tags.length > (viewMode === 'list' ? 5 : 3) && (
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-gray-200 to-gray-300 text-gray-600 rounded-full border border-gray-400 shadow-sm">
                          +{tags.length - (viewMode === 'list' ? 5 : 3)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Responsibilities Preview (List view only) */}
                  {responsibilities.length > 0 && viewMode === 'list' && (
                    <div className="mb-2.5">
                      <div className="text-xs font-semibold text-gray-700 mb-1.5">Key Responsibilities:</div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {responsibilities.slice(0, 2).map((resp, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-600 mt-0.5">•</span>
                            <span className="line-clamp-1">{resp}</span>
                          </li>
                        ))}
                        {responsibilities.length > 2 && (
                          <li className="text-gray-500 italic">+{responsibilities.length - 2} more responsibilities</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Qualifications Preview (List view only) */}
                  {qualifications.length > 0 && viewMode === 'list' && (
                    <div className="mb-2.5">
                      <div className="text-xs font-semibold text-gray-700 mb-1.5">Key Qualifications:</div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {qualifications.slice(0, 2).map((qual, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span className="line-clamp-1">{qual}</span>
                          </li>
                        ))}
                        {qualifications.length > 2 && (
                          <li className="text-gray-500 italic">+{qualifications.length - 2} more qualifications</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Footer: Location, Deadline, Company (List view) */}
                  <div className="flex items-center justify-between gap-4 pt-2.5 border-t-2 border-gray-200">
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      <div className="flex items-center gap-1">
                        <div className="p-1 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-blue-600" />
                        </div>
                        <span className="truncate font-medium">
                          {isRemote ? (
                            <span className="text-emerald-600 font-semibold">
                              {remoteType ? formatRemoteType(remoteType) : 'Remote'}
                            </span>
                          ) : location ? (
                            <span>
                              {location.city || "Unknown"}{location.state ? `, ${location.state}` : ""}
                              {location.country && location.country !== "United States" && `, ${location.country}`}
                            </span>
                          ) : (
                            <span>Location not specified</span>
                          )}
                        </span>
                      </div>
                      {viewMode === 'list' && job.company && (
                        <div className="flex items-center gap-1">
                          <div className="p-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                            <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-gray-600" />
                          </div>
                          <span className="truncate font-semibold text-gray-700">{companyName}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
                      {startDate && (
                        <div className="flex items-center gap-1">
                          <div className="p-1 bg-gradient-to-br from-green-100 to-emerald-200 rounded-lg">
                            <Clock className="w-3.5 h-3.5 text-green-600" />
                          </div>
                          <span className="font-medium">Starts {formatDateWithAppSettings(startDate)}</span>
                        </div>
                      )}
                      {deadline && (
                        <div className="flex items-center gap-1">
                          <div className="p-1 bg-gradient-to-br from-purple-100 to-pink-200 rounded-lg">
                            <Calendar className="w-3.5 h-3.5 text-purple-600" />
                          </div>
                          <span className="font-medium">Due {formatDateWithAppSettings(deadline)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* View CTA */}
                  <div className="mt-3 pt-2.5 border-t-2 border-gray-200">
                    <div className="text-center">
                      <span className="text-sm font-semibold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent group-hover:from-emerald-700 group-hover:to-green-700 transition-all">
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
    </div>
  );
}
