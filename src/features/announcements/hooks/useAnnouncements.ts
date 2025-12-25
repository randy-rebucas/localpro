"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { 
  Announcement, 
  AnnouncementType, 
  Priority, 
  AnnouncementStatus, 
  TargetAudience 
} from "@/types/announcements";

export interface AnnouncementsParams {
  type?: AnnouncementType | string;
  priority?: Priority | string;
  status?: AnnouncementStatus | string;
  targetAudience?: TargetAudience | string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface AnnouncementsResponse {
  success?: boolean;
  data?: {
    announcements?: Announcement[];
    pagination?: {
      // Actual API response structure
      currentPage?: number;
      totalPages?: number;
      totalItems?: number;
      itemsPerPage?: number;
      hasNext?: boolean;
      hasPrev?: boolean;
      // Legacy/alternative field names for backward compatibility
      current?: number;
      pages?: number;
      total?: number;
      limit?: number;
      count?: number;
    };
  };
  // Fallback for direct array or alternative response formats
  announcements?: Announcement[];
  pagination?: {
    currentPage?: number;
    totalPages?: number;
    totalItems?: number;
    itemsPerPage?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
    // Legacy/alternative field names
    current?: number;
    pages?: number;
    total?: number;
    limit?: number;
    count?: number;
  };
}

export function useAnnouncements(params: AnnouncementsParams = {}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true); // Start as true to show loading initially
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<AnnouncementsResponse["pagination"] | null>(null);
  const mountedRef = useRef(true);
  const previousParamsRef = useRef<string>("");
  const hasFetchedRef = useRef(false); // Track if we've done an initial fetch

  // Create a stable string representation of params for comparison
  const paramsKey = useMemo(() => JSON.stringify(params), [params]);

  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetchAnnouncements = useCallback(async () => {
    if (!mountedRef.current) return;

    const currentParams = paramsRef.current;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (currentParams.type) queryParams.append("type", currentParams.type);
      if (currentParams.priority) queryParams.append("priority", currentParams.priority);
      if (currentParams.status) queryParams.append("status", currentParams.status);
      if (currentParams.targetAudience) queryParams.append("targetAudience", currentParams.targetAudience);
      
      const page = currentParams.page || 1;
      const limit = currentParams.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      
      if (currentParams.sortBy) queryParams.append("sortBy", currentParams.sortBy);
      if (currentParams.sortOrder) queryParams.append("sortOrder", currentParams.sortOrder);

      const url = `${API_BASE_URL}${API_ENDPOINTS.announcements}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch announcements: ${response.status}`);
      }

      const responseData: AnnouncementsResponse | Announcement[] = await response.json();
      let announcementsData: Announcement[] = [];
      let paginationData = null;

      if (Array.isArray(responseData)) {
        // Direct array response (fallback)
        announcementsData = responseData;
      } else if (responseData && typeof responseData === "object") {
        const apiResponse = responseData as AnnouncementsResponse;
        
        // Check for nested structure: { success, data: { announcements: [...], pagination: {...} } }
        // This matches the API endpoint spec: Response: { success, data: { announcements: [...], pagination:{...} } }
        if (apiResponse.data && typeof apiResponse.data === "object" && !Array.isArray(apiResponse.data)) {
          if (Array.isArray(apiResponse.data.announcements)) {
            announcementsData = apiResponse.data.announcements;
            paginationData = apiResponse.data.pagination || null;
          }
        } else if (Array.isArray(apiResponse.announcements)) {
          // Fallback: { announcements: [...], pagination: {...} }
          announcementsData = apiResponse.announcements;
          paginationData = apiResponse.pagination || null;
        } else if (Array.isArray(apiResponse.data)) {
          // Fallback: { data: [...] }
          announcementsData = apiResponse.data;
        }
      }

      if (mountedRef.current) {
        // Only update state if data actually changed to prevent unnecessary re-renders
        setAnnouncements(prev => {
          // Compare by JSON string to check if data actually changed
          const prevStr = JSON.stringify(prev);
          const newStr = JSON.stringify(announcementsData);
          return prevStr === newStr ? prev : announcementsData;
        });
        
        // Normalize pagination to support both API formats
        // Actual API format: { currentPage, totalPages, totalItems, itemsPerPage, hasNext, hasPrev }
        // Legacy format: { current, pages, total, limit, count }
        const normalizedPagination = paginationData ? {
          // Actual API response fields
          currentPage: paginationData.currentPage ?? paginationData.current ?? 1,
          totalPages: paginationData.totalPages ?? paginationData.pages ?? 0,
          totalItems: paginationData.totalItems ?? paginationData.total ?? paginationData.count ?? 0,
          itemsPerPage: paginationData.itemsPerPage ?? paginationData.limit ?? 20,
          hasNext: paginationData.hasNext ?? (
            paginationData.currentPage !== undefined && paginationData.totalPages !== undefined
              ? paginationData.currentPage < paginationData.totalPages
              : false
          ),
          hasPrev: paginationData.hasPrev ?? (
            paginationData.currentPage !== undefined
              ? paginationData.currentPage > 1
              : false
          ),
          // Legacy fields for backward compatibility
          current: paginationData.currentPage ?? paginationData.current ?? 1,
          pages: paginationData.totalPages ?? paginationData.pages ?? 0,
          total: paginationData.totalItems ?? paginationData.total ?? paginationData.count ?? 0,
          limit: paginationData.itemsPerPage ?? paginationData.limit ?? 20,
          count: paginationData.totalItems ?? paginationData.count ?? 0,
        } : null;
        
        setPagination(normalizedPagination);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching announcements", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setAnnouncements([]);
        setLoading(false);
      }
    }
  }, []); // Empty deps - params accessed via ref

  useEffect(() => {
    mountedRef.current = true;
    
    // Always fetch on initial mount, then only refetch if params changed
    if (!hasFetchedRef.current || previousParamsRef.current !== paramsKey) {
      previousParamsRef.current = paramsKey;
      hasFetchedRef.current = true;
      fetchAnnouncements();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [paramsKey, fetchAnnouncements]);

  return {
    announcements,
    loading,
    error,
    pagination,
    refetch: fetchAnnouncements,
  };
}

export function useAnnouncement(id: string | null) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAnnouncement = useCallback(async () => {
    if (!id || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.announcementsById.replace("[id]", id)}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch announcement: ${response.status}`);
      }

      const responseData = await response.json();
      
      // According to API spec: Response: { success, data: { ...announcement, isAcknowledged, canComment, canAcknowledge } }
      let announcementData: Announcement | null = null;
      
      if (responseData && typeof responseData === "object") {
        // Check for nested structure: { success, data: { ...announcement } }
        if (responseData.data && typeof responseData.data === "object") {
          announcementData = responseData.data as Announcement;
        } else if (responseData.announcement) {
          // Fallback: { announcement: {...} }
          announcementData = responseData.announcement as Announcement;
        } else if (responseData._id || responseData.id) {
          // Fallback: direct announcement object
          announcementData = responseData as Announcement;
        }
      }

      if (mountedRef.current) {
        setAnnouncement(announcementData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching announcement", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setAnnouncement(null);
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAnnouncement();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAnnouncement]);

  return {
    announcement,
    loading,
    error,
    refetch: fetchAnnouncement,
  };
}

