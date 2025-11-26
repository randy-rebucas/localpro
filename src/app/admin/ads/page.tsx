"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { 
  Search, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Eye,
  BarChart3,
  TrendingUp,
  Clock,
  Image as ImageIcon,
  Plus,
  Edit,
  Trash2,
  Filter
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { CampaignStatus, Schedule, TargetAudience, AdLocation, AdContent, Bidding, AdType, AdCategory, BiddingStrategy } from "@/types/ads";
import { useAppSettings } from "@/hooks/useAppSettings";
import { formatCurrency } from "@/lib/currency-utils";
import { getDefaultCurrency } from "@/lib/settings-utils";

// Extended AdCampaign type to handle populated advertiser
interface AdCampaignWithAdvertiser {
  _id?: string;
  advertiser: string | {
    _id?: string;
    businessName?: string;
    businessType?: 'hardware_store' | 'supplier' | 'training_school' | 'service_provider' | 'manufacturer';
    verification?: {
      isVerified?: boolean;
    };
  };
  title: string;
  description: string;
  type: 'banner' | 'sponsored_listing' | 'video' | 'text' | 'interactive';
  category: 'hardware_stores' | 'suppliers' | 'training_schools' | 'services' | 'products';
  images?: Array<{ url?: string; publicId?: string; thumbnail?: string }> | string[];
  content?: {
    headline?: string;
    body?: string;
    images?: Array<{ url?: string; publicId?: string; thumbnail?: string }>;
    logo?: { url?: string; publicId?: string; thumbnail?: string };
    callToAction?: {
      text?: string;
      url?: string;
    };
  };
  budget: number | {
    total: number;
    daily?: number;
    currency?: string;
  };
  schedule: {
    startDate: string | Date;
    endDate: string | Date;
    timeSlots?: Array<{ day?: string; startTime?: string; endTime?: string }>;
  };
  targetAudience?: {
    demographics?: {
      ageRange?: number[];
      gender?: string[];
      location?: string[];
      interests?: string[];
    };
    behavior?: {
      userTypes?: string[];
      activityLevel?: string;
    };
  };
  location?: {
    city?: string;
    state?: string;
    country?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };
  bidding?: {
    strategy?: 'cpc' | 'cpm' | 'cpa' | 'fixed';
    bidAmount?: number;
    maxBid?: number;
  };
  performance?: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    spend?: number;
    ctr?: number;
    cpc?: number;
    cpm?: number;
  };
  status?: CampaignStatus;
  approval?: {
    reviewedBy?: string;
    reviewedAt?: string | Date;
    notes?: string;
    rejectionReason?: string;
  };
  isActive?: boolean;
  isFeatured?: boolean;
  views?: number;
  clicks?: number;
  impressions?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

interface AdStatistics {
  totalAds: number;
  pendingAds: number;
  activeAds: number;
  totalRevenue: number;
  adsByCategory: Array<{ category: string; count: number }>;
  adsByStatus: Array<{ status: string; count: number }>;
}

export default function AdminAdsPage() {
  const { settings: appSettings } = useAppSettings();
  const [ads, setAds] = useState<AdCampaignWithAdvertiser[]>([]);
  const [stats, setStats] = useState<AdStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imageUploadModalOpen, setImageUploadModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdCampaignWithAdvertiser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // Create form state
  const [createFormData, setCreateFormData] = useState(() => ({
    title: '',
    description: '',
    type: 'banner' as 'banner' | 'sponsored_listing' | 'video' | 'text' | 'interactive',
    category: 'services' as 'hardware_stores' | 'suppliers' | 'training_schools' | 'services' | 'products',
    // Budget (matching schema: { total, daily?, currency })
    budgetTotal: '',
    budgetDaily: '',
    currency: getDefaultCurrency(appSettings),
    // Schedule
    startDate: '',
    endDate: '',
    timeSlots: [] as Array<{ day: string; startTime: string; endTime: string }>,
    // Target Audience
    ageRangeMin: '',
    ageRangeMax: '',
    gender: [] as string[],
    targetLocations: [] as string[],
    interests: [] as string[],
    userTypes: [] as string[],
    activityLevel: '',
    // Location
    city: '',
    state: '',
    country: '',
    latitude: '',
    longitude: '',
    // Content
    headline: '',
    body: '',
    callToActionText: '',
    callToActionUrl: '',
    // Bidding
    biddingStrategy: 'cpc' as 'cpc' | 'cpm' | 'cpa' | 'fixed',
    bidAmount: '',
    maxBid: '',
    // Status
    status: 'draft' as 'draft' | 'pending' | 'approved' | 'active' | 'paused' | 'completed' | 'rejected',
    isActive: true,
    isFeatured: false
  }));

  // Edit form state
  const [editFormData, setEditFormData] = useState(() => ({
    title: '',
    description: '',
    type: 'banner' as 'banner' | 'sponsored_listing' | 'video' | 'text' | 'interactive',
    category: 'services' as 'hardware_stores' | 'suppliers' | 'training_schools' | 'services' | 'products',
    // Budget (matching schema: { total, daily?, currency })
    budgetTotal: '',
    budgetDaily: '',
    currency: getDefaultCurrency(appSettings),
    // Schedule
    startDate: '',
    endDate: '',
    timeSlots: [] as Array<{ day: string; startTime: string; endTime: string }>,
    // Target Audience
    ageRangeMin: '',
    ageRangeMax: '',
    gender: [] as string[],
    targetLocations: [] as string[],
    interests: [] as string[],
    userTypes: [] as string[],
    activityLevel: '',
    // Location
    city: '',
    state: '',
    country: '',
    latitude: '',
    longitude: '',
    // Content
    headline: '',
    body: '',
    callToActionText: '',
    callToActionUrl: '',
    // Bidding
    biddingStrategy: 'cpc' as 'cpc' | 'cpm' | 'cpa' | 'fixed',
    bidAmount: '',
    maxBid: '',
    // Status
    status: 'draft' as 'draft' | 'pending' | 'approved' | 'active' | 'paused' | 'completed' | 'rejected',
    isActive: true,
    isFeatured: false
  }));

  const fetchAds = useCallback(async () => {
    try {
      if (!getApiToken()) {
        logger.warn('No API token found, cannot fetch ads');
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      // Build query parameters based on filters
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.ads}${params.toString() ? `?${params.toString()}` : ''}`;
      
      let response: Response;
      try {
        response = await fetch(
          url,
          createAuthFetchOptions({
            method: 'GET'
          })
        );
      } catch (networkError) {
        // Handle network errors (CORS, connection refused, etc.)
        const error = networkError instanceof Error ? networkError : new Error(String(networkError));
        logger.error('Network error fetching ads', error, {
          url,
          errorType: 'network',
          message: error.message
        });
        throw new Error(`Network error: Unable to connect to the server. Please check your connection and try again.`);
      }

      // Handle HTTP errors
      if (!response.ok) {
        let errorMessage = `Failed to fetch ads (${response.status} ${response.statusText})`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // Response is not JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch {
            // Ignore text parsing errors
          }
        }
        
        logger.error('HTTP error fetching ads', new Error(errorMessage), {
          url,
          status: response.status,
          statusText: response.statusText,
          errorType: 'http'
        });
        
        throw new Error(errorMessage);
      }

      // Parse response
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        const error = parseError instanceof Error ? parseError : new Error(String(parseError));
        logger.error('JSON parse error fetching ads', error, {
          url,
          status: response.status,
          errorType: 'parse'
        });
        throw new Error('Invalid response format from server. Please try again later.');
      }
      
      // Handle different response formats from /api/ads endpoint
      let adsData: AdCampaignWithAdvertiser[] = [];
      
      logger.debug('Ads API response', { 
        url, 
        resultType: typeof result, 
        isArray: Array.isArray(result),
        resultKeys: result && typeof result === 'object' ? Object.keys(result) : [],
        result 
      });
      
      if (Array.isArray(result)) {
        // Direct array response
        adsData = result;
        logger.debug('Parsed ads as direct array', { count: adsData.length });
      } else if (result && typeof result === 'object') {
        // Object response with success/data structure
        if (result.success && result.data) {
          adsData = Array.isArray(result.data) ? result.data : [];
          logger.debug('Parsed ads from success.data', { count: adsData.length });
        } else if (result.data && Array.isArray(result.data)) {
          // Response with data array but no success field
          adsData = result.data;
          logger.debug('Parsed ads from data array', { count: adsData.length });
        } else if (result.campaigns && Array.isArray(result.campaigns)) {
          // Alternative response format with campaigns field
          adsData = result.campaigns;
          logger.debug('Parsed ads from campaigns array', { count: adsData.length });
        } else if (result.error || result.message) {
          // Error response
          const errorMsg = result.error || result.message || 'Failed to fetch ads';
          logger.error('API returned unsuccessful response', new Error(errorMsg), {
            url,
            response: result,
            errorType: 'api'
          });
          throw new Error(errorMsg);
        } else {
          // Unknown response format
          logger.warn('Unknown response format from ads API', { 
            url, 
            result,
            resultType: typeof result,
            isArray: Array.isArray(result)
          });
        }
      }
      
      logger.debug('Final ads data', { count: adsData.length, sample: adsData[0] });
      setAds(adsData);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error fetching ads', error, {
        endpoint: API_ENDPOINTS.ads,
        baseUrl: API_BASE_URL
      });
      setError(error.message);
      setAds([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, categoryFilter, searchTerm]);

  const fetchStatistics = useCallback(async () => {
    try {
      if (!getApiToken()) {
        logger.warn('No API token found, cannot fetch statistics');
        return;
      }

      // Endpoint: GET /api/ads/statistics
      const url = `${API_BASE_URL}${API_ENDPOINTS.adsStatistics}`;
      
      logger.debug('Fetching ads statistics', { url, endpoint: API_ENDPOINTS.adsStatistics });
      
      const response = await fetch(
        url,
        createAuthFetchOptions({
          method: 'GET'
        })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: Failed to fetch statistics`;
        
        // If it's a 400 with "Invalid ad ID format", it's likely a backend routing issue
        // where /api/ads/:id is matching before /api/ads/statistics
        if (response.status === 400 && errorMessage.includes('Invalid ad ID format')) {
          logger.warn('Statistics endpoint may have routing conflict. Backend may be interpreting "statistics" as an ad ID.', {
            status: response.status,
            statusText: response.statusText,
            endpoint: API_ENDPOINTS.adsStatistics,
            errorData
          });
        } else {
          logger.error('Failed to fetch statistics', new Error(errorMessage), {
            status: response.status,
            statusText: response.statusText,
            endpoint: API_ENDPOINTS.adsStatistics,
            errorData
          });
        }
        
        // Set stats to empty object so the section still shows
        setStats({
          totalAds: 0,
          pendingAds: 0,
          activeAds: 0,
          totalRevenue: 0,
          adsByCategory: [],
          adsByStatus: []
        });
        return;
      }

      const result = await response.json();
      
      // Handle different response formats
      if (result.success && result.data) {
        setStats(result.data);
      } else if (result.data) {
        // Response has data but no success field
        setStats(result.data);
      } else if (result) {
        // Direct statistics object
        setStats(result);
      } else {
        // Empty response, set default stats
        setStats({
          totalAds: 0,
          pendingAds: 0,
          activeAds: 0,
          totalRevenue: 0,
          adsByCategory: [],
          adsByStatus: []
        });
      }
    } catch (err) {
      const error: Error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error fetching statistics', error);
      // Set stats to empty object so the section still shows
      setStats({
        totalAds: 0,
        pendingAds: 0,
        activeAds: 0,
        totalRevenue: 0,
        adsByCategory: [],
        adsByStatus: []
      });
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchAds(), fetchStatistics()]);
    setLastUpdated(new Date());
  }, [fetchAds, fetchStatistics]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async () => {
    if (!selectedAd?._id) return;

    try {
      setSubmitting(true);

      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.adsApprove}/${selectedAd._id}/approve`,
        createAuthFetchOptions({
          method: 'PUT'
        })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to approve ad');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Ad approved successfully');
        setApproveModalOpen(false);
        setSelectedAd(null);
        await refreshData();
      } else {
        throw new Error(result.error || 'Failed to approve ad');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error approving ad', error);
      toast.error(`Failed to approve ad: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAd?._id) return;

    try {
      setSubmitting(true);

      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.adsReject}/${selectedAd._id}/reject`,
        createAuthFetchOptions({
          method: 'PUT',
          body: JSON.stringify({
            rejectionReason: rejectionReason || 'Ad rejected by administrator'
          })
        })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reject ad');
      }

      const result = await response.json();
      
      if (result.success) {
        toast.success('Ad rejected successfully');
        setRejectModalOpen(false);
        setSelectedAd(null);
        setRejectionReason("");
        await refreshData();
      } else {
        throw new Error(result.error || 'Failed to reject ad');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error rejecting ad', error);
      toast.error(`Failed to reject ad: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAd = async () => {
    try {
      setSubmitting(true);
      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      if (!createFormData.title || !createFormData.description) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (!createFormData.startDate || !createFormData.endDate) {
        toast.error('Please select start and end dates');
        return;
      }

      if (!createFormData.budgetTotal) {
        toast.error('Please enter a budget total');
        return;
      }

      // Build schedule with time slots
      const schedule: Partial<Schedule> = {
        startDate: new Date(createFormData.startDate),
        endDate: new Date(createFormData.endDate)
      };
      
      if (createFormData.timeSlots && createFormData.timeSlots.length > 0) {
        schedule.timeSlots = createFormData.timeSlots.filter(ts => ts.day && ts.startTime && ts.endTime);
      }

      // Build target audience
      const targetAudience: Partial<TargetAudience> = {};
      if (createFormData.ageRangeMin || createFormData.ageRangeMax) {
        targetAudience.demographics = {
          ...(createFormData.ageRangeMin || createFormData.ageRangeMax ? {
            ageRange: [
              createFormData.ageRangeMin ? parseInt(createFormData.ageRangeMin) : 0,
              createFormData.ageRangeMax ? parseInt(createFormData.ageRangeMax) : 100
            ]
          } : {}),
          ...(createFormData.gender.length > 0 ? { gender: createFormData.gender } : {}),
          ...(createFormData.targetLocations.length > 0 ? { location: createFormData.targetLocations } : {}),
          ...(createFormData.interests.length > 0 ? { interests: createFormData.interests } : {})
        };
      }
      
      if (createFormData.userTypes.length > 0 || createFormData.activityLevel) {
        targetAudience.behavior = {
          ...(createFormData.userTypes.length > 0 ? { userTypes: createFormData.userTypes } : {}),
          ...(createFormData.activityLevel ? { activityLevel: createFormData.activityLevel } : {})
        };
      }

      // Build location
      const location: Partial<AdLocation> = {};
      if (createFormData.city || createFormData.state || createFormData.country) {
        if (createFormData.city) location.city = createFormData.city;
        if (createFormData.state) location.state = createFormData.state;
        if (createFormData.country) location.country = createFormData.country;
        if (createFormData.latitude || createFormData.longitude) {
          location.coordinates = {
            ...(createFormData.latitude ? { latitude: parseFloat(createFormData.latitude) } : {}),
            ...(createFormData.longitude ? { longitude: parseFloat(createFormData.longitude) } : {})
          };
        }
      }

      // Build content
      const content: Partial<AdContent> = {};
      if (createFormData.headline) content.headline = createFormData.headline;
      if (createFormData.body) content.body = createFormData.body;
      if (createFormData.callToActionText || createFormData.callToActionUrl) {
        content.callToAction = {
          ...(createFormData.callToActionText ? { text: createFormData.callToActionText } : {}),
          ...(createFormData.callToActionUrl ? { url: createFormData.callToActionUrl } : {})
        };
      }

      // Build bidding
      const bidding: Partial<Bidding> = {};
      if (createFormData.biddingStrategy) bidding.strategy = createFormData.biddingStrategy;
      if (createFormData.bidAmount) bidding.bidAmount = parseFloat(createFormData.bidAmount);
      if (createFormData.maxBid) bidding.maxBid = parseFloat(createFormData.maxBid);

      // Build budget object (matching schema structure)
      const budget = {
        total: parseFloat(createFormData.budgetTotal) || 0,
        ...(createFormData.budgetDaily ? { daily: parseFloat(createFormData.budgetDaily) } : {}),
        currency: createFormData.currency || getDefaultCurrency(appSettings)
      };

      const formData: Partial<{
        title: string;
        description: string;
        type: AdType;
        category: AdCategory;
        budget: { total: number; daily?: number; currency: string };
        schedule: Schedule;
        targetAudience?: TargetAudience;
        location?: AdLocation;
        content?: AdContent;
        bidding?: Bidding;
        status: CampaignStatus;
        isActive: boolean;
        isFeatured: boolean;
      }> = {
        title: createFormData.title,
        description: createFormData.description,
        type: createFormData.type,
        category: createFormData.category,
        budget,
        schedule: schedule as Schedule,
        ...(Object.keys(targetAudience).length > 0 ? { targetAudience: targetAudience as TargetAudience } : {}),
        ...(Object.keys(location).length > 0 ? { location: location as AdLocation } : {}),
        ...(Object.keys(content).length > 0 ? { content: content as AdContent } : {}),
        ...(Object.keys(bidding).length > 0 ? { bidding: bidding as Bidding } : {}),
        status: createFormData.status,
        isActive: createFormData.isActive,
        isFeatured: createFormData.isFeatured
      };

      // Endpoint: POST /api/ads
      const url = `${API_BASE_URL}${API_ENDPOINTS.adsCreate}`;
      
      logger.debug('Creating ad', { url, formData });
      
      const response = await fetch(url, createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify(formData)
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('Failed to create ad', new Error(errorData.error || errorData.message || 'Failed to create ad'), {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.error || errorData.message || `Failed to create ad: ${response.status}`);
      }

      const result = await response.json();
      logger.debug('Create ad response', { result });
      
      // Handle different response formats
      if (result.success === true || result.data || (!result.success && !result.error)) {
        toast.success('Ad created successfully');
        setCreateModalOpen(false);
        setCreateFormData({
          title: '',
          description: '',
          type: 'banner',
          category: 'services',
          budgetTotal: '',
          budgetDaily: '',
          currency: getDefaultCurrency(appSettings),
          startDate: '',
          endDate: '',
          timeSlots: [],
          ageRangeMin: '',
          ageRangeMax: '',
          gender: [],
          targetLocations: [],
          interests: [],
          userTypes: [],
          activityLevel: '',
          city: '',
          state: '',
          country: '',
          latitude: '',
          longitude: '',
          headline: '',
          body: '',
          callToActionText: '',
          callToActionUrl: '',
          biddingStrategy: 'cpc',
          bidAmount: '',
          maxBid: '',
          status: 'draft',
          isActive: true,
          isFeatured: false
        });
        await refreshData();
      } else {
        const errorMsg = result.error || result.message || 'Failed to create ad';
        logger.error('Create ad returned error', new Error(errorMsg), { result });
        throw new Error(errorMsg);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error creating ad', error);
      toast.error(`Failed to create ad: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAd = async () => {
    if (!selectedAd?._id) return;

    try {
      setSubmitting(true);
      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      if (!editFormData.title || !editFormData.description) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (!editFormData.startDate || !editFormData.endDate) {
        toast.error('Please select start and end dates');
        return;
      }

      if (!editFormData.budgetTotal) {
        toast.error('Please enter a budget total');
        return;
      }

      // Build schedule with time slots
      const schedule: Partial<Schedule> = {
        startDate: new Date(editFormData.startDate),
        endDate: new Date(editFormData.endDate)
      };
      
      if (editFormData.timeSlots && editFormData.timeSlots.length > 0) {
        schedule.timeSlots = editFormData.timeSlots.filter(ts => ts.day && ts.startTime && ts.endTime);
      }

      // Build target audience
      const targetAudience: Partial<TargetAudience> = {};
      if (editFormData.ageRangeMin || editFormData.ageRangeMax) {
        targetAudience.demographics = {
          ...(editFormData.ageRangeMin || editFormData.ageRangeMax ? {
            ageRange: [
              editFormData.ageRangeMin ? parseInt(editFormData.ageRangeMin) : 0,
              editFormData.ageRangeMax ? parseInt(editFormData.ageRangeMax) : 100
            ]
          } : {}),
          ...(editFormData.gender.length > 0 ? { gender: editFormData.gender } : {}),
          ...(editFormData.targetLocations.length > 0 ? { location: editFormData.targetLocations } : {}),
          ...(editFormData.interests.length > 0 ? { interests: editFormData.interests } : {})
        };
      }
      
      if (editFormData.userTypes.length > 0 || editFormData.activityLevel) {
        targetAudience.behavior = {
          ...(editFormData.userTypes.length > 0 ? { userTypes: editFormData.userTypes } : {}),
          ...(editFormData.activityLevel ? { activityLevel: editFormData.activityLevel } : {})
        };
      }

      // Build location
      const location: Partial<AdLocation> = {};
      if (editFormData.city || editFormData.state || editFormData.country) {
        if (editFormData.city) location.city = editFormData.city;
        if (editFormData.state) location.state = editFormData.state;
        if (editFormData.country) location.country = editFormData.country;
        if (editFormData.latitude || editFormData.longitude) {
          location.coordinates = {
            ...(editFormData.latitude ? { latitude: parseFloat(editFormData.latitude) } : {}),
            ...(editFormData.longitude ? { longitude: parseFloat(editFormData.longitude) } : {})
          };
        }
      }

      // Build content
      const content: Partial<AdContent> = {};
      if (editFormData.headline) content.headline = editFormData.headline;
      if (editFormData.body) content.body = editFormData.body;
      if (editFormData.callToActionText || editFormData.callToActionUrl) {
        content.callToAction = {
          ...(editFormData.callToActionText ? { text: editFormData.callToActionText } : {}),
          ...(editFormData.callToActionUrl ? { url: editFormData.callToActionUrl } : {})
        };
      }

      // Build bidding
      const bidding: Partial<Bidding> = {};
      if (editFormData.biddingStrategy) bidding.strategy = editFormData.biddingStrategy;
      if (editFormData.bidAmount) bidding.bidAmount = parseFloat(editFormData.bidAmount);
      if (editFormData.maxBid) bidding.maxBid = parseFloat(editFormData.maxBid);

      // Build budget object (matching schema structure)
      const budget = {
        total: parseFloat(editFormData.budgetTotal) || 0,
        ...(editFormData.budgetDaily ? { daily: parseFloat(editFormData.budgetDaily) } : {}),
        currency: editFormData.currency || getDefaultCurrency(appSettings)
      };

      const formData: Partial<{
        title: string;
        description: string;
        type: AdType;
        category: AdCategory;
        budget: { total: number; daily?: number; currency: string };
        schedule: Schedule;
        targetAudience?: TargetAudience;
        location?: AdLocation;
        content?: AdContent;
        bidding?: Bidding;
        status: CampaignStatus;
        isActive: boolean;
        isFeatured: boolean;
      }> = {
        title: editFormData.title,
        description: editFormData.description,
        type: editFormData.type,
        category: editFormData.category,
        budget,
        schedule: schedule as Schedule,
        ...(Object.keys(targetAudience).length > 0 ? { targetAudience: targetAudience as TargetAudience } : {}),
        ...(Object.keys(location).length > 0 ? { location: location as AdLocation } : {}),
        ...(Object.keys(content).length > 0 ? { content: content as AdContent } : {}),
        ...(Object.keys(bidding).length > 0 ? { bidding: bidding as Bidding } : {}),
        status: editFormData.status,
        isActive: editFormData.isActive,
        isFeatured: editFormData.isFeatured
      };

      // Endpoint: PUT /api/ads/:id
      const url = `${API_BASE_URL}${API_ENDPOINTS.adsUpdate}/${selectedAd._id}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify(formData)
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to update ad');
      }

      const result = await response.json();
      
      if (result.success !== false) {
        toast.success('Ad updated successfully');
        setEditModalOpen(false);
        setSelectedAd(null);
        await refreshData();
      } else {
        throw new Error(result.error || 'Failed to update ad');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error updating ad', error);
      toast.error(`Failed to update ad: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAd = async () => {
    if (!selectedAd?._id) return;

    try {
      setSubmitting(true);
      if (!getApiToken()) {
        throw new Error('Authentication required');
      }

      // Endpoint: DELETE /api/ads/:id
      const url = `${API_BASE_URL}${API_ENDPOINTS.adsDelete}/${selectedAd._id}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'DELETE'
      }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to delete ad');
      }

      const result = await response.json();
      
      if (result.success !== false) {
        toast.success('Ad deleted successfully');
        setDeleteModalOpen(false);
        setSelectedAd(null);
        await refreshData();
      } else {
        throw new Error(result.error || 'Failed to delete ad');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error deleting ad', error);
      toast.error(`Failed to delete ad: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadImages = async () => {
    if (!selectedAd?._id || !selectedFiles || selectedFiles.length === 0) return;
    
    try {
      setSubmitting(true);
      const token = getApiToken();
      if (!token) {
        const error = new Error('No authentication token found');
        logger.error('Error uploading images', error, { adId: selectedAd._id });
        toast.error('Authentication required. Please log in again.');
        return;
      }

      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      // Endpoint: POST /api/ads/:id/images
      const url = `${API_BASE_URL}${API_ENDPOINTS.adsImages}/${selectedAd._id}/images`;
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };
      
      logger.debug('Uploading images', { 
        url, 
        adId: selectedAd._id, 
        fileCount: selectedFiles.length,
        fileNames: selectedFiles.map(f => f.name),
        fileSizes: selectedFiles.map(f => f.size)
      });

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers,
          body: formData
        });
      } catch (networkError) {
        const error = networkError instanceof Error ? networkError : new Error(String(networkError));
        logger.error('Network error uploading images', error, {
          url,
          adId: selectedAd._id,
          fileCount: selectedFiles.length
        });
        toast.error('Network error: Failed to connect to server. Please check your connection and try again.');
        return;
      }

      if (!response.ok) {
        let errorMessage = 'Failed to upload images';
        let errorData: { error?: string; message?: string } = {};
        
        try {
          const responseText = await response.text();
          if (responseText) {
            try {
              errorData = JSON.parse(responseText);
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch {
              errorMessage = responseText;
            }
          }
        } catch {
          // Ignore parsing errors
        }
        
        logger.error('Error uploading images', new Error(errorMessage), {
          url,
          adId: selectedAd._id,
          status: response.status,
          statusText: response.statusText,
          errorData,
          fileCount: selectedFiles.length
        });
        
        if (response.status === 400) {
          toast.error(`Bad request: ${errorMessage}. Please check that files are valid images.`);
        } else if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          toast.error('You do not have permission to upload images for this ad.');
        } else if (response.status === 413) {
          toast.error('File size too large. Please upload smaller images.');
        } else if (response.status === 415) {
          toast.error('Unsupported file type. Please upload image files only.');
        } else if (response.status >= 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error(`Failed to upload images: ${errorMessage}`);
        }
        return;
      }

      const result = await response.json();
      
      if (result.success !== false) {
        toast.success('Images uploaded successfully');
        setImageUploadModalOpen(false);
        setSelectedFiles([]);
        setSelectedAd(null);
        await refreshData();
      } else {
        throw new Error(result.error || 'Failed to upload images');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error uploading images', error, { adId: selectedAd._id });
      toast.error(`Failed to upload images: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (ad: AdCampaignWithAdvertiser) => {
    setSelectedAd(ad);
    const startDate = ad.schedule?.startDate ? new Date(ad.schedule.startDate).toISOString().split('T')[0] : '';
    const endDate = ad.schedule?.endDate ? new Date(ad.schedule.endDate).toISOString().split('T')[0] : '';
    
    // Extract budget - handle both number and object formats (schema shows object)
    const budgetObj = typeof ad.budget === 'number' 
      ? { total: ad.budget, currency: getDefaultCurrency(appSettings) }
      : (ad.budget || { total: 0, currency: getDefaultCurrency(appSettings) });
    
    // Extract target audience data
    const demographics = ad.targetAudience?.demographics;
    const behavior = ad.targetAudience?.behavior;
    
    // Extract location data
    const location = ad.location;
    
    // Extract content data
    const content = ad.content;
    
    // Extract bidding data
    const bidding = ad.bidding;
    
    setEditFormData({
      title: ad.title || '',
      description: ad.description || '',
      type: ad.type || 'banner',
      category: ad.category || 'services',
      budgetTotal: budgetObj.total?.toString() || '',
      budgetDaily: (typeof budgetObj === 'object' && 'daily' in budgetObj) ? budgetObj.daily?.toString() || '' : '',
      currency: budgetObj.currency || getDefaultCurrency(appSettings),
      startDate,
      endDate,
      timeSlots: (ad.schedule?.timeSlots || []).filter(ts => ts.day && ts.startTime && ts.endTime).map(ts => ({
      day: ts.day!,
      startTime: ts.startTime!,
      endTime: ts.endTime!
    })),
      ageRangeMin: demographics?.ageRange?.[0]?.toString() || '',
      ageRangeMax: demographics?.ageRange?.[1]?.toString() || '',
      gender: demographics?.gender || [],
      targetLocations: demographics?.location || [],
      interests: demographics?.interests || [],
      userTypes: behavior?.userTypes || [],
      activityLevel: behavior?.activityLevel || '',
      city: location?.city || '',
      state: location?.state || '',
      country: location?.country || '',
      latitude: location?.coordinates?.latitude?.toString() || '',
      longitude: location?.coordinates?.longitude?.toString() || '',
      headline: content?.headline || '',
      body: content?.body || '',
      callToActionText: content?.callToAction?.text || '',
      callToActionUrl: content?.callToAction?.url || '',
      biddingStrategy: bidding?.strategy || 'cpc',
      bidAmount: bidding?.bidAmount?.toString() || '',
      maxBid: bidding?.maxBid?.toString() || '',
      status: ad.status || 'draft',
      isActive: ad.isActive ?? true,
      isFeatured: ad.isFeatured ?? false
    });
    setEditModalOpen(true);
  };

  // Filter ads
  const filteredAds = ads.filter(ad => {
    const matchesSearch = !searchTerm || 
      ad.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || ad.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || (ad.status === statusFilter || (!ad.status && statusFilter === 'draft'));
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  logger.debug('Filtered ads', { 
    totalAds: ads.length, 
    filteredCount: filteredAds.length,
    filters: { searchTerm, categoryFilter, statusFilter }
  });

  const categories = [
    "all",
    "hardware_stores",
    "suppliers",
    "training_schools",
    "services",
    "products"
  ];

  const statuses: CampaignStatus[] = [
    "draft",
    "pending",
    "approved",
    "active",
    "paused",
    "completed",
    "rejected"
  ];

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading ads..." />
      </div>
    );
  }

  if (error && !ads.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ads Management
          </h1>
          <p className="text-gray-600 text-sm">Manage and review advertising campaigns</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <Plus className="w-3 h-3 mr-1" />
            Create Ad
          </button>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Ads</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : (stats?.totalAds || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  All campaigns
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0 ml-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Pending</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : (stats?.pendingAds || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Awaiting approval
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0 ml-4">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Active</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : (stats?.activeAds || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Currently running
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg flex-shrink-0 ml-4">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Revenue</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : formatCurrency(
                    stats?.totalRevenue || 0,
                    getDefaultCurrency(appSettings),
                    { appSettings }
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  Total earnings
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0 ml-4">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="w-3 h-3 mr-1" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <div className="text-xs text-gray-500">
                {filteredAds.length} ad{filteredAds.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search ads..."
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === "all" ? "All Categories" : cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Ads</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Advertiser</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAds.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-2 text-center text-xs text-gray-500">
                      {ads.length === 0 
                        ? (error ? `Error: ${error}` : 'No ads found. Create your first ad using the "Create Ad" button above.')
                        : `No ads match the current filters. ${ads.length} total ad(s) available.`}
                    </td>
                  </tr>
                ) : (
                  filteredAds.map((ad) => {
                    const advertiser = typeof ad.advertiser === 'object' ? ad.advertiser : null;
                    const advertiserName = advertiser?.businessName || 'Unknown';
                    const firstImage = Array.isArray(ad.images) && ad.images.length > 0 
                      ? (typeof ad.images[0] === 'string' ? ad.images[0] : ad.images[0]?.url)
                      : ad.content?.images?.[0]?.url || ad.content?.logo?.url;

                    return (
                      <tr key={ad._id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            {firstImage ? (
                              <Image
                                src={firstImage}
                                alt={ad.title}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded object-cover mr-2"
                                unoptimized
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center mr-2">
                                <ImageIcon className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="text-xs font-semibold text-gray-900">{ad.title}</div>
                              <div className="text-xs text-gray-600 truncate max-w-xs">{ad.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs text-gray-900">{advertiserName}</div>
                          {advertiser?.businessType && (
                            <div className="text-xs text-gray-500">
                              {advertiser.businessType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {ad.category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                          {ad.budget ? (
                            <span>
                              {formatCurrency(
                                typeof ad.budget === 'number' ? ad.budget : ad.budget.total,
                                typeof ad.budget === 'number' ? getDefaultCurrency(appSettings) : (ad.budget.currency || getDefaultCurrency(appSettings)),
                                { appSettings }
                              )}
                            </span>
                          ) : 'N/A'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            ad.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : ad.status === 'approved' || ad.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : ad.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {ad.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedAd(ad);
                                setViewModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="View ad details"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => openEditModal(ad)}
                              className="text-green-600 hover:text-green-900"
                              title="Edit ad"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAd(ad);
                                setImageUploadModalOpen(true);
                              }}
                              className="text-purple-600 hover:text-purple-900"
                              title="Upload images"
                            >
                              <ImageIcon className="w-3 h-3" />
                            </button>
                            {ad.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedAd(ad);
                                    setApproveModalOpen(true);
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                  title="Approve ad"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedAd(ad);
                                    setRejectModalOpen(true);
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                  title="Reject ad"
                                >
                                  <XCircle className="w-3 h-3" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => {
                                setSelectedAd(ad);
                                setDeleteModalOpen(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Delete ad"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Create Ad Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setCreateFormData({
            title: '',
            description: '',
            type: 'banner',
            category: 'services',
            budgetTotal: '',
            budgetDaily: '',
            currency: getDefaultCurrency(appSettings),
            startDate: '',
            endDate: '',
            timeSlots: [],
            ageRangeMin: '',
            ageRangeMax: '',
            gender: [],
            targetLocations: [],
            interests: [],
            userTypes: [],
            activityLevel: '',
            city: '',
            state: '',
            country: '',
            latitude: '',
            longitude: '',
            headline: '',
            body: '',
            callToActionText: '',
            callToActionUrl: '',
            biddingStrategy: 'cpc',
            bidAmount: '',
            maxBid: '',
            status: 'draft',
            isActive: true,
            isFeatured: false
          });
        }}
        title="Create New Ad"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={createFormData.title}
              onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter ad title"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={createFormData.description}
              onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={4}
              placeholder="Enter ad description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={createFormData.type}
                onChange={(e) => setCreateFormData({ ...createFormData, type: e.target.value as AdType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="banner">Banner</option>
                <option value="sponsored_listing">Sponsored Listing</option>
                <option value="video">Video</option>
                <option value="text">Text</option>
                <option value="interactive">Interactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={createFormData.category}
                onChange={(e) => setCreateFormData({ ...createFormData, category: e.target.value as AdCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="hardware_stores">Hardware Stores</option>
                <option value="suppliers">Suppliers</option>
                <option value="training_schools">Training Schools</option>
                <option value="services">Services</option>
                <option value="products">Products</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Budget Total <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={createFormData.budgetTotal}
                onChange={(e) => setCreateFormData({ ...createFormData, budgetTotal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Budget Daily (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={createFormData.budgetDaily}
                onChange={(e) => setCreateFormData({ ...createFormData, budgetDaily: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={createFormData.currency}
                onChange={(e) => setCreateFormData({ ...createFormData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value={getDefaultCurrency(appSettings)}>{getDefaultCurrency(appSettings)}</option>
                <option value="USD">USD</option>
                <option value="PHP">PHP</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={createFormData.startDate}
                onChange={(e) => setCreateFormData({ ...createFormData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={createFormData.endDate}
                onChange={(e) => setCreateFormData({ ...createFormData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                min={createFormData.startDate}
              />
            </div>
          </div>

          {/* Time Slots Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Schedule Time Slots (Optional)</h3>
              <button
                type="button"
                onClick={() => {
                  setCreateFormData({
                    ...createFormData,
                    timeSlots: [...createFormData.timeSlots, { day: '', startTime: '', endTime: '' }]
                  });
                }}
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Add Time Slot
              </button>
            </div>
            {createFormData.timeSlots.length > 0 && (
              <div className="space-y-2">
                {createFormData.timeSlots.map((slot, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 items-end">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Day</label>
                      <select
                        value={slot.day}
                        onChange={(e) => {
                          const newSlots = [...createFormData.timeSlots];
                          newSlots[index].day = e.target.value;
                          setCreateFormData({ ...createFormData, timeSlots: newSlots });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="">Select day</option>
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                        <option value="sunday">Sunday</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => {
                          const newSlots = [...createFormData.timeSlots];
                          newSlots[index].startTime = e.target.value;
                          setCreateFormData({ ...createFormData, timeSlots: newSlots });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => {
                          const newSlots = [...createFormData.timeSlots];
                          newSlots[index].endTime = e.target.value;
                          setCreateFormData({ ...createFormData, timeSlots: newSlots });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newSlots = createFormData.timeSlots.filter((_, i) => i !== index);
                        setCreateFormData({ ...createFormData, timeSlots: newSlots });
                      }}
                      className="px-2 py-1 text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Target Audience Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Target Audience</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Age Range (Min)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={createFormData.ageRangeMin}
                  onChange={(e) => setCreateFormData({ ...createFormData, ageRangeMin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="25"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Age Range (Max)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={createFormData.ageRangeMax}
                  onChange={(e) => setCreateFormData({ ...createFormData, ageRangeMax: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="65"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Target Locations (comma-separated)</label>
              <input
                type="text"
                value={createFormData.targetLocations.join(', ')}
                onChange={(e) => setCreateFormData({ 
                  ...createFormData, 
                  targetLocations: e.target.value.split(',').map(l => l.trim()).filter(l => l)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Manila, Quezon City, Makati"
              />
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Interests (comma-separated)</label>
              <input
                type="text"
                value={createFormData.interests.join(', ')}
                onChange={(e) => setCreateFormData({ 
                  ...createFormData, 
                  interests: e.target.value.split(',').map(i => i.trim()).filter(i => i)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="cleaning, home_services, maintenance"
              />
            </div>
          </div>

          {/* Location Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Location</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={createFormData.city}
                  onChange={(e) => setCreateFormData({ ...createFormData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Manila"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={createFormData.state}
                  onChange={(e) => setCreateFormData({ ...createFormData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Metro Manila"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={createFormData.country}
                  onChange={(e) => setCreateFormData({ ...createFormData, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Philippines"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={createFormData.latitude}
                  onChange={(e) => setCreateFormData({ ...createFormData, latitude: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="14.5995"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={createFormData.longitude}
                  onChange={(e) => setCreateFormData({ ...createFormData, longitude: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="120.9842"
                />
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Content</h3>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Headline</label>
              <input
                type="text"
                value={createFormData.headline}
                onChange={(e) => setCreateFormData({ ...createFormData, headline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="20% Off Cleaning Services"
              />
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Body</label>
              <textarea
                value={createFormData.body}
                onChange={(e) => setCreateFormData({ ...createFormData, body: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={3}
                placeholder="Professional cleaning services at discounted rates. Book now and save!"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Call to Action Text</label>
                <input
                  type="text"
                  value={createFormData.callToActionText}
                  onChange={(e) => setCreateFormData({ ...createFormData, callToActionText: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Book Now"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Call to Action URL</label>
                <input
                  type="text"
                  value={createFormData.callToActionUrl}
                  onChange={(e) => setCreateFormData({ ...createFormData, callToActionUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="/book-cleaning"
                />
              </div>
            </div>
          </div>

          {/* Bidding Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Bidding</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Strategy</label>
                <select
                  value={createFormData.biddingStrategy}
                  onChange={(e) => setCreateFormData({ ...createFormData, biddingStrategy: e.target.value as BiddingStrategy })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="cpc">CPC</option>
                  <option value="cpm">CPM</option>
                  <option value="cpa">CPA</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Bid Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={createFormData.bidAmount}
                  onChange={(e) => setCreateFormData({ ...createFormData, bidAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="2.50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Bid</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={createFormData.maxBid}
                  onChange={(e) => setCreateFormData({ ...createFormData, maxBid: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="5.00"
                />
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Status & Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={createFormData.status}
                  onChange={(e) => setCreateFormData({ ...createFormData, status: e.target.value as CampaignStatus })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-4 mt-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={createFormData.isActive}
                  onChange={(e) => setCreateFormData({ ...createFormData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs text-gray-700">Active</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={createFormData.isFeatured}
                  onChange={(e) => setCreateFormData({ ...createFormData, isFeatured: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs text-gray-700">Featured</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button
              onClick={() => {
                setCreateModalOpen(false);
                setCreateFormData({
                  title: '',
                  description: '',
                  type: 'banner',
                  category: 'services',
                  budgetTotal: '',
                  budgetDaily: '',
                  currency: getDefaultCurrency(appSettings),
                  startDate: '',
                  endDate: '',
                  timeSlots: [],
                  ageRangeMin: '',
                  ageRangeMax: '',
                  gender: [],
                  targetLocations: [],
                  interests: [],
                  userTypes: [],
                  activityLevel: '',
                  city: '',
                  state: '',
                  country: '',
                  latitude: '',
                  longitude: '',
                  headline: '',
                  body: '',
                  callToActionText: '',
                  callToActionUrl: '',
            biddingStrategy: 'cpc',
            bidAmount: '',
            maxBid: '',
            status: 'draft',
            isActive: true,
            isFeatured: false
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAd}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs"
            >
              {submitting ? 'Creating...' : 'Create Ad'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Ad Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedAd(null);
        }}
        title={selectedAd?.title || 'Ad Details'}
        size="lg"
      >
        {selectedAd ? (() => {
          const ad = selectedAd;
          const firstImage = Array.isArray(ad.images) && ad.images.length > 0 
            ? (typeof ad.images[0] === 'string' ? ad.images[0] : (ad.images[0] as { url?: string })?.url)
            : ad.content?.images?.[0]?.url || ad.content?.logo?.url;
          const advertiser = typeof ad.advertiser === 'object' && ad.advertiser !== null && !Array.isArray(ad.advertiser) ? ad.advertiser as { businessName?: string; businessType?: string } : null;
          
          return (
            <div className="space-y-4">
              {firstImage && typeof firstImage === 'string' && (
                <Image
                  src={firstImage}
                  alt={ad.title}
                  width={800}
                  height={192}
                  className="w-full h-48 object-cover rounded"
                  unoptimized
                />
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-sm text-gray-900">{ad.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Category</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {ad.category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Type</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {ad.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </p>
                </div>
              </div>
              {advertiser && advertiser.businessName && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Advertiser</h3>
                  <p className="mt-1 text-sm text-gray-900">{advertiser.businessName}</p>
                  {advertiser.businessType && (
                    <p className="text-xs text-gray-600 mt-1">
                      {advertiser.businessType.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </p>
                  )}
                </div>
              )}
              {ad.budget && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Budget</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatCurrency(
                      typeof ad.budget === 'number' ? ad.budget : ad.budget.total,
                      typeof ad.budget === 'number' ? getDefaultCurrency(appSettings) : (ad.budget.currency || getDefaultCurrency(appSettings)),
                      { appSettings }
                    )}
                    {typeof ad.budget === 'object' && ad.budget.daily && (
                      <> (Daily: {formatCurrency(
                        ad.budget.daily,
                        ad.budget.currency || getDefaultCurrency(appSettings),
                        { appSettings }
                      )})</>
                    )}
                  </p>
                </div>
              )}
              {ad.schedule && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Schedule</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(ad.schedule.startDate).toLocaleDateString()} - {new Date(ad.schedule.endDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="mt-1 text-sm text-gray-900">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    ad.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800'
                      : ad.status === 'approved' || ad.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : ad.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {ad.status || 'pending'}
                  </span>
                </p>
              </div>
              {ad.performance && (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <h3 className="text-xs font-medium text-gray-500">Impressions</h3>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{ad.performance.impressions || 0}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-gray-500">Clicks</h3>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{ad.performance.clicks || 0}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-gray-500">CTR</h3>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {ad.performance.ctr ? `${ad.performance.ctr.toFixed(2)}%` : '0%'}
                    </p>
                  </div>
                </div>
              )}
              {ad.approval?.rejectionReason && (
                <div className="bg-red-50 p-3 rounded">
                  <h3 className="text-xs font-medium text-red-800">Rejection Reason</h3>
                  <p className="mt-1 text-xs text-red-700">{ad.approval.rejectionReason}</p>
                </div>
              )}
            </div>
          );
        })() : null}
      </Modal>

      {/* Edit Ad Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedAd(null);
        }}
        title="Edit Ad"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editFormData.title}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter ad title"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={4}
              placeholder="Enter ad description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={editFormData.type}
                onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as AdType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="banner">Banner</option>
                <option value="sponsored_listing">Sponsored Listing</option>
                <option value="video">Video</option>
                <option value="text">Text</option>
                <option value="interactive">Interactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={editFormData.category}
                onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value as AdCategory })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="hardware_stores">Hardware Stores</option>
                <option value="suppliers">Suppliers</option>
                <option value="training_schools">Training Schools</option>
                <option value="services">Services</option>
                <option value="products">Products</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Budget Total <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editFormData.budgetTotal}
                onChange={(e) => setEditFormData({ ...editFormData, budgetTotal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Budget Daily (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editFormData.budgetDaily}
                onChange={(e) => setEditFormData({ ...editFormData, budgetDaily: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={editFormData.currency}
                onChange={(e) => setEditFormData({ ...editFormData, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value={getDefaultCurrency(appSettings)}>{getDefaultCurrency(appSettings)}</option>
                <option value="USD">USD</option>
                <option value="PHP">PHP</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={editFormData.startDate}
                onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={editFormData.endDate}
                onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                min={editFormData.startDate}
              />
            </div>
          </div>

          {/* Time Slots Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Schedule Time Slots (Optional)</h3>
              <button
                type="button"
                onClick={() => {
                  setEditFormData({
                    ...editFormData,
                    timeSlots: [...editFormData.timeSlots, { day: '', startTime: '', endTime: '' }]
                  });
                }}
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Add Time Slot
              </button>
            </div>
            {editFormData.timeSlots.length > 0 && (
              <div className="space-y-2">
                {editFormData.timeSlots.map((slot, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 items-end">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Day</label>
                      <select
                        value={slot.day}
                        onChange={(e) => {
                          const newSlots = [...editFormData.timeSlots];
                          newSlots[index].day = e.target.value;
                          setEditFormData({ ...editFormData, timeSlots: newSlots });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="">Select day</option>
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                        <option value="sunday">Sunday</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => {
                          const newSlots = [...editFormData.timeSlots];
                          newSlots[index].startTime = e.target.value;
                          setEditFormData({ ...editFormData, timeSlots: newSlots });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => {
                          const newSlots = [...editFormData.timeSlots];
                          newSlots[index].endTime = e.target.value;
                          setEditFormData({ ...editFormData, timeSlots: newSlots });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newSlots = editFormData.timeSlots.filter((_, i) => i !== index);
                        setEditFormData({ ...editFormData, timeSlots: newSlots });
                      }}
                      className="px-2 py-1 text-xs text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Target Audience Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Target Audience</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Age Range (Min)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editFormData.ageRangeMin}
                  onChange={(e) => setEditFormData({ ...editFormData, ageRangeMin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="25"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Age Range (Max)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editFormData.ageRangeMax}
                  onChange={(e) => setEditFormData({ ...editFormData, ageRangeMax: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="65"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Target Locations (comma-separated)</label>
              <input
                type="text"
                value={editFormData.targetLocations.join(', ')}
                onChange={(e) => setEditFormData({ 
                  ...editFormData, 
                  targetLocations: e.target.value.split(',').map(l => l.trim()).filter(l => l)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Manila, Quezon City, Makati"
              />
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Interests (comma-separated)</label>
              <input
                type="text"
                value={editFormData.interests.join(', ')}
                onChange={(e) => setEditFormData({ 
                  ...editFormData, 
                  interests: e.target.value.split(',').map(i => i.trim()).filter(i => i)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="cleaning, home_services, maintenance"
              />
            </div>
          </div>

          {/* Location Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Location</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Manila"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={editFormData.state}
                  onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Metro Manila"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={editFormData.country}
                  onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Philippines"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={editFormData.latitude}
                  onChange={(e) => setEditFormData({ ...editFormData, latitude: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="14.5995"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={editFormData.longitude}
                  onChange={(e) => setEditFormData({ ...editFormData, longitude: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="120.9842"
                />
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Content</h3>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Headline</label>
              <input
                type="text"
                value={editFormData.headline}
                onChange={(e) => setEditFormData({ ...editFormData, headline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="20% Off Cleaning Services"
              />
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Body</label>
              <textarea
                value={editFormData.body}
                onChange={(e) => setEditFormData({ ...editFormData, body: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={3}
                placeholder="Professional cleaning services at discounted rates. Book now and save!"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Call to Action Text</label>
                <input
                  type="text"
                  value={editFormData.callToActionText}
                  onChange={(e) => setEditFormData({ ...editFormData, callToActionText: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Book Now"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Call to Action URL</label>
                <input
                  type="text"
                  value={editFormData.callToActionUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, callToActionUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="/book-cleaning"
                />
              </div>
            </div>
          </div>

          {/* Bidding Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Bidding</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Strategy</label>
                <select
                  value={editFormData.biddingStrategy}
                  onChange={(e) => setEditFormData({ ...editFormData, biddingStrategy: e.target.value as BiddingStrategy })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="cpc">CPC</option>
                  <option value="cpm">CPM</option>
                  <option value="cpa">CPA</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Bid Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.bidAmount}
                  onChange={(e) => setEditFormData({ ...editFormData, bidAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="2.50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Bid</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.maxBid}
                  onChange={(e) => setEditFormData({ ...editFormData, maxBid: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="5.00"
                />
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Status & Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as CampaignStatus })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <div className="flex items-center space-x-4 mt-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs text-gray-700">Active</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editFormData.isFeatured}
                  onChange={(e) => setEditFormData({ ...editFormData, isFeatured: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs text-gray-700">Featured</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button
              onClick={() => {
                setEditModalOpen(false);
                setSelectedAd(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateAd}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs"
            >
              {submitting ? 'Updating...' : 'Update Ad'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Ad Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedAd(null);
        }}
        title="Delete Ad"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete this ad? This action cannot be undone.
          </p>
          {selectedAd && (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs font-medium text-gray-900">{selectedAd.title}</p>
              <p className="text-xs text-gray-600 mt-1">{selectedAd.description}</p>
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedAd(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAd}
              disabled={submitting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-xs"
            >
              {submitting ? 'Deleting...' : 'Delete Ad'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Image Upload Modal */}
      <Modal
        isOpen={imageUploadModalOpen}
        onClose={() => {
          setImageUploadModalOpen(false);
          setSelectedFiles([]);
          setSelectedAd(null);
        }}
        title="Upload Ad Images"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Select Images
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setSelectedFiles(files);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can select multiple images at once
            </p>
          </div>

          {selectedFiles.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">
                Selected Files ({selectedFiles.length}):
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                    <span className="text-gray-700 truncate">{file.name}</span>
                    <span className="text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button
              onClick={() => {
                setImageUploadModalOpen(false);
                setSelectedFiles([]);
                setSelectedAd(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadImages}
              disabled={submitting || selectedFiles.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs"
            >
              {submitting ? 'Uploading...' : 'Upload Images'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Approve Modal */}
      <Modal
        isOpen={approveModalOpen}
        onClose={() => {
          setApproveModalOpen(false);
          setSelectedAd(null);
        }}
        title="Approve Ad"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to approve this ad?
          </p>
          {selectedAd && (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs font-medium text-gray-900">{selectedAd.title}</p>
              <p className="text-xs text-gray-600 mt-1">{selectedAd.description}</p>
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => {
                setApproveModalOpen(false);
                setSelectedAd(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-xs"
            >
              {submitting ? 'Approving...' : 'Approve'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setSelectedAd(null);
          setRejectionReason("");
        }}
        title="Reject Ad"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to reject this ad?
          </p>
          {selectedAd && (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs font-medium text-gray-900">{selectedAd.title}</p>
              <p className="text-xs text-gray-600 mt-1">{selectedAd.description}</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Rejection Reason (optional)
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-xs"
              rows={3}
              placeholder="Enter reason for rejection..."
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => {
                setRejectModalOpen(false);
                setSelectedAd(null);
                setRejectionReason("");
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={submitting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-xs"
            >
              {submitting ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

