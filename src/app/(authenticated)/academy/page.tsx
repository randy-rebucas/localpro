"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GridSkeleton } from "@/components/ui/loading";
import { useRoleAccess } from "@/components/role-guard";
import { useSession } from "@/hooks/useAuth";
import { Broadcaster } from "@/components/broadcaster";
import { useActiveRoleView } from "@/shared/hooks/useActiveRoleView";
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
    X,
    CheckCircle2,
    Zap,
    Headphones,
    HelpCircle,
    BookOpen,
    Filter,
    Grid3x3,
    List,
    ArrowUp,
    ArrowDown,
    Tag,
    DollarSign,
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

type CategoryOption = { value: string; label: string };

const defaultCategoryOptions: CategoryOption[] = [
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
    const [searchInput, setSearchInput] = useState("");
    const [sortBy, setSortBy] = useState("relevance");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
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
    const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>(defaultCategoryOptions);
    const router = useRouter();
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const paginationRef = useRef(pagination);
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const { isInstructor, isAdmin, isClient } = useRoleAccess();
    const { data: session } = useSession();
    useActiveRoleView();
    
    // Debounce search input
    useEffect(() => {
        const t = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 300);
        return () => clearTimeout(t);
    }, [searchInput]);
    
    const fetchCategories = useCallback(async () => {
        try {
            const data = await apiRequest<unknown>(API_ENDPOINTS.academyCategories);
            let names: string[] = [];

            const extractName = (cat: unknown): string | undefined => {
                if (typeof cat === 'string') return cat;
                if (cat && typeof cat === 'object' && 'name' in cat && typeof (cat as { name?: unknown }).name === 'string') {
                    return (cat as { name: string }).name;
                }
                return undefined;
            };

            const collectNames = (value: unknown): string[] => {
                if (!value) return [];
                if (Array.isArray(value)) return value.map(extractName).filter((n): n is string => Boolean(n));
                if (typeof value === 'object' && 'categories' in value) {
                    const categories = (value as { categories?: unknown }).categories;
                    if (Array.isArray(categories)) return categories.map(extractName).filter((n): n is string => Boolean(n));
                }
                return [];
            };

            if (data && typeof data === 'object') {
                const record = data as { data?: unknown; categories?: unknown };
                names = collectNames(record.data);
                if (!names.length && record.data && typeof record.data === 'object') {
                    names = collectNames(record.data);
                }
                if (!names.length) {
                    names = collectNames(record.categories);
                }
                if (!names.length) {
                    names = collectNames(data);
                }
            } else {
                names = collectNames(data);
            }

            const unique = Array.from(new Set(names.map((n) => n?.toLowerCase?.() || n)));
            const options: CategoryOption[] = [
                defaultCategoryOptions[0],
                ...unique.map((n) => ({ value: n, label: n.charAt(0).toUpperCase() + n.slice(1) }))
            ];
            setCategoryOptions(options.length > 1 ? options : defaultCategoryOptions);
        } catch (err) {
            logger.warn("Failed to fetch categories", { error: err instanceof Error ? err.message : String(err) });
            setCategoryOptions(defaultCategoryOptions);
        }
    }, []);

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

    // Fetch featured courses, enrollments, and categories on mount
    useEffect(() => {
        fetchFeaturedCourses();
        fetchCategories();
        if (session) {
            fetchMyEnrollments();
        }
    }, [fetchFeaturedCourses, fetchCategories, fetchMyEnrollments, session]);

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
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
        setSearchInput("");
        setPagination(prev => ({ ...prev, current: 1 }));
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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent/10/30 relative overflow-hidden">
                {/* Animated Background Blobs */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent/10/30 relative overflow-hidden">
                <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent/10/30 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
            </div>

            <div className="relative z-0">
                {/* Broadcaster - Only shown for clients */}
                <Broadcaster />

                {/* Header Section - Following Reference Layout */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
                    <div className="flex items-start justify-between mb-4">
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
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-accent to-accent rounded-lg hover:from-accent hover:to-accent transition-all shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105 flex-shrink-0"
                            >
                                <Plus className="w-4 h-4" />
                                Create Course
                            </button>
                        )}
                    </div>

                    {/* Quick Links - Following Reference Layout */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 border-b border-gray-200 pb-4">
                        <Link 
                            href="/academy/instructors" 
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
                        >
                            <CheckCircle2 className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium">Verified Instructors</span>
                        </Link>
                        <Link 
                            href="/academy/my-courses" 
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
                        >
                            <BookOpen className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium">My Courses</span>
                        </Link>
                        {(isInstructor || isAdmin) && (
                            <Link 
                                href="/academy/my-created-courses" 
                                className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
                            >
                                <BookOpen className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-medium">My Created Courses</span>
                            </Link>
                        )}
                        <Link 
                            href="/academy/certifications" 
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
                        >
                            <Award className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium">Certificates</span>
                        </Link>
                        <Link 
                            href="/support" 
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-accent transition-colors group"
                        >
                            <Headphones className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium">Support</span>
                        </Link>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                        {/* Left Sidebar - Filters */}
                        <aside className={`lg:w-[280px] flex-shrink-0 ${filterDrawerOpen ? "block" : "hidden lg:block"}`}>
                            {/* Mobile Overlay */}
                            {filterDrawerOpen && (
                                <div
                                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                                    onClick={() => setFilterDrawerOpen(false)}
                                />
                            )}

                            <div
                                className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24 ${
                                    filterDrawerOpen
                                        ? "fixed right-0 top-0 h-full w-80 z-50 overflow-y-auto lg:relative lg:w-auto lg:h-auto lg:z-auto"
                                        : ""
                                }`}
                            >
                                {/* Header */}
                                <div className="bg-gradient-to-r from-accent/10 to-emerald-50 px-6 py-4 border-b border-accent/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-md">
                                                <Filter className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                                                <p className="text-xs text-gray-600">Refine your search</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setFilterDrawerOpen(false)}
                                            className="lg:hidden p-2 rounded-lg hover:bg-white/50 transition-colors"
                                            aria-label="Close filters"
                                        >
                                            <X className="w-5 h-5 text-gray-600" />
                                        </button>
                                    </div>
                                </div>

                                {/* Filter Content */}
                                <div className="p-6 space-y-8">
                                    {/* Category Filter */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-accent" />
                                            <label className="text-sm font-semibold text-gray-900">Category</label>
                                        </div>
                                        <select
                                            value={filters.category}
                                            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                                            className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-gray-700"
                                            aria-label="Select category"
                                        >
                                            {categoryOptions.map(category => (
                                                <option key={category.value} value={category.value}>
                                                    {category.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Level Filter */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <GraduationCap className="w-4 h-4 text-accent" />
                                            <label className="text-sm font-semibold text-gray-900">Level</label>
                                        </div>
                                        <select
                                            value={filters.level}
                                            onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                                            className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all text-gray-700"
                                            aria-label="Select level"
                                        >
                                            {levels.map(level => (
                                                <option key={level.value} value={level.value}>
                                                    {level.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Price Range */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="w-4 h-4 text-accent" />
                                            <label className="text-sm font-semibold text-gray-900">Price Range</label>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    value={filters.priceRange[0] || ""}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, priceRange: [parseInt(e.target.value) || 0, prev.priceRange[1]] }))}
                                                    placeholder="Min"
                                                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                                />
                                                <span className="self-center text-gray-500">-</span>
                                                <input
                                                    type="number"
                                                    value={filters.priceRange[1] || ""}
                                                    onChange={(e) => setFilters(prev => ({ ...prev, priceRange: [prev.priceRange[0], parseInt(e.target.value) || 1000] }))}
                                                    placeholder="Max"
                                                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rating Filter */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Award className="w-4 h-4 text-accent" />
                                            <label className="text-sm font-semibold text-gray-900">Rating</label>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                onClick={() => setFilters(prev => ({ ...prev, rating: 0 }))}
                                                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                                    filters.rating === 0
                                                        ? "bg-accent text-white shadow-md shadow-green-200"
                                                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200"
                                                }`}
                                            >
                                                All
                                            </button>
                                            {[4, 3, 2].map((rating) => (
                                                <button
                                                    key={rating}
                                                    onClick={() => setFilters(prev => ({ ...prev, rating }))}
                                                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                                        filters.rating === rating
                                                            ? "bg-accent text-white shadow-md shadow-green-200"
                                                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-gray-200"
                                                    }`}
                                                >
                                                    <Star
                                                        className={`w-4 h-4 ${
                                                            filters.rating === rating ? "fill-white" : "fill-yellow-400 text-yellow-400"
                                                        }`}
                                                    />
                                                    {rating}+
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Certification Toggle */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Award className="w-4 h-4 text-accent" />
                                            <label className="text-sm font-semibold text-gray-900">Certification</label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                                            <div>
                                                <span className="text-sm font-semibold text-gray-900 block">With Certification</span>
                                                <span className="text-xs text-gray-500">Show only certified courses</span>
                                            </div>
                                            <button
                                                onClick={() => setFilters(prev => ({ ...prev, certification: !prev.certification }))}
                                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ${
                                                    filters.certification ? "bg-accent shadow-lg shadow-green-200" : "bg-gray-300"
                                                }`}
                                                role="switch"
                                                aria-checked={filters.certification}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                                                        filters.certification ? "translate-x-6" : "translate-x-1"
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Enrollment Toggle */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-accent" />
                                            <label className="text-sm font-semibold text-gray-900">Availability</label>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                                            <div>
                                                <span className="text-sm font-semibold text-gray-900 block">Open Enrollment</span>
                                                <span className="text-xs text-gray-500">Show only available courses</span>
                                            </div>
                                            <button
                                                onClick={() => setFilters(prev => ({ ...prev, enrollment: !prev.enrollment }))}
                                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ${
                                                    filters.enrollment ? "bg-accent shadow-lg shadow-green-200" : "bg-gray-300"
                                                }`}
                                                role="switch"
                                                aria-checked={filters.enrollment}
                                            >
                                                <span
                                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                                                        filters.enrollment ? "translate-x-6" : "translate-x-1"
                                                    }`}
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Clear Filters Button */}
                                    {activeFiltersCount > 0 && (
                                        <button
                                            onClick={clearFilters}
                                            className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all border-2 border-transparent hover:border-gray-300 flex items-center justify-center gap-2"
                                        >
                                            <X className="w-4 h-4" />
                                            Clear All Filters
                                        </button>
                                    )}
                                </div>

                                {/* Additional Content Sections */}
                                <div className="px-6 pb-6 space-y-6">
                                    {/* Become an Instructor Section */}
                                    {isClient && !isInstructor && !isAdmin && (
                                        <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg p-4 border border-accent/20">
                                            <div className="flex items-start gap-3 mb-3">
                                                <Sparkles className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 text-sm">Become an Instructor</h3>
                                                    <p className="text-xs text-gray-600 mt-1">Share your expertise and earn by creating courses.</p>
                                                </div>
                                            </div>
                                            <Link
                                                href="/plus?upgrade=instructor"
                                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-all shadow-sm hover:shadow-md font-medium text-sm"
                                            >
                                                Upgrade Now
                                                <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    )}

                                    {/* Popular Categories */}
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 mb-4">Popular Categories</h2>
                                        <div className="flex flex-wrap gap-2">
                                            {categoryOptions.filter(c => c.value).slice(0, 5).map((category) => (
                                                <button
                                                    key={category.value}
                                                    onClick={() => setFilters(prev => ({ ...prev, category: prev.category === category.value ? "" : category.value }))}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                                                        filters.category === category.value
                                                            ? "bg-accent text-white border-accent"
                                                            : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                                                    }`}
                                                >
                                                    {category.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Learning Tips */}
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 mb-4">Learning tips</h2>
                                        <ul className="space-y-3">
                                            {learningTips.map((tip, index) => (
                                                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                                    <span className="text-accent mt-1">•</span>
                                                    <span>{tip}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Need Help Section */}
                                    <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg p-4 border border-accent/20">
                                        <div className="flex items-start gap-3 mb-3">
                                            <HelpCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h3 className="font-semibold text-gray-900 text-sm">Need Help?</h3>
                                                <p className="text-xs text-gray-600 mt-1">Our team is here to help you find the right course.</p>
                                            </div>
                                        </div>
                                        <Link
                                            href="/support"
                                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-accent rounded-lg hover:bg-accent/10 transition-all border border-accent/20 font-medium text-sm"
                                        >
                                            <Zap className="w-4 h-4" />
                                            Contact Support
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </aside>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0">
                        {/* Mobile Filter Button */}
                        <div className="lg:hidden mb-4">
                            <button
                                onClick={() => setFilterDrawerOpen(true)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                                aria-label="Open filters"
                            >
                                <Filter className="w-4 h-4" />
                                <span>Filters</span>
                                {activeFiltersCount > 0 && (
                                    <span className="ml-1 px-2 py-0.5 bg-accent text-white rounded-full text-xs font-semibold">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Search | Sort | Display Mode Bar */}
                        <div className="mb-6">
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    {/* Search */}
                                    <div className="relative w-full sm:w-[70%]">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            value={searchInput}
                                            onChange={(e) => setSearchInput(e.target.value)}
                                            placeholder="Search courses, skills, or instructors..."
                                            className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all text-gray-700"
                                            aria-label="Search courses"
                                        />
                                        {searchInput.trim().length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchInput("");
                                                    setSearchQuery("");
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                                                aria-label="Clear search"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Sort Controls */}
                                    <div className="flex items-center gap-2 w-full sm:w-[20%]">
                                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                                className="flex-1 min-w-0 px-2.5 py-2 text-xs font-medium border border-gray-300 rounded-lg bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all text-gray-700 cursor-pointer"
                                                aria-label="Sort courses by"
                                            >
                                                <option value="relevance">Relevance</option>
                                                <option value="newest">Date</option>
                                                <option value="price-low">Price</option>
                                                <option value="rating">Rating</option>
                                                <option value="popular">Popular</option>
                                                <option value="duration">Duration</option>
                                            </select>
                                            <button
                                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                                className="p-2 border border-gray-300 rounded-lg bg-white hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all text-gray-700 cursor-pointer flex-shrink-0"
                                                aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                                                title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                                            >
                                                {sortOrder === 'asc' ? (
                                                    <ArrowUp className="w-4 h-4" />
                                                ) : (
                                                    <ArrowDown className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Display Mode Toggle */}
                                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-full sm:w-[10%] justify-center sm:justify-start">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={`p-2 rounded-md transition-all duration-200 ${
                                                viewMode === 'grid'
                                                    ? 'bg-white text-emerald-600 shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                            title="Grid View"
                                            aria-label="Switch to grid view"
                                        >
                                            <Grid3x3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={`p-2 rounded-md transition-all duration-200 ${
                                                viewMode === 'list'
                                                    ? 'bg-white text-emerald-600 shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                            title="List View"
                                            aria-label="Switch to list view"
                                        >
                                            <List className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* My Enrolled Courses Section */}
                        {session && myEnrollments.length > 0 && (
                            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-gray-900">Continue Learning</h2>
                                    <Link 
                                        href="/academy/my-courses" 
                                        className="text-sm text-accent hover:text-accent font-medium flex items-center gap-1"
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
                                            <div key={enrollment._id || enrollment.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-accent/30 hover:shadow-md transition-all">
                                                <div className="space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">{course.title}</h3>
                                                        {enrollment.status === 'completed' && (
                                                            <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 ml-2" />
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
                                                                    className="bg-gradient-to-r from-accent to-accent h-2 rounded-full transition-all"
                                                                    style={{ width: `${enrollment.progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => handleViewCourse(courseId)}
                                                        className="w-full px-3 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-all font-medium text-sm flex items-center justify-center gap-2"
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

                        {/* Error State */}
                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm font-medium text-red-800 mb-1">
                                    Error loading courses
                                </p>
                                <p className="text-xs text-red-600">
                                    {error}
                                </p>
                                <p className="text-xs text-red-600 mt-1">
                                    Please try refreshing the page or adjusting your filters.
                                </p>
                            </div>
                        )}

                        {/* Featured Courses Section */}
                        {featuredCourses.length > 0 && (
                            <div className="mb-6 bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="w-5 h-5 text-yellow-500" />
                                    <h2 className="text-lg font-bold text-gray-900">Featured Courses</h2>
                                </div>
                                <div className={viewMode === 'grid' 
                                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                    : "space-y-4"
                                }>
                                    {featuredCourses.slice(0, 3).map((course, index) => (
                                        <CourseCard
                                            key={course.id || course._id || `featured-${index}`}
                                            course={course}
                                            onView={handleViewCourse}
                                            featured={true}
                                            viewMode={viewMode}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Courses Results */}
                        {filteredCourses.length === 0 ? (
                            <Card interactive={false}>
                                <EmptyState
                                    icon={GraduationCap}
                                    iconColor="text-accent"
                                    iconBgColor="bg-accent/10"
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
                                <div className={viewMode === 'grid' 
                                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                    : "space-y-4"
                                }>
                                    {filteredCourses.map((course, index) => (
                                        <CourseCard
                                            key={course.id || course._id || `course-${index}`}
                                            course={course}
                                            onView={handleViewCourse}
                                            viewMode={viewMode}
                                        />
                                    ))}
                                </div>
                                
                                {/* Pagination */}
                                {pagination.pages > 1 && (
                                    <div className="mt-6 flex items-center justify-between bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                                        <div className="text-sm text-gray-600">
                                            Showing {((pagination.current - 1) * pagination.limit) + 1} to {Math.min(pagination.current * pagination.limit, pagination.total)} of {pagination.total} results
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handlePageChange(pagination.current - 1)}
                                                disabled={pagination.current === 1}
                                                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Previous
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
                                                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                                pagination.current === pageNum
                                                                    ? 'bg-accent text-white'
                                                                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
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
                                                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Next
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
        </div>
    );
}

interface CourseCardProps {
    course: Course;
    onView: (courseId: string) => void;
    featured?: boolean;
    viewMode?: 'grid' | 'list';
}

const CourseCard = React.memo(function CourseCard({ course, onView, featured = false, viewMode = 'grid' }: CourseCardProps) {
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
        if (!course.duration) return '—';
        if (typeof course.duration === 'number') {
            return `${course.duration}h`;
        }
        const hours = course.duration.hours ?? 0;
        const weeks = course.duration.weeks;
        if (weeks) return `${weeks}w · ${hours}h`;
        return `${hours}h`;
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
            case 'beginner': return 'bg-accent/10 text-accent';
            case 'intermediate': return 'bg-primary/10 text-primary';
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
        if (typeof category === 'string') {
            return labels[category] || category;
        }
        const name =
            category && typeof category === 'object' && 'name' in category && typeof (category as { name?: unknown }).name === 'string'
                ? (category as { name: string }).name
                : '';
        return labels[name] || name || 'Category';
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

    if (viewMode === 'list') {
        return (
            <div
                className={`bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300 overflow-hidden group flex flex-row items-stretch ${
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
                                <h3 className="font-semibold text-gray-900 text-base group-hover:text-accent transition-colors line-clamp-1">
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
                                                <span className="text-lg font-bold text-accent">{formatPrice(priceDisplay.discounted)}</span>
                                            </>
                                        ) : (
                                            <span className="text-lg font-bold text-accent">
                                                {priceDisplay.regular !== undefined && formatPrice(priceDisplay.regular)}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-lg font-bold text-accent">Free</span>
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
                            className="px-5 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-all font-medium text-sm flex items-center gap-2 flex-shrink-0"
                        >
                            <Play className="w-4 h-4" />
                            View Course
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Grid view
    return (
        <div
            className={`bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300 overflow-hidden group flex flex-col ${
                featured ? "ring-2 ring-yellow-400" : ""
            }`}
        >
            {/* Course Image */}
            <div className="relative w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={course.title || 'Course image'}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
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
                {/* Price Badge */}
                <div className="absolute top-2 right-2">
                    {priceDisplay.regular !== undefined && priceDisplay.regular > 0 ? (
                        <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md">
                            {priceDisplay.discounted && priceDisplay.regular !== undefined && priceDisplay.discounted < priceDisplay.regular ? (
                                <div className="text-right">
                                    <span className="text-xs text-gray-400 line-through block">{formatPrice(priceDisplay.regular)}</span>
                                    <span className="text-sm font-bold text-accent">{formatPrice(priceDisplay.discounted)}</span>
                                </div>
                            ) : (
                                <span className="text-sm font-bold text-accent">
                                    {priceDisplay.regular !== undefined && formatPrice(priceDisplay.regular)}
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md">
                            <span className="text-sm font-bold text-accent">Free</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Course Details */}
            <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                    {/* Title and Instructor */}
                    <div className="mb-2">
                        <h3 className="font-semibold text-gray-900 text-base group-hover:text-accent transition-colors line-clamp-2 mb-1">
                            {course.title}
                        </h3>
                        <p className="text-sm text-gray-500">by {instructorName}</p>
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
                <div className="space-y-3">
                    {/* Meta Info */}
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            {renderStars(courseRating)}
                            <span className="ml-1">{courseRating.toFixed(1)}</span>
                            <span className="text-xs">({reviewCount})</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{durationDisplay}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{enrollmentCount}</span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={() => onView(courseId)}
                        className="w-full px-4 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-all font-medium text-sm flex items-center justify-center gap-2"
                    >
                        <Play className="w-4 h-4" />
                        View Course
                    </button>
                </div>
            </div>
        </div>
    );
});
