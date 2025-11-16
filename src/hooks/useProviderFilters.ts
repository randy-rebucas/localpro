"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

interface ProviderFiltersState {
  status: string;
  providerType: string;
  category: string;
  location: string;
  skills: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  currentPage: number;
  viewMode: 'grid' | 'list';
}

interface UseProviderFiltersOptions {
  limit?: number;
}

interface UseProviderFiltersReturn extends ProviderFiltersState {
  hasActiveFilters: boolean;
  setStatus: (status: string) => void;
  setProviderType: (type: string) => void;
  setCategory: (category: string) => void;
  setLocation: (location: string) => void;
  setSkills: (skills: string[]) => void;
  toggleSkill: (skillId: string) => void;
  clearSkills: () => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setCurrentPage: (page: number) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  clearFilters: () => void;
  providersParams: Record<string, unknown>;
}

export function useProviderFilters({
  limit = 10,
}: UseProviderFiltersOptions = {}): UseProviderFiltersReturn {
  const [status, setStatus] = useState("");
  const [providerType, setProviderType] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [status, providerType, category, location, skills, sortBy, sortOrder]);

  // Active filters check
  const hasActiveFilters = useMemo(() => {
    return status !== "" ||
           providerType !== "" ||
           category !== "" ||
           location.trim() !== "" ||
           skills.length > 0;
  }, [status, providerType, category, location, skills]);

  const toggleSkill = useCallback((skillId: string) => {
    setSkills(prev => {
      if (prev.includes(skillId)) {
        return prev.filter(id => id !== skillId);
      }
      return [...prev, skillId];
    });
  }, []);

  const clearSkills = useCallback(() => {
    setSkills([]);
  }, []);

  const clearFilters = useCallback(() => {
    setStatus("");
    setProviderType("");
    setCategory("");
    setLocation("");
    setSkills([]);
    setCurrentPage(1);
  }, []);

  // Build query parameters for providers fetch
  const providersParams = useMemo(() => ({
    status: status || undefined,
    providerType: providerType || undefined,
    category: category || undefined,
    location: location.trim() || undefined,
    skills: skills.length > 0 ? skills : undefined,
    page: currentPage,
    limit: limit,
    sortBy: sortBy,
    sortOrder: sortOrder,
  }), [status, providerType, category, location, skills, currentPage, limit, sortBy, sortOrder]);

  return {
    status,
    providerType,
    category,
    location,
    skills,
    sortBy,
    sortOrder,
    currentPage,
    viewMode,
    hasActiveFilters,
    setStatus,
    setProviderType,
    setCategory,
    setLocation,
    setSkills,
    toggleSkill,
    clearSkills,
    setSortBy,
    setSortOrder,
    setCurrentPage,
    setViewMode,
    clearFilters,
    providersParams,
  };
}

