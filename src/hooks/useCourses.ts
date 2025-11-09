"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
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
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<CoursesResponse["pagination"] | null>(null);
  const mountedRef = useRef(true);

  const fetchCourses = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.category) queryParams.append("category", params.category);
      if (params.instructorId) queryParams.append("instructorId", params.instructorId);
      if (params.level) queryParams.append("level", params.level);
      if (params.search) queryParams.append("search", params.search);
      if (params.isActive !== undefined) queryParams.append("isActive", params.isActive.toString());
      if (params.isFeatured !== undefined) queryParams.append("isFeatured", params.isFeatured.toString());
      
      const page = params.page || 1;
      const limit = params.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      const url = `${API_BASE_URL}${API_ENDPOINTS.academyCourses}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`);
      }

      const data: CoursesResponse | Course[] = await response.json();
      let coursesData: Course[] = [];
      let paginationData = null;

      if (Array.isArray(data)) {
        coursesData = data;
      } else if (data && typeof data === "object") {
        coursesData = (data as CoursesResponse).data || (data as CoursesResponse).courses || [];
        paginationData = (data as CoursesResponse).pagination || null;
      }

      if (mountedRef.current) {
        setCourses(coursesData);
        setPagination(paginationData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching courses", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setCourses([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchCourses();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchCourses]);

  return {
    courses,
    loading,
    error,
    pagination,
    refetch: fetchCourses,
  };
}

export function useCourse(id: string | null) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchCourse = useCallback(async () => {
    if (!id || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.academyCourseById.replace("[id]", id)}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch course: ${response.status}`);
      }

      const data = await response.json();
      const courseData = data?.data || data?.course || data;

      if (mountedRef.current) {
        setCourse(courseData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching course", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setCourse(null);
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    fetchCourse();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchCourse]);

  return {
    course,
    loading,
    error,
    refetch: fetchCourse,
  };
}

export function useMyCourses(params: { status?: string; page?: number; limit?: number } = {}) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{ current: number; pages: number; total: number; limit: number; count: number } | null>(null);
  const mountedRef = useRef(true);

  const fetchEnrollments = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append("status", params.status);
      const page = params.page || 1;
      const limit = params.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());

      const url = `${API_BASE_URL}${API_ENDPOINTS.academyMyCourses}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch enrollments: ${response.status}`);
      }

      const data = await response.json();
      const enrollmentsData = data?.data || data?.enrollments || [];
      const paginationData = data?.pagination || null;

      if (mountedRef.current) {
        setEnrollments(enrollmentsData);
        setPagination(paginationData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching enrollments", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setEnrollments([]);
        setLoading(false);
      }
    }
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchEnrollments();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchEnrollments]);

  return {
    enrollments,
    loading,
    error,
    pagination,
    refetch: fetchEnrollments,
  };
}

