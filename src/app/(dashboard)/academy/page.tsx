"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { GridSkeleton } from "@/components/ui/loading";
import { useRoleAccess } from "@/components/role-guard";
import {
    Search,
    Star,
    Clock,
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
    ArrowRight,
    Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { apiRequest, API_ENDPOINTS } from "@/lib/api";

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

export default function AcademyPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy] = useState("relevance");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
            // Handle pricing
            pricing: (() => {
                if (course.pricing && typeof course.pricing === 'object' && 'regularPrice' in course.pricing) {
                    return course.pricing as Course['pricing'];
                }
                const priceValue = typeof course.price === 'number' ? course.price : course.originalPrice || 0;
                return {
                    regularPrice: priceValue,
                    discountedPrice: (course.pricing as Course['pricing'])?.discountedPrice || course.price || undefined,
                    currency: (course.pricing as Course['pricing'])?.currency || course.currency || 'USD'
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
            console.error('Error fetching courses:', error);
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

    // Fetch courses when filters or search change
    useEffect(() => {
        fetchCourses();
    }, [debouncedSearchQuery, filters, sortBy, fetchCourses]);

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

    if (loading) {
        return (
            <div className="p-4 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Academy</h1>
                        <p className="text-gray-600">Browse courses and certifications</p>
                    </div>
                </div>
                <GridSkeleton count={6} columns={3} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
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
        );
    }

    return (
        <div className="p-4 space-y-4">
            {/* Header */}
            <PageHeader
                title="Academy"
                subtitle="Browse courses, learn new skills, and earn certifications"
                actions={[
                    ...(isInstructor || isAdmin ? [{
                        type: "button" as const,
                        onClick: handleCreateCourse,
                        label: "Create Course",
                        icon: Plus,
                        variant: "primary" as const
                    }] : [])
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
                                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    {categories.map(category => (
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
                                    onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                                        onChange={(e) => setFilters(prev => ({ ...prev, priceRange: [Number(e.target.value), prev.priceRange[1]] }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                    <span className="text-gray-500">to</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.priceRange[1]}
                                        onChange={(e) => setFilters(prev => ({ ...prev, priceRange: [prev.priceRange[0], Number(e.target.value)] }))}
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
                                    onChange={(e) => setFilters(prev => ({ ...prev, rating: Number(e.target.value) }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value={0}>Any Rating</option>
                                    <option value={4}>4+ Stars</option>
                                    <option value={3}>3+ Stars</option>
                                    <option value={2}>2+ Stars</option>
                                </select>
                            </div>

                            {/* Certification Filter */}
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filters.certification}
                                        onChange={(e) => setFilters(prev => ({ ...prev, certification: e.target.checked }))}
                                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-sm text-gray-700">With Certification</span>
                                </label>
                            </div>

                            {/* Enrollment Filter */}
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filters.enrollment}
                                        onChange={(e) => setFilters(prev => ({ ...prev, enrollment: e.target.checked }))}
                                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                    />
                                    <span className="text-sm text-gray-700">Open Enrollment</span>
                                </label>
                            </div>

                            {/* Clear Filters */}
                            <div>
                                <button
                                    onClick={() => {
                                        setFilters({
                                            category: "",
                                            level: "",
                                            priceRange: [0, 1000],
                                            rating: 0,
                                            certification: false,
                                            enrollment: true
                                        });
                                        setSearchQuery("");
                                    }}
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
                                        placeholder="Search courses, instructors, categories..."
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

                    {/* Call-out Card for Clients to Become Instructors */}
                    {isClient && !isInstructor && !isAdmin && (
                        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
                            <div className="px-3 py-1">
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-lg font-medium text-gray-700 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-green-600" />
                                        <span>Share your expertise and create courses as an instructor</span>
                                    </p>
                                    <Link
                                        href="/plus?upgrade=instructor"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap"
                                    >
                                        Upgrade
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Results */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <p className="text-gray-600">
                                    {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
                                </p>
                            </div>
                            <button
                                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
                            >
                                {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                            </button>
                        </div>

                        {filteredCourses.length === 0 ? (
                            <Card interactive={false}>
                                <EmptyState
                                    icon={GraduationCap}
                                    iconColor="text-purple-600"
                                    iconBgColor="bg-purple-100"
                                    title="No Courses Found"
                                    description="We couldn't find any courses matching your criteria. Try adjusting your search terms or filters."
                                    actions={[
                                        {
                                            type: "button",
                                            onClick: () => {
                                                setSearchQuery("");
                                                setFilters({
                                                    category: "",
                                                    level: "",
                                                    priceRange: [0, 1000],
                                                    rating: 0,
                                                    certification: false,
                                                    enrollment: true
                                                });
                                            },
                                            label: "Clear All Filters",
                                            variant: "primary"
                                        },
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
                                    {filteredCourses.map((course, index) => (
                                        <CourseCard
                                            key={course.id || course._id || `course-${index}`}
                                            course={course}
                                            viewMode={viewMode}
                                            onView={handleViewCourse}
                                        />
                                    ))}
                                </div>
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
    onView: (courseId: string) => void;
}

const CourseCard = React.memo(function CourseCard({ course, viewMode, onView }: CourseCardProps) {
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
    
    // Get pricing display
    const getPriceDisplay = () => {
        const pricing = course.pricing;
        if ('regularPrice' in pricing) {
            return {
                regular: pricing.regularPrice,
                discounted: pricing.discountedPrice,
                currency: pricing.currency || 'USD'
            };
        }
        return {
            regular: pricing.price || pricing.regularPrice || 0,
            discounted: pricing.discountedPrice || pricing.originalPrice,
            currency: pricing.currency || 'USD'
        };
    };
    const priceDisplay = getPriceDisplay();
    
    // Get duration display
    const getDurationDisplay = () => {
        if (typeof course.duration === 'number') {
            return `${course.duration} hours`;
        }
        const weeks = course.duration.weeks ? ` (${course.duration.weeks} weeks)` : '';
        return `${course.duration.hours} hours${weeks}`;
    };
    const durationDisplay = getDurationDisplay();
    
    // Get rating
    const courseRating = course.rating?.average || 0;
    const reviewCount = course.rating?.count || 0;
    
    // Format price with currency
    const formatPrice = (price: number, curr: string = priceDisplay.currency) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: curr
        }).format(price);
    };
    
    // Get enrollment count
    const enrollmentCount = course.enrollment?.current || course.studentsCount || 0;
    const maxCapacity = course.enrollment?.maxCapacity;
    const isEnrollmentOpen = course.enrollment?.isOpen !== false;
    
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
    
    const renderStars = (rating: number) => {
        return (
            <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                    <Star
                        key={`star-${i}`}
                        className={`w-3 h-3 ${i < Math.floor(rating)
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
            className={`bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group ${
                viewMode === "list" ? "flex" : ""
            }`}
        >
            <div className={viewMode === "list" ? "flex-1 p-4" : "p-4"}>
                <div className={viewMode === "list" ? "flex gap-6" : ""}>
                    {/* Course Image */}
                    <div className={`${viewMode === "list" ? "w-48 h-32" : "w-full h-40"} bg-gray-200 rounded-lg mb-3 flex-shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300 relative`}>
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={course.title || 'Course image'}
                                width={viewMode === "list" ? 192 : 400}
                                height={viewMode === "list" ? 128 : 192}
                                className="w-full h-full object-cover rounded-lg"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                                        <GraduationCap className="w-6 h-6" />
                                    </div>
                                    <span className="text-sm">No Image</span>
                                </div>
                            </div>
                        )}
                        {course.partner && (
                            <div className="absolute top-2 left-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-medium">
                                {course.partner.name}
                            </div>
                        )}
                        {!isEnrollmentOpen && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                                Full
                            </div>
                        )}
                    </div>

                    {/* Course Details */}
                    <div className={viewMode === "list" ? "flex-1" : ""}>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-gray-700 line-clamp-1">
                                    {course.title}
                                </h3>
                                {instructorName && (
                                    <p className="text-xs text-gray-500 mt-0.5">by {instructorName}</p>
                                )}
                            </div>
                            <div className="text-right ml-3 flex-shrink-0">
                                {priceDisplay.regular > 0 ? (
                                    <div className="text-xl font-bold text-green-600">
                                        {priceDisplay.discounted && priceDisplay.discounted < priceDisplay.regular ? (
                                            <>
                                                <span className="text-sm text-gray-400 line-through mr-1">
                                                    {formatPrice(priceDisplay.regular, priceDisplay.currency)}
                                                </span>
                                                {formatPrice(priceDisplay.discounted, priceDisplay.currency)}
                                            </>
                                        ) : (
                                            formatPrice(priceDisplay.regular, priceDisplay.currency)
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-xl font-bold text-green-600">Free</div>
                                )}
                            </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {course.description || course.shortDescription || 'No description available'}
                        </p>

                        {/* Course Meta */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className={`text-xs px-2 py-1 rounded ${getLevelColor(course.level)}`}>
                                {course.level}
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {getCategoryLabel(course.category)}
                            </span>
                            {course.certification?.isAvailable && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded flex items-center gap-1">
                                    <Award className="w-3 h-3" />
                                    Certificate
                                </span>
                            )}
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {durationDisplay}
                            </span>
                        </div>

                        {/* Instructor and Rating */}
                        <div className="flex items-center gap-2 mb-2">
                            {instructor.avatar ? (
                                <Image
                                    src={instructor.avatar}
                                    alt={instructorName}
                                    width={24}
                                    height={24}
                                    className="w-6 h-6 rounded-full"
                                />
                            ) : (
                                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-gray-600">
                                        {instructorName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-600 truncate">{instructorName}</p>
                                <div className="flex items-center gap-1">
                                    {renderStars(courseRating)}
                                    <span className="text-xs text-gray-500">
                                        {courseRating.toFixed(1)} ({reviewCount})
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Enrollment Info */}
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                            <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{enrollmentCount} {maxCapacity ? `of ${maxCapacity}` : ''} enrolled</span>
                            </div>
                        </div>

                        {/* Course Badges */}
                        {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                            <div className="mb-2">
                                <div className="flex flex-wrap gap-1">
                                    {course.learningOutcomes.slice(0, 2).map((outcome, idx) => (
                                        <span key={idx} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                            {outcome}
                                        </span>
                                    ))}
                                    {course.learningOutcomes.length > 2 && (
                                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                            +{course.learningOutcomes.length - 2} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* View Button */}
                        <button
                            onClick={() => onView(courseId)}
                            className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                        >
                            <Play className="w-4 h-4" />
                            View Course
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

