"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  Star, 
  Clock, 
  Users,
  Play,
  BookOpen,
  Award,
  CheckCircle,
  Share2,
  Heart,
  Shield,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  User,
  GraduationCap
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

// Course Interface
interface Course {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  shortDescription?: string;
  category?: string;
  subcategory?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  duration?: {
    hours?: number;
    weeks?: number;
  } | number; // Support both formats
  pricing?: {
    regularPrice?: number;
    discountedPrice?: number;
    currency?: string;
  };
  // Legacy pricing fields for backward compatibility
  price?: number;
  originalPrice?: number;
  currency?: string;
  partner?: {
    name?: string;
    logo?: string;
    website?: string;
  };
  certification?: {
    isAvailable?: boolean;
    name?: string;
    issuer?: string;
    validity?: number; // in months
    requirements?: string[];
  };
  enrollment?: {
    current?: number;
    maxCapacity?: number;
    isOpen?: boolean;
  };
  schedule?: {
    startDate?: string;
    endDate?: string;
    sessions?: Array<{
      _id?: string;
      id?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      type?: 'live' | 'recorded' | 'self-paced';
    }>;
  };
  thumbnail?: string;
  images?: Array<{
    url?: string;
    thumbnail?: string;
  }> | string[];
  instructor?: {
    _id?: string;
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    profile?: {
      bio?: string;
      rating?: number;
      reviewCount?: number;
      verified?: boolean;
      coursesCount?: number;
      studentsCount?: number;
    };
    bio?: string;
    rating?: number;
    reviewCount?: number;
    verified?: boolean;
    coursesCount?: number;
    studentsCount?: number;
  } | string;
  rating?: {
    average?: number;
    count?: number;
  };
  studentsCount?: number;
  lessonsCount?: number;
  isPublished?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  isEnrolled?: boolean;
  tags?: string[];
  language?: string;
  createdAt?: string;
  updatedAt?: string;
  difficulty?: number; // 1-5 scale
  prerequisites?: string[];
  learningOutcomes?: string[];
  whatYouWillLearn?: string[];
  curriculum?: Array<{
    _id?: string;
    id?: string;
    module?: string;
    title?: string;
    lessons?: Array<{
      _id?: string;
      id?: string;
      title?: string;
      description?: string;
      duration?: number; // in minutes
      type?: 'video' | 'text' | 'quiz' | 'assignment';
      isFree?: boolean;
      isPreview?: boolean;
      isCompleted?: boolean;
    }>;
  }> | {
    sections?: Array<{
      _id?: string;
      id?: string;
      title?: string;
      lessons?: Array<{
        _id?: string;
        id?: string;
        title?: string;
        duration?: number;
        type?: 'video' | 'text' | 'quiz' | 'assignment';
        isPreview?: boolean;
        isCompleted?: boolean;
      }>;
    }>;
  };
  reviews?: Array<{
    _id?: string;
    id?: string;
    user?: {
      _id?: string;
      id?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      avatar?: string;
    } | string;
    rating?: number;
    comment?: string;
    createdAt?: string;
    helpful?: number;
  }>;
}

interface CourseStatistics {
  rating?: {
    average?: number;
    count?: number;
  };
  enrollment?: {
    current?: number;
    maxCapacity?: number;
    isOpen?: boolean;
  };
  curriculum?: {
    modules?: number;
    totalLessons?: number;
    estimatedHours?: number;
    estimatedWeeks?: number;
  };
}

export default function CourseDetailPage() {
  const params = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [statistics, setStatistics] = useState<CourseStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const normalizeCourse = useCallback((courseData: Partial<Course> & Record<string, unknown>): Course => {
    // Handle duration (can be object or number)
    let durationValue: Course['duration'] = courseData.duration as Course['duration'];
    if (typeof courseData.duration === 'number') {
      durationValue = courseData.duration;
    } else if (courseData.duration && typeof courseData.duration === 'object') {
      durationValue = courseData.duration as Course['duration'];
    }

    // Handle pricing (can be object or separate fields)
    const pricingObj = courseData.pricing as Course['pricing'];
    const legacyPrice = courseData.price as number;
    const legacyOriginalPrice = courseData.originalPrice as number;
    const legacyCurrency = (courseData.currency as string) || 'PHP';

    // Handle instructor with nested profile
    let normalizedInstructor: Course['instructor'];
    if (typeof courseData.instructor === 'string') {
      normalizedInstructor = courseData.instructor;
    } else if (courseData.instructor) {
      const instructor = courseData.instructor as Record<string, unknown>;
      const profile = instructor.profile as Record<string, unknown> | undefined;
      const instructorId = instructor._id || instructor.id;
      const instructorId2 = instructor.id || instructor._id;
      normalizedInstructor = {
        _id: typeof instructorId === 'string' ? instructorId : undefined,
        id: typeof instructorId2 === 'string' ? instructorId2 : undefined,
        name: instructor.name as string | undefined,
        firstName: instructor.firstName as string | undefined,
        lastName: instructor.lastName as string | undefined,
        avatar: instructor.avatar as string | undefined,
        profile: profile ? {
          bio: profile.bio as string | undefined,
          rating: profile.rating as number | undefined,
          reviewCount: profile.reviewCount as number | undefined,
          verified: profile.verified as boolean | undefined,
          coursesCount: profile.coursesCount as number | undefined,
          studentsCount: profile.studentsCount as number | undefined
        } : undefined,
        bio: (instructor.bio as string) || (profile?.bio as string),
        rating: (instructor.rating as number) || (profile?.rating as number),
        reviewCount: (instructor.reviewCount as number) || (profile?.reviewCount as number),
        verified: (instructor.verified as boolean) || (profile?.verified as boolean),
        coursesCount: (instructor.coursesCount as number) || (profile?.coursesCount as number),
        studentsCount: (instructor.studentsCount as number) || (profile?.studentsCount as number)
      };
    }

    // Handle curriculum (can be array of modules or object with sections)
    let curriculumValue: Course['curriculum'];
    if (Array.isArray(courseData.curriculum)) {
      curriculumValue = courseData.curriculum as Course['curriculum'];
    } else if (courseData.curriculum && typeof courseData.curriculum === 'object') {
      curriculumValue = courseData.curriculum as Course['curriculum'];
    }

    // Calculate lessons count from curriculum
    let calculatedLessonsCount = 0;
    if (Array.isArray(courseData.curriculum)) {
      calculatedLessonsCount = courseData.curriculum.reduce((total: number, module: Record<string, unknown>) => {
        const lessons = Array.isArray(module.lessons) ? module.lessons : [];
        return total + lessons.length;
      }, 0);
    }

    return {
      ...courseData,
      _id: courseData._id || courseData.id || '',
      id: courseData.id || courseData._id || '',
      title: (courseData.title as string) || '',
      description: (courseData.description as string) || '',
      shortDescription: (courseData.shortDescription as string),
      category: (courseData.category as string),
      subcategory: (courseData.subcategory as string),
      level: (courseData.level as Course['level']) || 'beginner',
      duration: durationValue,
      pricing: pricingObj || (legacyPrice !== undefined || legacyOriginalPrice !== undefined ? {
        regularPrice: legacyOriginalPrice || legacyPrice,
        discountedPrice: legacyPrice,
        currency: legacyCurrency
      } : undefined),
      price: legacyPrice,
      originalPrice: legacyOriginalPrice,
      currency: legacyCurrency,
      partner: courseData.partner as Course['partner'],
      certification: courseData.certification as Course['certification'],
      enrollment: courseData.enrollment as Course['enrollment'],
      schedule: courseData.schedule as Course['schedule'],
      thumbnail: (courseData.thumbnail as string),
      instructor: normalizedInstructor,
      rating: courseData.rating as Course['rating'],
      studentsCount: (courseData.studentsCount as number) || (courseData.enrollment?.current as number) || 0,
      lessonsCount: (courseData.lessonsCount as number) || calculatedLessonsCount,
      isPublished: courseData.isPublished !== undefined ? courseData.isPublished : (courseData.isActive !== undefined ? courseData.isActive : true),
      isActive: courseData.isActive !== undefined ? courseData.isActive : true,
      isFeatured: courseData.isFeatured || false,
      isEnrolled: courseData.isEnrolled || false,
      tags: (courseData.tags as string[]) || [],
      language: (courseData.language as string) || 'English',
      difficulty: (courseData.difficulty as number) || 1,
      prerequisites: (courseData.prerequisites as string[]) || [],
      learningOutcomes: (courseData.learningOutcomes as string[]) || [],
      whatYouWillLearn: (courseData.whatYouWillLearn as string[]) || (courseData.learningOutcomes as string[]) || [],
      curriculum: curriculumValue,
      reviews: (courseData.reviews as Course['reviews']) || []
    };
  }, []);

  const fetchCourse = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.academyCoursesById}/${params.id}`, createAuthFetchOptions());
        
      // Handle different HTTP status codes
      if (response.status === 404) {
        setError("Course not found");
        setCourse(null);
        return;
      }
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Failed to load course details";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        setError(errorMessage);
        setCourse(null);
        return;
      }

      const data = await response.json();
      
      // Handle API response structure: {success: true, data: { course: {...}, statistics: {...}, relatedCourses: [] }}
      let courseData: Record<string, unknown>;
      let statisticsData: CourseStatistics | null = null;
      
      if (data.success && data.data) {
        // Check if course is nested under data.course
        if (data.data.course) {
          courseData = data.data.course as Record<string, unknown>;
          statisticsData = data.data.statistics as CourseStatistics | null;
        } else {
          // Fallback to data.data directly
          courseData = data.data as Record<string, unknown>;
        }
      } else {
        // Fallback to data directly
        courseData = data as Record<string, unknown>;
      }
      
      // Check if course data exists
      if (!courseData || (!courseData._id && !courseData.id)) {
        setError("Course not found");
        setCourse(null);
        return;
      }
      
      const normalizedCourse = normalizeCourse(courseData);
      setCourse(normalizedCourse);
      setStatistics(statisticsData);
      setIsEnrolled(normalizedCourse.isEnrolled || false);
      setError(null);
      
      // Load favorite status from localStorage
      const courseId = normalizedCourse._id || normalizedCourse.id;
      if (courseId) {
        const favorites = JSON.parse(localStorage.getItem('favoriteCourses') || '[]');
        setIsFavorited(favorites.includes(courseId));
      }
    } catch (error) {
      // Only log unexpected errors (network errors, etc.)
      logger.error("Error fetching course", error instanceof Error ? error : new Error(String(error)), { courseId: params.id });
      setError(error instanceof Error ? error.message : "Failed to load course details");
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [params.id, normalizeCourse]);

  useEffect(() => {
    if (params.id) {
      fetchCourse();
    }
  }, [params.id, fetchCourse]);

  const handleToggleFavorite = useCallback(() => {
    if (!course) return;
    
    const courseId = course._id || course.id;
    if (!courseId) return;
    
    try {
      const favorites = JSON.parse(localStorage.getItem('favoriteCourses') || '[]');
      const newFavorited = !isFavorited;
      
      if (newFavorited) {
        if (!favorites.includes(courseId)) {
          favorites.push(courseId);
        }
      } else {
        const index = favorites.indexOf(courseId);
        if (index > -1) {
          favorites.splice(index, 1);
        }
      }
      
      localStorage.setItem('favoriteCourses', JSON.stringify(favorites));
      setIsFavorited(newFavorited);
    } catch (error) {
      logger.error('Error toggling favorite', error instanceof Error ? error : new Error(String(error)), { courseId: params.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, isFavorited]);

  const handleShare = useCallback(async () => {
    if (!course) return;
    
    const shareData = {
      title: course.title,
      text: course.shortDescription || course.description || '',
      url: typeof window !== 'undefined' ? window.location.href : ''
    };
    
    try {
      if (navigator.share && typeof navigator.share === 'function') {
        await navigator.share(shareData);
        setShareFeedback('Shared successfully!');
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setShareFeedback('Link copied to clipboard!');
      }
      setTimeout(() => setShareFeedback(null), 2000);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        logger.error('Error sharing', error, { courseId: params.id });
        try {
          await navigator.clipboard.writeText(shareData.url);
          setShareFeedback('Link copied to clipboard!');
          setTimeout(() => setShareFeedback(null), 2000);
        } catch (clipboardError) {
          logger.error('Error copying to clipboard', clipboardError instanceof Error ? clipboardError : new Error(String(clipboardError)), { courseId: params.id });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course]);

  const formatPrice = (price: number, currency: string = 'PHP') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const formatDuration = (duration: Course['duration']) => {
    if (typeof duration === 'number') {
      const hours = duration;
      if (hours < 1) {
        return `${Math.round(hours * 60)}m`;
      } else if (hours < 24) {
        return `${Math.round(hours)}h`;
      } else {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
      }
    } else if (duration && typeof duration === 'object') {
      const parts: string[] = [];
      if (duration.hours) {
        parts.push(`${duration.hours}h`);
      }
      if (duration.weeks) {
        parts.push(`${duration.weeks} week${duration.weeks !== 1 ? 's' : ''}`);
      }
      return parts.join(', ') || 'Not specified';
    }
    return 'Not specified';
  };

  const formatDurationMinutes = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

  const getDisplayPrice = () => {
    if (course?.pricing?.discountedPrice !== undefined) {
      return {
        price: course.pricing.discountedPrice,
        originalPrice: course.pricing.regularPrice,
        currency: course.pricing.currency || 'PHP'
      };
    }
    if (course?.price !== undefined) {
      return {
        price: course.price,
        originalPrice: course.originalPrice,
        currency: course.currency || 'PHP'
      };
    }
    return null;
  };

  const renderStars = (rating: number) => {
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
  };

  const getLevelColor = (level: Course['level']) => {
    switch (level) {
      case 'beginner': return 'bg-accent/10 text-accent';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getInstructorName = () => {
    if (!course?.instructor) return 'Instructor';
    if (typeof course.instructor === 'string') return 'Instructor';
    return course.instructor.name || 
           `${course.instructor.firstName || ''} ${course.instructor.lastName || ''}`.trim() || 
           'Instructor';
  };

  const getInstructorBio = () => {
    if (!course?.instructor || typeof course.instructor === 'string') return undefined;
    return course.instructor.bio || course.instructor.profile?.bio;
  };

  const getInstructorRating = () => {
    if (!course?.instructor || typeof course.instructor === 'string') return undefined;
    return course.instructor.rating || course.instructor.profile?.rating;
  };

  const getImageUrl = () => {
    if (course?.thumbnail) return course.thumbnail;
    if (course?.images && Array.isArray(course.images) && course.images.length > 0) {
      const firstImage = course.images[0];
      return typeof firstImage === 'string' ? firstImage : (firstImage.url || firstImage.thumbnail || '');
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loading size="lg" text="Loading course details..." />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center py-12">
        <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Course Not Found</h2>
        <p className="text-gray-600 mb-6">{error || "The course you're looking for doesn't exist."}</p>
        <Link
          href="/marketplace/courses"
          className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors inline-block"
        >
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500">
        <Link href="/marketplace" className="hover:text-gray-700">
          Marketplace
        </Link>
        <span>/</span>
        <Link href="/marketplace/courses" className="hover:text-gray-700">
          Courses
        </Link>
        <span>/</span>
        <span className="text-gray-700">{course.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Course Header */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
                {course.shortDescription && (
                  <p className="text-lg text-gray-600 mb-4">{course.shortDescription}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                  {course.level && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                      {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                    </span>
                  )}
                  {course.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(course.duration)}</span>
                    </div>
                  )}
                  {(course.lessonsCount || statistics?.curriculum?.totalLessons) && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{statistics?.curriculum?.totalLessons || course.lessonsCount || 0} lessons</span>
                    </div>
                  )}
                  {(course.studentsCount !== undefined || statistics?.enrollment?.current !== undefined) && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>
                        {statistics?.enrollment?.current ?? course.studentsCount ?? 0} students
                      </span>
                    </div>
                  )}
                  {statistics?.curriculum?.modules && (
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      <span>{statistics.curriculum.modules} modules</span>
                    </div>
                  )}
                </div>

                {/* Rating */}
                {((course.rating && course.rating.average && course.rating.average > 0) ||
                  (statistics?.rating && statistics.rating.average && statistics.rating.average > 0)) && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      {renderStars(statistics?.rating?.average || course.rating?.average || 0)}
                      <span className="text-sm font-medium text-gray-700 ml-1">
                        {(statistics?.rating?.average || course.rating?.average || 0).toFixed(1)}
                      </span>
                    </div>
                    {(statistics?.rating?.count || course.rating?.count) && (
                      <span className="text-sm text-gray-500">
                        ({(statistics?.rating?.count || course.rating?.count || 0)} reviews)
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleShare}
                  className="relative p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors group"
                  title="Share course"
                >
                  <Share2 className="w-4 h-4" />
                  {shareFeedback && (
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {shareFeedback}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                  )}
                </button>
                <button 
                  onClick={handleToggleFavorite}
                  className={`p-2 border rounded-lg transition-colors ${
                    isFavorited 
                      ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Course Image */}
            {getImageUrl() && (
              <div className="relative w-full h-64 rounded-lg overflow-hidden mb-4">
                <Image
                  src={getImageUrl() || ''}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">About This Course</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {course.description}
            </p>
          </div>

          {/* Partner */}
          {course.partner && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Partner Organization</h2>
              <div className="flex items-center gap-4">
                {course.partner.logo && (
                  <Image
                    src={course.partner.logo}
                    alt={course.partner.name || 'Partner'}
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{course.partner.name}</h3>
                  {course.partner.website && (
                    <a
                      href={course.partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-accent text-sm"
                    >
                      Visit Website →
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Certification */}
          {course.certification && course.certification.isAvailable && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Certification</h2>
              <div className="flex items-start gap-3">
                <Award className="w-8 h-8 text-yellow-500 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {course.certification.name || 'Course Certificate'}
                  </h3>
                  {course.certification.issuer && (
                    <p className="text-sm text-gray-600 mb-2">Issued by: {course.certification.issuer}</p>
                  )}
                  {course.certification.validity && (
                    <p className="text-sm text-gray-600 mb-3">
                      Valid for {course.certification.validity} months
                    </p>
                  )}
                  {course.certification.requirements && course.certification.requirements.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Requirements:</p>
                      <ul className="space-y-1">
                        {course.certification.requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Schedule */}
          {course.schedule && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Schedule</h2>
              <div className="space-y-3">
                {course.schedule.startDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      <span className="font-medium">Start:</span>{' '}
                      {new Date(course.schedule.startDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                {course.schedule.endDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      <span className="font-medium">End:</span>{' '}
                      {new Date(course.schedule.endDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                {course.schedule.sessions && course.schedule.sessions.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Upcoming Sessions:</p>
                    <div className="space-y-2">
                      {course.schedule.sessions.slice(0, 5).map((session) => {
                        const sessionId = session._id || session.id || '';
                        return (
                          <div key={sessionId} className="border border-gray-200 rounded-lg p-3">
                            {session.date && (
                              <div className="text-sm text-gray-600 mb-1">
                                {new Date(session.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                            )}
                            {session.startTime && session.endTime && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">{session.startTime}</span> - {session.endTime}
                              </div>
                            )}
                            {session.type && (
                              <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                                session.type === 'live' 
                                  ? 'bg-red-100 text-red-800' 
                                  : session.type === 'self-paced'
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {session.type === 'live' ? 'Live' : session.type === 'self-paced' ? 'Self-Paced' : 'Recorded'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prerequisites */}
          {course.prerequisites && course.prerequisites.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Prerequisites</h2>
              <ul className="space-y-2">
                {course.prerequisites.map((prerequisite, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{prerequisite}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What You Will Learn / Learning Outcomes */}
          {((course.whatYouWillLearn && course.whatYouWillLearn.length > 0) || 
            (course.learningOutcomes && course.learningOutcomes.length > 0)) && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">What You&apos;ll Learn</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(course.whatYouWillLearn || course.learningOutcomes || []).map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Curriculum */}
          {course.curriculum && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Course Curriculum</h2>
                {statistics?.curriculum && (
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {statistics.curriculum.modules && (
                      <span>{statistics.curriculum.modules} Module{statistics.curriculum.modules !== 1 ? 's' : ''}</span>
                    )}
                    {statistics.curriculum.totalLessons && (
                      <span>{statistics.curriculum.totalLessons} Lesson{statistics.curriculum.totalLessons !== 1 ? 's' : ''}</span>
                    )}
                    {statistics.curriculum.estimatedHours && (
                      <span>{statistics.curriculum.estimatedHours} Hour{statistics.curriculum.estimatedHours !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {Array.isArray(course.curriculum) ? (
                  // Array format: modules with lessons
                  course.curriculum.map((module) => {
                    const moduleId = module._id || module.id || '';
                    const moduleTitle = module.module || module.title || 'Untitled Module';
                    const isExpanded = expandedSections.has(moduleId);
                    
                    return (
                      <div key={moduleId} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => moduleId && toggleSection(moduleId)}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                            <span className="font-medium text-gray-700">{moduleTitle}</span>
                          </div>
                          {module.lessons && (
                            <span className="text-sm text-gray-500">
                              {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </button>
                        
                        {isExpanded && module.lessons && (
                          <div className="border-t border-gray-200 p-4 space-y-2">
                            {module.lessons.map((lesson) => {
                              const lessonId = lesson._id || lesson.id || '';
                              return (
                                <div key={lessonId} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                  <div className="flex items-center gap-2">
                                    {lesson.type === 'video' && <Play className="w-4 h-4 text-gray-400" />}
                                    {lesson.type === 'quiz' && <Award className="w-4 h-4 text-gray-400" />}
                                    {lesson.type === 'assignment' && <BookOpen className="w-4 h-4 text-gray-400" />}
                                    <div className="flex flex-col">
                                      <span className="text-gray-700">{lesson.title || 'Untitled Lesson'}</span>
                                      {lesson.description && (
                                        <span className="text-xs text-gray-500">{lesson.description}</span>
                                      )}
                                    </div>
                                    {(lesson.isFree || lesson.isPreview) && (
                                      <span className={`px-2 py-0.5 text-xs rounded ${
                                        lesson.isFree 
                                          ? 'bg-accent/10 text-accent' 
                                          : 'bg-primary/10 text-primary'
                                      }`}>
                                        {lesson.isFree ? 'Free' : 'Preview'}
                                      </span>
                                    )}
                                  </div>
                                  {lesson.duration && (
                                    <span className="text-sm text-gray-500">
                                      {formatDurationMinutes(lesson.duration)}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  // Object format: sections (legacy)
                  course.curriculum.sections?.map((section) => {
                    const sectionId = section._id || section.id || '';
                    const isExpanded = expandedSections.has(sectionId);
                    
                    return (
                      <div key={sectionId} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => sectionId && toggleSection(sectionId)}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                            <span className="font-medium text-gray-700">{section.title || 'Untitled Section'}</span>
                          </div>
                          {section.lessons && (
                            <span className="text-sm text-gray-500">
                              {section.lessons.length} lesson{section.lessons.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </button>
                        
                        {isExpanded && section.lessons && (
                          <div className="border-t border-gray-200 p-4 space-y-2">
                            {section.lessons.map((lesson) => {
                              const lessonId = lesson._id || lesson.id || '';
                              return (
                                <div key={lessonId} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                  <div className="flex items-center gap-2">
                                    {lesson.type === 'video' && <Play className="w-4 h-4 text-gray-400" />}
                                    {lesson.type === 'quiz' && <Award className="w-4 h-4 text-gray-400" />}
                                    {lesson.type === 'assignment' && <BookOpen className="w-4 h-4 text-gray-400" />}
                                    <span className="text-gray-700">{lesson.title || 'Untitled Lesson'}</span>
                                    {lesson.isPreview && (
                                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                                        Preview
                                      </span>
                                    )}
                                  </div>
                                  {lesson.duration && (
                                    <span className="text-sm text-gray-500">
                                      {formatDurationMinutes(lesson.duration)}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Reviews */}
          {course.reviews && course.reviews.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Reviews ({course.reviews.length})
              </h2>
              <div className="space-y-4">
                {course.reviews.map((review, index) => {
                  const reviewId = review._id || review.id || index;
                  const userName = typeof review.user === 'string'
                    ? 'Student'
                    : (review.user?.name || 
                       `${review.user?.firstName || ''} ${review.user?.lastName || ''}`.trim() || 
                       'Student');
                  
                  return (
                    <div key={reviewId} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {typeof review.user !== 'string' && review.user?.avatar ? (
                            <Image
                              src={review.user.avatar}
                              alt={userName}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-700">{userName}</p>
                            {review.rating && (
                              <div className="flex items-center gap-1 mt-1">
                                {renderStars(review.rating)}
                              </div>
                            )}
                          </div>
                        </div>
                        {review.createdAt && (
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {review.comment && (
                        <p className="text-gray-600 mt-2">{review.comment}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
            {(() => {
              const displayPrice = getDisplayPrice();
              if (!displayPrice) return null;
              
              return (
                <div className="mb-4">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-3xl font-bold text-accent">
                      {formatPrice(displayPrice.price, displayPrice.currency)}
                    </span>
                    {displayPrice.originalPrice && displayPrice.originalPrice > displayPrice.price && (
                      <span className="text-lg text-gray-500 line-through">
                        {formatPrice(displayPrice.originalPrice, displayPrice.currency)}
                      </span>
                    )}
                  </div>
                  {displayPrice.originalPrice && displayPrice.originalPrice > displayPrice.price && (
                    <span className="text-sm text-accent font-medium">
                      Save {formatPrice(displayPrice.originalPrice - displayPrice.price, displayPrice.currency)}
                    </span>
                  )}
                </div>
              );
            })()}

            {/* Enrollment Status */}
            {(course.enrollment || statistics?.enrollment) && (() => {
              const enrollment = course.enrollment || statistics?.enrollment;
              if (!enrollment) return null;
              
              return (
                <div className={`mb-4 p-3 rounded-lg ${
                  enrollment.isOpen 
                    ? 'bg-accent/5 border border-accent/20' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      enrollment.isOpen ? 'text-accent' : 'text-red-800'
                    }`}>
                      {enrollment.isOpen ? 'Enrollment Open' : 'Enrollment Closed'}
                    </span>
                    {enrollment.maxCapacity !== undefined && enrollment.current !== undefined && (
                      <span className="text-xs text-gray-600">
                        {enrollment.current}/{enrollment.maxCapacity} enrolled
                      </span>
                    )}
                  </div>
                  {enrollment.maxCapacity !== undefined && enrollment.current !== undefined && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${
                          enrollment.isOpen ? 'bg-accent' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, (enrollment.current / enrollment.maxCapacity) * 100)}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              );
            })()}
            
            <button
              className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                isEnrolled
                  ? 'bg-accent text-white hover:bg-accent/90'
                  : (course.enrollment && !course.enrollment.isOpen)
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : (() => {
                      const displayPrice = getDisplayPrice();
                      return (displayPrice?.price === 0 || !displayPrice)
                        ? 'bg-accent text-white hover:bg-accent/90'
                        : 'bg-accent text-white hover:bg-accent/90';
                    })()
              }`}
              disabled={isEnrolled || ((course.enrollment || statistics?.enrollment) && !(course.enrollment?.isOpen ?? statistics?.enrollment?.isOpen ?? true))}
            >
              {isEnrolled ? (
                <>
                  <CheckCircle className="w-5 h-5 inline mr-2" />
                  Enrolled
                </>
              ) : ((course.enrollment || statistics?.enrollment) && !(course.enrollment?.isOpen ?? statistics?.enrollment?.isOpen ?? true)) ? (
                'Enrollment Closed'
              ) : (() => {
                  const displayPrice = getDisplayPrice();
                  return (displayPrice?.price === 0 || !displayPrice)
                    ? 'Enroll for Free'
                    : `Enroll Now - ${displayPrice ? formatPrice(displayPrice.price, displayPrice.currency) : 'Free'}`;
                })()
              }
            </button>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Shield className="w-4 h-4" />
                <span>30-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CheckCircle className="w-4 h-4" />
                <span>Full lifetime access</span>
              </div>
              {course.certification?.isAvailable && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Award className="w-4 h-4" />
                  <span>Certificate of completion</span>
                </div>
              )}
            </div>
          </div>

          {/* Instructor */}
          {course.instructor && typeof course.instructor !== 'string' && (course.instructor.id || course.instructor._id) && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Instructor</h3>
              <div className="flex items-center gap-3 mb-3">
                {course.instructor.avatar ? (
                  <Image
                    src={course.instructor.avatar}
                    alt={getInstructorName()}
                    width={60}
                    height={60}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-15 h-15 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-700">{getInstructorName()}</p>
                  {course.instructor.verified && (
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle className="w-4 h-4 text-accent" />
                      <span className="text-xs text-gray-600">Verified Instructor</span>
                    </div>
                  )}
                </div>
              </div>
              {getInstructorBio() && (
                <p className="text-sm text-gray-600">{getInstructorBio()}</p>
              )}
              {getInstructorRating() && (
                <div className="flex items-center gap-2 mt-2">
                  {renderStars(getInstructorRating() || 0)}
                  <span className="text-sm text-gray-600">
                    {(getInstructorRating() || 0).toFixed(1)}
                  </span>
                  {course.instructor.reviewCount !== undefined && course.instructor.reviewCount !== null && (
                    <span className="text-sm text-gray-500">
                      ({course.instructor.reviewCount} reviews)
                    </span>
                  )}
                  {course.instructor.profile?.reviewCount !== undefined && course.instructor.profile.reviewCount !== null && (
                    <span className="text-sm text-gray-500">
                      ({course.instructor.profile.reviewCount} reviews)
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Course Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Course Details</h3>
            <div className="space-y-3 text-sm">
              {course.category && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium text-gray-700 capitalize">
                    {course.category.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
              {course.language && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Language:</span>
                  <span className="font-medium text-gray-700">{course.language}</span>
                </div>
              )}
              {course.difficulty && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Difficulty:</span>
                  <div className="flex items-center gap-1">
                    {renderStars(course.difficulty)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
