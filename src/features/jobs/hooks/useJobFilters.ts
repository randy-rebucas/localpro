"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { JobCategory } from "@/types/jobs";
import { ServiceCategory } from "@/components/marketplace/categories-carousel";

interface JobFiltersState {
  selectedCategory: JobCategory | null;
  categoryKey: string | null;
  jobSearch: string;
  jobCategory: string;
  jobSubcategory: string;
  jobType: string;
  experienceLevel: string;
  jobLocation: string;
  isRemote: boolean;
  salaryRange: [number, number];
  company: string;
  featured: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  currentPage: number;
  viewMode: 'grid' | 'list';
}

interface UseJobFiltersOptions {
  maxSalary: number;
  initialSalaryRange?: [number, number];
  limit?: number;
}

interface UseJobFiltersReturn extends JobFiltersState {
  hasActiveFilters: boolean;
  setSelectedCategory: (category: JobCategory | null) => void;
  setCategoryKey: (key: string | null) => void;
  setJobSearch: (search: string) => void;
  setJobCategory: (category: string) => void;
  setJobSubcategory: (subcategory: string) => void;
  setJobType: (type: string) => void;
  setExperienceLevel: (level: string) => void;
  setJobLocation: (location: string) => void;
  setIsRemote: (remote: boolean) => void;
  setSalaryRange: (range: [number, number]) => void;
  setCompany: (company: string) => void;
  setFeatured: (featured: boolean) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setCurrentPage: (page: number) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  clearFilters: () => void;
  handleCategorySelect: (category: ServiceCategory | null) => void;
  jobsParams: Record<string, unknown>;
}

export function useJobFilters({
  maxSalary,
  initialSalaryRange = [0, 200000],
  limit = 10,
}: UseJobFiltersOptions): UseJobFiltersReturn {
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | null>(null);
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [jobSearch, setJobSearch] = useState("");
  const [jobCategory, setJobCategory] = useState("");
  const [jobSubcategory, setJobSubcategory] = useState("");
  const [jobType, setJobType] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [salaryRange, setSalaryRange] = useState<[number, number]>(initialSalaryRange);
  const [company, setCompany] = useState("");
  const [featured, setFeatured] = useState(false);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Update salary range when maxSalary changes
  useEffect(() => {
    if (salaryRange[1] === initialSalaryRange[1] && maxSalary !== initialSalaryRange[1]) {
      setSalaryRange((prev) => [prev[0], maxSalary]);
    }
  }, [maxSalary, initialSalaryRange, salaryRange]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [jobSearch, jobCategory, jobSubcategory, jobType, experienceLevel, jobLocation, isRemote, salaryRange, company, featured, sortBy, sortOrder]);

  // Get category key from selected category
  const getCategoryKey = useCallback((category: JobCategory | null): string | null => {
    if (!category) return null;
    return category._id || category.name.toLowerCase().replace(/\s+/g, '-');
  }, []);

  // Update category key when selected category changes
  useEffect(() => {
    const key = getCategoryKey(selectedCategory);
    setCategoryKey(key);
  }, [selectedCategory, getCategoryKey]);

  // Convert ServiceCategory to JobCategory
  const convertServiceCategoryToJobCategory = useCallback((serviceCat: ServiceCategory): JobCategory => {
    return {
      _id: serviceCat.id || serviceCat.key || undefined,
      name: serviceCat.name,
      description: serviceCat.description,
      isActive: true,
      metadata: {
        icon: serviceCat.icon,
      },
    };
  }, []);

  // Active filters check
  const hasActiveFilters = useMemo(() => {
    return jobSearch.trim() !== "" ||
           jobCategory !== "" ||
           jobSubcategory !== "" ||
           jobType !== "" ||
           experienceLevel !== "" ||
           jobLocation.trim() !== "" ||
           isRemote ||
           salaryRange[0] !== 0 ||
           salaryRange[1] !== maxSalary ||
           company.trim() !== "" ||
           featured;
  }, [jobSearch, jobCategory, jobSubcategory, jobType, experienceLevel, jobLocation, isRemote, salaryRange, maxSalary, company, featured]);

  const clearFilters = useCallback(() => {
    setJobSearch("");
    setJobCategory("");
    setJobSubcategory("");
    setJobType("");
    setExperienceLevel("");
    setJobLocation("");
    setIsRemote(false);
    setSalaryRange([0, maxSalary]);
    setCompany("");
    setFeatured(false);
    setSelectedCategory(null);
    setCategoryKey(null);
    setCurrentPage(1);
  }, [maxSalary]);

  const handleCategorySelect = useCallback((category: ServiceCategory | null) => {
    if (category) {
      // Convert ServiceCategory to JobCategory
      const jobCategory = convertServiceCategoryToJobCategory(category);
      setSelectedCategory(jobCategory);
      const key = getCategoryKey(jobCategory);
      // Set jobCategory for job filtering (use key/ID if available, otherwise use name)
      setJobCategory(key || jobCategory.name || '');
      setCategoryKey(key);
    } else {
      setSelectedCategory(null);
      setJobCategory('');
      setCategoryKey(null);
    }
  }, [convertServiceCategoryToJobCategory, getCategoryKey]);

  // Build query parameters for jobs fetch
  const jobsParams = useMemo(() => ({
    search: jobSearch.trim() || undefined,
    category: jobCategory || undefined,
    subcategory: jobSubcategory || undefined,
    jobType: jobType || undefined,
    experienceLevel: experienceLevel || undefined,
    location: jobLocation.trim() || undefined,
    isRemote: isRemote || undefined,
    minSalary: salaryRange[0] > 0 ? salaryRange[0] : undefined,
    maxSalary: salaryRange[1] < maxSalary ? salaryRange[1] : undefined,
    company: company.trim() || undefined,
    featured: featured || undefined,
    page: currentPage,
    limit: limit,
    sortBy: sortBy,
    sortOrder: sortOrder,
  }), [jobSearch, jobCategory, jobSubcategory, jobType, experienceLevel, jobLocation, isRemote, salaryRange, maxSalary, company, featured, currentPage, limit, sortBy, sortOrder]);

  return {
    selectedCategory,
    categoryKey,
    jobSearch,
    jobCategory,
    jobSubcategory,
    jobType,
    experienceLevel,
    jobLocation,
    isRemote,
    salaryRange,
    company,
    featured,
    sortBy,
    sortOrder,
    currentPage,
    viewMode,
    hasActiveFilters,
    setSelectedCategory,
    setCategoryKey,
    setJobSearch,
    setJobCategory,
    setJobSubcategory,
    setJobType,
    setExperienceLevel,
    setJobLocation,
    setIsRemote,
    setSalaryRange,
    setCompany,
    setFeatured,
    setSortBy,
    setSortOrder,
    setCurrentPage,
    setViewMode,
    clearFilters,
    handleCategorySelect,
    jobsParams,
  };
}

