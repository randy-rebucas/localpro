"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { isAuthenticated } from "@/lib/client-api-utils";
import { apiRequest, API_ENDPOINTS } from "@/lib/api";
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

type Pagination = {
    current?: number;
    pages?: number;
    total?: number;
    limit?: number;
    count?: number;
};

type CoursesResponse = {
    success?: boolean;
    data?: Course[];
    courses?: Course[];
    pagination?: Pagination;
} | Course[];

type FeaturedResponse = {
    success?: boolean;
    data?: Course[];
    featured?: Course[];
} | Course[];

type CategoriesResponse = {
    success?: boolean;
    data?: Category[];
    categories?: Category[];
} | Category[];

// Course Thumbnail Interface
interface CourseThumbnail {
    url: string;
    publicId?: string;
    thumbnail?: string;
}

// Course Entity Interface (matching data-entities.md)
interface Course {
    _id?: string;
    id?: string;
    title: string;
    description: string;
    category: 'cleaning' | 'plumbing' | 'electrical' | 'moving' | 'business' | 'safety' | 'certification';
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    instructor: {
        _id?: string;
        id?: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        avatar?: string;
        bio?: string;
        rating?: number;
        reviewCount?: number;
        verified?: boolean;
    } | string; // Can be populated object or just ID
    partner?: {
        name?: string;
        logo?: string;
        website?: string;
    };
    duration: {
        hours: number;
        weeks?: number;
    } | number; // Support both new structure and legacy format
    pricing: {
        regularPrice: number;
        discountedPrice?: number;
        currency: string;
    } | {
        // Legacy format support
        price?: number;
        regularPrice?: number;
        originalPrice?: number;
        discountedPrice?: number;
        currency?: string;
    };
    curriculum?: Array<{
        module: string;
        lessons?: Array<{
            title?: string;
            description?: string;
            duration?: number;
            type?: 'video' | 'text' | 'quiz' | 'practical';
            content?: {
                url?: string;
                publicId?: string;
                type?: string;
            };
            isFree?: boolean;
        }>;
    }>;
    prerequisites?: string[];
    learningOutcomes?: string[];
    certification?: {
        isAvailable?: boolean;
        name?: string;
        issuer?: string;
        validity?: number;
        requirements?: string[];
    };
    enrollment?: {
        current?: number;
        maxCapacity?: number;
        isOpen?: boolean;
    };
    schedule?: {
        startDate?: string | Date;
        endDate?: string | Date;
        sessions?: Array<{
            date?: string | Date;
            startTime?: string;
            endTime?: string;
            type?: 'live' | 'recorded' | 'practical';
        }>;
    };
    rating?: {
        average: number;
        count: number;
    };
    isActive?: boolean;
    thumbnail?: CourseThumbnail | string; // Support both new structure and legacy string format
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
    
    // Legacy fields for backward compatibility
    shortDescription?: string;
    subcategory?: string;
    price?: number;
    originalPrice?: number;
    currency?: string;
    studentsCount?: number;
    lessonsCount?: number;
    isPublished?: boolean;
    isFeatured?: boolean;
    isEnrolled?: boolean;
    language?: string;
    lastUpdated?: string;
    difficulty?: number; // 1-5 scale
    whatYouWillLearn?: string[];
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
        { value: "advanced", label: "Advanced" },
        { value: "expert", label: "Expert" }
    ];
    
    // Course categories matching data entity specification
    const courseCategories = [
        { value: "", label: "All Categories" },
        { value: "cleaning", label: "Cleaning" },
        { value: "plumbing", label: "Plumbing" },
        { value: "electrical", label: "Electrical" },
        { value: "moving", label: "Moving" },
        { value: "business", label: "Business" },
        { value: "safety", label: "Safety" },
        { value: "certification", label: "Certification" }
    ];
    
    // Normalize course data from API response
    const normalizeCourse = useCallback((course: any): Course => {
        return {
            ...course,
            _id: course._id || course.id,
            id: course.id || course._id,
            // Handle pricing structure
            pricing: course.pricing || {
                regularPrice: course.price || course.pricing?.regularPrice || course.pricing?.price || 0,
                discountedPrice: course.originalPrice || course.pricing?.discountedPrice,
                currency: course.currency || course.pricing?.currency || 'USD'
            },
            // Handle duration structure
            duration: course.duration && typeof course.duration === 'object' 
                ? course.duration
                : {
                    hours: course.duration || 0,
                    weeks: course.durationWeeks
                },
            // Handle thumbnail structure
            thumbnail: course.thumbnail && typeof course.thumbnail === 'object'
                ? course.thumbnail
                : course.thumbnail
                    ? { url: course.thumbnail }
                    : undefined,
            // Handle instructor (can be populated object or just ID)
            instructor: typeof course.instructor === 'string'
                ? { id: course.instructor }
                : {
                    _id: course.instructor?._id || course.instructor?.id,
                    id: course.instructor?.id || course.instructor?._id,
                    name: course.instructor?.name,
                    firstName: course.instructor?.firstName,
                    lastName: course.instructor?.lastName,
                    avatar: course.instructor?.avatar,
                    bio: course.instructor?.bio,
                    rating: course.instructor?.rating,
                    reviewCount: course.instructor?.reviewCount,
                    verified: course.instructor?.verified
                },
            // Handle rating
            rating: course.rating || {
                average: course.averageRating || 0,
                count: course.ratingCount || course.reviewsCount || 0
            },
            // Set defaults
            isActive: course.isActive !== undefined ? course.isActive : course.isPublished !== undefined ? course.isPublished : true,
            enrollment: course.enrollment || {
                current: course.studentsCount || 0,
                maxCapacity: course.maxCapacity,
                isOpen: course.enrollmentOpen !== undefined ? course.enrollmentOpen : true
            },
            // Count lessons from curriculum if available
            lessonsCount: course.lessonsCount || (course.curriculum 
                ? course.curriculum.reduce((acc: number, module: any) => acc + (module.lessons?.length || 0), 0)
                : 0),
            studentsCount: course.studentsCount || course.enrollment?.current || 0
        };
    }, []);

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

            // Add sorting (matching API documentation)
            if (sortBy === "price_low") {
                queryParams.sortBy = "price";
                queryParams.sortOrder = "asc";
            } else if (sortBy === "price_high") {
                queryParams.sortBy = "price";
                queryParams.sortOrder = "desc";
            } else if (sortBy === "rating") {
                queryParams.sortBy = "rating";
                queryParams.sortOrder = "desc";
            } else if (sortBy === "students") {
                queryParams.sortBy = "enrollment.current";
                queryParams.sortOrder = "desc";
            } else if (sortBy === "duration") {
                queryParams.sortBy = "duration.hours";
                queryParams.sortOrder = "asc";
            } else if (sortBy === "newest") {
                queryParams.sortBy = "createdAt";
                queryParams.sortOrder = "desc";
            } else if (sortBy === "oldest") {
                queryParams.sortBy = "createdAt";
                queryParams.sortOrder = "asc";
            } else {
                queryParams.sort = sortBy;
            }

            console.log("Fetching courses with params:", queryParams);

            const data = await apiRequest<CoursesResponse>(`${API_ENDPOINTS.academyCourses}?${new URLSearchParams(queryParams).toString()}`);
            console.log("Courses data:", data);

            // Handle different response formats according to API documentation
            if (data && typeof data === 'object' && !Array.isArray(data)) {
                if ('success' in data && data.success && 'data' in data && data.data) {
                    // Standard API response format - normalize courses
                    if ('pagination' in data && data.pagination) {
                        setPagination({
                            current: data.pagination.current || 1,
                            pages: data.pagination.pages || 1,
                            total: data.pagination.total || 0,
                            limit: data.pagination.limit || 12,
                            count: data.pagination.count || 0
                        });
                    }
                    const normalizedCourses = (data.data || []).map((course: any) => normalizeCourse(course));
                    setCourses(normalizedCourses);
                } else if (Array.isArray(data)) {
                    // Direct array response
                    const normalizedCourses = data.map((course: any) => normalizeCourse(course));
                    setCourses(normalizedCourses);
                    setPagination({
                        current: 1,
                        pages: 1,
                        total: normalizedCourses.length,
                        limit: 12,
                        count: normalizedCourses.length
                    });
                } else if ('courses' in data && Array.isArray(data.courses)) {
                    // Alternative response format
                    const normalizedCourses = data.courses.map((course: any) => normalizeCourse(course));
                    setCourses(normalizedCourses);
                    if ('pagination' in data && data.pagination) {
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
                            total: normalizedCourses.length,
                            limit: 12,
                            count: normalizedCourses.length
                        });
                    }
                } else {
                    setCourses([]);
                }
            } else if (Array.isArray(data)) {
                // Direct array response
                const normalizedCourses = data.map((course: any) => normalizeCourse(course));
                setCourses(normalizedCourses);
                setPagination({
                    current: 1,
                    pages: 1,
                    total: normalizedCourses.length,
                    limit: 12,
                    count: normalizedCourses.length
                });
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
    }, [searchQuery, filters, sortBy, pagination.current, pagination.limit, normalizeCourse]);

    const fetchFeaturedCourses = useCallback(async () => {
        try {
            if (!isAuthenticated()) {
                return;
            }

            const data = await apiRequest<FeaturedResponse>(API_ENDPOINTS.academyFeatured);
            // Handle different response formats for featured courses
            if (data && typeof data === 'object' && !Array.isArray(data)) {
                if ('success' in data && data.success && 'data' in data && data.data) {
                    const normalizedCourses = data.data.map((course: any) => normalizeCourse(course));
                    setFeaturedCourses(normalizedCourses);
                } else if ('featured' in data && Array.isArray(data.featured)) {
                    const normalizedCourses = data.featured.map((course: any) => normalizeCourse(course));
                    setFeaturedCourses(normalizedCourses);
                } else {
                    setFeaturedCourses([]);
                }
            } else if (Array.isArray(data)) {
                const normalizedCourses = data.map((course: any) => normalizeCourse(course));
                setFeaturedCourses(normalizedCourses);
            } else {
                setFeaturedCourses([]);
            }
        } catch (error) {
            console.warn("Error fetching featured courses, using empty array:", error);
            setFeaturedCourses([]);
        }
    }, [normalizeCourse]);

    const fetchCategories = useCallback(async () => {
        try {
            if (!isAuthenticated()) {
                return;
            }

            const data = await apiRequest<CategoriesResponse>(API_ENDPOINTS.academyCategories);
            // Handle different response formats for categories
            if (data && typeof data === 'object' && !Array.isArray(data)) {
                if ('success' in data && data.success && 'data' in data && data.data) {
                    setCategories(data.data);
                } else if ('categories' in data && Array.isArray(data.categories)) {
                    setCategories(data.categories);
                } else {
                    setCategories(fallbackCategories);
                }
            } else if (Array.isArray(data)) {
                setCategories(data);
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
            case 'advanced': return 'bg-orange-100 text-orange-800';
            case 'expert': return 'bg-red-100 text-red-800';
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


    const formatDuration = (duration: Course['duration']) => {
        const hours = typeof duration === 'object' ? duration.hours : duration;
        const weeks = typeof duration === 'object' ? duration.weeks : undefined;
        
        if (weeks && weeks > 0) {
            return `${weeks} week${weeks !== 1 ? 's' : ''} (${hours}h)`;
        }
        
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
    
    const formatPrice = (pricing: Course['pricing'], showCurrency: boolean = true) => {
        let regularPrice: number;
        if ('regularPrice' in pricing) {
            regularPrice = pricing.regularPrice || 0;
        } else if ('price' in pricing) {
            regularPrice = pricing.price || 0;
        } else if ('regularPrice' in pricing && pricing.regularPrice !== undefined) {
            regularPrice = pricing.regularPrice;
        } else {
            regularPrice = 0;
        }
        
        const discountedPrice = 'discountedPrice' in pricing 
            ? pricing.discountedPrice 
            : ('originalPrice' in pricing ? pricing.originalPrice : ('discountedPrice' in pricing ? pricing.discountedPrice : undefined));
        const currency = ('currency' in pricing ? pricing.currency : 'USD') || 'USD';
        
        if (regularPrice === 0) {
            return 'Free';
        }
        
        const formatted = new Intl.NumberFormat('en-US', {
            style: showCurrency ? 'currency' : 'decimal',
            currency: currency
        }).format(regularPrice);
        
        return formatted;
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {courseCategories.map(category => (
                                        <option key={category.value} value={category.value}>
                                            {category.label}
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

                            {/* Refresh Control */}
                            <div className="flex gap-2">
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
                            <button
                                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
                            >
                                {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                            </button>
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
                                            key={course._id || course.id}
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
    formatPrice: (pricing: Course['pricing'], showCurrency?: boolean) => string;
    formatDuration: (duration: Course['duration']) => string;
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
    const courseId = course._id || course.id || '';
    
    // Normalize instructor data
    const instructor = typeof course.instructor === 'string' 
        ? { id: course.instructor, name: 'Unknown Instructor' }
        : course.instructor || {};
    const instructorName = instructor.name || 
        (instructor.firstName && instructor.lastName 
            ? `${instructor.firstName} ${instructor.lastName}` 
            : instructor.firstName || instructor.lastName || 'Unknown Instructor');
    const instructorRating = instructor.rating || 0;
    
    const courseRating = course.rating?.average || 0;
    const reviewCount = course.rating?.count || 0;
    
    // Get pricing values
    const pricing = course.pricing;
    let regularPrice: number;
    if ('regularPrice' in pricing) {
        regularPrice = pricing.regularPrice || 0;
    } else if ('price' in pricing) {
        regularPrice = pricing.price || 0;
    } else if ('regularPrice' in pricing && pricing.regularPrice !== undefined) {
        regularPrice = pricing.regularPrice;
    } else {
        regularPrice = 0;
    }
    const discountedPrice = 'discountedPrice' in pricing 
        ? pricing.discountedPrice 
        : ('originalPrice' in pricing ? pricing.originalPrice : ('discountedPrice' in pricing ? pricing.discountedPrice : undefined));
    
    // Get thumbnail URL
    const getThumbnailUrl = () => {
        if (!course.thumbnail) return null;
        return typeof course.thumbnail === 'string' 
            ? course.thumbnail 
            : (course.thumbnail.url || course.thumbnail.thumbnail || null);
    };
    const thumbnailUrl = getThumbnailUrl();
    
    // Get enrollment info
    const enrollmentCount = course.enrollment?.current || course.studentsCount || 0;
    const maxCapacity = course.enrollment?.maxCapacity;
    const isEnrollmentOpen = course.enrollment?.isOpen !== false;
    
    // Get lessons count
    const lessonsCount = course.lessonsCount || (course.curriculum 
        ? course.curriculum.reduce((acc, module) => acc + (module.lessons?.length || 0), 0)
        : 0);

    return (
        <Link
            href={`/academy/courses/${courseId}`}
            className={`bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group overflow-hidden ${viewMode === "list" ? "flex" : ""
                }`}
        >
            <div className={viewMode === "list" ? "flex-1 p-4" : "p-4 w-full"}>
                <div className={viewMode === "list" ? "flex gap-6" : ""}>
                    {/* Course Thumbnail */}
                    <div className={`${viewMode === "list" ? "w-48 h-32" : "w-full h-40"} bg-gray-200 rounded-lg mb-3 flex-shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
                        {thumbnailUrl ? (
                            <Image
                                src={thumbnailUrl}
                                alt={
                                    course.thumbnail && 
                                    typeof course.thumbnail === 'object' && 
                                    course.thumbnail.url 
                                        ? course.title 
                                        : course.title
                                }
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
                                    {formatPrice(pricing)}
                                </div>
                                {discountedPrice && discountedPrice < regularPrice && (
                                    <div className="text-sm text-gray-500 line-through">
                                        {formatPrice(
                                            'regularPrice' in pricing
                                                ? { ...pricing, regularPrice: discountedPrice, discountedPrice: undefined }
                                                : { ...pricing, regularPrice: discountedPrice, discountedPrice: undefined }
                                        )}
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
                                {typeof course.instructor === 'object' && course.instructor?.avatar ? (
                                    <Image
                                        src={course.instructor.avatar}
                                        alt={instructorName}
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-xs font-medium text-gray-600">
                                        {instructorName.charAt(0).toUpperCase()}
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
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-2 gap-2 overflow-hidden">
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1 pr-2">
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(course.level)}`}>
                                        {course.level}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Clock className="w-3 h-3 flex-shrink-0" />
                                    <span className="whitespace-nowrap text-xs">{formatDuration(course.duration)}</span>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Play className="w-3 h-3 flex-shrink-0" />
                                    <span className="whitespace-nowrap text-xs">{lessonsCount} lessons</span>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Users className="w-3 h-3 flex-shrink-0" />
                                    <span className="whitespace-nowrap text-xs">{enrollmentCount} student{enrollmentCount !== 1 ? 's' : ''}</span>
                                    {maxCapacity && (
                                        <span className="text-xs text-gray-400 whitespace-nowrap">/ {maxCapacity}</span>
                                    )}
                                </div>
                                {!isEnrollmentOpen && (
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded whitespace-nowrap">
                                            Enrollment Closed
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                                {renderStars(courseRating, course._id)}
                                <span className="whitespace-nowrap text-xs">{courseRating.toFixed(1)} ({reviewCount})</span>
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
                                {course.category?.charAt(0).toUpperCase() + course.category?.slice(1) || 'Course'}
                            </span>
                            {course.partner && (
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                                    {course.partner.name || 'Partner Course'}
                                </span>
                            )}
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
                            {course.certification?.isAvailable && (
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                    <Award className="w-3 h-3 inline mr-1" />
                                    Certificate Available
                                </span>
                            )}
                            {instructor.verified && (
                                <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                    Verified Instructor
                                </span>
                            )}
                        </div>

                        {/* Difficulty Rating */}
                        {course.difficulty && (
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs text-gray-500">Difficulty:</span>
                                <div className="flex">
                                    {getDifficultyStars(course.difficulty)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
});
