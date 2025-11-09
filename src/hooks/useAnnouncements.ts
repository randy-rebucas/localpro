"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { Announcement } from "@/types/announcements";

export interface AnnouncementsParams {
  type?: string;
  priority?: string;
  status?: string;
  targetAudience?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface AnnouncementsResponse {
  success?: boolean;
  data?: Announcement[];
  announcements?: Announcement[];
  pagination?: {
    current: number;
    pages: number;
    total: number;
    limit: number;
    count: number;
  };
}

export function useAnnouncements(params: AnnouncementsParams = {}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<AnnouncementsResponse["pagination"] | null>(null);
  const mountedRef = useRef(true);

  const fetchAnnouncements = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (params.type) queryParams.append("type", params.type);
      if (params.priority) queryParams.append("priority", params.priority);
      if (params.status) queryParams.append("status", params.status);
      if (params.targetAudience) queryParams.append("targetAudience", params.targetAudience);
      
      const page = params.page || 1;
      const limit = params.limit || 10;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

      const url = `${API_BASE_URL}${API_ENDPOINTS.announcements}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch announcements: ${response.status}`);
      }

      const data: AnnouncementsResponse | Announcement[] = await response.json();
      let announcementsData: Announcement[] = [];
      let paginationData = null;

      if (Array.isArray(data)) {
        announcementsData = data;
      } else if (data && typeof data === "object") {
        announcementsData = (data as AnnouncementsResponse).data || (data as AnnouncementsResponse).announcements || [];
        paginationData = (data as AnnouncementsResponse).pagination || null;
      }

      if (mountedRef.current) {
        setAnnouncements(announcementsData);
        setPagination(paginationData);
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
  }, [params]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAnnouncements();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAnnouncements]);

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

      const data = await response.json();
      const announcementData = data?.data || data?.announcement || data;

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

