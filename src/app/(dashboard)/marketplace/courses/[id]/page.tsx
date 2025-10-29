"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
    handleClientApiRoute,
    isAuthenticated 
} from "@/lib/client-api-utils";
import {
    Star,
    Clock,
    Users,
    Play,
    BookOpen,
    Award,
    CheckCircle,
    ArrowLeft,
    Share2,
    Heart,
    Download,
    Shield,
    BarChart3,
    ThumbsUp,
    ChevronRight,
    ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
        coursesCount: number;
        studentsCount: number;
        joinDate: string;
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
    curriculum: {
        sections: {
            _id: string;
            title: string;
            lessons: {
                _id: string;
                title: string;
                duration: number;
                type: 'video' | 'text' | 'quiz' | 'assignment';
                isPreview: boolean;
                isCompleted: boolean;
            }[];
        }[];
    };
    reviews: {
        _id: string;
        user: {
            name: string;
            avatar?: string;
        };
        rating: number;
        comment: string;
        createdAt: string;
        helpful: number;
    }[];
    relatedCourses: Course[];
}

export default function CourseDetailPage() {
    const params = useParams();
    const courseId = params.id as string;
    
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    const fetchCourse = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            if (!isAuthenticated()) {
                throw new Error("Authentication required. Please log in to view course details.");
            }

            const result = await handleClientApiRoute(async () => {
                const response = await fetch(`/api/academy/courses/${courseId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch course: ${response.status}`);
                }
                
                return await response.json();
            }, "Fetch course");

            if (result.error) {
                throw new Error(result.error);
            }

            const data = result.data;
            
            if (data.success && data.data) {
                setCourse(data.data);
                setIsEnrolled(data.data.isEnrolled || false);
            } else {
                throw new Error("Course not found");
            }
        } catch (error) {
            console.error("Error fetching course:", error);
            setError(error instanceof Error ? error.message : 'Failed to fetch course');
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        if (courseId) {
            fetchCourse();
        }
    }, [courseId, fetchCourse]);

    const handleEnroll = async () => {
        try {
            if (!isAuthenticated()) {
                throw new Error("Authentication required. Please log in to enroll in courses.");
            }

            const result = await handleClientApiRoute(async () => {
                const response = await fetch(`/api/academy/courses/${courseId}/enroll`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                
                if (!response.ok) {
                    throw new Error(`Failed to enroll in course: ${response.status}`);
                }
                
                return await response.json();
            }, "Enroll in course");

            if (result.error) {
                throw new Error(result.error);
            }

            setIsEnrolled(true);
            // You might want to show a success message or redirect
        } catch (error) {
            console.error("Error enrolling in course:", error);
            // Handle error (show toast, etc.)
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
                className={`w-4 h-4 ${i < difficulty ? "text-yellow-400 fill-current" : "text-gray-300"}`}
            />
        ));
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                    <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(rating)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                    />
                ))}
            </div>
        );
    };

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
            <div className="p-6 space-y-6">
                <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-4">
                        <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
                        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="p-4">
                <Card interactive={false}>
                    <EmptyState
                        icon={BookOpen}
                        iconColor="text-red-600"
                        iconBgColor="bg-red-100"
                        title="Course Not Found"
                        description={error || "The course you're looking for doesn't exist or has been removed."}
                        actions={[
                            {
                                type: "link",
                                href: "/marketplace/courses",
                                label: "Browse Courses",
                                variant: "primary"
                            }
                        ]}
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/marketplace/courses"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                    <p className="text-gray-600 mt-1">{course.shortDescription || course.description}</p>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Share2 className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setIsFavorited(!isFavorited)}
                        className={`p-2 rounded-lg transition-colors ${
                            isFavorited ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'
                        }`}
                    >
                        <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Course Thumbnail */}
                    <div className="relative">
                        <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
                            {course.thumbnail ? (
                                <Image
                                    src={course.thumbnail}
                                    alt={course.title}
                                    width={800}
                                    height={400}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
                                    <div className="text-center">
                                        <BookOpen className="w-16 h-16 mx-auto mb-4" />
                                        <span className="text-lg">No Thumbnail</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="absolute top-4 left-4">
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getLevelColor(course.level)}`}>
                                {course.level}
                            </span>
                        </div>
                        {course.isFeatured && (
                            <div className="absolute top-4 right-4">
                                <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full flex items-center gap-1">
                                    <Award className="w-4 h-4" />
                                    Featured
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Course Description */}
                    <Card>
                        <div className="p-6">
                            <h2 className="text-xl font-semibold mb-4">About This Course</h2>
                            <div className="prose max-w-none">
                                <p className={`text-gray-700 ${!showFullDescription && course.description.length > 300 ? 'line-clamp-4' : ''}`}>
                                    {course.description}
                                </p>
                                {course.description.length > 300 && (
                                    <button
                                        onClick={() => setShowFullDescription(!showFullDescription)}
                                        className="text-blue-600 hover:text-blue-800 font-medium mt-2"
                                    >
                                        {showFullDescription ? 'Show Less' : 'Show More'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* What You'll Learn */}
                    {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
                        <Card>
                            <div className="p-6">
                                <h2 className="text-xl font-semibold mb-4">What You&apos;ll Learn</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {course.whatYouWillLearn.map((item, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span className="text-gray-700">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Course Curriculum */}
                    {course.curriculum && course.curriculum.sections && (
                        <Card>
                            <div className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Course Curriculum</h2>
                                <div className="space-y-4">
                                    {course.curriculum.sections.map((section) => (
                                        <div key={section._id} className="border border-gray-200 rounded-lg">
                                            <button
                                                onClick={() => toggleSection(section._id)}
                                                className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-medium text-gray-900">{section.title}</h3>
                                                    <span className="text-sm text-gray-500">
                                                        {section.lessons.length} lesson{section.lessons.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                                {expandedSections.has(section._id) ? (
                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                                )}
                                            </button>
                                            {expandedSections.has(section._id) && (
                                                <div className="border-t border-gray-200 p-4 space-y-3">
                                                    {section.lessons.map((lesson) => (
                                                        <div key={lesson._id} className="flex items-center justify-between py-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-6 h-6 flex items-center justify-center">
                                                                    {lesson.type === 'video' && <Play className="w-4 h-4 text-blue-600" />}
                                                                    {lesson.type === 'text' && <BookOpen className="w-4 h-4 text-gray-600" />}
                                                                    {lesson.type === 'quiz' && <BarChart3 className="w-4 h-4 text-purple-600" />}
                                                                    {lesson.type === 'assignment' && <Download className="w-4 h-4 text-green-600" />}
                                                                </div>
                                                                <span className="text-gray-700">{lesson.title}</span>
                                                                {lesson.isPreview && (
                                                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                                                        Preview
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-gray-500">
                                                                    {formatDuration(lesson.duration)}
                                                                </span>
                                                                {lesson.isCompleted && (
                                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Instructor */}
                    {course.instructor && (
                        <Card>
                            <div className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Instructor</h2>
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                        {course.instructor.avatar ? (
                                            <Image
                                                src={course.instructor.avatar}
                                                alt={course.instructor.name}
                                                width={64}
                                                height={64}
                                                className="w-16 h-16 rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-lg font-medium text-gray-600">
                                                {course.instructor.name.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-semibold text-gray-900">{course.instructor.name}</h3>
                                            {course.instructor.verified && (
                                                <Shield className="w-5 h-5 text-green-600" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="flex items-center gap-1">
                                                {renderStars(course.instructor.rating)}
                                                <span className="text-sm text-gray-600">
                                                    {course.instructor.rating.toFixed(1)} ({course.instructor.reviewCount} reviews)
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                            <span>{course.instructor.coursesCount} courses</span>
                                            <span>{course.instructor.studentsCount} students</span>
                                        </div>
                                        {course.instructor.bio && (
                                            <p className="text-gray-700">{course.instructor.bio}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Reviews */}
                    {course.reviews && course.reviews.length > 0 && (
                        <Card>
                            <div className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Student Reviews</h2>
                                <div className="space-y-4">
                                    {course.reviews.slice(0, 5).map((review) => (
                                        <div key={review._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                                    {review.user.avatar ? (
                                                        <Image
                                                            src={review.user.avatar}
                                                            alt={review.user.name}
                                                            width={40}
                                                            height={40}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-medium text-gray-600">
                                                            {review.user.name.charAt(0)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-gray-900">{review.user.name}</span>
                                                        <div className="flex">
                                                            {renderStars(review.rating)}
                                                        </div>
                                                    </div>
                                                    <p className="text-gray-700 text-sm mb-2">{review.comment}</p>
                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                                        <button className="flex items-center gap-1 hover:text-gray-700">
                                                            <ThumbsUp className="w-3 h-3" />
                                                            Helpful ({review.helpful})
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Course Info Card */}
                    <Card>
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <div className="text-3xl font-bold text-gray-900 mb-2">
                                    {course.price === 0 ? 'Free' : formatPrice(course.price, course.currency)}
                                </div>
                                {course.originalPrice && course.originalPrice > course.price && (
                                    <div className="text-lg text-gray-500 line-through">
                                        {formatPrice(course.originalPrice, course.currency)}
                                    </div>
                                )}
                            </div>

                            {!isEnrolled ? (
                                <button
                                    onClick={handleEnroll}
                                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors mb-4"
                                >
                                    Enroll Now
                                </button>
                            ) : (
                                <Link
                                    href={`/marketplace/courses/${course._id}/learn`}
                                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors mb-4 inline-block text-center"
                                >
                                    Continue Learning
                                </Link>
                            )}

                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Duration</span>
                                    <span className="font-medium">{formatDuration(course.duration)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Lessons</span>
                                    <span className="font-medium">{course.lessonsCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Students</span>
                                    <span className="font-medium">{course.studentsCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Language</span>
                                    <span className="font-medium">{course.language}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Level</span>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(course.level)}`}>
                                        {course.level}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Difficulty</span>
                                    <div className="flex">
                                        {getDifficultyStars(course.difficulty)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Course Stats */}
                    <Card>
                        <div className="p-6">
                            <h3 className="font-semibold mb-4">Course Statistics</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Star className="w-4 h-4 text-yellow-500" />
                                        <span className="text-sm text-gray-600">Rating</span>
                                    </div>
                                    <span className="font-medium">
                                        {course.rating.average.toFixed(1)} ({course.rating.count})
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-500" />
                                        <span className="text-sm text-gray-600">Students</span>
                                    </div>
                                    <span className="font-medium">{course.studentsCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Play className="w-4 h-4 text-green-500" />
                                        <span className="text-sm text-gray-600">Lessons</span>
                                    </div>
                                    <span className="font-medium">{course.lessonsCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-purple-500" />
                                        <span className="text-sm text-gray-600">Duration</span>
                                    </div>
                                    <span className="font-medium">{formatDuration(course.duration)}</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Course Tags */}
                    {course.tags && course.tags.length > 0 && (
                        <Card>
                            <div className="p-6">
                                <h3 className="font-semibold mb-4">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {course.tags.map((tag, index) => (
                                        <span key={index} className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Related Courses */}
                    {course.relatedCourses && course.relatedCourses.length > 0 && (
                        <Card>
                            <div className="p-6">
                                <h3 className="font-semibold mb-4">Related Courses</h3>
                                <div className="space-y-3">
                                    {course.relatedCourses.slice(0, 3).map((relatedCourse) => (
                                        <Link
                                            key={relatedCourse._id}
                                            href={`/marketplace/courses/${relatedCourse._id}`}
                                            className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0">
                                                    {relatedCourse.thumbnail ? (
                                                        <Image
                                                            src={relatedCourse.thumbnail}
                                                            alt={relatedCourse.title}
                                                            width={48}
                                                            height={48}
                                                            className="w-12 h-12 rounded object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 flex items-center justify-center">
                                                            <BookOpen className="w-6 h-6 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                                                        {relatedCourse.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="flex">
                                                            {renderStars(relatedCourse.rating.average)}
                                                        </div>
                                                        <span className="text-xs text-gray-500">
                                                            {relatedCourse.rating.average.toFixed(1)} ({relatedCourse.rating.count})
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        {formatPrice(relatedCourse.price, relatedCourse.currency)}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
