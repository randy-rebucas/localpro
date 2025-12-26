"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  GraduationCap,
  Sparkles,
  Star,
  Users,
  ShieldCheck,
  CheckCircle2,
  Video,
  Tag,
  CalendarRange,
  Award,
  Heart,
  Share2,
} from "lucide-react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { Loading } from "@/components/ui/loading";
import { Course } from "@/types/academy";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { getDefaultCurrency } from "@/lib/settings-utils";
import { checkFavorite } from "@/lib/favorites-utils";
import toast from "react-hot-toast";
import { useSession } from "@/hooks/useAuth";

type CourseResponse =
  | { success?: boolean; data?: Course | { course?: Course }; course?: Course }
  | Course
  | Course[]
  | null;

type ScheduleLike = {
  startDate?: string | Date;
  endDate?: string | Date;
};

type InstructorLike = {
  _id?: string;
  id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profile?: {
    avatar?: string;
    bio?: string;
    rating?: number;
  };
  bio?: string;
  rating?: number;
};

const getCourseId = (value: Course | null | undefined, fallback?: string) => {
  if (!value) return fallback;
  if (value._id) return value._id;
  const record = value as unknown as Record<string, unknown>;
  if (typeof record.id === "string") return record.id;
  return fallback;
};

const getUserId = (user: unknown): string | undefined => {
  if (!user || typeof user !== "object") return undefined;
  const record = user as Record<string, unknown>;
  if (typeof record.id === "string") return record.id;
  if (typeof record._id === "string") return record._id;
  if (typeof record.userId === "string") return record.userId;
  return undefined;
};

const getSchedule = (schedule: unknown): ScheduleLike | undefined => {
  if (!schedule || typeof schedule !== "object") return undefined;
  const record = schedule as Record<string, unknown>;
  const startDate = record.startDate as string | Date | undefined;
  const endDate = record.endDate as string | Date | undefined;
  return { startDate, endDate };
};

export default function AcademyCourseDetailPage() {
  const params = useParams<{ id: string }>();
  const { settings: appSettings } = useAppSettings();
  const { data: session } = useSession();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const fetchCourse = useCallback(async () => {
    if (!params?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Gracefully handle missing token (public endpoint might still work)
      if (!getApiToken()) {
        logger.warn("No token found when fetching academy course detail");
      }

      const url = `${API_BASE_URL}${API_ENDPOINTS.academyCourses}/${params.id}`;
      const res = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (res.status === 404) {
        setError("Course not found");
        setCourse(null);
        return;
      }

      if (!res.ok) {
        const message = (await res.json().catch(() => ({}))).error || res.statusText || "Failed to load course";
        throw new Error(message);
      }

      const data: CourseResponse = await res.json();
      let payload: Course | undefined;

      if (data && typeof data === "object") {
        if ("success" in data && data.success === false) {
          const errorMessage =
            "error" in data && typeof data.error === "string" ? data.error : "Failed to load course";
          throw new Error(errorMessage);
        }

        // Common shapes
        if ("course" in data && data.course) {
          payload = data.course as Course;
        } else if ("data" in data && data.data) {
          const nestedData = data.data;
          if (nestedData && typeof nestedData === "object" && "course" in nestedData) {
            const nestedCourse = (nestedData as { course?: Course }).course;
            if (nestedCourse) payload = nestedCourse;
          } else {
            payload = nestedData as Course;
          }
        }
      }

      // Fallback if payload not yet set
      if (!payload) {
        if (Array.isArray(data) && data.length > 0) {
          const found = data.find((c) => {
            if (!c || typeof c !== "object") return false;
            const record = c as unknown as Record<string, unknown>;
            return (
              (typeof record._id === "string" && record._id === params.id) ||
              (typeof record.id === "string" && record.id === params.id)
            );
          });
          payload = (found as Course) || (data[0] as Course);
        } else if (data && typeof data === "object") {
          payload = data as Course;
        }
      }

      if (!payload || (!payload._id && !payload.title)) {
        setError("Course not found");
        setCourse(null);
        return;
      }

      setCourse(payload);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load course";
      logger.error("Error fetching academy course detail", err instanceof Error ? err : new Error(String(err)));
      setError(message);
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  // Sync favorite state when course loads
  useEffect(() => {
    const syncFavorite = async () => {
      const courseId = getCourseId(course, params?.id as string | undefined);
      if (!courseId) return;
      try {
        if (!getApiToken()) {
          setIsFavorited(false);
          return;
        }
        const favorited = await checkFavorite("course", courseId);
        setIsFavorited(favorited);
      } catch (err) {
        logger.warn("Failed to check course favorite", { error: err instanceof Error ? err.message : String(err) });
      }
    };
    syncFavorite();
  }, [course?._id, course, params?.id]);

  const priceDisplay = useMemo(() => {
    if (!course?.pricing) return null;
    const currency = course.pricing.currency || getDefaultCurrency(appSettings);
    const regular = course.pricing.regularPrice ?? 0;
    const discounted = course.pricing.discountedPrice;
    return { currency, regular, discounted };
  }, [course?.pricing, appSettings]);

  const courseDurationLabel = useMemo(() => {
    if (!course?.duration) return "Self-paced";
    const hours = course.duration.hours ?? 0;
    const weeks = course.duration.weeks;
    if (!weeks) return `${hours}h`;
    return `${weeks} week${weeks !== 1 ? "s" : ""} · ${hours}h`;
  }, [course?.duration]);

  const schedule = getSchedule(course?.schedule);
  const startDate = schedule?.startDate ? new Date(schedule.startDate) : null;
  const endDate = schedule?.endDate ? new Date(schedule.endDate) : null;

  const isOwner = useMemo(() => {
    if (!course || !session?.user) return false;
    const userId = getUserId(session.user);
    if (!userId) return false;
    if (typeof course.instructor === "string") {
      return course.instructor === userId;
    }
    if (!course.instructor || typeof course.instructor !== "object") return false;
    const instrRecord = course.instructor as Record<string, unknown>;
    const instructorId =
      (typeof instrRecord._id === "string" && instrRecord._id) ||
      (typeof instrRecord.id === "string" && instrRecord.id) ||
      (typeof instrRecord.userId === "string" && instrRecord.userId) ||
      undefined;
    return instructorId === userId;
  }, [course, session?.user]);

  const levelPill = useMemo(() => {
    const level = course?.level;
    if (!level) return "";
    switch (level) {
      case "beginner":
        return "bg-accent/10 text-accent";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-orange-100 text-orange-800";
      case "expert":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }, [course?.level]);

  const renderStars = (rating = 0) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ));

  const safeImageUrl = (value?: string | null) => {
    const trimmed = typeof value === "string" ? value.trim() : "";
    return trimmed ? trimmed : null;
  };

  const handleToggleFavorite = useCallback(async () => {
    const courseId = getCourseId(course, params?.id as string | undefined);
    if (!courseId) return;

    if (!getApiToken()) {
      toast.error("Please log in to add favorites");
      return;
    }

    if (isTogglingFavorite) return;
    setIsTogglingFavorite(true);

    const endpoint = `${API_BASE_URL}/api/academy/courses/${courseId}/favorite`;
    const method = isFavorited ? "DELETE" : "POST";

    try {
      const res = await fetch(
        endpoint,
        createAuthFetchOptions({
          method,
          headers: { "Content-Type": "application/json" },
        })
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data.error || data.message || `Failed to ${isFavorited ? "remove from" : "add to"} favorites`;
        throw new Error(message);
      }

      setIsFavorited(!isFavorited);
      toast.success(isFavorited ? "Removed from favorites" : "Added to favorites");
    } catch (error) {
      logger.error("Error toggling course favorite", error instanceof Error ? error : new Error(String(error)), { courseId });
      toast.error(error instanceof Error ? error.message : "Failed to update favorite. Please try again.");
    } finally {
      setIsTogglingFavorite(false);
    }
  }, [course, params?.id, isFavorited, isTogglingFavorite]);

  const handleShare = useCallback(async () => {
    if (!course) return;

    const shareData = {
      title: course.title,
      text: course.description || "",
      url: typeof window !== "undefined" ? window.location.href : ""
    };

    try {
      if (navigator.share && typeof navigator.share === "function") {
        await navigator.share(shareData);
        setShareFeedback("Shared successfully!");
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setShareFeedback("Link copied to clipboard!");
      }
      setTimeout(() => setShareFeedback(null), 2000);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        logger.error("Error sharing course", error, { courseId: course._id || params?.id });
        try {
          await navigator.clipboard.writeText(shareData.url);
          setShareFeedback("Link copied to clipboard!");
          setTimeout(() => setShareFeedback(null), 2000);
        } catch (clipboardError) {
          logger.error("Error copying to clipboard", clipboardError instanceof Error ? clipboardError : new Error(String(clipboardError)), { courseId: course._id || params?.id });
          setShareFeedback("Failed to share. Please try again.");
          setTimeout(() => setShareFeedback(null), 2000);
        }
      }
    }
  }, [course, params?.id]);

  const handleEnroll = useCallback(async () => {
    const courseId = getCourseId(course, params?.id as string | undefined);
    if (!courseId) return;

    if (!getApiToken()) {
      toast.error("Please log in to enroll");
      return;
    }

    if (isEnrolling) return;
    setIsEnrolling(true);

    // Derive payment info from course pricing as a default payload
    const currency = course?.pricing?.currency || getDefaultCurrency(appSettings);
    const amount = course?.pricing?.discountedPrice ?? course?.pricing?.regularPrice ?? 0;

    const payload = {
      payment: {
        amount,
        currency,
        status: amount > 0 ? "pending" : "paid",
      },
    };

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/academy/courses/${courseId}/enroll`,
        createAuthFetchOptions({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data.error || data.message || "Failed to enroll";
        throw new Error(message);
      }

      toast.success("Enrolled successfully");
    } catch (error) {
      logger.error("Error enrolling in course", error instanceof Error ? error : new Error(String(error)), { courseId });
      toast.error(error instanceof Error ? error.message : "Failed to enroll. Please try again.");
    } finally {
      setIsEnrolling(false);
    }
  }, [course, params?.id, appSettings, isEnrolling]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loading size="lg" text="Loading course details..." />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-4">
        <GraduationCap className="w-12 h-12 text-gray-300" />
        <div>
          <p className="text-lg font-semibold text-gray-800">Course not found</p>
          <p className="text-sm text-gray-600">{error || "The course you're looking for isn't available."}</p>
        </div>
        <Link
          href="/academy/courses"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to courses
        </Link>
      </div>
    );
  }

  const categoryName =
    typeof course.category === "string"
      ? course.category
      : (course.category &&
          typeof course.category === "object" &&
          ((course.category as { name?: string }).name || (course.category as { _id?: string })._id)) ||
        "Category";

  const instructor =
    course.instructor && typeof course.instructor === "object" ? (course.instructor as InstructorLike) : null;
  const instructorName =
    typeof course.instructor === "string"
      ? "Instructor"
      : `${instructor?.firstName || ""} ${instructor?.lastName || ""}`.trim() ||
        instructor?.email ||
        "Instructor";
  const instructorAvatar = safeImageUrl(instructor?.profile?.avatar);
  const instructorBio = instructor?.bio || instructor?.profile?.bio;
  const instructorRating = instructor?.profile?.rating ?? instructor?.rating;

  const thumbnail = safeImageUrl(
    typeof course.thumbnail === "string"
      ? course.thumbnail
      : course.thumbnail?.url || course.thumbnail?.thumbnail || null
  );

  return (
    <div className="p-6 space-y-6">
      {/* Back action (aligned with job detail styling) */}
      <div className="flex items-center gap-3">
        <Link
          href="/academy/courses"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to courses"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{course.title}</h1>
          <p className="text-sm text-gray-600">
            {course.description
              ? course.description.length > 96
                ? `${course.description.slice(0, 96)}…`
                : course.description
              : "Course detail"}
          </p>
        </div>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${levelPill}`}>
                {course.level?.charAt(0).toUpperCase() + course.level?.slice(1)}
              </span>
              {categoryName && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/5 text-primary border border-primary/20">
                  {categoryName}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
            {course.description && <p className="text-gray-700 text-base">{course.description}</p>}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>
                  {course.duration?.hours || 0}h{course.duration?.weeks ? ` · ${course.duration.weeks}w` : ""}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{course.enrollment?.current ?? 0} enrolled</span>
              </div>
              {course.rating?.average !== undefined && (
                <div className="flex items-center gap-1">
                  {renderStars(course.rating.average)}
                  <span className="text-gray-700 ml-1 text-sm">{course.rating.average.toFixed(1)}</span>
                  <span className="text-gray-500 text-xs">({course.rating.count ?? 0})</span>
                </div>
              )}
            </div>
          </div>
          <div className="w-full lg:w-80">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
              {thumbnail ? (
                <Image
                  src={thumbnail}
                  alt={course.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 320px"
                  unoptimized
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400">
                  <BookOpen className="w-10 h-10" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <div className="absolute bottom-3 right-3">
                <button className="inline-flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-2 rounded-md text-sm font-semibold text-gray-800 shadow-sm hover:bg-white">
                  <Video className="w-4 h-4" />
                  Preview
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          {priceDisplay ? (
            <div className="flex items-baseline gap-2">
              {priceDisplay.discounted !== undefined ? (
                <>
                  <span className="text-2xl font-bold text-accent">
                    {formatCurrency(priceDisplay.discounted, priceDisplay.currency, { appSettings })}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    {formatCurrency(priceDisplay.regular, priceDisplay.currency, { appSettings })}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-gray-900">
                  {formatCurrency(priceDisplay.regular, priceDisplay.currency, { appSettings })}
                </span>
              )}
            </div>
          ) : (
            <span className="text-lg font-semibold text-gray-800">Pricing not available</span>
          )}
          <button
            onClick={handleEnroll}
            disabled={isEnrolling || isOwner}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            title={isOwner ? "You cannot enroll in a course you created" : "Enroll now"}
          >
            {isOwner ? "Your course" : isEnrolling ? "Enrolling..." : "Enroll now"}
          </button>
          <div className="flex items-center gap-2 text-sm text-accent">
            <ShieldCheck className="w-4 h-4" />
            <span>14-day satisfaction guarantee</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleShare}
              className="relative p-2.5 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-all shadow-sm hover:shadow-md"
              title="Share course"
            >
              <Share2 className="w-4 h-4" />
              {shareFeedback && (
                <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap">
                  {shareFeedback}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              )}
            </button>
            <button
              onClick={handleToggleFavorite}
              disabled={isTogglingFavorite || !course?._id}
              className={`p-2.5 rounded-lg transition-all shadow-sm hover:shadow-md ${
                isFavorited
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "bg-gray-100 text-gray-600 hover:bg-pink-100 hover:text-pink-700"
              } ${isTogglingFavorite ? "opacity-60 cursor-not-allowed" : ""}`}
              title={isFavorited ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Info highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Duration & Schedule</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">{courseDurationLabel}</p>
          {startDate && (
            <p className="text-xs text-gray-600 mt-1">
              Starts {startDate.toLocaleDateString()}
              {endDate ? ` · Ends ${endDate.toLocaleDateString()}` : ""}
            </p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Enrollments</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {course.enrollment?.current ?? 0} enrolled
            {course.enrollment?.maxCapacity
              ? ` / ${course.enrollment.maxCapacity} seats`
              : " · Open"}
          </p>
          {course.enrollment?.isOpen === false && (
            <p className="text-xs text-red-600 mt-1">Enrollment closed</p>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <p className="text-xs text-gray-500">Certification</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {course.certification?.name || "Certificate of Completion"}
          </p>
          {course.certification?.issuer && (
            <p className="text-xs text-gray-600 mt-1">Issuer: {course.certification.issuer}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* What you'll learn */}
          {course.learningOutcomes && course.learningOutcomes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-900">What you&apos;ll learn</h2>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {course.learningOutcomes.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Curriculum */}
          {course.curriculum && course.curriculum.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-gray-900">Curriculum</h2>
              </div>
              <div className="space-y-4">
                {course.curriculum.map((module, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-900">{module.module}</div>
                      <div className="text-xs text-gray-500">
                        {module.lessons?.length ? `${module.lessons.length} lesson${module.lessons.length > 1 ? "s" : ""}` : ""}
                      </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {module.lessons?.map((lesson, lessonIdx) => (
                        <div key={lessonIdx} className="py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/5 text-primary flex items-center justify-center text-xs font-semibold">
                              {lessonIdx + 1}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{lesson.title || "Lesson"}</div>
                              {lesson.description && <div className="text-xs text-gray-600">{lesson.description}</div>}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{lesson.duration ? `${lesson.duration} min` : "Self-paced"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prerequisites */}
          {course.prerequisites && course.prerequisites.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-gray-900">Prerequisites</h2>
              </div>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
                {course.prerequisites.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Certification */}
          {course.certification && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-900">Certification</h2>
              </div>
              <p className="text-sm text-gray-700">
                {course.certification.name || "Certification available"}{course.certification.issuer ? ` · Issuer: ${course.certification.issuer}` : ""}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Instructor */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              {instructorAvatar ? (
                <Image
                  src={instructorAvatar}
                  alt={instructorName}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary font-semibold">
                  {instructorName.slice(0, 1)}
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Instructor</p>
                <p className="text-base font-semibold text-gray-900">{instructorName}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {instructorBio
                ? instructorBio
                : "Passionate instructor bringing practical experience to every lesson."}
            </p>
            {instructorRating !== undefined && (
              <div className="flex items-center gap-2 mt-3 text-sm text-gray-700">
                {renderStars(instructorRating)}
                <span>{instructorRating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Quick facts */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Course info</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Level</span>
                <span className="font-medium">{course.level || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Category</span>
                <span className="font-medium">{categoryName || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium">
                  {course.duration?.hours ?? 0}h{course.duration?.weeks ? ` · ${course.duration.weeks}w` : ""}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Capacity</span>
                <span className="font-medium">
                  {course.enrollment?.maxCapacity ? `${course.enrollment.maxCapacity} seats` : "Unlimited"}
                </span>
              </div>
            {startDate && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Schedule</span>
                  <span className="font-medium flex items-center gap-1">
                    <CalendarRange className="w-4 h-4" />
                  {startDate.toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {course.partner?.name && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">Partner</p>
                <div className="flex items-center gap-2 mt-1">
                  {course.partner.logo ? (
                    <Image
                      src={course.partner.logo}
                      alt={course.partner.name}
                      width={28}
                      height={28}
                      className="w-7 h-7 object-contain"
                      unoptimized
                    />
                  ) : null}
                  <span className="text-sm font-medium text-gray-900">{course.partner.name}</span>
                </div>
              </div>
            )}

            {course.tags && course.tags.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">Tags</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {course.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

