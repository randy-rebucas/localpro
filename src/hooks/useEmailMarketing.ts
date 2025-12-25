/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from '@/features/admin/hooks/useEmailMarketing' instead.
 */
export * from '@/features/admin/hooks/useEmailMarketing';
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import {
  EmailCampaign,
  CampaignStatus,
  CampaignType,
  TargetAudience,
  Subscriber,
  SubscriberStatus,
  SubscriberStats,
  EmailAnalytics,
  TopCampaign,
  DailyStats,
  AudienceEstimate,
  CampaignAnalytics,
  CreateCampaignPayload,
  UpdateCampaignPayload,
  SubscribePayload,
  UpdateSubscriberPayload,
  ImportSubscribersPayload,
  TestEmailPayload,
  CampaignFilters,
  SubscriberFilters,
  PaginationInfo,
  CampaignsResponse,
  SubscribersResponse,
} from "@/types/email-marketing";

// Helper function to build URLs with path parameters
function buildUrl(endpoint: string, params?: Record<string, string>): string {
  let url = `${API_BASE_URL}${endpoint}`;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`[${key}]`, value);
    });
  }
  return url;
}

// Helper function to normalize pagination
function normalizePagination(pagination?: PaginationInfo | null): PaginationInfo | null {
  if (!pagination) return null;
  return {
    currentPage: pagination.currentPage ?? pagination.current ?? 1,
    totalPages: pagination.totalPages ?? pagination.pages ?? 0,
    totalItems: pagination.totalItems ?? pagination.total ?? pagination.count ?? 0,
    itemsPerPage: pagination.itemsPerPage ?? pagination.limit ?? 20,
    hasNext: pagination.hasNext ?? (
      pagination.currentPage !== undefined && pagination.totalPages !== undefined
        ? pagination.currentPage < pagination.totalPages
        : false
    ),
    hasPrev: pagination.hasPrev ?? (
      pagination.currentPage !== undefined
        ? pagination.currentPage > 1
        : false
    ),
    // Legacy fields
    current: pagination.currentPage ?? pagination.current ?? 1,
    pages: pagination.totalPages ?? pagination.pages ?? 0,
    total: pagination.totalItems ?? pagination.total ?? pagination.count ?? 0,
    limit: pagination.itemsPerPage ?? pagination.limit ?? 20,
    count: pagination.totalItems ?? pagination.count ?? 0,
  };
}

// ============================================================================
// Hook: useCampaigns - Fetch list of email campaigns
// ============================================================================

export function useCampaigns(filters: CampaignFilters = {}) {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const mountedRef = useRef(true);
  const previousFiltersRef = useRef<string>("");
  const hasFetchedRef = useRef(false);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchCampaigns = useCallback(async () => {
    if (!mountedRef.current) return;
    if (!getApiToken()) {
      setLoading(false);
      return;
    }

    const currentFilters = filtersRef.current;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (currentFilters.status) queryParams.append("status", currentFilters.status);
      if (currentFilters.type) queryParams.append("type", currentFilters.type);
      if (currentFilters.targetAudience) queryParams.append("targetAudience", currentFilters.targetAudience);
      if (currentFilters.startDate) queryParams.append("startDate", currentFilters.startDate);
      if (currentFilters.endDate) queryParams.append("endDate", currentFilters.endDate);
      if (currentFilters.search) queryParams.append("search", currentFilters.search);
      
      const page = currentFilters.page || 1;
      const limit = currentFilters.limit || 20;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      
      if (currentFilters.sortBy) queryParams.append("sortBy", currentFilters.sortBy);
      if (currentFilters.sortOrder) queryParams.append("sortOrder", currentFilters.sortOrder);

      const url = `${API_BASE_URL}${API_ENDPOINTS.emailMarketingCampaigns}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch campaigns: ${response.status}`);
      }

      const responseData: CampaignsResponse | EmailCampaign[] = await response.json();
      let campaignsData: EmailCampaign[] = [];
      let paginationData = null;

      if (Array.isArray(responseData)) {
        campaignsData = responseData;
      } else if (responseData && typeof responseData === "object") {
        const apiResponse = responseData as CampaignsResponse;
        
        if (apiResponse.data && typeof apiResponse.data === "object" && !Array.isArray(apiResponse.data)) {
          if (Array.isArray(apiResponse.data.campaigns)) {
            campaignsData = apiResponse.data.campaigns;
            paginationData = apiResponse.data.pagination || null;
          }
        } else if (Array.isArray(apiResponse.campaigns)) {
          campaignsData = apiResponse.campaigns;
          paginationData = apiResponse.pagination || null;
        } else if (Array.isArray(apiResponse.data)) {
          campaignsData = apiResponse.data as unknown as EmailCampaign[];
        }
      }

      if (mountedRef.current) {
        setCampaigns(campaignsData);
        setPagination(normalizePagination(paginationData));
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching campaigns", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setCampaigns([]);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!hasFetchedRef.current || previousFiltersRef.current !== filtersKey) {
      previousFiltersRef.current = filtersKey;
      hasFetchedRef.current = true;
      fetchCampaigns();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [filtersKey, fetchCampaigns]);

  return {
    campaigns,
    loading,
    error,
    pagination,
    refetch: fetchCampaigns,
  };
}

// ============================================================================
// Hook: useCampaign - Fetch single campaign
// ============================================================================

export function useCampaign(id: string | null) {
  const [campaign, setCampaign] = useState<EmailCampaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchCampaign = useCallback(async () => {
    if (!id || !mountedRef.current) return;
    if (!getApiToken()) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.emailMarketingCampaignsById, { id });
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch campaign: ${response.status}`);
      }

      const responseData = await response.json();
      let campaignData: EmailCampaign | null = null;
      
      if (responseData && typeof responseData === "object") {
        if (responseData.data && typeof responseData.data === "object") {
          campaignData = responseData.data as EmailCampaign;
        } else if (responseData.campaign) {
          campaignData = responseData.campaign as EmailCampaign;
        } else if (responseData._id || responseData.id) {
          campaignData = responseData as EmailCampaign;
        }
      }

      if (mountedRef.current) {
        setCampaign(campaignData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching campaign", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setCampaign(null);
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    fetchCampaign();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchCampaign]);

  return {
    campaign,
    loading,
    error,
    refetch: fetchCampaign,
  };
}

// ============================================================================
// Hook: useCampaignCRUD - Create, Update, Delete Campaigns
// ============================================================================

export function useCampaignCRUD() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCampaign = useCallback(async (payload: CreateCampaignPayload): Promise<EmailCampaign | null> => {
    if (!getApiToken()) return null;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.emailMarketingCampaigns}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(payload),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || errorData?.error || `Failed to create campaign: ${response.status}`);
      }

      const data = await response.json();
      return data?.data?.campaign || data?.campaign || data?.data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error creating campaign", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCampaign = useCallback(async (id: string, payload: UpdateCampaignPayload): Promise<EmailCampaign | null> => {
    if (!getApiToken()) return null;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.emailMarketingCampaignsById, { id });
      const response = await fetch(url, createAuthFetchOptions({
        method: "PUT",
        body: JSON.stringify(payload),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || errorData?.error || `Failed to update campaign: ${response.status}`);
      }

      const data = await response.json();
      return data?.data?.campaign || data?.campaign || data?.data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error updating campaign", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCampaign = useCallback(async (id: string): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.emailMarketingCampaignsById, { id });
      const response = await fetch(url, createAuthFetchOptions({
        method: "DELETE",
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || errorData?.error || `Failed to delete campaign: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error deleting campaign", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const duplicateCampaign = useCallback(async (id: string): Promise<EmailCampaign | null> => {
    if (!getApiToken()) return null;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.emailMarketingCampaignsDuplicate, { id });
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || errorData?.error || `Failed to duplicate campaign: ${response.status}`);
      }

      const data = await response.json();
      return data?.data?.campaign || data?.campaign || data?.data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error duplicating campaign", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    duplicateCampaign,
  };
}

// ============================================================================
// Hook: useCampaignActions - Send, Pause, Resume, Cancel, Test
// ============================================================================

export function useCampaignActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCampaign = useCallback(async (id: string): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.emailMarketingCampaignsSend, { id });
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || errorData?.error || `Failed to send campaign: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error sending campaign", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const pauseCampaign = useCallback(async (id: string): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.emailMarketingCampaignsPause, { id });
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || errorData?.error || `Failed to pause campaign: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error pausing campaign", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const resumeCampaign = useCallback(async (id: string): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.emailMarketingCampaignsResume, { id });
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || errorData?.error || `Failed to resume campaign: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error resuming campaign", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelCampaign = useCallback(async (id: string): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.emailMarketingCampaignsCancel, { id });
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || errorData?.error || `Failed to cancel campaign: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error cancelling campaign", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendTestEmail = useCallback(async (id: string, payload: TestEmailPayload): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.emailMarketingCampaignsTest, { id });
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(payload),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || errorData?.error || `Failed to send test email: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error sending test email", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    sendCampaign,
    pauseCampaign,
    resumeCampaign,
    cancelCampaign,
    sendTestEmail,
  };
}

// ============================================================================
// Hook: useCampaignAnalytics - Fetch campaign analytics
// ============================================================================

export function useCampaignAnalytics(id: string | null) {
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAnalytics = useCallback(async () => {
    if (!id || !mountedRef.current) return;
    if (!getApiToken()) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.emailMarketingCampaignsAnalytics, { id });
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch campaign analytics: ${response.status}`);
      }

      const responseData = await response.json();
      const analyticsData = responseData?.data?.analytics || responseData?.analytics || responseData?.data || null;

      if (mountedRef.current) {
        setAnalytics(analyticsData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching campaign analytics", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setAnalytics(null);
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAnalytics();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}

// ============================================================================
// Hook: useAudienceEstimate - Estimate audience size
// ============================================================================

export function useAudienceEstimate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimateAudience = useCallback(async (
    targetAudience: TargetAudience,
    targetSegments?: string[],
    customQuery?: Record<string, unknown>
  ): Promise<AudienceEstimate | null> => {
    if (!getApiToken()) return null;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.emailMarketingCampaignsEstimate}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify({ targetAudience, targetSegments, customQuery }),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || errorData?.error || `Failed to estimate audience: ${response.status}`);
      }

      const data = await response.json();
      return data?.data || data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error estimating audience", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    estimateAudience,
  };
}

// ============================================================================
// Hook: useSubscribers - Fetch list of subscribers
// ============================================================================

export function useSubscribers(filters: SubscriberFilters = {}) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const mountedRef = useRef(true);
  const previousFiltersRef = useRef<string>("");
  const hasFetchedRef = useRef(false);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchSubscribers = useCallback(async () => {
    if (!mountedRef.current) return;
    if (!getApiToken()) {
      setLoading(false);
      return;
    }

    const currentFilters = filtersRef.current;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (currentFilters.status) queryParams.append("status", currentFilters.status);
      if (currentFilters.source) queryParams.append("source", currentFilters.source);
      if (currentFilters.tags?.length) queryParams.append("tags", currentFilters.tags.join(","));
      if (currentFilters.search) queryParams.append("search", currentFilters.search);
      
      const page = currentFilters.page || 1;
      const limit = currentFilters.limit || 20;
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      
      if (currentFilters.sortBy) queryParams.append("sortBy", currentFilters.sortBy);
      if (currentFilters.sortOrder) queryParams.append("sortOrder", currentFilters.sortOrder);

      const url = `${API_BASE_URL}${API_ENDPOINTS.emailMarketingSubscribers}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch subscribers: ${response.status}`);
      }

      const responseData: SubscribersResponse | Subscriber[] = await response.json();
      let subscribersData: Subscriber[] = [];
      let paginationData = null;

      if (Array.isArray(responseData)) {
        subscribersData = responseData;
      } else if (responseData && typeof responseData === "object") {
        const apiResponse = responseData as SubscribersResponse;
        
        if (apiResponse.data && typeof apiResponse.data === "object" && !Array.isArray(apiResponse.data)) {
          if (Array.isArray(apiResponse.data.subscribers)) {
            subscribersData = apiResponse.data.subscribers;
            paginationData = apiResponse.data.pagination || null;
          }
        } else if (Array.isArray(apiResponse.subscribers)) {
          subscribersData = apiResponse.subscribers;
          paginationData = apiResponse.pagination || null;
        } else if (Array.isArray(apiResponse.data)) {
          subscribersData = apiResponse.data as unknown as Subscriber[];
        }
      }

      if (mountedRef.current) {
        setSubscribers(subscribersData);
        setPagination(normalizePagination(paginationData));
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching subscribers", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setSubscribers([]);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!hasFetchedRef.current || previousFiltersRef.current !== filtersKey) {
      previousFiltersRef.current = filtersKey;
      hasFetchedRef.current = true;
      fetchSubscribers();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [filtersKey, fetchSubscribers]);

  return {
    subscribers,
    loading,
    error,
    pagination,
    refetch: fetchSubscribers,
  };
}

// ============================================================================
// Hook: useSubscriber - Fetch single subscriber
// ============================================================================

export function useSubscriber(id: string | null) {
  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchSubscriber = useCallback(async () => {
    if (!id || !mountedRef.current) return;
    if (!getApiToken()) return;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.emailMarketingSubscribersById, { id });
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch subscriber: ${response.status}`);
      }

      const responseData = await response.json();
      let subscriberData: Subscriber | null = null;
      
      if (responseData && typeof responseData === "object") {
        if (responseData.data && typeof responseData.data === "object") {
          subscriberData = responseData.data as Subscriber;
        } else if (responseData.subscriber) {
          subscriberData = responseData.subscriber as Subscriber;
        } else if (responseData._id || responseData.id) {
          subscriberData = responseData as Subscriber;
        }
      }

      if (mountedRef.current) {
        setSubscriber(subscriberData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching subscriber", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setSubscriber(null);
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;
    fetchSubscriber();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchSubscriber]);

  return {
    subscriber,
    loading,
    error,
    refetch: fetchSubscriber,
  };
}

// ============================================================================
// Hook: useSubscriberCRUD - Create, Update, Delete Subscribers
// ============================================================================

export function useSubscriberCRUD() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSubscriber = useCallback(async (id: string, payload: UpdateSubscriberPayload): Promise<Subscriber | null> => {
    if (!getApiToken()) return null;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.emailMarketingSubscribersById, { id });
      const response = await fetch(url, createAuthFetchOptions({
        method: "PUT",
        body: JSON.stringify(payload),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || errorData?.error || `Failed to update subscriber: ${response.status}`);
      }

      const data = await response.json();
      return data?.data?.subscriber || data?.subscriber || data?.data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error updating subscriber", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteSubscriber = useCallback(async (id: string): Promise<boolean> => {
    if (!getApiToken()) return false;

    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.emailMarketingSubscribersById, { id });
      const response = await fetch(url, createAuthFetchOptions({
        method: "DELETE",
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || errorData?.error || `Failed to delete subscriber: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error deleting subscriber", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const importSubscribers = useCallback(async (payload: ImportSubscribersPayload): Promise<{ imported: number; skipped: number } | null> => {
    if (!getApiToken()) return null;

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.emailMarketingSubscribersImport}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify(payload),
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || errorData?.error || `Failed to import subscribers: ${response.status}`);
      }

      const data = await response.json();
      return data?.data || data || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error importing subscribers", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportSubscribers = useCallback(async (filters?: SubscriberFilters): Promise<Blob | null> => {
    if (!getApiToken()) return null;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append("status", filters.status);
      if (filters?.source) queryParams.append("source", filters.source);
      if (filters?.tags?.length) queryParams.append("tags", filters.tags.join(","));

      const url = `${API_BASE_URL}${API_ENDPOINTS.emailMarketingSubscribersExport}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || errorData?.error || `Failed to export subscribers: ${response.status}`);
      }

      return await response.blob();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error exporting subscribers", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    updateSubscriber,
    deleteSubscriber,
    importSubscribers,
    exportSubscribers,
  };
}

// ============================================================================
// Hook: useSubscriberStats - Fetch subscriber statistics
// ============================================================================

export function useSubscriberStats() {
  const [stats, setStats] = useState<SubscriberStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchStats = useCallback(async () => {
    if (!mountedRef.current) return;
    if (!getApiToken()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.emailMarketingSubscribersStats}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch subscriber stats: ${response.status}`);
      }

      const responseData = await response.json();
      const statsData = responseData?.data?.stats || responseData?.stats || responseData?.data || null;

      if (mountedRef.current) {
        setStats(statsData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching subscriber stats", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setStats(null);
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
// Hook: useEmailAnalytics - Fetch overall email marketing analytics
// ============================================================================

export function useEmailAnalytics() {
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchAnalytics = useCallback(async () => {
    if (!mountedRef.current) return;
    if (!getApiToken()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.emailMarketingAnalytics}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch email analytics: ${response.status}`);
      }

      const responseData = await response.json();
      const analyticsData = responseData?.data?.analytics || responseData?.analytics || responseData?.data || null;

      if (mountedRef.current) {
        setAnalytics(analyticsData);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching email analytics", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setAnalytics(null);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchAnalytics();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}

// ============================================================================
// Hook: useTopCampaigns - Fetch top performing campaigns
// ============================================================================

export function useTopCampaigns(limit: number = 10) {
  const [campaigns, setCampaigns] = useState<TopCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchTopCampaigns = useCallback(async () => {
    if (!mountedRef.current) return;
    if (!getApiToken()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.emailMarketingAnalyticsTop}?limit=${limit}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch top campaigns: ${response.status}`);
      }

      const responseData = await response.json();
      const campaignsData = responseData?.data?.campaigns || responseData?.campaigns || responseData?.data || [];

      if (mountedRef.current) {
        setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching top campaigns", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setCampaigns([]);
        setLoading(false);
      }
    }
  }, [limit]);

  useEffect(() => {
    mountedRef.current = true;
    fetchTopCampaigns();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchTopCampaigns]);

  return {
    campaigns,
    loading,
    error,
    refetch: fetchTopCampaigns,
  };
}

// ============================================================================
// Hook: useDailyStats - Fetch daily email statistics
// ============================================================================

export function useDailyStats(days: number = 30) {
  const [stats, setStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchDailyStats = useCallback(async () => {
    if (!mountedRef.current) return;
    if (!getApiToken()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.emailMarketingAnalyticsDaily}?days=${days}`;
      const response = await fetch(url, createAuthFetchOptions());

      if (!response.ok) {
        throw new Error(`Failed to fetch daily stats: ${response.status}`);
      }

      const responseData = await response.json();
      const statsData = responseData?.data?.stats || responseData?.stats || responseData?.data || [];

      if (mountedRef.current) {
        setStats(Array.isArray(statsData) ? statsData : []);
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error fetching daily stats", err instanceof Error ? err : new Error(errorMessage));
      if (mountedRef.current) {
        setError(errorMessage);
        setStats([]);
        setLoading(false);
      }
    }
  }, [days]);

  useEffect(() => {
    mountedRef.current = true;
    fetchDailyStats();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchDailyStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchDailyStats,
  };
}

// ============================================================================
// Hook: usePublicSubscription - Public subscription actions (no auth required)
// ============================================================================

export function usePublicSubscription() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subscribe = useCallback(async (payload: SubscribePayload): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_BASE_URL}${API_ENDPOINTS.emailMarketingSubscribe}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || errorData?.error || `Failed to subscribe: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error subscribing", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmSubscription = useCallback(async (token: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.emailMarketingConfirm, { token });
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || errorData?.error || `Failed to confirm subscription: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error confirming subscription", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async (token: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const url = buildUrl(API_ENDPOINTS.emailMarketingUnsubscribe, { token });
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || errorData?.error || `Failed to unsubscribe: ${response.status}`);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error("Error unsubscribing", err instanceof Error ? err : new Error(errorMessage));
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    subscribe,
    confirmSubscription,
    unsubscribe,
  };
}

// Export types for external use
export type {
  EmailCampaign,
  CampaignStatus,
  CampaignType,
  TargetAudience,
  Subscriber,
  SubscriberStatus,
  SubscriberStats,
  EmailAnalytics,
  TopCampaign,
  DailyStats,
  AudienceEstimate,
  CampaignAnalytics,
  CreateCampaignPayload,
  UpdateCampaignPayload,
  SubscribePayload,
  UpdateSubscriberPayload,
  ImportSubscribersPayload,
  TestEmailPayload,
  CampaignFilters,
  SubscriberFilters,
  PaginationInfo,
};

