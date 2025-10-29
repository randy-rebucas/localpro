"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    handleClientApiRoute,
    isAuthenticated
} from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import {
    Search,
    Star,
    Clock,
    ChevronDown,
    Grid,
    List,
    SlidersHorizontal,
    Plus,
    BookOpen,
    Users,
    Play,
    Award,
    RefreshCw,
    GraduationCap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

interface Course {
    _id: string;
    title: string;
    description: string;
    shortDescription?: string;
    category: string;
    subcategory?: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    duration: number; // in hours
    price: number;
    originalPrice?: number;
    currency: string;
    thumbnail?: string;
    instructor: {
        _id: string;
        name: string;
        avatar?: string;
        bio?: string;
        rating: number;
        reviewCount: number;
        verified: boolean;
    };
    rating: {
        average: number;
        count: number;
    };
    studentsCount: number;
    lessonsCount: number;
    isPublished: boolean;
    isFeatured: boolean;
    isEnrolled: boolean;
    tags: string[];
    language: string;
    createdAt: string;
    updatedAt: string;
    lastUpdated: string;
    difficulty: number; // 1-5 scale
    prerequisites: string[];
    learningOutcomes: string[];
    whatYouWillLearn: string[];
}

interface Category {
    _id: string;
    name: string;
    description?: string;
    icon?: string;
    courseCount: number;
    subcategories?: Category[];
}

interface FilterOptions {
    category: string;
    subcategory: string;
    level: string;
    priceRange: [number, number];
    rating: number;
    duration: [number, number];
    language: string;
    difficulty: number;
    isFree: boolean;
    isFeatured: boolean;
}

export default function MarketplaceCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    // Fallback categories in case API is not available
    const fallbackCategories = useMemo(() => [
        { _id: "programming", name: "Programming", courseCount: 0 },
        { _id: "design", name: "Design", courseCount: 0 },
        { _id: "business", name: "Business", courseCount: 0 },
        { _id: "marketing", name: "Marketing", courseCount: 0 },
        { _id: "photography", name: "Photography", courseCount: 0 },
        { _id: "music", name: "Music", courseCount: 0 },
        { _id: "languages", name: "Languages", courseCount: 0 },
        { _id: "other", name: "Other", courseCount: 0 }
    ], []);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("relevance");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [showFilters, setShowFilters] = useState(false);
    const [activeTab, setActiveTab] = useState<"all" | "featured">("all");
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0,
        limit: 12,
        count: 0
    });
    const [filters, setFilters] = useState<FilterOptions>({
        category: "",
        subcategory: "",
        level: "",
        priceRange: [0, 1000],
        rating: 0,
        duration: [0, 50],
        language: "",
        difficulty: 0,
        isFree: false,
        isFeatured: false
    });

    const levels = [
        { value: "", label: "All Levels" },
        { value: "beginner", label: "Beginner" },
        { value: "intermediate", label: "Intermediate" },
        { value: "advanced", label: "Advanced" }
    ];

    const languages = [
        { value: "", label: "All Languages" },
        { value: "en", label: "English" },
        { value: "es", label: "Spanish" },
        { value: "fr", label: "French" },
        { value: "de", label: "German" },
        { value: "pt", label: "Portuguese" }
    ];

    const sortOptions = [
        { value: "relevance", label: "Most Relevant" },
        { value: "newest", label: "Newest First" },
        { value: "oldest", label: "Oldest First" },
        { value: "price_low", label: "Price: Low to High" },
        { value: "price_high", label: "Price: High to Low" },
        { value: "rating", label: "Highest Rated" },
        { value: "students", label: "Most Popular" },
        { value: "duration", label: "Duration" }
    ];

    const fetchCourses = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Check if user is authenticated
            if (!isAuthenticated()) {
                console.error("❌ User not authenticated - no api-token cookie found");
                console.log("Available cookies:", document.cookie);
                throw new Error("Authentication required. Please log in to view courses.");
            }

            console.log("✅ User is authenticated, proceeding with API request");

            const queryParams: Record<string, string> = {
                page: pagination.current.toString(),
                limit: pagination.limit.toString(),
                search: searchQuery || "",
                category: filters.category || "",
                subcategory: filters.subcategory || "",
                level: filters.level || "",
                language: filters.language || "",
                minPrice: filters.priceRange[0].toString(),
                maxPrice: filters.priceRange[1].toString(),
                minDuration: filters.duration[0].toString(),
                maxDuration: filters.duration[1].toString(),
            };

            if (filters.rating > 0) {
                queryParams.minRating = filters.rating.toString();
            }
            if (filters.difficulty > 0) {
                queryParams.difficulty = filters.difficulty.toString();
            }
            if (filters.isFree) {
                queryParams.isFree = "true";
            }
            if (filters.isFeatured) {
                queryParams.isFeatured = "true";
            }

            // Add sorting
            if (sortBy === "price_low") {
                queryParams.sortBy = "price";
                queryParams.sortOrder = "asc";
            } else if (sortBy === "price_high") {
                queryParams.sortBy = "price";
                queryParams.sortOrder = "desc";
            } else if (sortBy === "rating") {
                queryParams.sortBy = "rating.average";
                queryParams.sortOrder = "desc";
            } else if (sortBy === "students") {
                queryParams.sortBy = "studentsCount";
                queryParams.sortOrder = "desc";
            } else if (sortBy === "duration") {
                queryParams.sortBy = "duration";
                queryParams.sortOrder = "asc";
            } else {
                queryParams.sort = sortBy;
            }

            console.log("Fetching courses with params:", queryParams);

            const result = await handleClientApiRoute(async () => {
                console.log("🔍 Making request to local API route...");
                console.log("Query params:", queryParams);

                // Add timeout to prevent hanging
                const controller = new AbortController();
                setTimeout(() => controller.abort(), 10000); // 10 second timeout

                const response = await fetch(`/api/academy/courses?${new URLSearchParams(queryParams).toString()}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include', // Include cookies for authentication
                    signal: controller.signal
                });
                console.log("📡 Response status:", response.status);
                console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()));

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("❌ API Error Response:", errorText);
                    throw new Error(`Failed to fetch courses: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                console.log("✅ API Response data:", data);
                return data;
            }, "Fetch courses");

            if (result.error) {
                throw new Error(result.error);
            }

            const data = result.data;
            console.log("Courses data:", data);

            // Handle different response formats according to API documentation
            if (data && typeof data === 'object') {
                if (data.success && data.data) {
                    // Standard API response format
                    if (data.pagination) {
                        setPagination({
                            current: data.pagination.current || 1,
                            pages: data.pagination.pages || 1,
                            total: data.pagination.total || 0,
                            limit: data.pagination.limit || 12,
                            count: data.pagination.count || 0
                        });
                    }
                    setCourses(data.data || []);
                } else if (Array.isArray(data)) {
                    // Direct array response
                    setCourses(data);
                    setPagination({
                        current: 1,
                        pages: 1,
                        total: data.length,
                        limit: 12,
                        count: data.length
                    });
                } else if (data.courses && Array.isArray(data.courses)) {
                    // Alternative response format
                    setCourses(data.courses);
                    if (data.pagination) {
                        setPagination({
                            current: data.pagination.current || 1,
                            pages: data.pagination.pages || 1,
                            total: data.pagination.total || 0,
                            limit: data.pagination.limit || 12,
                            count: data.pagination.count || 0
                        });
                    } else {
                        setPagination({
                            current: 1,
                            pages: 1,
                            total: data.courses.length,
                            limit: 12,
                            count: data.courses.length
                        });
                    }
                } else {
                    setCourses([]);
                }
            } else {
                setCourses([]);
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
            setError(error instanceof Error ? error.message : 'Failed to fetch courses. Please try again later.');
            setCourses([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [searchQuery, filters, sortBy, pagination]);

    const fetchFeaturedCourses = useCallback(async () => {
        try {
            if (!isAuthenticated()) {
                return;
            }

            const result = await handleClientApiRoute(async () => {
                const response = await fetch(API_ENDPOINTS.academyFeatured, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include', // Include cookies for authentication
                });

                if (!response.ok) {
                    // Don't throw error for featured courses - just log and return empty array
                    console.warn(`Featured courses API returned ${response.status}, using empty array`);
                    return { success: true, data: [] };
                }

                return await response.json();
            }, "Fetch featured courses");

            if (result.error) {
                console.warn("Error fetching featured courses, using empty array:", result.error);
                setFeaturedCourses([]);
                return;
            }

            const data = result.data;
            // Handle different response formats for featured courses
            if (data && typeof data === 'object') {
                if (data.success && data.data) {
                    setFeaturedCourses(data.data);
                } else if (data.featured && Array.isArray(data.featured)) {
                    setFeaturedCourses(data.featured);
                } else if (Array.isArray(data)) {
                    setFeaturedCourses(data);
                } else {
                    setFeaturedCourses([]);
                }
            } else {
                setFeaturedCourses([]);
            }
        } catch (error) {
            console.warn("Error fetching featured courses, using empty array:", error);
            setFeaturedCourses([]);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            if (!isAuthenticated()) {
                return;
            }

            const result = await handleClientApiRoute(async () => {
                const response = await fetch(API_ENDPOINTS.academyCategories, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include', // Include cookies for authentication
                });

                if (!response.ok) {
                    // Don't throw error for categories - just log and return empty array
                    console.warn(`Categories API returned ${response.status}, using empty array`);
                    return { success: true, data: [] };
                }

                return await response.json();
            }, "Fetch categories");

            if (result.error) {
                console.warn("Error fetching categories, using fallback categories:", result.error);
                setCategories(fallbackCategories);
                return;
            }

            const data = result.data;
            // Handle different response formats for categories
            if (data && typeof data === 'object') {
                if (data.success && data.data) {
                    setCategories(data.data);
                } else if (data.categories && Array.isArray(data.categories)) {
                    setCategories(data.categories);
                } else if (Array.isArray(data)) {
                    setCategories(data);
                } else {
                    setCategories(fallbackCategories);
                }
            } else {
                setCategories(fallbackCategories);
            }
        } catch (error) {
            console.warn("Error fetching categories, using fallback categories:", error);
            setCategories(fallbackCategories);
        }
    }, [fallbackCategories]);

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchCourses();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [fetchCourses]);

    // Fetch data on mount
    useEffect(() => {
        fetchCourses();
        fetchFeaturedCourses();
        fetchCategories();
    }, [fetchCourses, fetchFeaturedCourses, fetchCategories]);

    const handleFilterChange = (key: keyof FilterOptions, value: string | number | boolean | number[]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            category: "",
            subcategory: "",
            level: "",
            priceRange: [0, 1000],
            rating: 0,
            duration: [0, 50],
            language: "",
            difficulty: 0,
            isFree: false,
            isFeatured: false
        });
    };

    const getLevelColor = (level: Course['level']) => {
        switch (level) {
            case 'beginner': return 'bg-green-100 text-green-800';
            case 'intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'advanced': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getDifficultyStars = (difficulty: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`w-3 h-3 ${i < difficulty ? "text-yellow-400 fill-current" : "text-gray-300"}`}
            />
        ));
    };

    const renderStars = useCallback((rating: number, courseId?: string) => {
        return (
            <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                    <Star
                        key={`${courseId || 'default'}-star-${i}`}
                        className={`w-4 h-4 ${i < Math.floor(rating)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                            }`}
                    />
                ))}
            </div>
        );
    }, []);

    const formatPrice = (price: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(price);
    };

    const formatDuration = (hours: number) => {
        if (hours < 1) {
            return `${Math.round(hours * 60)}m`;
        } else if (hours < 24) {
            return `${Math.round(hours)}h`;
        } else {
            const days = Math.floor(hours / 24);
            const remainingHours = Math.round(hours % 24);
            return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
        }
    };

    if (loading) {
        return (
            <div className="p-4 space-y-4">
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

                {/* Tabs Skeleton */}
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                    <div className="px-4 py-2 bg-gray-200 rounded-md w-24 h-8 animate-pulse"></div>
                    <div className="px-4 py-2 bg-gray-200 rounded-md w-20 h-8 animate-pulse"></div>
                </div>

                {/* Search and Filters Skeleton */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex flex-col lg:flex-row gap-3">
                        <div className="flex-1">
                            <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                        </div>
                        <div className="flex gap-2">
                            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                            <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
                            <div className="h-10 bg-gray-200 rounded w-10 animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Results Count Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                </div>

                {/* Course Grid Skeleton */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                            <div className="w-full h-40 bg-gray-200 rounded-lg mb-3"></div>
                            <div className="space-y-2">
                                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                <div className="flex items-center gap-2 mt-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                    <div className="space-y-1 flex-1">
                                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex gap-2">
                                        <div className="h-5 bg-gray-200 rounded w-16"></div>
                                        <div className="h-5 bg-gray-200 rounded w-12"></div>
                                    </div>
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
            <div className="p-4">
                <Card interactive={false}>
                    <EmptyState
                        icon={BookOpen}
                        iconColor="text-red-600"
                        iconBgColor="bg-red-100"
                        title="Unable to Load Courses"
                        description={error}
                        actions={[
                            {
                                type: "button",
                                onClick: fetchCourses,
                                label: "Try Again",
                                icon: RefreshCw,
                                variant: "primary"
                            },
                            {
                                type: "button",
                                onClick: clearFilters,
                                label: "Reset Filters",
                                variant: "secondary"
                            }
                        ]}
                    />
                </Card>
            </div>
        );
    }

    const currentCourses = activeTab === "featured" ? featuredCourses : courses;

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <PageHeader
                title="Browse Courses"
                subtitle="Discover and enroll in courses to advance your skills"
                actions={[
                    {
                        type: "link",
                        href: "/academy/courses/create",
                        label: "Create Course",
                        icon: Plus,
                        variant: "primary"
                    }
                ]}
            />

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                <button
                    onClick={() => setActiveTab("all")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "all"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                >
                    All Courses
                </button>
                <button
                    onClick={() => setActiveTab("featured")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "featured"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Featured
                    </div>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex flex-col lg:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search courses, instructors, or topics..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
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
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                        <button
                            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
                        >
                            {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                        </button>

                        <button
                            onClick={() => fetchCourses(true)}
                            disabled={refreshing}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh courses"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">All Categories</option>
                                    {(categories.length > 0 ? categories : fallbackCategories).map(category => (
                                        <option key={category._id} value={category._id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Level Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Level
                                </label>
                                <select
                                    value={filters.level}
                                    onChange={(e) => handleFilterChange("level", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {levels.map(level => (
                                        <option key={level.value} value={level.value}>
                                            {level.label}
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <span className="text-gray-500">to</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.priceRange[1]}
                                        onChange={(e) => handleFilterChange("priceRange", [filters.priceRange[0], Number(e.target.value)])}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Language Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Language
                                </label>
                                <select
                                    value={filters.language}
                                    onChange={(e) => handleFilterChange("language", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {languages.map(lang => (
                                        <option key={lang.value} value={lang.value}>
                                            {lang.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Rating Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Minimum Rating
                                </label>
                                <select
                                    value={filters.rating}
                                    onChange={(e) => handleFilterChange("rating", Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value={0}>Any Rating</option>
                                    <option value={4}>4+ Stars</option>
                                    <option value={3}>3+ Stars</option>
                                    <option value={2}>2+ Stars</option>
                                </select>
                            </div>

                            {/* Duration Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Duration (hours)
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.duration[0]}
                                        onChange={(e) => handleFilterChange("duration", [Number(e.target.value), filters.duration[1]])}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <span className="text-gray-500">to</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.duration[1]}
                                        onChange={(e) => handleFilterChange("duration", [filters.duration[0], Number(e.target.value)])}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Checkboxes */}
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={filters.isFree}
                                        onChange={(e) => handleFilterChange("isFree", e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Free courses only</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={filters.isFeatured}
                                        onChange={(e) => handleFilterChange("isFeatured", e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Featured courses only</span>
                                </label>
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
                            {refreshing && (
                                <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                            )}
                            {activeTab === "featured" ? featuredCourses.length : pagination.total} course{(activeTab === "featured" ? featuredCourses.length : pagination.total) !== 1 ? 's' : ''} found
                            {pagination.pages > 1 && activeTab === "all" && (
                                <span className="ml-2 text-sm text-gray-500">
                                    (Page {pagination.current} of {pagination.pages})
                                </span>
                            )}
                        </p>
                        {pagination.count > 0 && activeTab === "all" && (
                            <p className="text-sm text-gray-500">
                                Showing {courses.length} of {pagination.count} results
                            </p>
                        )}
                    </div>
                </div>

                {currentCourses.length === 0 ? (
                    <Card interactive={false}>
                        <EmptyState
                            icon={BookOpen}
                            iconColor="text-blue-600"
                            iconBgColor="bg-blue-100"
                            title="No Courses Found"
                            description="We couldn't find any courses matching your criteria. Try adjusting your search terms or filters."
                            actions={[
                                {
                                    type: "button",
                                    onClick: clearFilters,
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
                            {currentCourses.map((course) => (
                                <CourseCard
                                    key={course._id}
                                    course={course}
                                    viewMode={viewMode}
                                    renderStars={renderStars}
                                    getLevelColor={getLevelColor}
                                    getDifficultyStars={getDifficultyStars}
                                    formatPrice={formatPrice}
                                    formatDuration={formatDuration}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && activeTab === "all" && (
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

interface CourseCardProps {
    course: Course;
    viewMode: "grid" | "list";
    renderStars: (rating: number, courseId?: string) => React.ReactElement;
    getLevelColor: (level: Course['level']) => string;
    getDifficultyStars: (difficulty: number) => React.ReactElement[];
    formatPrice: (price: number, currency?: string) => string;
    formatDuration: (hours: number) => string;
}

const CourseCard = React.memo(function CourseCard({
    course,
    viewMode,
    renderStars,
    getLevelColor,
    getDifficultyStars,
    formatPrice,
    formatDuration
}: CourseCardProps) {
    const instructorName = course.instructor ? course.instructor.name : 'Unknown Instructor';
    const instructorRating = course.instructor?.rating || 0;
    const courseRating = course.rating?.average || 0;
    const reviewCount = course.rating?.count || 0;
    const basePrice = course.price || 0;

    return (
        <Link
            href={`/academy/courses/${course._id}`}
            className={`bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group ${viewMode === "list" ? "flex" : ""
                }`}
        >
            <div className={viewMode === "list" ? "flex-1 p-4" : "p-4"}>
                <div className={viewMode === "list" ? "flex gap-6" : ""}>
                    {/* Course Thumbnail */}
                    <div className={`${viewMode === "list" ? "w-48 h-32" : "w-full h-40"} bg-gray-200 rounded-lg mb-3 flex-shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
                        {course.thumbnail ? (
                            <Image
                                src={course.thumbnail}
                                alt={course.title}
                                width={viewMode === "list" ? 192 : 400}
                                height={viewMode === "list" ? 128 : 192}
                                className="w-full h-full object-cover rounded-lg"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <span className="text-sm">No Thumbnail</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Course Details */}
                    <div className={viewMode === "list" ? "flex-1" : ""}>
                        <div className="flex items-start justify-between mb-1">
                            <h3 className="text-base font-semibold text-gray-700 line-clamp-1 flex-1">
                                {course.title || 'Untitled Course'}
                            </h3>
                            <div className="text-right ml-3 flex-shrink-0">
                                <div className="text-xl font-bold text-blue-600">
                                    {basePrice === 0 ? 'Free' : formatPrice(basePrice, course.currency)}
                                </div>
                                {course.originalPrice && course.originalPrice > basePrice && (
                                    <div className="text-sm text-gray-500 line-through">
                                        {formatPrice(course.originalPrice, course.currency)}
                                    </div>
                                )}
                            </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {course.shortDescription || course.description || 'No description available'}
                        </p>

                        {/* Instructor Info */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                {course.instructor?.avatar ? (
                                    <Image
                                        src={course.instructor.avatar}
                                        alt={instructorName}
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-xs font-medium text-gray-600">
                                        {instructorName.charAt(0)}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">{instructorName}</p>
                                <div className="flex items-center gap-1">
                                    {renderStars(instructorRating, course._id)}
                                    <span className="text-xs text-gray-500">
                                        ({instructorRating.toFixed(1)})
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Course Meta */}
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(course.level)}`}>
                                        {course.level}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatDuration(course.duration)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Play className="w-3 h-3" />
                                    <span>{course.lessonsCount} lessons</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    <span>{course.studentsCount} students</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {renderStars(courseRating, course._id)}
                                <span>{courseRating.toFixed(1)} ({reviewCount})</span>
                            </div>
                        </div>

                        {/* Course Tags */}
                        {course.tags && course.tags.length > 0 && (
                            <div className="mb-2">
                                <div className="flex flex-wrap gap-1">
                                    {course.tags.slice(0, 3).map((tag, index) => (
                                        <span key={index} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                    {course.tags.length > 3 && (
                                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                            +{course.tags.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Course Badges */}
                        <div className="flex flex-wrap gap-1">
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                {course.category?.toLowerCase() || 'course'}
                            </span>
                            {course.isFeatured && (
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                    <Award className="w-3 h-3 inline mr-1" />
                                    Featured
                                </span>
                            )}
                            {course.isEnrolled && (
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                    <GraduationCap className="w-3 h-3 inline mr-1" />
                                    Enrolled
                                </span>
                            )}
                            {course.instructor?.verified && (
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                    Verified Instructor
                                </span>
                            )}
                        </div>

                        {/* Difficulty Rating */}
                        <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-gray-500">Difficulty:</span>
                            <div className="flex">
                                {getDifficultyStars(course.difficulty)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
});
