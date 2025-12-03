"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GridSkeleton } from "@/components/ui/loading";
import { useRoleAccess } from "@/components/role-guard";
import { useSession } from "@/hooks/useAuth";
import {
    Search,
    Star,
    Clock,
    Plus,
    Users,
    Play,
    Award,
    RefreshCw,
    GraduationCap,
    ArrowRight,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    X,
    CheckCircle2,
    Zap,
    Headphones,
    HelpCircle,
    BookOpen,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { apiRequest, API_ENDPOINTS } from "@/lib/api";
import { logger } from "@/lib/logger";

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

// Course Thumbnail Interface
interface CourseThumbnail {
    url: string;
    publicId?: string;
    thumbnail?: string;
}

// Course Entity Interface (matching data-entities.md)
export interface Course {
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
    difficulty?: number;
    whatYouWillLearn?: string[];
}

interface FilterOptions {
    category: string;
    level: string;
    priceRange: [number, number];
    rating: number;
    certification: boolean;
    enrollment: boolean;
}

const categories = [
    { value: "", label: "All Categories" },
    { value: "cleaning", label: "Cleaning" },
    { value: "plumbing", label: "Plumbing" },
    { value: "electrical", label: "Electrical" },
    { value: "moving", label: "Moving" },
    { value: "business", label: "Business" },
    { value: "safety", label: "Safety" },
    { value: "certification", label: "Certification" }
];

const levels = [
    { value: "", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "expert", label: "Expert" }
];

const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "rating", label: "Highest Rated" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "popular", label: "Most Popular" },
    { value: "duration", label: "Duration" }
];

const learningTips = [
    "Set a consistent study schedule",
    "Take notes and practice regularly",
    "Complete all quizzes for certification"
];

interface Enrollment {
    _id?: string;
    id?: string;
    course?: Course;
    progress?: number;
    status?: string;
    enrolledAt?: string;
    completedAt?: string;
}

type FeaturedResponse = {
    success?: boolean;
    data?: Course[];
    featured?: Course[];
    count?: number;
} | Course[];

export default function AcademyPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
    const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [, setLoadingFeatured] = useState(false);
    const [, setLoadingEnrollments] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("relevance");
    const [pagination, setPagination] = useState({
        current: 1,
        pages: 1,
        total: 0,
        limit: 12,
        count: 0
    });
    const [filters, setFilters] = useState<FilterOptions>({
        category: "",
        level: "",
        priceRange: [0, 1000],
        rating: 0,
        certification: false,
        enrollment: true
    });
    const router = useRouter();
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const paginationRef = useRef(pagination);
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const { isInstructor, isAdmin, isClient } = useRoleAccess();
    const { data: session } = useSession();

    // Normalize course data from API response
    const normalizeCourse = useCallback((course: Partial<Course> & Record<string, unknown>): Course => {
        return {
            ...course,
            _id: course._id || course.id,
            id: course.id || course._id,
            // Ensure required fields have defaults
            title: course.title || 'Untitled Course',
            description: course.description || '',
            category: course.category || 'business',
            level: course.level || 'beginner',
            // Handle duration
            duration: (() => {
                if (course.duration && typeof course.duration === 'object' && 'hours' in course.duration) {
                    return course.duration as Course['duration'];
                }
                return {
                    hours: typeof course.duration === 'number' ? course.duration : course.lessonsCount || 0,
                    weeks: undefined
                };
            })(),
            // Handle pricing - Always normalize to PHP
            pricing: (() => {
                if (course.pricing && typeof course.pricing === 'object' && 'regularPrice' in course.pricing) {
                    return { ...course.pricing as Course['pricing'], currency: 'PHP' };
                }
                const priceValue = typeof course.price === 'number' ? course.price : course.originalPrice || 0;
                return {
                    regularPrice: priceValue,
                    discountedPrice: (course.pricing as Course['pricing'])?.discountedPrice || course.price || undefined,
                    currency: 'PHP'
                };
            })(),
            // Handle instructor
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
            rating: (() => {
                if (course.rating && typeof course.rating === 'object' && 'average' in course.rating) {
                    return course.rating as Course['rating'];
                }
                return {
                    average: 0,
                    count: 0
                };
            })(),
            // Set defaults
            isActive: course.isActive !== undefined ? course.isActive : true
        };
    }, []);

    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const params = new URLSearchParams();
            params.append('page', paginationRef.current.current.toString());
            params.append('limit', paginationRef.current.limit.toString());
            
            // Always request only active courses
            params.append('isActive', 'true');
            
            if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
            if (filters.category) params.append('category', filters.category);
            if (filters.level) params.append('level', filters.level);
            if (filters.rating > 0) params.append('minRating', filters.rating.toString());
            if (filters.certification) params.append('hasCertification', 'true');
            if (filters.enrollment) params.append('enrollmentOpen', 'true');
            if (filters.priceRange[0] > 0) params.append('minPrice', filters.priceRange[0].toString());
            if (filters.priceRange[1] < 1000) params.append('maxPrice', filters.priceRange[1].toString());
            if (sortBy) params.append('sortBy', sortBy);

            const data = await apiRequest<CoursesResponse>(`${API_ENDPOINTS.academyCourses}?${params.toString()}`);
            
            // Handle different response formats
            let coursesData: Course[] = [];
            let paginationData: Pagination | undefined;
            
            if (Array.isArray(data)) {
                coursesData = (data as Array<Partial<Course> & Record<string, unknown>>).map((course) => normalizeCourse(course));
            } else if (data && typeof data === 'object') {
                const dataObj = data as Record<string, unknown>;
                if ('success' in dataObj && dataObj.success) {
                    const coursesArray = (dataObj.data || dataObj.courses || []) as Array<Partial<Course> & Record<string, unknown>>;
                    coursesData = coursesArray.map((course) => normalizeCourse(course));
                    paginationData = dataObj.pagination as Pagination | undefined;
                } else if ('data' in dataObj && Array.isArray(dataObj.data)) {
                    coursesData = (dataObj.data as Array<Partial<Course> & Record<string, unknown>>).map((course) => normalizeCourse(course));
                    paginationData = dataObj.pagination as Pagination | undefined;
                }
            }
            
            setCourses(coursesData);
            if (paginationData) {
                const newPagination = {
                    ...paginationRef.current,
                    ...paginationData
                };
                paginationRef.current = newPagination;
                setPagination(newPagination);
            } else {
                const newPagination = {
                    ...paginationRef.current,
                    total: coursesData.length,
                    count: coursesData.length,
                    pages: 1
                };
                paginationRef.current = newPagination;
                setPagination(newPagination);
            }
        } catch (error) {
            logger.error('Error fetching courses', error instanceof Error ? error : new Error(String(error)));
            setError(error instanceof Error ? error.message : 'Failed to fetch courses');
            setCourses([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchQuery, filters, sortBy, normalizeCourse]);

    // Debounce search query
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500);
        
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

    // Update pagination ref when pagination state changes
    useEffect(() => {
        paginationRef.current = pagination;
    }, [pagination]);

    // Fetch featured courses
    const fetchFeaturedCourses = useCallback(async () => {
        try {
            setLoadingFeatured(true);
            const data = await apiRequest<FeaturedResponse>(API_ENDPOINTS.academyFeatured);
            
            let featuredData: Course[] = [];
            if (Array.isArray(data)) {
                featuredData = (data as Array<Partial<Course> & Record<string, unknown>>).map((course) => normalizeCourse(course));
            } else if (data && typeof data === 'object') {
                const dataObj = data as Record<string, unknown>;
                if ('success' in dataObj && dataObj.success && 'data' in dataObj && dataObj.data) {
                    featuredData = (dataObj.data as Array<Partial<Course> & Record<string, unknown>>).map((course) => normalizeCourse(course));
                } else if ('featured' in dataObj && Array.isArray(dataObj.featured)) {
                    featuredData = (dataObj.featured as Array<Partial<Course> & Record<string, unknown>>).map((course) => normalizeCourse(course));
                }
            }
            setFeaturedCourses(featuredData.slice(0, 6)); // Limit to 6 featured courses
        } catch (error) {
            logger.warn('Error fetching featured courses', { error: error instanceof Error ? error.message : String(error) });
            setFeaturedCourses([]);
        } finally {
            setLoadingFeatured(false);
        }
    }, [normalizeCourse]);

    // Fetch my enrolled courses
    const fetchMyEnrollments = useCallback(async () => {
        if (!session) return;
        
        try {
            setLoadingEnrollments(true);
            const data = await apiRequest<{ success?: boolean; data?: Enrollment[]; enrollments?: Enrollment[] }>(API_ENDPOINTS.academyMyCourses);
            
            let enrollmentsData: Enrollment[] = [];
            if (data && typeof data === 'object') {
                const dataObj = data as Record<string, unknown>;
                if ('success' in dataObj && dataObj.success && 'data' in dataObj && dataObj.data) {
                    enrollmentsData = (dataObj.data as Enrollment[]);
                } else if ('enrollments' in dataObj && Array.isArray(dataObj.enrollments)) {
                    enrollmentsData = (dataObj.enrollments as Enrollment[]);
                }
            } else if (Array.isArray(data)) {
                enrollmentsData = data as Enrollment[];
            }
            setMyEnrollments(enrollmentsData.slice(0, 6)); // Limit to 6 enrollments
        } catch (error) {
            logger.warn('Error fetching my enrollments', { error: error instanceof Error ? error.message : String(error) });
            setMyEnrollments([]);
        } finally {
            setLoadingEnrollments(false);
        }
    }, [session]);

    // Reset to page 1 when filters or search change
    useEffect(() => {
        if (paginationRef.current.current !== 1) {
            paginationRef.current = { ...paginationRef.current, current: 1 };
            setPagination(prev => ({ ...prev, current: 1 }));
        }
    }, [debouncedSearchQuery, filters, sortBy]);

    // Fetch courses when filters or search change
    useEffect(() => {
        fetchCourses();
    }, [debouncedSearchQuery, filters, sortBy, fetchCourses]);

    // Fetch featured courses and enrollments on mount
    useEffect(() => {
        fetchFeaturedCourses();
        if (session) {
            fetchMyEnrollments();
        }
    }, [fetchFeaturedCourses, fetchMyEnrollments, session]);

    // Filter courses client-side for additional filtering
    const filteredCourses = useMemo(() => {
        return courses.filter(course => {
            // Only show active courses
            if (course.isActive !== true) {
                return false;
            }
            
            // Enrollment filter
            if (filters.enrollment && course.enrollment?.isOpen === false) {
                return false;
            }
            
            return true;
        });
    }, [courses, filters.enrollment]);

    const handleViewCourse = (courseId: string) => {
        router.push(`/academy/courses/${courseId}`);
    };

    const handleCreateCourse = () => {
        router.push('/academy/create-course');
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= pagination.pages) {
            paginationRef.current = { ...paginationRef.current, current: page };
            setPagination(prev => ({ ...prev, current: page }));
        }
    };

    const clearFilters = () => {
        setFilters({
            category: "",
            level: "",
            priceRange: [0, 1000],
            rating: 0,
            certification: false,
            enrollment: true
        });
        setSearchQuery("");
    };

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.category) count++;
        if (filters.level) count++;
        if (filters.rating > 0) count++;
        if (filters.certification) count++;
        if (!filters.enrollment) count++;
        if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) count++;
        return count;
    }, [filters]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 relative overflow-hidden">
                {/* Animated Background Blobs */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/20 rounded-full blur-3xl animate-float"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-green-100/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                    {/* Header Skeleton */}
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                        <div className="h-12 bg-gray-200 rounded-lg w-full mb-4"></div>
                        <div className="flex gap-3">
                            <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
                            <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
                            <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
                        </div>
                    </div>

                    {/* Content Skeleton */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="lg:w-64 flex-shrink-0">
                            <div className="bg-white rounded-xl border-2 border-gray-200 p-6 animate-pulse">
                                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                                <div className="space-y-4">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="h-10 bg-gray-200 rounded"></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <GridSkeleton count={6} columns={3} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 relative overflow-hidden">
                <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/20 rounded-full blur-3xl animate-float"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <Card interactive={false}>
                        <EmptyState
                            icon={GraduationCap}
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
                                }
                            ]}
                        />
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-green-100/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
            </div>

            <div className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Academy — Learn skills that grow your career
                            </h1>
                            <p className="text-gray-600">
                                Expert-led courses, certifications, and hands-on training for service professionals.
                            </p>
                        </div>
                        {(isInstructor || isAdmin) && (
                            <button
                                onClick={handleCreateCourse}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 flex-shrink-0"
                            >
                                <Plus className="w-4 h-4" />
                                Create Course
                            </button>
                        )}
                    </div>
                </div>

                {/* Subheader - Feature Links */}
                <div className="mb-6 flex items-center gap-6 border-b border-gray-200 pb-4">
                    <Link 
                        href="/academy/instructors" 
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors group"
                    >
                        <CheckCircle2 className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Verified Instructors</span>
                    </Link>
                    <Link 
                        href="/academy/certifications" 
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors group"
                    >
                        <Award className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Certificates</span>
                    </Link>
                    <Link 
                        href="/support" 
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors group"
                    >
                        <Headphones className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Support</span>
                    </Link>
                    <Link 
                        href="/academy/my-courses" 
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors group"
                    >
                        <BookOpen className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">My Courses</span>
                    </Link>
                </div>
                    
                {/* Search Bar */}
                <div className="relative mb-6">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                        <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search courses, skills, or instructors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md bg-white"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Main Content Layout */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Sidebar - Filters */}
                    <aside className="lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6 space-y-6 sticky top-24">
                            {/* Filters Section */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                                    {activeFiltersCount > 0 && (
                                        <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full">
                                            {activeFiltersCount}
                                        </span>
                                    )}
                                </div>
                                
                                {/* Category Filter */}
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                    <select
                                        value={filters.category}
                                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md bg-white font-medium"
                                    >
                                        {categories.map(category => (
                                            <option key={category.value} value={category.value}>
                                                {category.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Level Filter */}
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Level</label>
                                    <select
                                        value={filters.level}
                                        onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md bg-white font-medium"
                                    >
                                        {levels.map(level => (
                                            <option key={level.value} value={level.value}>
                                                {level.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Price Range */}
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price Range</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={filters.priceRange[0] || ""}
                                            onChange={(e) => setFilters(prev => ({ ...prev, priceRange: [parseInt(e.target.value) || 0, prev.priceRange[1]] }))}
                                            placeholder="Min"
                                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md bg-white"
                                        />
                                        <span className="self-center text-gray-500">-</span>
                                        <input
                                            type="number"
                                            value={filters.priceRange[1] || ""}
                                            onChange={(e) => setFilters(prev => ({ ...prev, priceRange: [prev.priceRange[0], parseInt(e.target.value) || 1000] }))}
                                            placeholder="Max"
                                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md bg-white"
                                        />
                                    </div>
                                </div>

                                {/* Rating Filter */}
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Rating</label>
                                    <select
                                        value={filters.rating}
                                        onChange={(e) => setFilters(prev => ({ ...prev, rating: Number(e.target.value) }))}
                                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm hover:shadow-md bg-white font-medium"
                                    >
                                        <option value={0}>Any Rating</option>
                                        <option value={4}>4+ Stars</option>
                                        <option value={3}>3+ Stars</option>
                                        <option value={2}>2+ Stars</option>
                                    </select>
                                </div>

                                {/* Certification Filter */}
                                <div className="mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.certification}
                                            onChange={(e) => setFilters(prev => ({ ...prev, certification: e.target.checked }))}
                                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">With Certification</span>
                                    </label>
                                </div>

                                {/* Enrollment Filter */}
                                <div className="mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.enrollment}
                                            onChange={(e) => setFilters(prev => ({ ...prev, enrollment: e.target.checked }))}
                                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Open Enrollment</span>
                                    </label>
                                </div>

                                {/* Clear Filters */}
                                {activeFiltersCount > 0 && (
                                    <button
                                        onClick={clearFilters}
                                        className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>

                            {/* Become an Instructor Section */}
                            {isClient && !isInstructor && !isAdmin && (
                                <div className="pt-6 border-t-2 border-gray-200">
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                                        <div className="flex items-start gap-3 mb-3">
                                            <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h3 className="font-semibold text-gray-900 text-sm">Become an Instructor</h3>
                                                <p className="text-xs text-gray-600 mt-1">Share your expertise and earn by creating courses.</p>
                                            </div>
                                        </div>
                                        <Link
                                            href="/plus?upgrade=instructor"
                                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm hover:shadow-md font-medium text-sm"
                                        >
                                            Upgrade Now
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {/* Popular Categories */}
                            <div className="pt-6 border-t-2 border-gray-200">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Popular Categories</h2>
                                <div className="flex flex-wrap gap-2">
                                    {categories.filter(c => c.value).slice(0, 5).map((category) => (
                                        <button
                                            key={category.value}
                                            onClick={() => setFilters(prev => ({ ...prev, category: prev.category === category.value ? "" : category.value }))}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                                                filters.category === category.value
                                                    ? "bg-green-600 text-white border-green-600"
                                                    : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                                            }`}
                                        >
                                            {category.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Learning Tips */}
                            <div className="pt-6 border-t-2 border-gray-200">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Learning tips</h2>
                                <ul className="space-y-3">
                                    {learningTips.map((tip, index) => (
                                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                            <span className="text-green-600 mt-1">•</span>
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Need Help Section */}
                            <div className="pt-6 border-t-2 border-gray-200">
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                                    <div className="flex items-start gap-3 mb-3">
                                        <HelpCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-sm">Need Help?</h3>
                                            <p className="text-xs text-gray-600 mt-1">Our team is here to help you find the right course.</p>
                                        </div>
                                    </div>
                                    <Link
                                        href="/support"
                                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 transition-all border border-green-200 font-medium text-sm"
                                    >
                                        <Zap className="w-4 h-4" />
                                        Contact Support
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0 space-y-6">
                        {/* My Enrolled Courses Section */}
                        {session && myEnrollments.length > 0 && (
                            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-gray-900">Continue Learning</h2>
                                    <Link 
                                        href="/academy/my-courses" 
                                        className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                                    >
                                        View All
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {myEnrollments.slice(0, 3).map((enrollment) => {
                                        const course = enrollment.course;
                                        if (!course) return null;
                                        const courseId = course.id || course._id || '';
                                        return (
                                            <div key={enrollment._id || enrollment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-green-300 hover:shadow-md transition-all">
                                                <div className="space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">{course.title}</h3>
                                                        {enrollment.status === 'completed' && (
                                                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                                                        )}
                                                    </div>
                                                    {enrollment.progress !== undefined && (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-gray-600">Progress</span>
                                                                <span className="font-medium text-gray-900">{enrollment.progress}%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div 
                                                                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                                                                    style={{ width: `${enrollment.progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => handleViewCourse(courseId)}
                                                        className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium text-sm flex items-center justify-center gap-2"
                                                    >
                                                        <Play className="w-4 h-4" />
                                                        {enrollment.status === 'completed' ? 'Review' : 'Continue'}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Featured Courses Section */}
                        {featuredCourses.length > 0 && (
                            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="w-5 h-5 text-yellow-500" />
                                    <h2 className="text-lg font-bold text-gray-900">Featured Courses</h2>
                                </div>
                                <div className="space-y-4">
                                    {featuredCourses.slice(0, 3).map((course, index) => (
                                        <CourseCard
                                            key={course.id || course._id || `featured-${index}`}
                                            course={course}
                                            onView={handleViewCourse}
                                            featured={true}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sort and Results Count */}
                        <div className="flex items-center justify-between">
                            <p className="text-gray-600 text-sm">
                                {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
                            </p>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white font-medium"
                            >
                                {sortOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Course Grid */}
                        {filteredCourses.length === 0 ? (
                            <Card interactive={false}>
                                <EmptyState
                                    icon={GraduationCap}
                                    iconColor="text-green-600"
                                    iconBgColor="bg-green-100"
                                    title="No Courses Found"
                                    description="We couldn't find any courses matching your criteria. Try adjusting your search terms or filters."
                                    actions={[
                                        {
                                            type: "button",
                                            onClick: clearFilters,
                                            label: "Clear All Filters",
                                            variant: "primary"
                                        },
                                    ]}
                                />
                            </Card>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {filteredCourses.map((course, index) => (
                                        <CourseCard
                                            key={course.id || course._id || `course-${index}`}
                                            course={course}
                                            onView={handleViewCourse}
                                        />
                                    ))}
                                </div>
                                
                                {/* Pagination */}
                                {pagination.pages > 1 && (
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                                        <div className="text-sm text-gray-600">
                                            Showing {((pagination.current - 1) * pagination.limit) + 1} to {Math.min(pagination.current * pagination.limit, pagination.total)} of {pagination.total} courses
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handlePageChange(pagination.current - 1)}
                                                disabled={pagination.current === 1}
                                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                aria-label="Previous page"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                                    let pageNum: number;
                                                    if (pagination.pages <= 5) {
                                                        pageNum = i + 1;
                                                    } else if (pagination.current <= 3) {
                                                        pageNum = i + 1;
                                                    } else if (pagination.current >= pagination.pages - 2) {
                                                        pageNum = pagination.pages - 4 + i;
                                                    } else {
                                                        pageNum = pagination.current - 2 + i;
                                                    }
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => handlePageChange(pageNum)}
                                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                                                pagination.current === pageNum
                                                                    ? "bg-green-600 text-white"
                                                                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <button
                                                onClick={() => handlePageChange(pagination.current + 1)}
                                                disabled={pagination.current === pagination.pages}
                                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                aria-label="Next page"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
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
    onView: (courseId: string) => void;
    featured?: boolean;
}

const CourseCard = React.memo(function CourseCard({ course, onView, featured = false }: CourseCardProps) {
    const courseId = course.id || course._id || '';
    
    // Get image URL
    const getImageUrl = () => {
        if (!course.thumbnail) return null;
        if (typeof course.thumbnail === 'string') return course.thumbnail;
        return course.thumbnail.url || course.thumbnail.thumbnail || null;
    };
    const imageUrl = getImageUrl();
    
    // Get instructor name
    const instructor = typeof course.instructor === 'string' 
        ? { name: 'Unknown Instructor', verified: false }
        : course.instructor || {};
    const instructorName = instructor.name || 
        (instructor.firstName && instructor.lastName 
            ? `${instructor.firstName} ${instructor.lastName}` 
            : instructor.firstName || instructor.lastName || 'Unknown Instructor');
    
    // Get pricing display - Always use PHP
    const getPriceDisplay = () => {
        const pricing = course.pricing;
        if ('regularPrice' in pricing) {
            return {
                regular: pricing.regularPrice,
                discounted: pricing.discountedPrice
            };
        }
        return {
            regular: pricing.price || pricing.regularPrice || 0,
            discounted: pricing.discountedPrice || pricing.originalPrice
        };
    };
    const priceDisplay = getPriceDisplay();
    
    // Get duration display
    const getDurationDisplay = () => {
        if (typeof course.duration === 'number') {
            return `${course.duration}h`;
        }
        return `${course.duration.hours}h`;
    };
    const durationDisplay = getDurationDisplay();
    
    // Get rating
    const courseRating = course.rating?.average || 0;
    const reviewCount = course.rating?.count || 0;
    
    // Format price - Always use PHP
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(price);
    };
    
    // Get enrollment count
    const enrollmentCount = course.enrollment?.current || course.studentsCount || 0;
    
    // Get level badge color
    const getLevelColor = (level: Course['level']) => {
        switch (level) {
            case 'beginner': return 'bg-green-100 text-green-800';
            case 'intermediate': return 'bg-blue-100 text-blue-800';
            case 'advanced': return 'bg-purple-100 text-purple-800';
            case 'expert': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    // Get category label
    const getCategoryLabel = (category: Course['category']) => {
        const labels: Record<string, string> = {
            cleaning: 'Cleaning',
            plumbing: 'Plumbing',
            electrical: 'Electrical',
            moving: 'Moving',
            business: 'Business',
            safety: 'Safety',
            certification: 'Certification'
        };
        return labels[category] || category;
    };
    
    const renderStars = (rating: number) => {
        return (
            <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                    <Star
                        key={`star-${i}`}
                        className={`w-3.5 h-3.5 ${i < Math.floor(rating)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div
            className={`bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-lg hover:border-green-300 transition-all duration-300 overflow-hidden group flex flex-row items-stretch ${
                featured ? "ring-2 ring-yellow-400" : ""
            }`}
        >
            {/* Course Image - Left Side */}
            <div className="relative w-48 md:w-56 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={course.title || 'Course image'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 min-h-[10rem]">
                        <div className="text-center">
                            <BookOpen className="w-10 h-10 mx-auto mb-2" />
                            <span className="text-xs">No Image</span>
                        </div>
                    </div>
                )}
                {featured && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Featured
                    </div>
                )}
            </div>

            {/* Course Details - Right Side */}
            <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                <div>
                    {/* Title and Instructor */}
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0 pr-4">
                            <h3 className="font-semibold text-gray-900 text-base group-hover:text-green-600 transition-colors line-clamp-1">
                                {course.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">by {instructorName}</p>
                        </div>
                        {/* Price - Top Right */}
                        <div className="text-right flex-shrink-0">
                            {priceDisplay.regular !== undefined && priceDisplay.regular > 0 ? (
                                <div>
                                    {priceDisplay.discounted && priceDisplay.regular !== undefined && priceDisplay.discounted < priceDisplay.regular ? (
                                        <>
                                            <span className="text-xs text-gray-400 line-through block">
                                                {formatPrice(priceDisplay.regular)}
                                            </span>
                                            <span className="text-lg font-bold text-green-600">{formatPrice(priceDisplay.discounted)}</span>
                                        </>
                                    ) : (
                                        <span className="text-lg font-bold text-green-600">
                                            {priceDisplay.regular !== undefined && formatPrice(priceDisplay.regular)}
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-lg font-bold text-green-600">Free</span>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {course.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{course.description}</p>
                    )}

                    {/* Tags Row */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${getLevelColor(course.level)}`}>
                            {course.level}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                            {getCategoryLabel(course.category)}
                        </span>
                        {course.certification?.isAvailable && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                Certificate
                            </span>
                        )}
                    </div>
                </div>

                {/* Bottom Row - Meta and Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            {renderStars(courseRating)}
                            <span className="ml-1">{courseRating.toFixed(1)} ({reviewCount})</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{durationDisplay}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{enrollmentCount} enrolled</span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={() => onView(courseId)}
                        className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium text-sm flex items-center gap-2 flex-shrink-0"
                    >
                        <Play className="w-4 h-4" />
                        View Course
                    </button>
                </div>
            </div>
        </div>
    );
});
