"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { GridSkeleton } from "@/components/ui/loading";
import { 
  Search, 
  // Filter, 
  Star, 
  MapPin, 
  Clock, 
  // DollarSign,
  ChevronDown,
  Grid,
  List,
  SlidersHorizontal,
  Plus,
  Store,
  RefreshCw
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

interface Service {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  provider: {
    _id: string;
    firstName: string;
    lastName: string;
    profile: {
      rating: number;
    };
  };
  pricing: {
    type: string;
    basePrice: number;
    currency: string;
  };
  availability: {
    timezone: string;
    schedule: any[];
  };
  serviceArea: string[];
  features: string[];
  requirements: string[];
  serviceType: string;
  estimatedDuration: {
    min: number;
    max: number;
  };
  teamSize: number;
  equipmentProvided: boolean;
  materialsIncluded: boolean;
  warranty: {
    hasWarranty: boolean;
    duration: number;
    description: string;
  };
  insurance: {
    covered: boolean;
    coverageAmount: number;
  };
  emergencyService: {
    available: boolean;
    surcharge: number;
    responseTime: string;
  };
  servicePackages: Array<{
    name: string;
    description: string;
    price: number;
    features: string[];
    duration: number;
    _id: string;
  }>;
  addOns: Array<{
    name: string;
    description: string;
    price: number;
    category: string;
    _id: string;
  }>;
  isActive: boolean;
  rating: {
    average: number;
    count: number;
  };
  images: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface FilterOptions {
  category: string;
  priceRange: [number, number];
  rating: number;
  location: string;
  availability: boolean;
  coordinates?: { lat: number; lng: number };
  radius?: number;
}

export default function MarketplacePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("price_low");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 15,
    count: 0
  });
  const [filters, setFilters] = useState<FilterOptions>({
    category: "",
    priceRange: [0, 1000],
    rating: 0,
    location: "",
    availability: true,
    coordinates: undefined,
    radius: 10000 // 10km default radius
  });

  const categories = [
    { value: "", label: "All Categories" },
    { value: "cleaning", label: "Cleaning" },
    { value: "plumbing", label: "Plumbing" },
    { value: "electrical", label: "Electrical" },
    { value: "moving", label: "Moving" },
    { value: "landscaping", label: "Landscaping" },
    { value: "maintenance", label: "Maintenance" },
    { value: "repair", label: "Repair" }
  ];

  const sortOptions = [
    { value: "relevance", label: "Most Relevant" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "rating", label: "Highest Rated" },
    { value: "newest", label: "Newest First" }
  ];

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setFilters(prev => ({ ...prev, coordinates }));
        },
        (error) => {
          console.error("Error getting location:", error);
          // Optionally show user-friendly error message
          setError("Unable to get your location. Please enter your location manually.");
        }
      );
    } else {
      console.warn("Geolocation is not supported by this browser.");
      setError("Location services are not available. Please enter your location manually.");
    }
  };

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      if (searchQuery) params.append("search", searchQuery);
      if (filters.category) params.append("category", filters.category);
      if (filters.location) params.append("location", filters.location);
      if (filters.availability) params.append("available", "true");
      if (filters.rating > 0) {
        params.append("rating", filters.rating.toString());
        params.append("sortBy", "rating.average");
        params.append("sortOrder", "desc");
      }
      if (filters.priceRange[0] > 0) params.append("minPrice", filters.priceRange[0].toString());
      if (filters.priceRange[1] < 1000) params.append("maxPrice", filters.priceRange[1].toString());
      
      // Add coordinates and radius if available
      if (filters.coordinates) {
        params.append("coordinates", JSON.stringify(filters.coordinates));
        if (filters.radius) params.append("radius", filters.radius.toString());
      }
      
      // Enhanced sorting
      if (sortBy === "price_low") {
        params.append("sortBy", "pricing.basePrice");
        params.append("sortOrder", "asc");
      } else if (sortBy === "price_high") {
        params.append("sortBy", "pricing.basePrice");
        params.append("sortOrder", "desc");
      } else if (sortBy === "rating") {
        params.append("sortBy", "rating.average");
        params.append("sortOrder", "desc");
      } else {
        params.append("sort", sortBy);
      }
      
      // Add pagination with the specified parameters
      params.append("page", "1");
      params.append("limit", "15");

      console.log("Fetching services with params:", params.toString());
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      let response;
      try {
        response = await fetch(`/api/marketplace/services?${params.toString()}`, {
          signal: controller.signal
        });
      } catch (fetchError) {
        console.log("Primary API failed, trying simple API:", fetchError);
        // Try the simple API as fallback
        response = await fetch(`/api/marketplace/services-simple?${params.toString()}`, {
          signal: controller.signal
        });
      }
      
      clearTimeout(timeoutId);
      
      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch services`);
      }

      const data = await response.json();
      console.log("Services data:", data);
      
      // Handle the API response structure with pagination
      if (data.success && data.data) {
        console.log("API Response - Success:", data.success);
        console.log("API Response - Message:", data.message);
        console.log("API Response - Pagination:", data.pagination);
        console.log("API Response - Data count:", data.data.length);
        
        // Set pagination info
        if (data.pagination) {
          setPagination({
            current: data.pagination.current || 1,
            pages: data.pagination.pages || 1,
            total: data.pagination.total || 0,
            limit: data.pagination.limit || 15,
            count: data.pagination.count || 0
          });
        }
        
        // Set services data
        setServices(data.data || []);
        
        // Debug: Log the first service to see its structure
        if (data.data && data.data.length > 0) {
          console.log("First service structure:", data.data[0]);
          console.log("First service provider:", data.data[0].provider);
          console.log("First service pricing:", data.data[0].pricing);
        }
      } else if (Array.isArray(data)) {
        // Fallback for direct array response
        setServices(data);
        setPagination({
          current: 1,
          pages: 1,
          total: data.length,
          limit: 15,
          count: data.length
        });
      } else if (data.services) {
        // Fallback for services property
        setServices(data.services);
        setPagination({
          current: 1,
          pages: 1,
          total: data.services.length,
          limit: 15,
          count: data.services.length
        });
      } else {
        setServices([]);
        setPagination({
          current: 1,
          pages: 1,
          total: 0,
          limit: 15,
          count: 0
        });
      }
    } catch (error) {
      console.error("Error fetching services:", error);

      setServices([]);
      setError(null); // Clear any previous errors since we have data
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, sortBy]);

  // Debounced search to improve performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchServices();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [fetchServices]);

  const handleFilterChange = (key: keyof FilterOptions, value: string | number | boolean | number[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      priceRange: [0, 1000],
      rating: 0,
      location: "",
      availability: true,
      coordinates: undefined,
      radius: 10000
    });
  };

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }, []);

  const formatDuration = useCallback((minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }, []);

  const renderStars = useCallback((rating: number, serviceId?: string) => {
    return (
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={`${serviceId || 'default'}-star-${i}`}
            className={`w-4 h-4 ${
              i < Math.floor(rating)
                ? "text-yellow-400 fill-current"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>

        {/* Search and Filters Skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-10 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Service Cards Skeleton */}
        <GridSkeleton count={6} columns={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card interactive={false}>
          <EmptyState
            icon={Search}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
            title="Unable to Load Services"
            description={error}
            actions={[
              {
                type: "button",
                onClick: fetchServices,
                label: "Try Again",
                icon: RefreshCw,
                variant: "primary"
              },
              {
                type: "button",
                onClick: () => {
                  setSearchQuery("");
                  setFilters({
                    category: "",
                    priceRange: [0, 1000],
                    rating: 0,
                    location: "",
                    availability: true,
                    coordinates: undefined,
                    radius: 10000
                  });
                  fetchServices();
                },
                label: "Reset Filters",
                variant: "secondary"
              }
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <PageHeader
        title="Browse Services"
        subtitle="Find and book services from local providers"
        actions={[
          {
            type: "button",
            onClick: getCurrentLocation,
            label: "Use Current Location",
            icon: MapPin,
            variant: "outline",
            className: "text-sm bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          },
          {
            type: "link",
            href: "/marketplace/create-service",
            label: "List Your Service",
            icon: Plus,
            variant: "primary"
          }
        ]}
      />

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-green-500 transition-colors" />
              <input
                type="text"
                placeholder="Search services, providers, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Sort and View Controls */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>


            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceRange[0]}
                    onChange={(e) => handleFilterChange("priceRange", [Number(e.target.value), filters.priceRange[1]])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceRange[1]}
                    onChange={(e) => handleFilterChange("priceRange", [filters.priceRange[0], Number(e.target.value)])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange("rating", Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value={0}>Any Rating</option>
                  <option value={4}>4+ Stars</option>
                  <option value={3}>3+ Stars</option>
                  <option value={2}>2+ Stars</option>
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="City, State"
                  value={filters.location}
                  onChange={(e) => handleFilterChange("location", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="text-gray-600">
              {pagination.total} service{pagination.total !== 1 ? 's' : ''} found
              {pagination.pages > 1 && (
                <span className="ml-2 text-sm text-gray-500">
                  (Page {pagination.current} of {pagination.pages})
                </span>
              )}
            </p>
            {pagination.count > 0 && (
              <p className="text-sm text-gray-500">
                Showing {services.length} of {pagination.count} results
              </p>
            )}
          </div>
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
          >
            {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </button>
        </div>

        {services.length === 0 ? (
          <Card interactive={false}>
            <EmptyState
              icon={Search}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-100"
              title="No Services Found"
              description="We couldn't find any services matching your criteria. Try adjusting your search terms or filters."
              actions={[
                {
                  type: "button",
                  onClick: () => {
                    setSearchQuery("");
                    setFilters({
                      category: "",
                      priceRange: [0, 1000],
                      rating: 0,
                      location: "",
                      availability: true,
                      coordinates: undefined,
                      radius: 10000
                    });
                  },
                  label: "Clear All Filters",
                  variant: "primary"
                },
                {
                  type: "button",
                  onClick: () => setSearchQuery(""),
                  label: "Clear Search",
                  variant: "secondary"
                }
              ]}
            />
          </Card>
        ) : (
          <>
            <div className={`grid gap-4 ${
              viewMode === "grid" 
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            }`}>
              {services.map((service) => (
                <ServiceCard
                  key={service._id}
                  service={service}
                  viewMode={viewMode}
                  formatPrice={formatPrice}
                  formatDuration={formatDuration}
                  renderStars={renderStars}
                />
              ))}
            </div>
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => {
                    if (pagination.current > 1) {
                      // Update pagination and refetch
                      setPagination(prev => ({ ...prev, current: prev.current - 1 }));
                      fetchServices();
                    }
                  }}
                  disabled={pagination.current <= 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {pagination.current} of {pagination.pages}
                </span>
                
                <button
                  onClick={() => {
                    if (pagination.current < pagination.pages) {
                      // Update pagination and refetch
                      setPagination(prev => ({ ...prev, current: prev.current + 1 }));
                      fetchServices();
                    }
                  }}
                  disabled={pagination.current >= pagination.pages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface ServiceCardProps {
  service: Service;
  viewMode: "grid" | "list";
  formatPrice: (price: number) => string;
  formatDuration: (minutes: number) => string;
  renderStars: (rating: number, serviceId?: string) => React.ReactElement;
}

const ServiceCard = React.memo(function ServiceCard({ service, viewMode, formatPrice, formatDuration, renderStars }: ServiceCardProps) {
  const providerName = service.provider ? `${service.provider.firstName} ${service.provider.lastName}` : 'Unknown Provider';
  const providerRating = service.provider?.profile?.rating || 0;
  const serviceRating = service.rating?.average || 0;
  const reviewCount = service.rating?.count || 0;
  const basePrice = service.pricing?.basePrice || 0;
  const currency = service.pricing?.currency || 'USD';
  const duration = service.estimatedDuration ? 
    `${service.estimatedDuration.min}-${service.estimatedDuration.max} hours` : 
    'Duration not specified';
  
  // Format price with currency
  const formatPriceWithCurrency = (price: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr
    }).format(price);
  };

  return (
    <Link
      href={`/marketplace/services/${service._id}`}
      className={`bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group ${
        viewMode === "list" ? "flex" : ""
      }`}
    >
      <div className={viewMode === "list" ? "flex-1 p-4" : "p-4"}>
        <div className={viewMode === "list" ? "flex gap-6" : ""}>
          {/* Service Image */}
          <div className={`${viewMode === "list" ? "w-48 h-32" : "w-full h-40"} bg-gray-200 rounded-lg mb-3 flex-shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
            {service.images && service.images.length > 0 ? (
              <Image
                src={service.images[0]}
                alt={service.title}
                width={viewMode === "list" ? 192 : 400}
                height={viewMode === "list" ? 128 : 192}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <Store className="w-6 h-6" />
                  </div>
                  <span className="text-sm">No Image</span>
                </div>
              </div>
            )}
          </div>

          {/* Service Details */}
          <div className={viewMode === "list" ? "flex-1" : ""}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-gray-700 line-clamp-1 flex-1">
                {service.title || 'Unnamed Service'}
              </h3>
              <div className="text-right ml-3 flex-shrink-0">
                <div className="text-xl font-bold text-green-600">
                  {formatPriceWithCurrency(basePrice, currency)}
                </div>
                {service.pricing?.type && (
                  <div className="text-xs text-gray-500 capitalize">
                    per {service.pricing.type}
                  </div>
                )}
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {service.description || 'No description available'}
            </p>

            {/* Provider Info */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-gray-600">
                  {providerName.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{providerName}</p>
                <div className="flex items-center gap-1">
                  {renderStars(providerRating, service._id)}
                  <span className="text-xs text-gray-500">
                    ({reviewCount})
                  </span>
                </div>
              </div>
            </div>

            {/* Service Features */}
            {service.features && service.features.length > 0 && (
              <div className="mb-2">
                <div className="flex flex-wrap gap-1">
                  {service.features.slice(0, 3).map((feature, index) => (
                    <span key={index} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {feature}
                    </span>
                  ))}
                  {service.features.length > 3 && (
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      +{service.features.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Service Meta */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{duration}</span>
                </div>
                {service.serviceArea && service.serviceArea.length > 0 && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{service.serviceArea[0]}</span>
                    {service.serviceArea.length > 1 && (
                      <span className="text-xs">+{service.serviceArea.length - 1} more</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span>{Number(serviceRating).toFixed(1)} ({reviewCount})</span>
              </div>
            </div>

            {/* Service Badges */}
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                {service.category?.toLowerCase() || 'service'}
              </span>
              {service.subcategory && (
                <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                  {service.subcategory.replace('_', ' ')}
                </span>
              )}
              {service.insurance?.covered && (
                <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Insured
                </span>
              )}
              {service.warranty?.hasWarranty && (
                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {service.warranty.duration} day warranty
                </span>
              )}
              {service.emergencyService?.available && (
                <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  Emergency Available
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});
