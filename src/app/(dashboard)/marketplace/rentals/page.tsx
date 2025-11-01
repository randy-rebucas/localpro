"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { GridSkeleton } from "@/components/ui/loading";
import {
    Search,
    Star,
    MapPin,
    Grid,
    List,
    SlidersHorizontal,
    Plus,
    RefreshCw,
    Truck,
    Wrench,
    Car,
    Hammer,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { apiRequest, API_ENDPOINTS } from "@/lib/api";

type RentalsPagination = {
    current?: number;
    pages?: number;
    total?: number;
    limit?: number;
    count?: number;
};

type RentalsApiResponse = {
    success?: boolean;
    message?: string;
    data?: RentalItem[];
    rentals?: RentalItem[];
    rentalItems?: RentalItem[];
    pagination?: RentalsPagination;
} | RentalItem[];

// RentalItem Image Interface
interface RentalItemImage {
  url: string;
  publicId?: string;
  thumbnail?: string;
  alt?: string;
}

// RentalItem Entity Interface (matching data-entities.md)
export interface RentalItem {
  _id?: string;
  id?: string;
  name: string;
  title: string;
  description: string;
  category: 'tools' | 'vehicles' | 'equipment' | 'machinery';
  subcategory: string;
  owner: {
    _id?: string;
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    rating?: number;
    reviewCount?: number;
    verified?: boolean;
  } | string; // Can be populated object or just ID
  pricing: {
    hourly?: number;
    daily?: number;
    weekly?: number;
    monthly?: number;
    currency: string;
  };
  availability: {
    isAvailable: boolean;
    schedule?: Array<{
      startDate: string | Date;
      endDate: string | Date;
      reason?: 'rented' | 'maintenance' | 'unavailable';
    }>;
  };
  location: {
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    coordinates?: {
      lat: number;
      lng: number;
    };
    pickupRequired?: boolean;
    deliveryAvailable?: boolean;
    deliveryFee?: number;
  };
  specifications?: {
    brand?: string;
    model?: string;
    year?: number;
    condition?: 'excellent' | 'good' | 'fair' | 'poor';
    features?: string[];
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
      unit?: string;
    };
    weight?: {
      value?: number;
      unit?: string;
    };
  };
  requirements?: {
    minAge?: number;
    licenseRequired?: boolean;
    licenseType?: string;
    deposit?: number;
    insuranceRequired?: boolean;
  };
  images?: RentalItemImage[] | string[]; // Support both formats
  documents?: Array<{
    type?: 'manual' | 'warranty' | 'insurance' | 'license' | 'other';
    url?: string;
    publicId?: string;
    name?: string;
  }>;
  maintenance?: {
    lastService?: string | Date;
    nextService?: string | Date;
    serviceHistory?: Array<{
      date?: string | Date;
      type?: string;
      description?: string;
      cost?: number;
    }>;
  };
  rating?: {
    average: number;
    count: number;
  };
  reviews?: Array<{
    user: string | {
      _id?: string;
      id?: string;
      name?: string;
    };
    rating: number;
    comment?: string;
    createdAt?: string | Date;
  }>;
  averageRating?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  views?: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  
  // Legacy fields for backward compatibility
  type?: 'equipment' | 'vehicle' | 'space' | 'tool';
  status?: 'available' | 'rented' | 'maintenance' | 'unavailable';
  price?: number;
  priceUnit?: 'hour' | 'day' | 'week' | 'month';
  viewsCount?: number;
  isFavorited?: boolean;
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

const categories = [
    { value: "", label: "All Categories" },
    { value: "tools", label: "Tools" },
    { value: "vehicles", label: "Vehicles" },
    { value: "equipment", label: "Equipment" },
    { value: "machinery", label: "Machinery" }
];

export default function MarketplaceRentalsPage() {
    const [rentals, setRentals] = useState<RentalItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy] = useState("price_low");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0,
        limit: 15,
        count: 0
    });
    const [filters, setFilters] = useState<FilterOptions>({
        category: "",
        priceRange: [0, 10000],
        rating: 0,
        location: "",
        availability: true,
        coordinates: undefined,
        radius: 10000, // 10km default radius
    });
  

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
                    setError("Unable to get your location. Please enter your location manually.");
                }
            );
        } else {
            console.warn("Geolocation is not supported by this browser.");
            setError("Location services are not available. Please enter your location manually.");
        }
    };

    // Normalize rental item data from API response
    const normalizeRentalItem = useCallback((item: Partial<RentalItem> & Record<string, unknown>): RentalItem => {
    return {
      ...item,
      _id: item._id || item.id,
      id: item.id || item._id,
      // Handle pricing structure
      pricing: item.pricing || {
        hourly: item.price && item.priceUnit === 'hour' ? item.price : undefined,
        daily: item.price && item.priceUnit === 'day' ? item.price : undefined,
        weekly: item.price && item.priceUnit === 'week' ? item.price : undefined,
        monthly: item.price && item.priceUnit === 'month' ? item.price : undefined,
        currency: item.currency || 'USD'
      },
      // Handle availability
      availability: item.availability || {
        isAvailable: item.status === 'available' || item.isAvailable !== false,
        schedule: item.availability?.schedule || []
      },
      // Handle location
      location: item.location && typeof item.location === 'object' && 'address' in item.location
        ? item.location
        : {
            address: item.location || {
              street: item.location?.street,
              city: item.location?.city,
              state: item.location?.state,
              zipCode: item.location?.zipCode,
              country: item.location?.country
            },
            coordinates: item.location?.coordinates,
            pickupRequired: item.location?.pickupRequired !== false,
            deliveryAvailable: item.location?.deliveryAvailable || false,
            deliveryFee: item.location?.deliveryFee
          },
      // Handle images
      images: Array.isArray(item.images)
        ? item.images.map((img: string | RentalItemImage | Record<string, unknown>) =>
            typeof img === 'string'
              ? { url: img, alt: (item.title || item.name || '') as string }
              : {
                  url: (img as RentalItemImage).url || (img as RentalItemImage).publicId || '',
                  publicId: (img as RentalItemImage).publicId,
                  thumbnail: (img as RentalItemImage).thumbnail,
                  alt: (img as RentalItemImage).alt || (item.title || item.name || '') as string
                }
          )
        : [],
      // Handle owner
      owner: typeof item.owner === 'string'
        ? { id: item.owner }
        : {
            _id: item.owner?._id || item.owner?.id,
            id: item.owner?.id || item.owner?._id,
            name: item.owner?.name,
            firstName: item.owner?.firstName,
            lastName: item.owner?.lastName,
            avatar: item.owner?.avatar,
            rating: item.owner?.rating,
            reviewCount: item.owner?.reviewCount,
            verified: item.owner?.verified
          },
      // Handle rating
      rating: item.rating || {
        average: item.averageRating || item.rating?.average || 0,
        count: item.reviews?.length || item.rating?.count || item.reviewCount || 0
      },
      averageRating: item.averageRating || item.rating?.average || 0,
      // Set defaults
      isActive: item.isActive !== undefined ? item.isActive : true,
      views: item.views || item.viewsCount || 0
    };
  }, []);

    const fetchRentals = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();

            // Add pagination first
            params.append("page", pagination.current.toString());
            params.append("limit", pagination.limit.toString());

            // Determine which endpoint to use based on whether coordinates are available
            const hasCoordinates = filters.coordinates && filters.coordinates.lat && filters.coordinates.lng;
            
            // Add location parameters for nearby endpoint
            if (hasCoordinates && filters.coordinates) {
                params.append("lat", filters.coordinates.lat.toString());
                params.append("lng", filters.coordinates.lng.toString());
                params.append("radius", (filters.radius || 50000).toString());
            }
            
            // Common filters
            if (searchQuery) params.append("search", searchQuery);
            if (filters.category) params.append("category", filters.category);
            if (filters.location && !hasCoordinates) params.append("location", filters.location);
            
            // Add price range
            if (filters.priceRange[0] > 0) params.append("minPrice", filters.priceRange[0].toString());
            if (filters.priceRange[1] < 10000) params.append("maxPrice", filters.priceRange[1].toString());
            
            // Availability filters
            if (filters.availability) params.append("isActive", "true");
            
            if (filters.rating > 0) {
                params.append("minRating", filters.rating.toString());
                params.append("sortBy", "averageRating");
                params.append("sortOrder", "desc");
            }

            // Enhanced sorting
            if (sortBy === "price_low") {
                params.append("sortBy", "price");
                params.append("sortOrder", "asc");
            } else if (sortBy === "price_high") {
                params.append("sortBy", "price");
                params.append("sortOrder", "desc");
            } else if (sortBy === "rating") {
                params.append("sortBy", "rating");
                params.append("sortOrder", "desc");
            } else if (sortBy === "newest") {
                params.append("sortBy", "createdAt");
                params.append("sortOrder", "desc");
            } else {
                params.append("sort", sortBy);
            }

            console.log("Fetching rentals with params:", params.toString());

            // Determine which endpoint to use
            const endpoint = hasCoordinates 
                ? API_ENDPOINTS.rentalsNearby || API_ENDPOINTS.rentals
                : API_ENDPOINTS.rentals;

            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            let data: RentalsApiResponse;
            try {
                data = await apiRequest<RentalsApiResponse>(`${endpoint}?${params.toString()}`, {
                    signal: controller.signal
                });
            } catch (fetchError) {
                console.log("Primary API failed, trying fallback API:", fetchError);
                data = await apiRequest<RentalsApiResponse>(`${API_ENDPOINTS.rentals}?${params.toString()}`, {
                    signal: controller.signal
                });
            } finally {
                clearTimeout(timeoutId);
            }
            
            console.log(`Fetched from ${hasCoordinates ? 'nearby' : 'regular'} endpoint`);

            // Handle the API response structure with pagination
            if (Array.isArray(data)) {
                // Direct array response - normalize rentals
                const normalizedRentals = (data as Array<Partial<RentalItem> & Record<string, unknown>>).map((item) => normalizeRentalItem(item));
                setRentals(normalizedRentals);
                setPagination({
                    current: 1,
                    pages: 1,
                    total: normalizedRentals.length,
                    limit: 15,
                    count: normalizedRentals.length
                });
            } else if (data && typeof data === 'object') {
                // Object response format
                if ('success' in data && data.success && 'data' in data && data.data) {
                    // Set pagination info
                    if ('pagination' in data && data.pagination) {
                        setPagination({
                            current: data.pagination.current || 1,
                            pages: data.pagination.pages || 1,
                            total: data.pagination.total || 0,
                            limit: data.pagination.limit || 15,
                            count: data.pagination.count || 0
                        });
                    }

                    // Normalize and set rentals data
                    const normalizedRentals = (data.data || []).map((item: Partial<RentalItem> & Record<string, unknown>) => normalizeRentalItem(item));
                    setRentals(normalizedRentals);
                } else if (('rentals' in data || 'rentalItems' in data)) {
                    const dataObj = data as Record<string, unknown>;
                    const rentalsArray = (dataObj.rentals || dataObj.rentalItems) as Array<Partial<RentalItem> & Record<string, unknown>>;
                    if (Array.isArray(rentalsArray)) {
                        // Alternative response format with rentals/rentalItems property
                        const normalizedRentals = rentalsArray.map((item) => normalizeRentalItem(item));
                        setRentals(normalizedRentals);
                        if ('pagination' in data && data.pagination) {
                            setPagination({
                                current: data.pagination.current || 1,
                                pages: data.pagination.pages || 1,
                                total: data.pagination.total || 0,
                                limit: data.pagination.limit || 15,
                                count: data.pagination.count || 0
                            });
                        } else {
                            setPagination({
                                current: 1,
                                pages: 1,
                                total: normalizedRentals.length,
                                limit: 15,
                                count: normalizedRentals.length
                            });
                        }
                    } else {
                        setRentals([]);
                        setPagination({
                            current: 1,
                            pages: 1,
                            total: 0,
                            limit: 15,
                            count: 0
                        });
                    }
                }
            } else {
                setRentals([]);
                setPagination({
                    current: 1,
                    pages: 1,
                    total: 0,
                    limit: 15,
                    count: 0
                });
            }
        } catch (error) {
            console.error("Error fetching rentals:", error);

            setError('Failed to fetch rentals. Please try again later.');
            setRentals([]);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, filters, sortBy, pagination, normalizeRentalItem]);

    // Debounced search to improve performance
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchRentals();
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [fetchRentals]);

    // Trigger fetch when pagination changes
    useEffect(() => {
        fetchRentals();
    }, [fetchRentals]);

    const handleFilterChange = (key: keyof FilterOptions, value: string | number | boolean | number[]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            category: "",
            priceRange: [0, 10000],
            rating: 0,
            location: "",
            availability: true,
            coordinates: undefined,
            radius: 10000,
        });
    };

    const getCategoryIcon = (category: RentalItem['category']) => {
        switch (category) {
            case 'tools': return <Hammer className="w-4 h-4" />;
            case 'vehicles': return <Car className="w-4 h-4" />;
            case 'equipment': return <Wrench className="w-4 h-4" />;
            case 'machinery': return <Truck className="w-4 h-4" />;
            default: return <Wrench className="w-4 h-4" />;
        }
    };

    const renderStars = useCallback((rating: number, rentalId?: string) => {
        return (
            <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                    <Star
                        key={`${rentalId || 'default'}-star-${i}`}
                        className={`w-4 h-4 ${i < Math.floor(rating)
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

                {/* Rental Cards Skeleton */}
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
                        title="Unable to Load Rentals"
                        description={error}
                        actions={[
                            {
                                type: "button",
                                onClick: fetchRentals,
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
                                        priceRange: [0, 10000],
                                        rating: 0,
                                        location: "",
                                        availability: true,
                                        coordinates: undefined,
                                        radius: 10000,
                                    });
                                    fetchRentals();
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
                title="Browse Rentals"
                subtitle="Find and rent equipment, vehicles, tools, and machinery"
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
                        href: "/rentals/create",
                        label: "List Your Rental",
                        icon: Plus,
                        variant: "primary"
                    }
                ]}
            />

            {/* Main Layout: Filters on Left, Content on Right */}
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Left Sidebar - Filters */}
                <aside className="w-full lg:w-64 flex-shrink-0">
                    <Card className="p-4 sticky top-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                                <SlidersHorizontal className="w-5 h-5 text-gray-400" />
                            </div>

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

                            {/* Clear Filters */}
                            <div>
                                <button
                                    onClick={clearFilters}
                                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </Card>
                </aside>

                {/* Right Content Area */}
                <div className="flex-1 space-y-4">
                    {/* Search and Controls */}
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-green-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search rentals, locations..."
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
                        </div>
                    </div>

                    {/* Results */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <p className="text-gray-600">
                                    {pagination.total} rental{pagination.total !== 1 ? 's' : ''} found
                                    {pagination.pages > 1 && (
                                        <span className="ml-2 text-sm text-gray-500">
                                            (Page {pagination.current} of {pagination.pages})
                                        </span>
                                    )}
                                </p>
                                {pagination.count > 0 && (
                                    <p className="text-sm text-gray-500">
                                        Showing {rentals.length} of {pagination.count} results
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

                        {rentals.length === 0 ? (
                            <Card interactive={false}>
                                <EmptyState
                                    icon={Truck}
                                    iconColor="text-purple-600"
                                    iconBgColor="bg-purple-100"
                                    title="No Rentals Found"
                                    description="We couldn't find any rentals matching your criteria. Try adjusting your search terms or filters."
                                    actions={[
                                        {
                                            type: "button",
                                            onClick: () => {
                                                setSearchQuery("");
                                                setFilters({
                                                    category: "",
                                                    priceRange: [0, 10000],
                                                    rating: 0,
                                                    location: "",
                                                    availability: true,
                                                    coordinates: undefined,
                                                    radius: 10000,
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
                                <div className={`grid gap-4 ${viewMode === "grid"
                                        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                                        : "grid-cols-1"
                                    }`}>
                                    {rentals.map((rental) => (
                                        <RentalCard
                                            key={rental._id || rental.id}
                                            rental={rental}
                                            viewMode={viewMode}
                                            renderStars={renderStars}
                                            getCategoryIcon={getCategoryIcon}
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.pages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-6">
                                        <button
                                            onClick={() => {
                                                if (pagination.current > 1) {
                                                    setPagination(prev => ({ ...prev, current: prev.current - 1 }));
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
                                                    setPagination(prev => ({ ...prev, current: prev.current + 1 }));
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
            </div>
        </div>
    );
}

interface RentalCardProps {
    rental: RentalItem;
    viewMode: "grid" | "list";
    renderStars: (rating: number, rentalId?: string) => React.ReactElement;
    getCategoryIcon: (category: RentalItem['category']) => React.ReactElement;
}

const RentalCard = React.memo(function RentalCard({
    rental,
    viewMode,
    renderStars,
    getCategoryIcon
}: RentalCardProps) {
    // Get rental ID
    const rentalId = rental._id || rental.id || '';
    
    // Normalize owner data
    const owner = typeof rental.owner === 'string' 
        ? { id: rental.owner, name: 'Unknown Owner' }
        : rental.owner || {};
    const ownerName = owner.name || 
        (owner.firstName && owner.lastName 
            ? `${owner.firstName} ${owner.lastName}` 
            : owner.firstName || owner.lastName || 'Unknown Owner');
    
    const rentalRating = rental.averageRating || rental.rating?.average || 0;
    const reviewCount = rental.rating?.count || rental.reviews?.length || 0;
    
    // Get pricing display
    const getPriceDisplay = () => {
        const pricing = rental.pricing;
        if (pricing.daily) return { amount: pricing.daily, unit: 'day', currency: pricing.currency || 'USD' };
        if (pricing.hourly) return { amount: pricing.hourly, unit: 'hour', currency: pricing.currency || 'USD' };
        if (pricing.weekly) return { amount: pricing.weekly, unit: 'week', currency: pricing.currency || 'USD' };
        if (pricing.monthly) return { amount: pricing.monthly, unit: 'month', currency: pricing.currency || 'USD' };
        // Fallback to legacy fields
        if (rental.price) return { amount: rental.price, unit: rental.priceUnit || 'day', currency: pricing.currency || 'USD' };
        return null;
    };
    const priceDisplay = getPriceDisplay();
    
    // Get first image URL (handle both old string array and new object array format)
    const getImageUrl = () => {
        if (!rental.images || rental.images.length === 0) return null;
        const firstImage = rental.images[0];
        return typeof firstImage === 'string' ? firstImage : (firstImage.url || firstImage.thumbnail || null);
    };
    const imageUrl = getImageUrl();

    // Format price with currency
    const formatPrice = (price: number, curr: string = priceDisplay?.currency || 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: curr
        }).format(price);
    };
    
    // Get location display
    const locationCity = rental.location?.address?.city || '';
    const locationState = rental.location?.address?.state || '';
    
    // Get availability status
    const isAvailable = rental.availability?.isAvailable !== false;
    
    // Get category label
    const getCategoryLabel = (category: RentalItem['category']) => {
        const labels: Record<string, string> = {
            tools: 'Tools',
            vehicles: 'Vehicles',
            equipment: 'Equipment',
            machinery: 'Machinery'
        };
        return labels[category] || category;
    };

    return (
        <Link
            href={`/marketplace/rentals/${rentalId}`}
            className={`bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group ${viewMode === "list" ? "flex" : ""
                }`}
        >
            <div className={viewMode === "list" ? "flex-1 p-4" : "p-4"}>
                <div className={viewMode === "list" ? "flex gap-6" : ""}>
                    {/* Rental Image */}
                    <div className={`${viewMode === "list" ? "w-48 h-32" : "w-full h-40"} bg-gray-200 rounded-lg mb-3 flex-shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300 relative`}>
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={
                                    rental.images && 
                                    Array.isArray(rental.images) && 
                                    rental.images.length > 0 && 
                                    typeof rental.images[0] === 'object' && 
                                    rental.images[0].alt 
                                        ? rental.images[0].alt 
                                        : rental.title || rental.name
                                }
                                width={viewMode === "list" ? 192 : 400}
                                height={viewMode === "list" ? 128 : 192}
                                className="w-full h-full object-cover rounded-lg"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                                        {getCategoryIcon(rental.category)}
                                    </div>
                                    <span className="text-sm">No Image</span>
                                </div>
                            </div>
                        )}
                        {rental.isFeatured && (
                            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
                                Featured
                            </div>
                        )}
                        {!isAvailable && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                                Unavailable
                            </div>
                        )}
                    </div>

                    {/* Rental Details */}
                    <div className={viewMode === "list" ? "flex-1" : ""}>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-gray-700 line-clamp-1">
                                    {rental.title || rental.name || 'Unnamed Rental'}
                                </h3>
                                {rental.specifications?.brand && (
                                    <p className="text-xs text-gray-500 mt-0.5">by {rental.specifications.brand}</p>
                                )}
                            </div>
                            <div className="text-right ml-3 flex-shrink-0">
                                {priceDisplay && (
                                    <div className="text-xl font-bold text-green-600">
                                        {formatPrice(priceDisplay.amount, priceDisplay.currency)}
                                    </div>
                                )}
                                {priceDisplay && (
                                    <div className="text-xs text-gray-500">
                                        /{priceDisplay.unit}
                                    </div>
                                )}
                            </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {rental.description || 'No description available'}
                        </p>

                        {/* Owner Info */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-medium text-gray-600">
                                    {ownerName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">{ownerName}</p>
                                <div className="flex items-center gap-1">
                                    {renderStars(rentalRating, rentalId)}
                                    <span className="text-xs text-gray-500">
                                        ({reviewCount || 0})
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        {rental.tags && rental.tags.length > 0 && (
                            <div className="mb-2">
                                <div className="flex flex-wrap gap-1">
                                    {rental.tags.slice(0, 3).map((tag, index) => (
                                        <span key={index} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                    {rental.tags.length > 3 && (
                                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                            +{rental.tags.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Rental Meta */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {isAvailable ? 'Available' : 'Unavailable'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center gap-1">
                                        {getCategoryIcon(rental.category)}
                                        {getCategoryLabel(rental.category)}
                                    </span>
                                </div>
                                {(locationCity || locationState) && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        <span className="text-xs">
                                            {locationCity && locationState ? `${locationCity}, ${locationState}` : locationCity || locationState}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4" />
                                <span>{Number(rentalRating).toFixed(1)} ({reviewCount})</span>
                            </div>
                        </div>

                        {/* Rental Badges */}
                        <div className="mt-2 flex flex-wrap gap-1">
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                {rental.category?.replace(/\b\w/g, l => l.toUpperCase()) || 'Rental'}
                            </span>
                            {rental.subcategory && (
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                    {rental.subcategory}
                                </span>
                            )}
                            {rental.isFeatured && (
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                    <Star className="w-3 h-3 inline mr-1" />
                                    Featured
                                </span>
                            )}
                            {rental.location?.deliveryAvailable && (
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                    <Truck className="w-3 h-3 inline mr-1" />
                                    Delivery Available
                                </span>
                            )}
                            {rental.specifications?.condition && (
                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                    rental.specifications.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                                    rental.specifications.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                                    rental.specifications.condition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {rental.specifications.condition}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
});
