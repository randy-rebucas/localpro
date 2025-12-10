"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { Loading } from "@/components/ui/loading";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { getDefaultCurrency } from "@/lib/settings-utils";
import { Course } from "@/types/academy";
import {
  ArrowLeft,
  GraduationCap,
  Search,
  Clock,
  Star,
  BookOpen,
  Users,
} from "lucide-react";

type CoursesResponse =
  | { success?: boolean; data?: Course[]; courses?: Course[] }
  | Course[]
  | null;

export default function MyCoursesPage() {
  const router = useRouter();
  const { settings: appSettings } = useAppSettings();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredCourses = useMemo(() => {
    if (!search) return courses;
    const term = search.toLowerCase();
    return courses.filter(
      (c) =>
        c.title?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term) ||
        c.category?.toLowerCase().includes(term)
    );
  }, [courses, search]);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!getApiToken()) {
        setError("Please sign in to view your courses.");
        setCourses([]);
        return;
      }

      const res = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.academyMyCourses}`,
        createAuthFetchOptions({ method: "GET" })
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Failed to load courses");
      }

      const data: CoursesResponse = await res.json();
      let list: Course[] = [];
      if (Array.isArray(data)) {
        list = data as Course[];
      } else if (data && typeof data === "object") {
        const payload = (data as any).data || data;
        if (Array.isArray(payload)) {
          list = payload as Course[];
        } else if (Array.isArray(payload?.courses)) {
          list = payload.courses as Course[];
        } else if (Array.isArray(payload?.items)) {
          list = payload.items as Course[];
        } else if (Array.isArray((data as any).courses)) {
          list = (data as any).courses as Course[];
        } else if (Array.isArray((data as any).items)) {
          list = (data as any).items as Course[];
        } else if (payload?.course) {
          list = [payload.course as Course];
        }
      }

      setCourses(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load courses";
      logger.error("Error fetching my courses", err instanceof Error ? err : new Error(String(err)));
      setError(message);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const renderStars = (rating = 0) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ));

  const formatPrice = (course: Course) => {
    const currency = course.pricing?.currency || getDefaultCurrency(appSettings);
    const regular = course.pricing?.regularPrice ?? 0;
    const discounted = course.pricing?.discountedPrice;
    if (discounted !== undefined) {
      return (
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-green-700">
            {formatCurrency(discounted, currency, { appSettings })}
          </span>
          <span className="text-xs text-gray-500 line-through">
            {formatCurrency(regular, currency, { appSettings })}
          </span>
        </div>
      );
    }
    return (
      <div className="text-sm font-semibold text-gray-900">
        {formatCurrency(regular, currency, { appSettings })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loading size="lg" text="Loading your courses..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-4">
        <GraduationCap className="w-12 h-12 text-gray-300" />
        <div>
          <p className="text-lg font-semibold text-gray-800">Unable to load courses</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
        <button
          onClick={fetchCourses}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/academy")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to academy"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Courses</h1>
          <p className="text-sm text-gray-600">Your enrolled and saved academy courses</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your courses..."
          className="flex-1 text-sm outline-none"
        />
      </div>

      {/* Empty state */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center space-y-3 border border-dashed border-gray-200">
          <GraduationCap className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-lg font-semibold text-gray-800">No courses yet</p>
          <p className="text-sm text-gray-600">Browse the academy and start learning today.</p>
          <Link
            href="/academy/courses"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Browse courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCourses.map((course) => {
            const thumbnail =
              typeof course.thumbnail === "string"
                ? course.thumbnail
                : course.thumbnail?.url || course.thumbnail?.thumbnail || "";

            return (
              <div key={course._id || course.title} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="aspect-video bg-gray-100 relative">
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={course.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      unoptimized
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                      <BookOpen className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        {typeof course.category === "string" ? course.category : (course.category as any)?.name || "Category"}
                      </span>
                      {course.level && (
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                          {course.level}
                        </span>
                      )}
                    </div>
                    {course.rating?.average !== undefined && (
                      <div className="flex items-center gap-1 text-xs text-gray-700">
                        {renderStars(course.rating.average)}
                        <span className="ml-1">{course.rating.average.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration?.hours ?? 0}h{course.duration?.weeks ? ` · ${course.duration.weeks}w` : ""}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{course.enrollment?.current ?? 0} enrolled</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    {course.pricing ? formatPrice(course) : <span className="text-sm text-gray-500">Free</span>}
                    <Link
                      href={`/academy/courses/${course._id || course.title}`}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                      View course
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

