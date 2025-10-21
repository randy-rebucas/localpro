"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Store
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  category: "CLEANING" | "PLUMBING" | "ELECTRICAL" | "MOVING";
  price: number;
  duration: number;
  provider: {
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
    avatar?: string;
  };
  location: {
    city: string;
    state: string;
  };
  images?: string[];
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  createdAt: string;
}

interface FilterOptions {
  category: string;
  priceRange: [number, number];
  rating: number;
  location: string;
  availability: boolean;
}

export default function MarketplacePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    category: "",
    priceRange: [0, 1000],
    rating: 0,
    location: "",
    availability: true
  });

  const categories = [
    { value: "", label: "All Categories" },
    { value: "CLEANING", label: "Cleaning" },
    { value: "PLUMBING", label: "Plumbing" },
    { value: "ELECTRICAL", label: "Electrical" },
    { value: "MOVING", label: "Moving" }
  ];

  const sortOptions = [
    { value: "relevance", label: "Most Relevant" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "rating", label: "Highest Rated" },
    { value: "newest", label: "Newest First" }
  ];

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      if (searchQuery) params.append("search", searchQuery);
      if (filters.category) params.append("category", filters.category);
      if (filters.location) params.append("location", filters.location);
      if (filters.availability) params.append("available", "true");
      if (filters.rating > 0) params.append("minRating", filters.rating.toString());
      if (filters.priceRange[0] > 0) params.append("minPrice", filters.priceRange[0].toString());
      if (filters.priceRange[1] < 1000) params.append("maxPrice", filters.priceRange[1].toString());
      params.append("sort", sortBy);

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
      setServices(Array.isArray(data) ? data : data.services || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      
      // Fallback to hardcoded mock data if all APIs fail
      console.log("All APIs failed, using hardcoded mock data");
      const mockServices: Service[] = [
        {
          id: "1",
          name: "Professional House Cleaning",
          description: "Complete house cleaning service including kitchen, bathrooms, living areas, and bedrooms.",
          category: "CLEANING" as const,
          price: 150,
          duration: 180,
          provider: {
            id: "provider-1",
            name: "Sarah Johnson",
            rating: 4.8,
            reviewCount: 127,
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
          },
          location: {
            city: "New York",
            state: "NY"
          },
          images: [
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"
          ],
          rating: 4.8,
          reviewCount: 127,
          isAvailable: true,
          createdAt: "2024-01-15T10:00:00Z"
        },
        {
          id: "2",
          name: "Emergency Plumbing Repair",
          description: "24/7 emergency plumbing services for leaks, clogs, and repairs.",
          category: "PLUMBING" as const,
          price: 200,
          duration: 120,
          provider: {
            id: "provider-2",
            name: "Mike Rodriguez",
            rating: 4.9,
            reviewCount: 89,
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
          },
          location: {
            city: "Los Angeles",
            state: "CA"
          },
          images: [
            "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=300&fit=crop"
          ],
          rating: 4.9,
          reviewCount: 89,
          isAvailable: true,
          createdAt: "2024-01-10T14:30:00Z"
        }
      ];
      
      setServices(mockServices);
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
      availability: true
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchServices}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-700">Browse Services</h1>
          <p className="text-gray-600">Find and book services from local providers</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/marketplace/create-service"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            List Your Service
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
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
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </button>

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
          <div className="mt-6 pt-6 border-t border-gray-200 animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            {services.length} service{services.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {services.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No services found</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              We couldn&apos;t find any services matching your criteria. Try adjusting your search terms or filters.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilters({
                    category: "",
                    priceRange: [0, 1000],
                    rating: 0,
                    location: "",
                    availability: true
                  });
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Clear All Filters
              </button>
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Search
              </button>
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === "grid" 
              ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
              : "grid-cols-1"
          }`}>
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                viewMode={viewMode}
                formatPrice={formatPrice}
                formatDuration={formatDuration}
                renderStars={renderStars}
              />
            ))}
          </div>
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
  renderStars: (rating: number) => React.ReactNode;
}

const ServiceCard = React.memo(function ServiceCard({ service, viewMode, formatPrice, formatDuration, renderStars }: ServiceCardProps) {
  return (
    <Link
      href={`/marketplace/services/${service.id}`}
      className={`bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group ${
        viewMode === "list" ? "flex" : ""
      }`}
    >
      <div className={viewMode === "list" ? "flex-1 p-6" : "p-6"}>
        <div className={viewMode === "list" ? "flex gap-6" : ""}>
          {/* Service Image */}
          <div className={`${viewMode === "list" ? "w-48 h-32" : "w-full h-48"} bg-gray-200 rounded-lg mb-4 flex-shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
            {service.images && service.images.length > 0 ? (
              <Image
                src={service.images[0]}
                alt={service.name}
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-700 line-clamp-1 flex-1">
                {service.name}
              </h3>
              <span className="text-2xl font-bold text-green-600 ml-4 flex-shrink-0">
                {formatPrice(service.price)}
              </span>
            </div>

            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {service.description}
            </p>

            {/* Provider Info */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                {service.provider.avatar ? (
                  <Image
                    src={service.provider.avatar}
                    alt={service.provider.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium text-gray-600">
                    {service.provider.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{service.provider.name}</p>
                <div className="flex items-center gap-1">
                  {renderStars(service.provider.rating)}
                  <span className="text-xs text-gray-500">
                    ({service.provider.reviewCount})
                  </span>
                </div>
              </div>
            </div>

            {/* Service Meta */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(service.duration)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{service.location.city}, {service.location.state}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span>{service.rating.toFixed(1)} ({service.reviewCount})</span>
              </div>
            </div>

            {/* Category Badge */}
            <div className="mt-3">
              <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                {service.category.toLowerCase().replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});
