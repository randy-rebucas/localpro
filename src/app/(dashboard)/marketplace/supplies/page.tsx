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
import { apiRequest, API_ENDPOINTS } from "@/lib/api";

type SuppliesPagination = {
    current?: number;
    pages?: number;
    total?: number;
    limit?: number;
    count?: number;
};

type SuppliesApiResponse = {
    success?: boolean;
    message?: string;
    data?: Product[];
    supplies?: Product[];
    products?: Product[];
    pagination?: SuppliesPagination;
} | Product[];

// Product Image Interface
interface ProductImage {
    url: string;
    publicId?: string;
    thumbnail?: string;
    alt?: string;
}

// Product Entity Interface (matching data-entities.md)
interface Product {
    _id?: string;
    id?: string;
    name: string;
    title: string;
    description: string;
    category: 'cleaning_supplies' | 'tools' | 'materials' | 'equipment';
    subcategory: string;
    brand: string;
    sku: string;
    pricing: {
        retailPrice: number;
        wholesalePrice?: number;
        currency: string;
    };
    inventory: {
        quantity: number;
        minStock?: number;
        maxStock?: number;
        location?: string;
    };
    specifications?: {
        weight?: string;
        dimensions?: string;
        material?: string;
        color?: string;
        warranty?: string;
    };
    location?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
    images?: ProductImage[] | string[]; // Support both formats
    tags?: string[];
    isActive?: boolean;
    isFeatured?: boolean;
    views?: number;
    isSubscriptionEligible?: boolean;
    supplier: {
        _id?: string;
        id?: string;
        name?: string;
        firstName?: string;
        lastName?: string;
    } | string; // Can be populated object or just ID
    reviews?: Array<{
        user: string | {
            _id?: string;
            id?: string;
            name?: string;
        };
        rating: number;
        comment?: string;
        createdAt?: string;
    }>;
    averageRating?: number;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
}

// Legacy Supply type alias for backward compatibility
type Supply = Product;

interface FilterOptions {
    category: string;
    priceRange: [number, number];
    rating: number;
    location: string;
    availability: boolean;
    inStock: boolean;
    coordinates?: { lat: number; lng: number };
    radius?: number;
    brand?: string;
    subscriptionEligible?: boolean;
}

export default function MarketplaceSuppliesPage() {
    const [supplies, setSupplies] = useState<Product[]>([]);
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
        priceRange: [0, 10000],
        rating: 0,
        location: "",
        availability: true,
        inStock: false,
        coordinates: undefined,
        radius: 10000, // 10km default radius
        subscriptionEligible: false
    });

    const categories = [
        { value: "", label: "All Categories" },
        { value: "cleaning_supplies", label: "Cleaning Supplies" },
        { value: "tools", label: "Tools" },
        { value: "materials", label: "Materials" },
        { value: "equipment", label: "Equipment" }
    ];
    
    // Normalize product data from API response
    const normalizeProduct = useCallback((product: any): Product => {
        return {
            ...product,
            _id: product._id || product.id,
            id: product.id || product._id,
            images: Array.isArray(product.images) 
                ? product.images.map((img: any) => 
                    typeof img === 'string' 
                        ? { url: img, alt: product.title || product.name } 
                        : { url: img.url || img.publicId || '', publicId: img.publicId, thumbnail: img.thumbnail, alt: img.alt || product.title || product.name }
                  )
                : [],
            supplier: typeof product.supplier === 'string' 
                ? { id: product.supplier } 
                : {
                    _id: product.supplier?._id || product.supplier?.id,
                    id: product.supplier?.id || product.supplier?._id,
                    name: product.supplier?.name,
                    firstName: product.supplier?.firstName,
                    lastName: product.supplier?.lastName
                  },
            pricing: product.pricing || {
                retailPrice: product.price || product.retailPrice || 0,
                wholesalePrice: product.wholesalePrice,
                currency: product.currency || 'USD'
            },
            inventory: product.inventory || {
                quantity: product.stock || product.quantity || 0,
                minStock: product.minStock,
                maxStock: product.maxStock,
                location: product.inventory?.location
            },
            averageRating: product.averageRating || product.rating?.average || 0,
            isActive: product.isActive !== undefined ? product.isActive : true,
            views: product.views || product.viewsCount || 0
        };
    }, []);

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
             
             // Add price range (use retailPrice from pricing)
             if (filters.priceRange[0] > 0) params.append("minPrice", filters.priceRange[0].toString());
             if (filters.priceRange[1] < 10000) params.append("maxPrice", filters.priceRange[1].toString());
             
             // Availability and stock filters
             if (filters.availability) params.append("isActive", "true");
             if (filters.inStock) params.append("inStock", "true");
             
             if (filters.rating > 0) {
                 params.append("minRating", filters.rating.toString());
                 params.append("sortBy", "averageRating");
                 params.append("sortOrder", "desc");
             }
             
             if (filters.subscriptionEligible) {
                 params.append("subscriptionEligible", "true");
             }
             
             if (filters.brand) {
                 params.append("brand", filters.brand);
             }

             // Enhanced sorting (matching API documentation and usage examples)
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

            console.log("Fetching supplies with params:", params.toString());

            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

            // Determine which endpoint to use
            const endpoint = hasCoordinates 
                ? API_ENDPOINTS.suppliesNearby 
                : API_ENDPOINTS.suppliesProducts || API_ENDPOINTS.supplies;

            // Prefer primary endpoint; fall back to products on failure
            let data: SuppliesApiResponse;
            try {
                data = await apiRequest<SuppliesApiResponse>(`${endpoint}?${params.toString()}`, {
                    signal: controller.signal
                });
            } catch (fetchError) {
                console.log("Primary API failed, trying fallback API:", fetchError);
                // Try alternative endpoint
                const fallbackEndpoint = endpoint === API_ENDPOINTS.suppliesNearby
                    ? API_ENDPOINTS.suppliesProducts || API_ENDPOINTS.supplies
                    : API_ENDPOINTS.supplies;
                data = await apiRequest<SuppliesApiResponse>(`${fallbackEndpoint}?${params.toString()}`, {
                    signal: controller.signal
                });
            } finally {
                clearTimeout(timeoutId);
            }
            
            console.log(`Fetched from ${hasCoordinates ? 'nearby' : 'regular'} endpoint`);

            console.log("Supplies data:", data);

            // Handle the API response structure with pagination
            if (Array.isArray(data)) {
                // Direct array response - normalize products
                const normalizedProducts = data.map((product: any) => normalizeProduct(product));
                setSupplies(normalizedProducts);
                setPagination({
                    current: 1,
                    pages: 1,
                    total: normalizedProducts.length,
                    limit: 15,
                    count: normalizedProducts.length
                });
            } else if (data && typeof data === 'object') {
                // Object response format
                if ('success' in data && data.success && 'data' in data && data.data) {
                    console.log("API Response - Success:", data.success);
                    console.log("API Response - Message:", data.message);
                    console.log("API Response - Pagination:", data.pagination);
                    console.log("API Response - Data count:", data.data.length);

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

                    // Normalize and set products data
                    const normalizedProducts = (data.data || []).map((product: any) => normalizeProduct(product));
                    setSupplies(normalizedProducts);

                    // Debug: Log the first product to see its structure
                    if (normalizedProducts.length > 0) {
                        console.log("First product structure:", normalizedProducts[0]);
                        console.log("First product supplier:", normalizedProducts[0].supplier);
                        console.log("First product pricing:", normalizedProducts[0].pricing);
                    }
                } else if (('supplies' in data || 'products' in data) && Array.isArray((data as any).supplies || (data as any).products)) {
                    // Alternative response format with supplies/products property
                    const products = (data as any).supplies || (data as any).products || [];
                    const normalizedProducts = products.map((product: any) => normalizeProduct(product));
                    setSupplies(normalizedProducts);
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
                            total: normalizedProducts.length,
                            limit: 15,
                            count: normalizedProducts.length
                        });
                    }
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
    }, [searchQuery, filters, sortBy, pagination.current, pagination.limit, normalizeProduct]);

    // Debounced search to improve performance
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchSupplies();
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [fetchSupplies]);

    // Trigger fetch when pagination changes
    useEffect(() => {
        fetchSupplies();
    }, [fetchSupplies]);

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
            inStock: false,
            coordinates: undefined,
            radius: 10000,
            subscriptionEligible: false
        });
    };
    
    // Get stock status based on inventory quantity
    const getStockStatus = (product: Product) => {
        const quantity = product.inventory?.quantity || 0;
        const minStock = product.inventory?.minStock || 0;
        
        if (quantity === 0) return { status: 'out-of-stock', color: 'bg-red-100 text-red-800', label: 'Out of Stock' };
        if (quantity <= minStock) return { status: 'low-stock', color: 'bg-yellow-100 text-yellow-800', label: 'Low Stock' };
        return { status: 'in-stock', color: 'bg-green-100 text-green-800', label: 'In Stock' };
    };

    const getCategoryIcon = (category: Product['category']) => {
        switch (category) {
            case 'cleaning_supplies': return <Shield className="w-4 h-4" />;
            case 'tools': return <Zap className="w-4 h-4" />;
            case 'materials': return <Package className="w-4 h-4" />;
            case 'equipment': return <Truck className="w-4 h-4" />;
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
                                        priceRange: [0, 10000],
                                        rating: 0,
                                        location: "",
                                        availability: true,
                                        inStock: false,
                                        coordinates: undefined,
                                        radius: 10000,
                                        subscriptionEligible: false
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
                        </div>
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
                                                    priceRange: [0, 10000],
                                                    rating: 0,
                                                    location: "",
                                                    availability: true,
                                                    inStock: false,
                                                    coordinates: undefined,
                                                    radius: 10000,
                                                    subscriptionEligible: false
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
                                            key={supply._id || supply.id}
                                            supply={supply}
                                            viewMode={viewMode}
                                            renderStars={renderStars}
                                            getStockStatus={getStockStatus}
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

interface SupplyCardProps {
    supply: Product;
    viewMode: "grid" | "list";
    renderStars: (rating: number, supplyId?: string) => React.ReactElement;
    getStockStatus: (product: Product) => { status: string; color: string; label: string };
    getCategoryIcon: (category: Product['category']) => React.ReactElement;
}

const SupplyCard = React.memo(function SupplyCard({
    supply,
    viewMode,
    renderStars,
    getStockStatus,
    getCategoryIcon
}: SupplyCardProps) {
    // Get product ID
    const productId = supply._id || supply.id || '';
    
    // Normalize supplier data
    const supplier = typeof supply.supplier === 'string' 
        ? { id: supply.supplier, name: 'Unknown Supplier' }
        : supply.supplier || {};
    const supplierName = supplier.name || 
        (supplier.firstName && supplier.lastName 
            ? `${supplier.firstName} ${supplier.lastName}` 
            : supplier.firstName || supplier.lastName || 'Unknown Supplier');
    
    const productRating = supply.averageRating || 0;
    const reviewCount = supply.reviews?.length || 0;
    const retailPrice = supply.pricing?.retailPrice || 0;
    const wholesalePrice = supply.pricing?.wholesalePrice;
    const currency = supply.pricing?.currency || 'USD';
    const stockStatus = getStockStatus(supply);
    const stockQuantity = supply.inventory?.quantity || 0;
    
    // Get first image URL (handle both old string array and new object array format)
    const getImageUrl = () => {
        if (!supply.images || supply.images.length === 0) return null;
        const firstImage = supply.images[0];
        return typeof firstImage === 'string' ? firstImage : (firstImage.url || firstImage.thumbnail || null);
    };
    const imageUrl = getImageUrl();

    // Format price with currency
    const formatPrice = (price: number, curr: string = currency) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: curr
        }).format(price);
    };
    
    // Get category label
    const getCategoryLabel = (category: Product['category']) => {
        const labels: Record<string, string> = {
            cleaning_supplies: 'Cleaning Supplies',
            tools: 'Tools',
            materials: 'Materials',
            equipment: 'Equipment'
        };
        return labels[category] || category;
    };

    return (
        <Link
            href={`/marketplace/supplies/${productId}`}
            className={`bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group ${viewMode === "list" ? "flex" : ""
                }`}
        >
            <div className={viewMode === "list" ? "flex-1 p-4" : "p-4"}>
                <div className={viewMode === "list" ? "flex gap-6" : ""}>
                    {/* Product Image */}
                    <div className={`${viewMode === "list" ? "w-48 h-32" : "w-full h-40"} bg-gray-200 rounded-lg mb-3 flex-shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={
                                    supply.images && 
                                    Array.isArray(supply.images) && 
                                    supply.images.length > 0 && 
                                    typeof supply.images[0] === 'object' && 
                                    supply.images[0].alt 
                                        ? supply.images[0].alt 
                                        : supply.title || supply.name
                                }
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

                    {/* Product Details */}
                    <div className={viewMode === "list" ? "flex-1" : ""}>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-gray-700 line-clamp-1">
                                    {supply.title || supply.name || 'Unnamed Product'}
                                </h3>
                                {supply.brand && (
                                    <p className="text-xs text-gray-500 mt-0.5">by {supply.brand}</p>
                                )}
                            </div>
                            <div className="text-right ml-3 flex-shrink-0">
                                <div className="text-xl font-bold text-green-600">
                                    {formatPrice(retailPrice, currency)}
                                </div>
                                {wholesalePrice && wholesalePrice < retailPrice && (
                                    <div className="text-xs text-gray-500">
                                        Wholesale: {formatPrice(wholesalePrice, currency)}
                                    </div>
                                )}
                                {supply.sku && (
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        SKU: {supply.sku}
                                    </div>
                                )}
                            </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {supply.description || 'No description available'}
                        </p>

                        {/* Supplier Info */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-medium text-gray-600">
                                    {supplierName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">{supplierName}</p>
                                <div className="flex items-center gap-1">
                                    {renderStars(productRating, productId)}
                                    <span className="text-xs text-gray-500">
                                        ({reviewCount || 0})
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        {supply.tags && supply.tags.length > 0 && (
                            <div className="mb-2">
                                <div className="flex flex-wrap gap-1">
                                    {supply.tags.slice(0, 3).map((tag, index) => (
                                        <span key={index} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                    {supply.tags.length > 3 && (
                                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                            +{supply.tags.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Product Meta */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                                        {stockStatus.label}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded flex items-center gap-1">
                                        {getCategoryIcon(supply.category)}
                                        {getCategoryLabel(supply.category)}
                                    </span>
                                </div>
                                {stockQuantity > 0 && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                            {stockQuantity} in stock
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4" />
                                <span>{Number(productRating).toFixed(1)} ({reviewCount})</span>
                            </div>
                        </div>

                        {/* Product Badges */}
                        <div className="mt-2 flex flex-wrap gap-1">
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                {supply.category?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Product'}
                            </span>
                            {supply.subcategory && (
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                    {supply.subcategory}
                                </span>
                            )}
                            {supply.isFeatured && (
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                    <Star className="w-3 h-3 inline mr-1" />
                                    Featured
                                </span>
                            )}
                            {supply.isSubscriptionEligible && (
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    Subscription Available
                                </span>
                            )}
                            {supply.specifications?.warranty && (
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                    Warranty Included
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
});
