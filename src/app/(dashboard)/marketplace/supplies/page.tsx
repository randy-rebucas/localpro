"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { GridSkeleton } from "@/components/ui/loading";
import {
    Search,
    Star,
    MapPin,
    Clock,
    ChevronDown,
    Grid,
    List,
    SlidersHorizontal,
    Plus,
    Package,
    RefreshCw,
    Truck,
    Shield,
    Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

interface Supply {
    _id: string;
    name: string;
    description: string;
    category: string;
    type: 'cleaning' | 'tools' | 'materials' | 'equipment' | 'subscription';
    status: 'available' | 'out-of-stock' | 'discontinued' | 'pre-order';
    price: number;
    originalPrice?: number;
    unit: 'piece' | 'pack' | 'box' | 'kg' | 'liter' | 'set';
    stock: number;
    minOrder: number;
    maxOrder?: number;
    location: {
        address: string;
        city: string;
        state: string;
        zipCode: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    images: string[];
    features: string[];
    specifications: {
        brand?: string;
        model?: string;
        weight?: string;
        dimensions?: string;
        material?: string;
        color?: string;
        warranty?: string;
    };
    supplier: {
        _id: string;
        name: string;
        avatar?: string;
        rating: number;
        reviewCount: number;
        verified: boolean;
        location: string;
    };
    delivery: {
        available: boolean;
        estimatedDays: number;
        cost: number;
        freeShippingThreshold?: number;
    };
    rating: {
        average: number;
        count: number;
    };
    viewsCount: number;
    isFeatured: boolean;
    isFavorited: boolean;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

interface FilterOptions {
    category: string;
    type: string;
    status: string;
    priceRange: [number, number];
    rating: number;
    location: string;
    availability: boolean;
    coordinates?: { lat: number; lng: number };
    radius?: number;
}

export default function MarketplaceSuppliesPage() {
    const [supplies, setSupplies] = useState<Supply[]>([]);
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
        type: "",
        status: "",
        priceRange: [0, 1000],
        rating: 0,
        location: "",
        availability: true,
        coordinates: undefined,
        radius: 10000 // 10km default radius
    });

    const categories = [
        { value: "", label: "All Categories" },
        { value: "cleaning", label: "Cleaning Supplies" },
        { value: "tools", label: "Tools & Equipment" },
        { value: "materials", label: "Building Materials" },
        { value: "safety", label: "Safety Equipment" },
        { value: "office", label: "Office Supplies" },
        { value: "maintenance", label: "Maintenance Kits" },
        { value: "other", label: "Other" }
    ];

    const types = [
        { value: "", label: "All Types" },
        { value: "cleaning", label: "Cleaning" },
        { value: "tools", label: "Tools" },
        { value: "materials", label: "Materials" },
        { value: "equipment", label: "Equipment" },
        { value: "subscription", label: "Subscription" }
    ];

    const statuses = [
        { value: "", label: "All Status" },
        { value: "available", label: "Available" },
        { value: "out-of-stock", label: "Out of Stock" },
        { value: "discontinued", label: "Discontinued" },
        { value: "pre-order", label: "Pre-order" }
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
                    setError("Unable to get your location. Please enter your location manually.");
                }
            );
        } else {
            console.warn("Geolocation is not supported by this browser.");
            setError("Location services are not available. Please enter your location manually.");
        }
    };

    const fetchSupplies = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

             const params = new URLSearchParams();

             // Add pagination first
             params.append("page", pagination.current.toString());
             params.append("limit", pagination.limit.toString());

             // Add search and filters
             params.append("search", searchQuery || "");
             params.append("category", filters.category || "");
             params.append("location", filters.location || "");
             
             // Add price range
             params.append("minPrice", filters.priceRange[0].toString());
             params.append("maxPrice", filters.priceRange[1].toString());

             // Add additional filters if they have values
             if (filters.type) params.append("type", filters.type);
             if (filters.status) params.append("status", filters.status);
             if (filters.availability) params.append("available", "true");
             if (filters.rating > 0) {
                 params.append("rating", filters.rating.toString());
                 params.append("sortBy", "rating.average");
                 params.append("sortOrder", "desc");
             }

             // Add coordinates and radius if available
             if (filters.coordinates) {
                 params.append("coordinates", JSON.stringify(filters.coordinates));
                 if (filters.radius) params.append("radius", filters.radius.toString());
             }

             // Enhanced sorting
             if (sortBy === "price_low") {
                 params.append("sortBy", "price");
                 params.append("sortOrder", "asc");
             } else if (sortBy === "price_high") {
                 params.append("sortBy", "price");
                 params.append("sortOrder", "desc");
             } else if (sortBy === "rating") {
                 params.append("sortBy", "rating.average");
                 params.append("sortOrder", "desc");
             } else {
                 params.append("sort", sortBy);
             }

            console.log("Fetching supplies with params:", params.toString());

            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

             let response;
             try {
                 response = await fetch(`/api/supplies?${params.toString()}`, {
                     signal: controller.signal
                 });
             } catch (fetchError) {
                 console.log("Primary API failed, trying fallback API:", fetchError);
                 // Try the products API as fallback
                 response = await fetch(`/api/supplies/products?${params.toString()}`, {
                     signal: controller.signal
                 });
             }

            clearTimeout(timeoutId);

            console.log("Response status:", response.status);
            console.log("Response ok:", response.ok);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("API Error:", errorData);
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch supplies`);
            }

            const data = await response.json();
            console.log("Supplies data:", data);

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

                // Set supplies data
                setSupplies(data.data || []);

                // Debug: Log the first supply to see its structure
                if (data.data && data.data.length > 0) {
                    console.log("First supply structure:", data.data[0]);
                    console.log("First supply supplier:", data.data[0].supplier);
                    console.log("First supply pricing:", data.data[0].price);
                }
            } else if (Array.isArray(data)) {
                // Fallback for direct array response
                setSupplies(data);
                setPagination({
                    current: 1,
                    pages: 1,
                    total: data.length,
                    limit: 15,
                    count: data.length
                });
            } else if (data.supplies) {
                // Fallback for supplies property
                setSupplies(data.supplies);
                setPagination({
                    current: 1,
                    pages: 1,
                    total: data.supplies.length,
                    limit: 15,
                    count: data.supplies.length
                });
            } else {
                setSupplies([]);
                setPagination({
                    current: 1,
                    pages: 1,
                    total: 0,
                    limit: 15,
                    count: 0
                });
            }
        } catch (error) {
            console.error("Error fetching supplies:", error);

            setError('Failed to fetch supplies. Please try again later.');
            setSupplies([]);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, filters, sortBy, pagination]);

     // Debounced search to improve performance
     useEffect(() => {
         const timeoutId = setTimeout(() => {
             fetchSupplies();
         }, 300); // 300ms debounce

         return () => clearTimeout(timeoutId);
     }, [searchQuery, filters, sortBy, pagination]);

     // Trigger fetch when pagination changes
     useEffect(() => {
         fetchSupplies();
     }, [searchQuery, filters, sortBy, pagination]);

    const handleFilterChange = (key: keyof FilterOptions, value: string | number | boolean | number[]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            category: "",
            type: "",
            status: "",
            priceRange: [0, 1000],
            rating: 0,
            location: "",
            availability: true,
            coordinates: undefined,
            radius: 10000
        });
    };

    const getStatusColor = (status: Supply['status']) => {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-800';
            case 'out-of-stock': return 'bg-red-100 text-red-800';
            case 'discontinued': return 'bg-gray-100 text-gray-800';
            case 'pre-order': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeIcon = (type: Supply['type']) => {
        switch (type) {
            case 'cleaning': return <Shield className="w-4 h-4" />;
            case 'tools': return <Zap className="w-4 h-4" />;
            case 'materials': return <Package className="w-4 h-4" />;
            case 'equipment': return <Truck className="w-4 h-4" />;
            case 'subscription': return <Clock className="w-4 h-4" />;
            default: return <Package className="w-4 h-4" />;
        }
    };

    const renderStars = useCallback((rating: number, supplyId?: string) => {
        return (
            <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                    <Star
                        key={`${supplyId || 'default'}-star-${i}`}
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

                {/* Supply Cards Skeleton */}
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
                        title="Unable to Load Supplies"
                        description={error}
                        actions={[
                            {
                                type: "button",
                                onClick: fetchSupplies,
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
                                        type: "",
                                        status: "",
                                        priceRange: [0, 1000],
                                        rating: 0,
                                        location: "",
                                        availability: true,
                                        coordinates: undefined,
                                        radius: 10000
                                    });
                                    fetchSupplies();
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
                title="Browse Supplies"
                subtitle="Find tools, materials, and supplies for your projects"
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
                        href: "/supplies/create",
                        label: "List Your Supply",
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
                                placeholder="Search supplies, suppliers, or locations..."
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

                            {/* Type Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type
                                </label>
                                <select
                                    value={filters.type}
                                    onChange={(e) => handleFilterChange("type", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    {types.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange("status", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    {statuses.map(status => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
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
                            {pagination.total} suppl{pagination.total !== 1 ? 'ies' : 'y'} found
                            {pagination.pages > 1 && (
                                <span className="ml-2 text-sm text-gray-500">
                                    (Page {pagination.current} of {pagination.pages})
                                </span>
                            )}
                        </p>
                        {pagination.count > 0 && (
                            <p className="text-sm text-gray-500">
                                Showing {supplies.length} of {pagination.count} results
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

                {supplies.length === 0 ? (
                    <Card interactive={false}>
                        <EmptyState
                            icon={Package}
                            iconColor="text-purple-600"
                            iconBgColor="bg-purple-100"
                            title="No Supplies Found"
                            description="We couldn't find any supplies matching your criteria. Try adjusting your search terms or filters."
                            actions={[
                                {
                                    type: "button",
                                    onClick: () => {
                                        setSearchQuery("");
                                        setFilters({
                                            category: "",
                                            type: "",
                                            status: "",
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
                        <div className={`grid gap-4 ${viewMode === "grid"
                                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                                : "grid-cols-1"
                            }`}>
                            {supplies.map((supply) => (
                                <SupplyCard
                                    key={supply._id}
                                    supply={supply}
                                    viewMode={viewMode}
                                    renderStars={renderStars}
                                    getStatusColor={getStatusColor}
                                    getTypeIcon={getTypeIcon}
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
    );
}

interface SupplyCardProps {
    supply: Supply;
    viewMode: "grid" | "list";
    renderStars: (rating: number, supplyId?: string) => React.ReactElement;
    getStatusColor: (status: Supply['status']) => string;
    getTypeIcon: (type: Supply['type']) => React.ReactElement;
}

const SupplyCard = React.memo(function SupplyCard({
    supply,
    viewMode,
    renderStars,
    getStatusColor,
    getTypeIcon
}: SupplyCardProps) {
    const supplierName = supply.supplier ? supply.supplier.name : 'Unknown Supplier';
    const supplierRating = supply.supplier?.rating || 0;
    const supplyRating = supply.rating?.average || 0;
    const reviewCount = supply.rating?.count || 0;
    const basePrice = supply.price || 0;

    // Format price with currency
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    };

    return (
        <Link
            href={`/supplies/${supply._id}`}
            className={`bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group ${viewMode === "list" ? "flex" : ""
                }`}
        >
            <div className={viewMode === "list" ? "flex-1 p-4" : "p-4"}>
                <div className={viewMode === "list" ? "flex gap-6" : ""}>
                    {/* Supply Image */}
                    <div className={`${viewMode === "list" ? "w-48 h-32" : "w-full h-40"} bg-gray-200 rounded-lg mb-3 flex-shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
                        {supply.images && supply.images.length > 0 ? (
                            <Image
                                src={supply.images[0]}
                                alt={supply.name}
                                width={viewMode === "list" ? 192 : 400}
                                height={viewMode === "list" ? 128 : 192}
                                className="w-full h-full object-cover rounded-lg"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <span className="text-sm">No Image</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Supply Details */}
                    <div className={viewMode === "list" ? "flex-1" : ""}>
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-base font-semibold text-gray-700 line-clamp-1 flex-1">
                                {supply.name || 'Unnamed Supply'}
                            </h3>
                            <div className="text-right ml-3 flex-shrink-0">
                                <div className="text-xl font-bold text-green-600">
                                    {formatPrice(basePrice)}
                                </div>
                                {supply.originalPrice && (
                                    <div className="text-sm text-gray-500 line-through">
                                        {formatPrice(supply.originalPrice)}
                                    </div>
                                )}
                                <div className="text-xs text-gray-500">
                                    per {supply.unit}
                                </div>
                            </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {supply.description || 'No description available'}
                        </p>

                        {/* Supplier Info */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-medium text-gray-600">
                                    {supplierName.charAt(0)}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">{supplierName}</p>
                                <div className="flex items-center gap-1">
                                    {renderStars(supplierRating, supply._id)}
                                    <span className="text-xs text-gray-500">
                                        ({supplierRating})
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Supply Features */}
                        {supply.features && supply.features.length > 0 && (
                            <div className="mb-2">
                                <div className="flex flex-wrap gap-1">
                                    {supply.features.slice(0, 3).map((feature, index) => (
                                        <span key={index} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                            {feature}
                                        </span>
                                    ))}
                                    {supply.features.length > 3 && (
                                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                            +{supply.features.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Supply Meta */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(supply.status)}`}>
                                        {supply.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center gap-1">
                                        {getTypeIcon(supply.type)}
                                        {supply.type}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                        Stock: {supply.stock}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4" />
                                <span>{Number(supplyRating).toFixed(1)} ({reviewCount})</span>
                            </div>
                        </div>

                        {/* Supply Badges */}
                        <div className="mt-2 flex flex-wrap gap-1">
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                {supply.category?.toLowerCase() || 'supply'}
                            </span>
                            {supply.isFeatured && (
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                    <Star className="w-3 h-3 inline mr-1" />
                                    Featured
                                </span>
                            )}
                            {supply.delivery?.available && (
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                    <Truck className="w-3 h-3 inline mr-1" />
                                    Delivery Available
                                </span>
                            )}
                            {supply.supplier?.verified && (
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                    Verified Supplier
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
});
