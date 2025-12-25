"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  Star, 
  MapPin, 
  Clock,
  Search,
  Grid,
  List,
  SlidersHorizontal,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/loading";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { logger } from "@/lib/logger";
import { getPlaceholderImageUrl } from "@/lib/image-utils";
import { useServiceCategories } from "@/hooks/useServiceCategories";
import { useProviderSkills } from "@/hooks/useProviderSkills";
import { SkillsBadgeFilter } from "@/components/marketplace/skills-badge-filter";
import type { ServiceCategory } from "@/components/marketplace/categories-carousel";

// Service Image Interface
interface ServiceImage {
  url: string;
  publicId?: string;
  thumbnail?: string;
  alt?: string;
}

// Service Entity Interface
interface Service {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  provider: {
    _id?: string;
    id?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    profile?: {
      skills?: string[];
      rating?: number;
    };
    rating?: number;
  } | string;
  pricing: {
    type: 'hourly' | 'fixed' | 'per_sqft' | 'per_item';
    basePrice: number;
    currency?: string;
  };
  availability?: {
    schedule?: Array<{
      day?: string;
      startTime?: string;
      endTime?: string;
      isAvailable?: boolean;
    }>;
    timezone?: string;
  };
  serviceArea: string[];
  images?: ServiceImage[] | string[];
  features?: string[];
  requirements?: string[];
  serviceType?: 'one_time' | 'recurring' | 'emergency' | 'maintenance' | 'installation';
  estimatedDuration?: {
    min?: number;
    max?: number;
  };
  rating?: {
    average?: number;
    count?: number;
  };
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Pagination {
  current?: number;
  pages?: number;
  total?: number;
  limit?: number;
  count?: number;
}

type ServicesApiResponse = {
  success?: boolean;
  message?: string;
  data?: Service[];
  services?: Service[];
  pagination?: Pagination;
} | Service[];

export default function CategoryServicesPage() {
  const params = useParams();
  const categoryKey = params.key as string;
  
  // Use the service categories hook
  const { categories, loading: categoriesLoading, error: categoriesError } = useServiceCategories();
  
  // Find the current category from the fetched categories
  const category = categories.find((cat: ServiceCategory) => cat.key === categoryKey) || null;
  
  // Fetch skills for the current category - only when categoryKey is available
  const { skills, loading: skillsLoading, error: skillsError, count: skillsCount } = useProviderSkills(
    categoryKey && categoryKey.trim() !== '' ? categoryKey : null
  );
  
  // Debug: Log skills data
  useEffect(() => {
    if (categoryKey) {
      console.log("categoryKey", categoryKey);
      logger.debug("Category page - Skills state", { 
        categoryKey, 
        skillsCount: skills.length,
        totalCount: skillsCount,
        loading: skillsLoading, 
        error: skillsError,
        firstSkill: skills.length > 0 ? {
          id: skills[0].id,
          name: skills[0].name,
          displayOrder: skills[0].displayOrder
        } : null
      });
    }
  }, [categoryKey, skills, skillsLoading, skillsError, skillsCount]);
  
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
    pages: 1,
    total: 0,
    limit: 12,
    count: 0
  });
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [minRating, setMinRating] = useState(0);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  // Use ref to track pagination to avoid dependency loop
  const paginationRef = useRef(pagination);
  const isPaginationUpdateFromApiRef = useRef(false);

  // Normalize service data from API response
  const normalizeService = useCallback((serviceData: Partial<Service> & Record<string, unknown>): Service => {
    return {
      ...serviceData,
      _id: serviceData._id || serviceData.id,
      id: serviceData.id || serviceData._id,
      title: (serviceData.title as string) || '',
      description: (serviceData.description as string) || '',
      category: (serviceData.category as string) || '',
      subcategory: (serviceData.subcategory as string) || '',
      images: Array.isArray(serviceData.images)
        ? serviceData.images.map((img: string | ServiceImage | Record<string, unknown>) =>
            typeof img === 'string'
              ? { url: img, alt: (serviceData.title || '') as string }
              : { 
                url: (img as ServiceImage).url || (img as ServiceImage).publicId || '', 
                publicId: (img as ServiceImage).publicId, 
                thumbnail: (img as ServiceImage).thumbnail, 
                alt: (img as ServiceImage).alt || (serviceData.title || '') 
              }
          )
        : [],
      provider: typeof serviceData.provider === 'string'
        ? { id: serviceData.provider }
        : {
            _id: serviceData.provider?._id || serviceData.provider?.id,
            id: serviceData.provider?.id || serviceData.provider?._id,
            firstName: serviceData.provider?.firstName,
            lastName: serviceData.provider?.lastName,
            name: serviceData.provider?.name,
            profile: serviceData.provider?.profile,
            rating: serviceData.provider?.rating
          },
      pricing: serviceData.pricing ? {
        type: serviceData.pricing.type || 'fixed',
        basePrice: serviceData.pricing.basePrice ?? 0,
        currency: serviceData.pricing.currency || 'PHP'
      } : {
        type: 'fixed' as const,
        basePrice: 0,
        currency: 'PHP'
      },
      rating: serviceData.rating || {
        average: 0,
        count: 0
      },
      isActive: serviceData.isActive !== undefined ? serviceData.isActive : true,
      serviceArea: serviceData.serviceArea || [],
      features: serviceData.features || [],
      requirements: serviceData.requirements || []
    };
  }, []);

  // Update ref when pagination changes
  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  const fetchServices = useCallback(async () => {
    if (!categoryKey) return;
    
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      // Use ref to get current pagination without adding it to dependencies
      const currentPagination = paginationRef.current;
      const currentPage = currentPagination.current || 1;
      const currentLimit = currentPagination.limit || 12;
      params.append("page", currentPage.toString());
      params.append("limit", currentLimit.toString());

      // Add category filter
      params.append("category", categoryKey);

      // Add search query
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      // Add price range
      if (priceRange[0] > 0) {
        params.append("minPrice", priceRange[0].toString());
      }
      if (priceRange[1] < 10000) {
        params.append("maxPrice", priceRange[1].toString());
      }

      // Add rating filter
      if (minRating > 0) {
        params.append("rating", minRating.toString());
      }

      // Add skills filter - using skill IDs
      if (selectedSkills.length > 0) {
        // Filter out any non-ID values (names) and only use IDs
        const skillIds = selectedSkills.filter(id => id && id.trim() !== '');
        skillIds.forEach(skillId => {
          params.append("skills", skillId);
        });
      }

      // Add sorting
      if (sortBy === "price_low") {
        params.append("sortBy", "basePrice");
        params.append("sortOrder", "asc");
      } else if (sortBy === "price_high") {
        params.append("sortBy", "basePrice");
        params.append("sortOrder", "desc");
      } else if (sortBy === "rating") {
        params.append("sortBy", "rating");
        params.append("sortOrder", "desc");
      } else if (sortBy === "newest") {
        params.append("sortBy", "createdAt");
        params.append("sortOrder", "desc");
      }

      // Marketplace services is PUBLIC endpoint
      const queryString = new URLSearchParams(Object.fromEntries(params)).toString();
      const url = `${API_BASE_URL}${API_ENDPOINTS.marketplaceServices}${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }

      const data: ServicesApiResponse = await response.json();
      
      // Handle API response structure
      let servicesList: Service[] = [];
      if (Array.isArray(data)) {
        servicesList = data;
      } else if (data.success && data.data && Array.isArray(data.data)) {
        servicesList = data.data;
      } else if (data.services && Array.isArray(data.services)) {
        servicesList = data.services;
      }

      // Normalize services - filter out null/undefined/empty services
      const normalizedServices = (servicesList || [])
        .filter(service => service != null && service !== undefined)
        .map(service => normalizeService(service as Partial<Service> & Record<string, unknown>))
        .filter(service => service && service.title); // Ensure service has required fields
      setServices(normalizedServices);

      // Update pagination if provided - only update if values actually changed
      if (!Array.isArray(data) && data.pagination) {
        setPagination(prev => {
          const newPagination = { ...prev, ...data.pagination };
          // Only update if values actually changed to prevent infinite loops
          const hasChanged = 
            newPagination.current !== prev.current ||
            newPagination.pages !== prev.pages ||
            newPagination.total !== prev.total ||
            newPagination.count !== prev.count;
          
          if (hasChanged) {
            // Mark that this is an API update to prevent triggering fetchServices again
            isPaginationUpdateFromApiRef.current = true;
            // Update ref immediately
            paginationRef.current = newPagination;
            return newPagination;
          }
          return prev; // Return previous to prevent re-render
        });
      }

    } catch (error) {
      logger.error("Error fetching services", error instanceof Error ? error : new Error(String(error)), { categoryKey: params.key });
      // Don't set error state, just show empty state
      setServices([]);
      setError(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryKey, searchQuery, sortBy, priceRange, minRating, selectedSkills, normalizeService]);

  // Reset pagination when filters change (but not pagination itself)
  useEffect(() => {
    setPagination(prev => ({ ...prev, current: 1 }));
  }, [categoryKey, searchQuery, sortBy, priceRange, minRating, selectedSkills]);

  // Handle skill selection
  const handleSkillToggle = useCallback((skillId: string) => {
    setSelectedSkills(prev => {
      if (prev.includes(skillId)) {
        return prev.filter(id => id !== skillId);
      }
      return [...prev, skillId];
    });
  }, []);

  const handleClearSkills = useCallback(() => {
    setSelectedSkills([]);
  }, []);

  // Note: Categories are fetched via useServiceCategories hook
  // Services are fetched via fetchServices which is called when filters change

  // Fetch services when filters change (excluding pagination to avoid loops)
  useEffect(() => {
    if (categoryKey) {
      fetchServices();
    }
  }, [categoryKey, searchQuery, sortBy, priceRange, minRating, fetchServices]);

  // Handle manual pagination changes (user clicking Next/Previous)
  useEffect(() => {
    // Only fetch if pagination changed and it wasn't from an API response
    if (!isPaginationUpdateFromApiRef.current && categoryKey) {
      fetchServices();
    }
    // Reset the flag after checking
    isPaginationUpdateFromApiRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.current]);

  const formatPrice = (price: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const getImageUrl = (images: ServiceImage[] | string[] | undefined, index: number = 0): string => {
    if (!images || images.length === 0) {
      return getPlaceholderImageUrl(300, 200, 'Service Image', 'f3f4f6', '9ca3af', 'jpg');
    }
    const img = images[index];
    const url = typeof img === 'string' ? img : (img.url || img.thumbnail || '');
    return url || getPlaceholderImageUrl(300, 200, 'Service Image', 'f3f4f6', '9ca3af', 'jpg');
  };

  const getCategoryName = (categoryKey: string): string => {
    if (category) {
      return category.name;
    }
    // Fallback mapping
    const categoryMap: Record<string, string> = {
      cleaning: 'Cleaning',
      plumbing: 'Plumbing',
      electrical: 'Electrical',
      moving: 'Moving',
      landscaping: 'Landscaping',
      painting: 'Painting',
      carpentry: 'Carpentry',
      flooring: 'Flooring',
      roofing: 'Roofing',
      hvac: 'HVAC',
      appliance_repair: 'Appliance Repair',
      locksmith: 'Locksmith',
      handyman: 'Handyman',
      home_security: 'Home Security',
      pool_maintenance: 'Pool Maintenance',
      pest_control: 'Pest Control',
      carpet_cleaning: 'Carpet Cleaning',
      window_cleaning: 'Window Cleaning',
      gutter_cleaning: 'Gutter Cleaning',
      power_washing: 'Power Washing',
      snow_removal: 'Snow Removal',
      other: 'Other'
    };
    return categoryMap[categoryKey] || categoryKey;
  };

  const formatSubcategoryName = (subcategory: string): string => {
    // Convert snake_case or kebab-case to Title Case
    return subcategory
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (categoriesLoading || (loading && services.length === 0)) {
    return (
      <div className="p-4">
        <Loading size="lg" text="Loading category..." />
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="p-4">
        <EmptyState
          icon={AlertCircle}
          title="Failed to load category"
          description={categoriesError}
        />
      </div>
    );
  }

  const categoryName = category ? category.name : getCategoryName(categoryKey);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Link
          href="/marketplace"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>
      </div>

      {/* Category Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          {category && (
            <div className="text-4xl">{category.icon}</div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-700 mb-2">
              {categoryName} 
            </h1>
            {category && (
              <p className="text-gray-600">
                {category.description}
              </p>
            )}
          </div>
        </div>
        {category && category.statistics && (
          <div className="flex items-center flex-wrap gap-4 text-sm text-gray-600 mt-4">
            <div>
              <span className="font-semibold text-green-600">
                {category.statistics.totalServices}
              </span>
              {" "}services available
            </div>
            {category.statistics.pricing && (
              <div>
                Price range: {formatPrice(category.statistics.pricing.min)} - {formatPrice(category.statistics.pricing.max)}
              </div>
            )}
            {category.statistics.rating && category.statistics.rating.totalRatings > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>
                  {category.statistics.rating.average.toFixed(1)} ({category.statistics.rating.totalRatings} ratings)
                </span>
              </div>
            )}
            {category.subcategories && category.subcategories.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-500">Subcategories:</span>
                <div className="flex flex-wrap gap-1.5">
                  {category.subcategories.map((subcategory: string, index: number) => (
                    <span key={subcategory} className="text-gray-600">
                      {formatSubcategoryName(subcategory)}
                      {index < (category.subcategories?.length || 0) - 1 && <span className="text-gray-400">,</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Skills Filter */}
      {categoryKey && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">Filter by Skills</h3>
            <p className="text-xs text-gray-500">
              Select skills to find providers with specific expertise
            </p>
          </div>
          <SkillsBadgeFilter
            skills={skills}
            selectedSkills={selectedSkills}
            onSkillToggle={handleSkillToggle}
            onClearAll={handleClearSkills}
            loading={skillsLoading}
            error={skillsError}
          />
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchServices();
                }
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="newest">Newest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
              showFilters 
                ? "bg-green-100 border-green-300 text-green-700" 
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Rating
              </label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="0">All Ratings</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Star</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Services Grid/List */}
      {services.length === 0 ? (
        <Card interactive={false}>
          <EmptyState
            icon={Search}
            iconColor="text-gray-400"
            iconBgColor="bg-gray-100"
            title="No Services Found"
            description={`No ${categoryName.toLowerCase()} services found. Try adjusting your filters.`}
          />
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              Showing {services.length} of {pagination.total || services.length} services
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid" 
                    ? "bg-green-100 text-green-700" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list" 
                    ? "bg-green-100 text-green-700" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {services.map((service) => {
                const serviceId = service._id || service.id;
                const imageUrl = getImageUrl(service.images);
                const rating = service.rating?.average || 0;
                const ratingCount = service.rating?.count || 0;
                
                return (
                  <Link
                    key={serviceId}
                    href={`/marketplace/services/${serviceId}`}
                    className="group"
                  >
                    <Card interactive={true} className="h-full flex flex-col">
                      <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
                        <Image
                          src={imageUrl || getPlaceholderImageUrl(300, 200, 'Service Image', 'f3f4f6', '9ca3af', 'jpg')}
                          alt={service.title}
                          width={300}
                          height={200}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = getPlaceholderImageUrl(300, 200, 'Service Image', 'f3f4f6', '9ca3af', 'jpg');
                          }}
                        />
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 bg-white bg-opacity-90 rounded-full text-xs font-medium text-gray-700">
                            {getCategoryName(service.category)}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-semibold text-gray-700 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-1">
                          {service.description}
                        </p>
                        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                          {service.serviceArea && service.serviceArea.length > 0 && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{service.serviceArea[0]}</span>
                            </div>
                          )}
                          {service.estimatedDuration && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{service.estimatedDuration.min || 0}-{service.estimatedDuration.max || 0}h</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-1">
                            {renderStars(rating)}
                            <span className="text-xs text-gray-600 ml-1">
                              {rating.toFixed(1)} ({ratingCount})
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {formatPrice(service.pricing.basePrice, service.pricing.currency)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {service.pricing.type === 'hourly' ? 'per hour' : 
                               service.pricing.type === 'fixed' ? 'fixed price' : 
                               service.pricing.type === 'per_sqft' ? 'per sq ft' : 
                               'per item'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((service) => {
                const serviceId = service._id || service.id;
                const imageUrl = getImageUrl(service.images);
                const rating = service.rating?.average || 0;
                const ratingCount = service.rating?.count || 0;
                
                return (
                  <Link
                    key={serviceId}
                    href={`/marketplace/services/${serviceId}`}
                    className="block"
                  >
                    <Card interactive={true}>
                      <div className="flex gap-4">
                        <div className="relative w-48 h-48 flex-shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={imageUrl || getPlaceholderImageUrl(200, 200, 'Service Image', 'f3f4f6', '9ca3af', 'jpg')}
                            alt={service.title}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = getPlaceholderImageUrl(200, 200, 'Service Image', 'f3f4f6', '9ca3af', 'jpg');
                            }}
                          />
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-gray-700 mb-2 group-hover:text-green-600 transition-colors">
                                {service.title}
                              </h3>
                              <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  {getCategoryName(service.category)}
                                </span>
                                {service.serviceArea && service.serviceArea.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{service.serviceArea.join(', ')}</span>
                                  </div>
                                )}
                                {service.estimatedDuration && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{service.estimatedDuration.min || 0}-{service.estimatedDuration.max || 0} hours</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-2xl font-bold text-green-600 mb-1">
                                {formatPrice(service.pricing.basePrice, service.pricing.currency)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {service.pricing.type === 'hourly' ? 'per hour' : 
                                 service.pricing.type === 'fixed' ? 'fixed price' : 
                                 service.pricing.type === 'per_sqft' ? 'per sq ft' : 
                                 'per item'}
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {service.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              {renderStars(rating)}
                              <span className="text-sm text-gray-600 ml-2">
                                {rating.toFixed(1)} ({ratingCount} reviews)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => {
                  isPaginationUpdateFromApiRef.current = false; // Mark as user-initiated
                  setPagination(prev => ({ ...prev, current: (prev.current || 1) - 1 }));
                }}
                disabled={pagination.current === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {pagination.current} of {pagination.pages}
              </span>
              <button
                onClick={() => {
                  isPaginationUpdateFromApiRef.current = false; // Mark as user-initiated
                  setPagination(prev => ({ ...prev, current: (prev.current || 1) + 1 }));
                }}
                disabled={pagination.current === pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

