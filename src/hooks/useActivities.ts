"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

// ============================================================================
// Types & Interfaces
// ============================================================================

export type ActivityType = 
  | "post"
  | "comment"
  | "like"
  | "share"
  | "follow"
  | "booking_created"
  | "booking_completed"
  | "job_posted"
  | "job_applied"
  | "service_created"
  | "review_posted"
  | "payment_received"
  | "course_enrolled"
  | "course_completed"
  | "achievement_earned"
  | "referral_made"
  | "profile_updated"
  | "verification_completed"
  | "subscription_started"
  | "supply_listed"
  | "rental_listed"
  | "system";

export type ActivityCategory = 
  | "social"
  | "marketplace"
  | "learning"
  | "financial"
  | "profile"
  | "achievement"
  | "system";

export type ActivityVisibility = "public" | "followers" | "private";

export type InteractionType = "like" | "comment" | "share" | "save" | "report";

export interface ActivityUser {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  avatar?: string;
  roles?: string[];
}

export interface ActivityInteraction {
  _id?: string;
  id?: string;
  user: string | ActivityUser;
  type: InteractionType;
  content?: string;
  createdAt?: string | Date;
}

export interface ActivityMedia {
  type: "image" | "video" | "document" | "link";
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  mimeType?: string;
  size?: number;
}

export interface Activity {
  _id?: string;
  id?: string;
  user: string | ActivityUser;
  type: ActivityType;
  category?: ActivityCategory;
  title?: string;
  content?: string;
  description?: string;
  media?: ActivityMedia[];
  metadata?: Record<string, unknown>;
  visibility?: ActivityVisibility;
  interactions?: ActivityInteraction[];
  interactionCounts?: {
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
  };
  points?: number;
  tags?: string[];
  mentions?: string[];
  relatedEntity?: {
    type: string;
    id: string;
    name?: string;
  };
  isEdited?: boolean;
  editedAt?: string | Date;
  expiresAt?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ActivityStats {
  totalActivities: number;
  byType: Record<ActivityType, number>;
  byCategory: Record<ActivityCategory, number>;
  totalInteractions: number;
  totalPoints: number;
  averageEngagement?: number;
  thisWeek?: {
    activities: number;
    interactions: number;
    points: number;
  };
  thisMonth?: {
    activities: number;
    interactions: number;
    points: number;
  };
}

export interface GlobalStats {
  totalUsers: number;
  totalActivities: number;
  totalInteractions: number;
  activeUsersToday: number;
  activeUsersWeek: number;
  topActivityTypes: Array<{ type: ActivityType; count: number }>;
  topCategories: Array<{ category: ActivityCategory; count: number }>;
  engagementRate: number;
}

export interface ActivityMetadata {
  types: Array<{ value: ActivityType; label: string; description?: string }>;
  categories: Array<{ value: ActivityCategory; label: string; color?: string }>;
  interactionTypes: Array<{ value: InteractionType; label: string }>;
  visibilityOptions: Array<{ value: ActivityVisibility; label: string }>;
}

export interface LeaderboardEntry {
  rank: number;
  user: ActivityUser;
  points: number;
  activitiesCount?: number;
  badgesCount?: number;
  streak?: number;
}

export interface ActivitiesParams {
  page?: number;
  limit?: number;
  type?: ActivityType | ActivityType[];
  category?: ActivityCategory | ActivityCategory[];
  userId?: string;
  visibility?: ActivityVisibility;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  tags?: string[];
}

export interface TimelineParams {
  startDate: string;
  endDate: string;
  groupBy?: "day" | "week" | "month";
  type?: ActivityType[];
  category?: ActivityCategory[];
}

export interface PaginationInfo {
  current: number;
  pages: number;
  total: number;
  limit: number;
}

export interface CreateActivityPayload {
  type: ActivityType;
  category?: ActivityCategory;
  title?: string;
  content?: string;
  description?: string;
  media?: ActivityMedia[];
  metadata?: Record<string, unknown>;
  visibility?: ActivityVisibility;
  tags?: string[];
  mentions?: string[];
  relatedEntity?: {
    type: string;
    id: string;
    name?: string;
  };
}

export interface UpdateActivityPayload {
  title?: string;
  content?: string;
  description?: string;
  media?: ActivityMedia[];
  visibility?: ActivityVisibility;
  tags?: string[];
  mentions?: string[];
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildUrl(endpoint: string, pathParams?: Record<string, string>, queryParams?: Record<string, string | string[] | undefined>): string {
  let url = `${API_BASE_URL}${endpoint}`;
  
  // Replace path parameters
  if (pathParams) {
    Object.entries(pathParams).forEach(([key, value]) => {
      url = url.replace(`[${key}]`, encodeURIComponent(value));
    });
  }
  
  // Add query parameters
  if (queryParams && Object.keys(queryParams).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        } else {
          searchParams.append(key, value);
        }
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  return url;
}

// ============================================================================
// Main Hook: useActivityFeed - Get Activity Feed
// ============================================================================

export function useActivityFeed(params: ActivitiesParams = {}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const mountedRef = useRef(true);

  const fetchFeed = useCallback(async (append: boolean = false) => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string | string[] | undefined> = {};
      if (params.page) queryParams.page = params.page.toString();
      if (params.limit) queryParams.limit = params.limit.toString();
      if (params.type) queryParams.type = Array.isArray(params.type) ? params.type : [params.type];
      if (params.category) queryParams.category = Array.isArray(params.category) ? params.category : [params.category];
      if (params.visibility) queryParams.visibility = params.visibility;
      if (params.tags) queryParams.tags = params.tags;

      const url = buildUrl(API_ENDPOINTS.activitiesFeed, undefined, queryParams);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch activity feed: ${response.status}`);
      }

      const data = await response.json();
      const activitiesData = data?.data?.activities || data?.activities || data?.data || [];
      const paginationData = data?.data?.pagination || data?.pagination || null;

      if (mountedRef.current) {
        if (append) {
          setActivities(prev => [...prev, ...activitiesData]);
        } else {
          setActivities(activitiesData);
        }
        setPagination(paginationData);
        setHasMore(activitiesData.length === (params.limit || 10));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching activity feed", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        if (!append) setActivities([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [params.page, params.limit, params.type, params.category, params.visibility, params.tags]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && pagination) {
      fetchFeed(true);
    }
  }, [loading, hasMore, pagination, fetchFeed]);

  useEffect(() => {
    mountedRef.current = true;
    fetchFeed();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchFeed]);

  return {
    activities,
    loading,
    error,
    pagination,
    hasMore,
    refetch: () => fetchFeed(false),
    loadMore,
  };
}

// ============================================================================
// Hook: useMyActivities - Get Current User's Activities
// ============================================================================

export function useMyActivities(params: ActivitiesParams = {}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const mountedRef = useRef(true);

  const fetchMyActivities = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string | string[] | undefined> = {};
      if (params.page) queryParams.page = params.page.toString();
      if (params.limit) queryParams.limit = params.limit.toString();
      if (params.type) queryParams.type = Array.isArray(params.type) ? params.type : [params.type];
      if (params.category) queryParams.category = Array.isArray(params.category) ? params.category : [params.category];
      if (params.startDate) queryParams.startDate = params.startDate;
      if (params.endDate) queryParams.endDate = params.endDate;
      if (params.sortBy) queryParams.sortBy = params.sortBy;
      if (params.sortOrder) queryParams.sortOrder = params.sortOrder;

      const url = buildUrl(API_ENDPOINTS.activitiesMy, undefined, queryParams);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch my activities: ${response.status}`);
      }

      const data = await response.json();
      const activitiesData = data?.data?.activities || data?.activities || data?.data || [];
      const paginationData = data?.data?.pagination || data?.pagination || null;

      if (mountedRef.current) {
        setActivities(activitiesData);
        setPagination(paginationData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching my activities", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setActivities([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [params.page, params.limit, params.type, params.category, params.startDate, params.endDate, params.sortBy, params.sortOrder]);

  useEffect(() => {
    mountedRef.current = true;
    fetchMyActivities();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchMyActivities]);

  return {
    activities,
    loading,
    error,
    pagination,
    refetch: fetchMyActivities,
  };
}

// ============================================================================
// Hook: useUserActivities - Get Specific User's Activities
// ============================================================================

export function useUserActivities(userId: string | null, params: ActivitiesParams = {}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const mountedRef = useRef(true);

  const fetchUserActivities = useCallback(async () => {
    if (!getApiToken() || !userId || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string | string[] | undefined> = {};
      if (params.page) queryParams.page = params.page.toString();
      if (params.limit) queryParams.limit = params.limit.toString();
      if (params.type) queryParams.type = Array.isArray(params.type) ? params.type : [params.type];
      if (params.category) queryParams.category = Array.isArray(params.category) ? params.category : [params.category];

      const url = buildUrl(API_ENDPOINTS.activitiesUserById, { userId }, queryParams);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch user activities: ${response.status}`);
      }

      const data = await response.json();
      const activitiesData = data?.data?.activities || data?.activities || data?.data || [];
      const paginationData = data?.data?.pagination || data?.pagination || null;

      if (mountedRef.current) {
        setActivities(activitiesData);
        setPagination(paginationData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching user activities", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setActivities([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [userId, params.page, params.limit, params.type, params.category]);

  useEffect(() => {
    mountedRef.current = true;
    fetchUserActivities();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchUserActivities]);

  return {
    activities,
    loading,
    error,
    pagination,
    refetch: fetchUserActivities,
  };
}

// ============================================================================
// Hook: useActivityDetails - Get Single Activity
// ============================================================================

export function useActivityDetails(activityId: string | null) {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchActivity = useCallback(async () => {
    if (!getApiToken() || !activityId || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.activitiesById, { id: activityId });
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch activity: ${response.status}`);
      }

      const data = await response.json();
      const activityData = data?.data?.activity || data?.activity || data?.data || null;

      if (mountedRef.current) {
        setActivity(activityData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching activity details", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [activityId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchActivity();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchActivity]);

  return {
    activity,
    loading,
    error,
    refetch: fetchActivity,
  };
}

// ============================================================================
// Hook: useActivityTimeline - Get Timeline by Date
// ============================================================================

export function useActivityTimeline(params: TimelineParams) {
  const [timeline, setTimeline] = useState<Array<{ date: string; activities: Activity[]; count: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchTimeline = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string | string[] | undefined> = {
        startDate: params.startDate,
        endDate: params.endDate,
      };
      if (params.groupBy) queryParams.groupBy = params.groupBy;
      if (params.type) queryParams.type = params.type;
      if (params.category) queryParams.category = params.category;

      const url = buildUrl(API_ENDPOINTS.activitiesTimeline, undefined, queryParams);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch activity timeline: ${response.status}`);
      }

      const data = await response.json();
      const timelineData = data?.data?.timeline || data?.timeline || data?.data || [];

      if (mountedRef.current) {
        setTimeline(timelineData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching activity timeline", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setTimeline([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [params.startDate, params.endDate, params.groupBy, params.type, params.category]);

  useEffect(() => {
    mountedRef.current = true;
    fetchTimeline();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchTimeline]);

  return {
    timeline,
    loading,
    error,
    refetch: fetchTimeline,
  };
}

// ============================================================================
// Hook: useMyActivityStats - Get My Statistics
// ============================================================================

export function useMyActivityStats() {
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchStats = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.activitiesStatsMy);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch my activity stats: ${response.status}`);
      }

      const data = await response.json();
      const statsData = data?.data?.stats || data?.stats || data?.data || null;

      if (mountedRef.current) {
        setStats(statsData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching my activity stats", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchStats();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

// ============================================================================
// Hook: useGlobalActivityStats - Get Global Statistics (Admin)
// ============================================================================

export function useGlobalActivityStats() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchStats = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.activitiesStatsGlobal);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        // 403 is expected for non-admin users - handle silently
        if (response.status === 403) {
          if (mountedRef.current) {
            setStats(null);
          }
          return;
        }
        throw new Error(`Failed to fetch global activity stats: ${response.status}`);
      }

      const data = await response.json();
      const statsData = data?.data?.stats || data?.stats || data?.data || null;

      if (mountedRef.current) {
        setStats(statsData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching global activity stats", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchStats();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

// ============================================================================
// Hook: useActivityMetadata - Get Types & Categories
// ============================================================================

export function useActivityMetadata() {
  const [metadata, setMetadata] = useState<ActivityMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchMetadata = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.activitiesMetadata);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch activity metadata: ${response.status}`);
      }

      const data = await response.json();
      const metadataData = data?.data?.metadata || data?.metadata || data?.data || null;

      if (mountedRef.current) {
        setMetadata(metadataData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching activity metadata", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchMetadata();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchMetadata]);

  return {
    metadata,
    loading,
    error,
    refetch: fetchMetadata,
  };
}

// ============================================================================
// Hook: useMyPoints - Get My Total Points
// ============================================================================

export function useMyPoints() {
  const [points, setPoints] = useState<number>(0);
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchPoints = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.activitiesPoints);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch points: ${response.status}`);
      }

      const data = await response.json();
      const pointsData = data?.data?.points ?? data?.points ?? 0;
      const breakdownData = data?.data?.breakdown || data?.breakdown || {};

      if (mountedRef.current) {
        setPoints(pointsData);
        setBreakdown(breakdownData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching points", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchPoints();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchPoints]);

  return {
    points,
    breakdown,
    loading,
    error,
    refetch: fetchPoints,
  };
}

// ============================================================================
// Hook: useLeaderboard - Get Points Leaderboard
// ============================================================================

export function useLeaderboard(params: { limit?: number; period?: "all" | "week" | "month" } = {}) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchLeaderboard = useCallback(async () => {
    if (!getApiToken() || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string | undefined> = {};
      if (params.limit) queryParams.limit = params.limit.toString();
      if (params.period) queryParams.period = params.period;

      const url = buildUrl(API_ENDPOINTS.activitiesLeaderboard, undefined, queryParams);
      const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
      }

      const data = await response.json();
      const leaderboardData = data?.data?.leaderboard || data?.leaderboard || data?.data || [];
      const myRankData = data?.data?.myRank || data?.myRank || null;

      if (mountedRef.current) {
        setLeaderboard(leaderboardData);
        setMyRank(myRankData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching leaderboard", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setLeaderboard([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [params.limit, params.period]);

  useEffect(() => {
    mountedRef.current = true;
    fetchLeaderboard();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    myRank,
    loading,
    error,
    refetch: fetchLeaderboard,
  };
}

// ============================================================================
// Hook: useActivityCRUD - Create, Update, Delete Activities
// ============================================================================

export function useActivityCRUD() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create activity
  const createActivity = useCallback(async (payload: CreateActivityPayload): Promise<Activity | null> => {
    if (!getApiToken()) return null;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.activities);
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(payload),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Failed to create activity: ${response.status}`);
      }

      const data = await response.json();
      return data?.data?.activity || data?.activity || data?.data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error creating activity", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update activity
  const updateActivity = useCallback(async (activityId: string, payload: UpdateActivityPayload): Promise<Activity | null> => {
    if (!getApiToken()) return null;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.activitiesById, { id: activityId });
      const response = await fetch(url, createAuthFetchOptions({
        method: "PUT",
        body: JSON.stringify(payload),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Failed to update activity: ${response.status}`);
      }

      const data = await response.json();
      return data?.data?.activity || data?.activity || data?.data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error updating activity", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete activity
  const deleteActivity = useCallback(async (activityId: string): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.activitiesById, { id: activityId });
      const response = await fetch(url, createAuthFetchOptions({
        method: "DELETE",
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Failed to delete activity: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error deleting activity", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createActivity,
    updateActivity,
    deleteActivity,
  };
}

// ============================================================================
// Hook: useActivityInteractions - Add/Remove Interactions
// ============================================================================

export function useActivityInteractions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add interaction (like, comment, share, save)
  const addInteraction = useCallback(async (
    activityId: string, 
    type: InteractionType, 
    content?: string
  ): Promise<ActivityInteraction | null> => {
    if (!getApiToken()) return null;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.activitiesInteractions, { id: activityId });
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify({ type, content }),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Failed to add interaction: ${response.status}`);
      }

      const data = await response.json();
      return data?.data?.interaction || data?.interaction || data?.data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error adding interaction", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove interaction
  const removeInteraction = useCallback(async (
    activityId: string, 
    type: InteractionType
  ): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.activitiesInteractions, { id: activityId });
      const response = await fetch(url, createAuthFetchOptions({
        method: "DELETE",
        body: JSON.stringify({ type }),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `Failed to remove interaction: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error removing interaction", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Convenience methods
  const like = useCallback((activityId: string) => addInteraction(activityId, "like"), [addInteraction]);
  const unlike = useCallback((activityId: string) => removeInteraction(activityId, "like"), [removeInteraction]);
  const comment = useCallback((activityId: string, content: string) => addInteraction(activityId, "comment", content), [addInteraction]);
  const share = useCallback((activityId: string) => addInteraction(activityId, "share"), [addInteraction]);
  const save = useCallback((activityId: string) => addInteraction(activityId, "save"), [addInteraction]);
  const unsave = useCallback((activityId: string) => removeInteraction(activityId, "save"), [removeInteraction]);

  return {
    loading,
    error,
    addInteraction,
    removeInteraction,
    like,
    unlike,
    comment,
    share,
    save,
    unsave,
  };
}

// ============================================================================
// Utility: Activities API Functions (for direct use without hooks)
// ============================================================================

export const ActivitiesAPI = {
  // Get activity feed
  async getFeed(params?: ActivitiesParams) {
    const queryParams: Record<string, string | string[] | undefined> = {};
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.type) queryParams.type = Array.isArray(params.type) ? params.type : [params.type];
    if (params?.category) queryParams.category = Array.isArray(params.category) ? params.category : [params.category];

    const url = buildUrl(API_ENDPOINTS.activitiesFeed, undefined, queryParams);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch activity feed: ${response.status}`);
    }
    
    return response.json();
  },

  // Get my activities
  async getMyActivities(params?: ActivitiesParams) {
    const queryParams: Record<string, string | string[] | undefined> = {};
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();

    const url = buildUrl(API_ENDPOINTS.activitiesMy, undefined, queryParams);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch my activities: ${response.status}`);
    }
    
    return response.json();
  },

  // Get user activities
  async getUserActivities(userId: string, params?: ActivitiesParams) {
    const queryParams: Record<string, string | string[] | undefined> = {};
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.limit) queryParams.limit = params.limit.toString();

    const url = buildUrl(API_ENDPOINTS.activitiesUserById, { userId }, queryParams);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user activities: ${response.status}`);
    }
    
    return response.json();
  },

  // Get single activity
  async getById(activityId: string) {
    const url = buildUrl(API_ENDPOINTS.activitiesById, { id: activityId });
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch activity: ${response.status}`);
    }
    
    return response.json();
  },

  // Get timeline
  async getTimeline(params: TimelineParams) {
    const queryParams: Record<string, string | string[] | undefined> = {
      startDate: params.startDate,
      endDate: params.endDate,
    };
    if (params.groupBy) queryParams.groupBy = params.groupBy;

    const url = buildUrl(API_ENDPOINTS.activitiesTimeline, undefined, queryParams);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch timeline: ${response.status}`);
    }
    
    return response.json();
  },

  // Create activity
  async create(payload: CreateActivityPayload) {
    const url = buildUrl(API_ENDPOINTS.activities);
    const response = await fetch(url, createAuthFetchOptions({
      method: "POST",
      body: JSON.stringify(payload),
    }));
    
    if (!response.ok) {
      throw new Error(`Failed to create activity: ${response.status}`);
    }
    
    return response.json();
  },

  // Update activity
  async update(activityId: string, payload: UpdateActivityPayload) {
    const url = buildUrl(API_ENDPOINTS.activitiesById, { id: activityId });
    const response = await fetch(url, createAuthFetchOptions({
      method: "PUT",
      body: JSON.stringify(payload),
    }));
    
    if (!response.ok) {
      throw new Error(`Failed to update activity: ${response.status}`);
    }
    
    return response.json();
  },

  // Delete activity
  async delete(activityId: string) {
    const url = buildUrl(API_ENDPOINTS.activitiesById, { id: activityId });
    const response = await fetch(url, createAuthFetchOptions({ method: "DELETE" }));
    
    if (!response.ok) {
      throw new Error(`Failed to delete activity: ${response.status}`);
    }
    
    return response.json();
  },

  // Add interaction
  async addInteraction(activityId: string, type: InteractionType, content?: string) {
    const url = buildUrl(API_ENDPOINTS.activitiesInteractions, { id: activityId });
    const response = await fetch(url, createAuthFetchOptions({
      method: "POST",
      body: JSON.stringify({ type, content }),
    }));
    
    if (!response.ok) {
      throw new Error(`Failed to add interaction: ${response.status}`);
    }
    
    return response.json();
  },

  // Remove interaction
  async removeInteraction(activityId: string, type: InteractionType) {
    const url = buildUrl(API_ENDPOINTS.activitiesInteractions, { id: activityId });
    const response = await fetch(url, createAuthFetchOptions({
      method: "DELETE",
      body: JSON.stringify({ type }),
    }));
    
    if (!response.ok) {
      throw new Error(`Failed to remove interaction: ${response.status}`);
    }
    
    return response.json();
  },

  // Get my stats
  async getMyStats() {
    const url = buildUrl(API_ENDPOINTS.activitiesStatsMy);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch my stats: ${response.status}`);
    }
    
    return response.json();
  },

  // Get global stats
  async getGlobalStats() {
    const url = buildUrl(API_ENDPOINTS.activitiesStatsGlobal);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch global stats: ${response.status}`);
    }
    
    return response.json();
  },

  // Get metadata
  async getMetadata() {
    const url = buildUrl(API_ENDPOINTS.activitiesMetadata);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`);
    }
    
    return response.json();
  },

  // Get my points
  async getMyPoints() {
    const url = buildUrl(API_ENDPOINTS.activitiesPoints);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch points: ${response.status}`);
    }
    
    return response.json();
  },

  // Get leaderboard
  async getLeaderboard(params?: { limit?: number; period?: string }) {
    const queryParams: Record<string, string | undefined> = {};
    if (params?.limit) queryParams.limit = params.limit.toString();
    if (params?.period) queryParams.period = params.period;

    const url = buildUrl(API_ENDPOINTS.activitiesLeaderboard, undefined, queryParams);
    const response = await fetch(url, createAuthFetchOptions({ method: "GET" }));
    
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.status}`);
    }
    
    return response.json();
  },
};

export default useActivityFeed;

