"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

interface ProviderFiltersState {
  status: string;
  providerType: string;
  category: string; // Category key (for display/UI purposes)
  categoryId: string; // Category ObjectId (for API queries)
  location: string;
  skills: string[]; // Skill IDs (ObjectIds)
  skillsMatch: 'any' | 'all';
  city: string;
  state: string;
  minRating: number;
  maxDistance: number;
  lat: number | undefined;
  lng: number | undefined;
  featured: boolean | undefined;
  promoted: boolean | undefined;
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
  setCategory: (category: string, categoryId?: string) => void; // Accept both key and ID
  setLocation: (location: string) => void;
  setSkills: (skills: string[]) => void;
  setSkillsMatch: (match: 'any' | 'all') => void;
  setCity: (city: string) => void;
  setState: (state: string) => void;
  setMinRating: (rating: number) => void;
  setMaxDistance: (distance: number) => void;
  setLat: (lat: number | undefined) => void;
  setLng: (lng: number | undefined) => void;
  setFeatured: (featured: boolean | undefined) => void;
  setPromoted: (promoted: boolean | undefined) => void;
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
  limit = 20,
}: UseProviderFiltersOptions = {}): UseProviderFiltersReturn {
  const [status, setStatus] = useState("");
  const [providerType, setProviderType] = useState("");
  const [category, setCategoryKey] = useState(""); // Category key for UI
  const [categoryId, setCategoryId] = useState(""); // Category ObjectId for API
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillsMatch, setSkillsMatch] = useState<'any' | 'all'>('any');
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [minRating, setMinRating] = useState<number>(0);
  const [maxDistance, setMaxDistance] = useState<number>(0);
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [featured, setFeatured] = useState<boolean | undefined>(undefined);
  const [promoted, setPromoted] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('rating');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // setCategory now accepts both key and ID
  const setCategory = useCallback((categoryKey: string, id?: string) => {
    setCategoryKey(categoryKey || "");
    setCategoryId(id || "");
  }, []);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [status, providerType, category, categoryId, location, skills, skillsMatch, city, state, minRating, maxDistance, lat, lng, featured, promoted, sortBy, sortOrder]);

  // Active filters check
  const hasActiveFilters = useMemo(() => {
    return status !== "" ||
           providerType !== "" ||
           category !== "" ||
           categoryId !== "" ||
           location.trim() !== "" ||
           city.trim() !== "" ||
           state.trim() !== "" ||
           skills.length > 0 ||
           minRating > 0 ||
           maxDistance > 0 ||
           lat !== undefined ||
           lng !== undefined ||
           featured !== undefined ||
           promoted !== undefined;
  }, [status, providerType, category, categoryId, location, city, state, skills, minRating, maxDistance, lat, lng, featured, promoted]);

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
    setCategoryKey("");
    setCategoryId("");
    setLocation("");
    setCity("");
    setState("");
    setSkills([]);
    setSkillsMatch('any');
    setMinRating(0);
    setMaxDistance(0);
    setLat(undefined);
    setLng(undefined);
    setFeatured(undefined);
    setPromoted(undefined);
    setCurrentPage(1);
  }, []);

  // Build query parameters for providers fetch
  const providersParams = useMemo(() => ({
    status: status || undefined,
    providerType: providerType || undefined,
    categoryId: categoryId || undefined, // Use categoryId (ObjectId) for API
    category: categoryId ? undefined : (category || undefined), // Fallback to category key if no ID
    location: location.trim() || undefined,
    skills: skills.length > 0 ? skills : undefined, // Skill IDs (ObjectIds)
    skillsMatch: skills.length > 0 ? skillsMatch : undefined,
    city: city.trim() || undefined,
    state: state.trim() || undefined,
    minRating: minRating > 0 ? minRating : undefined,
    maxDistance: maxDistance > 0 ? maxDistance : undefined,
    lat: lat,
    lng: lng,
    featured: featured,
    promoted: promoted,
    page: currentPage,
    limit: limit,
    sortBy: sortBy,
    sortOrder: sortOrder,
  }), [status, providerType, category, categoryId, location, skills, skillsMatch, city, state, minRating, maxDistance, lat, lng, featured, promoted, currentPage, limit, sortBy, sortOrder]);

  return {
    status,
    providerType,
    category,
    categoryId,
    location,
    skills,
    skillsMatch,
    city,
    state,
    minRating,
    maxDistance,
    lat,
    lng,
    featured,
    promoted,
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
    setSkillsMatch,
    setCity,
    setState,
    setMinRating,
    setMaxDistance,
    setLat,
    setLng,
    setFeatured,
    setPromoted,
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

