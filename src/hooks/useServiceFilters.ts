/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/marketplace/hooks/useServiceFilters' instead.
 */
export * from '@/features/marketplace/hooks/useServiceFilters';
import { useState, useEffect, useCallback, useMemo } from "react";
import { ServiceCategory } from "@/components/marketplace/categories-carousel";

interface ServiceFiltersState {
  selectedCategory: ServiceCategory | null;
  categoryKey: string | null;
  subcategory: string | null;
  search: string;
  priceRange: [number, number];
  minRating: number;
  isAvailable: boolean;
  location: string;
  locationCoordinates: { lat: number; lng: number } | null;
  radius: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  groupByCategory: boolean;
  currentPage: number;
  viewMode: 'grid' | 'list';
}

interface UseServiceFiltersOptions {
  maxPrice: number;
  initialPriceRange?: [number, number];
  limit?: number;
}

interface UseServiceFiltersReturn extends ServiceFiltersState {
  hasActiveFilters: boolean;
  setSelectedCategory: (category: ServiceCategory | null) => void;
  setCategoryKey: (key: string | null) => void;
  setSubcategory: (subcategory: string | null) => void;
  setSearch: (search: string) => void;
  setPriceRange: (range: [number, number]) => void;
  setMinRating: (rating: number) => void;
  setIsAvailable: (available: boolean) => void;
  setLocation: (location: string) => void;
  setLocationCoordinates: (coordinates: { lat: number; lng: number } | null) => void;
  setRadius: (radius: number) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setGroupByCategory: (group: boolean) => void;
  setCurrentPage: (page: number) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  clearFilters: () => void;
  handleCategorySelect: (category: ServiceCategory | null) => void;
  servicesParams: Record<string, unknown>;
}

export function useServiceFilters({
  maxPrice,
  initialPriceRange = [0, 10000],
  limit = 10,
}: UseServiceFiltersOptions): UseServiceFiltersReturn {
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>(initialPriceRange);
  const [minRating, setMinRating] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [location, setLocation] = useState("");
  const [locationCoordinates, setLocationCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(5000);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [groupByCategory, setGroupByCategory] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Update price range when maxPrice changes
  useEffect(() => {
    if (priceRange[1] === initialPriceRange[1] && maxPrice !== initialPriceRange[1]) {
      setPriceRange((prev) => [prev[0], maxPrice]);
    }
  }, [maxPrice, initialPriceRange, priceRange]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryKey, subcategory, search, location, locationCoordinates, radius, priceRange, minRating, isAvailable, sortBy, sortOrder, groupByCategory]);

  // Get category key from selected category
  const getCategoryKey = useCallback((category: ServiceCategory | null): string | null => {
    if (!category) return null;
    return category.key || category.id || category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
  }, []);

  // Update category key when selected category changes
  useEffect(() => {
    const key = getCategoryKey(selectedCategory);
    setCategoryKey(key);
  }, [selectedCategory, getCategoryKey]);

  // Active filters check
  const hasActiveFilters = useMemo(() => {
    return priceRange[0] !== 0 ||
           priceRange[1] !== maxPrice ||
           minRating !== 0 ||
           isAvailable ||
           search.trim() !== "" ||
           location.trim() !== "" ||
           locationCoordinates !== null ||
           subcategory !== null;
  }, [priceRange, maxPrice, minRating, isAvailable, search, location, locationCoordinates, subcategory]);

  const clearFilters = useCallback(() => {
    setSelectedCategory(null);
    setCategoryKey(null);
    setSubcategory(null);
    setSearch("");
    setPriceRange([0, maxPrice]);
    setMinRating(0);
    setIsAvailable(false);
    setLocation("");
    setLocationCoordinates(null);
    setRadius(5000);
    setCurrentPage(1);
  }, [maxPrice]);

  const handleCategorySelect = useCallback((category: ServiceCategory | null) => {
    setSelectedCategory(category);
    const key = getCategoryKey(category);
    setCategoryKey(key);
  }, [getCategoryKey]);

  // Build query parameters for services fetch
  const servicesParams = useMemo(() => ({
    categoryKey: categoryKey || undefined,
    subcategory: subcategory || undefined,
    search: search.trim() || undefined,
    location: location.trim() || undefined,
    lat: locationCoordinates?.lat,
    lng: locationCoordinates?.lng,
    radius: locationCoordinates ? radius : undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < maxPrice ? priceRange[1] : undefined,
    rating: minRating > 0 ? minRating : undefined,
    isActive: isAvailable ? true : undefined,
    page: currentPage,
    limit: limit,
    sortBy: sortBy,
    sortOrder: sortOrder,
    groupByCategory: groupByCategory,
  }), [categoryKey, subcategory, search, location, locationCoordinates, radius, priceRange, maxPrice, minRating, isAvailable, currentPage, limit, sortBy, sortOrder, groupByCategory]);

  return {
    selectedCategory,
    categoryKey,
    subcategory,
    search,
    priceRange,
    minRating,
    isAvailable,
    location,
    locationCoordinates,
    radius,
    sortBy,
    sortOrder,
    groupByCategory,
    currentPage,
    viewMode,
    hasActiveFilters,
    setSelectedCategory,
    setCategoryKey,
    setSubcategory,
    setSearch,
    setPriceRange,
    setMinRating,
    setIsAvailable,
    setLocation,
    setLocationCoordinates,
    setRadius,
    setSortBy,
    setSortOrder,
    setGroupByCategory,
    setCurrentPage,
    setViewMode,
    clearFilters,
    handleCategorySelect,
    servicesParams,
  };
}

