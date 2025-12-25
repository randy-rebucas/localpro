"use client";

import useSWR from "swr";
import { API_ENDPOINTS } from "@/lib/api";
import { createSWRKey, swrFetcher } from "@/lib/swr-config";
import { Course, Enrollment } from "@/types/courses";

export interface CoursesParams {
  category?: string;
  instructorId?: string;
  level?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
}

interface CoursesResponse {
  success?: boolean;
  data?: Course[];
  courses?: Course[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
    count: number;
  };
}

export function useCourses(params: CoursesParams = {}) {
  const swrKey = createSWRKey(API_ENDPOINTS.academyCourses, {
    category: params.category,
    instructorId: params.instructorId,
    level: params.level,
    search: params.search,
    isActive: params.isActive,
    isFeatured: params.isFeatured,
    page: params.page || 1,
    limit: params.limit || 10,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  const { data, error, isLoading, isValidating, mutate } = useSWR<CoursesResponse | Course[]>(
    swrKey,
    swrFetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  // Normalize response data
  let courses: Course[] = [];
  let pagination: CoursesResponse["pagination"] | null = null;

  if (data) {
    if (Array.isArray(data)) {
      courses = data;
    } else if (data && typeof data === "object") {
      courses = (data as CoursesResponse).data || (data as CoursesResponse).courses || [];
      pagination = (data as CoursesResponse).pagination || null;
    }
  }

  return {
    courses,
    loading: isLoading,
    isValidating,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    pagination,
    refetch: mutate,
  };
}

export function useCourse(id: string | null) {
  const swrKey = id ? API_ENDPOINTS.academyCourseById.replace("[id]", id) : null;

  const { data, error, isLoading, mutate } = useSWR<{ data?: Course; course?: Course } | Course>(
    swrKey,
    swrFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const course = data ? ((data as { data?: Course; course?: Course }).data || 
                         (data as { data?: Course; course?: Course }).course || 
                         (data as Course)) : null;

  return {
    course,
    loading: isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch: mutate,
  };
}

export function useMyCourses(params: { status?: string; page?: number; limit?: number } = {}) {
  const swrKey = createSWRKey(API_ENDPOINTS.academyMyCourses, {
    status: params.status,
    page: params.page || 1,
    limit: params.limit || 10,
  });

  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    data?: Enrollment[];
    enrollments?: Enrollment[];
    pagination?: { current: number; pages: number; total: number; limit: number; count: number };
  }>(
    swrKey,
    swrFetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  const enrollments = data?.data || data?.enrollments || [];
  const pagination = data?.pagination || null;

  return {
    enrollments,
    loading: isLoading,
    isValidating,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    pagination,
    refetch: mutate,
  };
}

