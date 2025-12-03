"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Megaphone,
  Search,
  Eye,
  CheckCircle,
  Plus,
  Edit,
  Clock,
  AlertCircle,
  X,
  Star,
  Headphones,
  HelpCircle,
  BarChart3,
  Target,
  Zap
} from "lucide-react";
import { apiRequest, API_ENDPOINTS } from "@/lib/api";
import { logger } from "@/lib/logger";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useRoleAccess } from "@/components/role-guard";

type AdsPagination = {
  current: number;
  pages: number;
  total: number;
  limit: number;
  count: number;
};

type AdsResponse = {
  success?: boolean;
  data?: AdCampaign[];
  campaigns?: AdCampaign[];
  ads?: AdCampaign[];
  pagination?: AdsPagination;
} | AdCampaign[];

interface AdImage {
  url: string;
  publicId?: string;
  thumbnail?: string;
  alt?: string;
}

export interface AdCampaign {
  _id?: string;
  id?: string;
  advertiser: {
    _id?: string;
    id?: string;
    user?: string | {
      _id?: string;
      id?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
    };
    businessName?: string;
    businessType?: 'hardware_store' | 'supplier' | 'training_school' | 'service_provider' | 'manufacturer';
    verification?: {
      isVerified?: boolean;
    };
  } | string;
  title: string;
  description: string;
  type: 'banner' | 'sponsored_listing' | 'video' | 'text' | 'interactive';
  category: 'hardware_stores' | 'suppliers' | 'training_schools' | 'services' | 'products';
  targetAudience?: {
    demographics?: {
      ageRange?: [number, number];
      gender?: string[];
      location?: string[];
      interests?: string[];
    };
    behavior?: {
      userTypes?: string[];
      activityLevel?: 'active' | 'moderate' | 'new';
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
  images?: AdImage[] | string[];
  content?: {
    headline?: string;
    body?: string;
    images?: AdImage[];
    video?: {
      url?: string;
      publicId?: string;
      thumbnail?: string;
    };
    callToAction?: {
      text?: string;
      url?: string;
    };
    logo?: {
      url?: string;
      publicId?: string;
      thumbnail?: string;
    };
  };
  budget: {
    total: number;
    daily?: number;
    currency?: string;
  };
  bidding?: {
    strategy?: 'cpc' | 'cpm' | 'cpa' | 'fixed';
    bidAmount?: number;
    maxBid?: number;
  };
  schedule: {
    startDate: string | Date;
    endDate: string | Date;
    timeSlots?: Array<{
      day?: string;
      startTime?: string;
      endTime?: string;
    }>;
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
  status: 'draft' | 'pending' | 'approved' | 'active' | 'paused' | 'completed' | 'rejected';
  approval?: {
    reviewedBy?: string | {
      _id?: string;
      id?: string;
    };
    reviewedAt?: string | Date;
    notes?: string;
    rejectionReason?: string;
  };
  isActive?: boolean;
  isFeatured?: boolean;
  views?: number;
  clicks?: number;
  impressions?: number;
  promotion?: {
    type?: 'featured' | 'sponsored' | 'boosted';
    duration?: number;
    budget?: number;
    startDate?: string | Date;
    endDate?: string | Date;
    status?: 'active' | 'expired' | 'cancelled';
  };
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  clickCount?: number;
  impressionCount?: number;
  spent?: number;
  isPromoted?: boolean;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

const categories = [
  { value: "", label: "All Categories" },
  { value: "hardware_stores", label: "Hardware Stores" },
  { value: "suppliers", label: "Suppliers" },
  { value: "training_schools", label: "Training Schools" },
  { value: "services", label: "Services" },
  { value: "products", label: "Products" }
];

const adTypes = [
  { value: "", label: "All Types" },
  { value: "banner", label: "Banner" },
  { value: "sponsored_listing", label: "Sponsored Listing" },
  { value: "video", label: "Video" },
  { value: "text", label: "Text" },
  { value: "interactive", label: "Interactive" }
];

const statuses = [
  { value: "", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" }
];

const sortOptions = [
  { value: "createdAt", label: "Newest First" },
  { value: "title", label: "Title" },
  { value: "budget", label: "Budget" },
  { value: "spent", label: "Spent" },
  { value: "ctr", label: "CTR" }
];

const adTips = [
  "Use eye-catching images for better CTR",
  "Target specific demographics for efficiency",
  "A/B test different ad copies"
];

const getStatusColor = (status: AdCampaign['status']) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700 border-green-200';
    case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'approved': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'paused': return 'bg-gray-100 text-gray-700 border-gray-200';
    case 'completed': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
    case 'draft': return 'bg-gray-100 text-gray-600 border-gray-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getStatusIcon = (status: AdCampaign['status']) => {
  switch (status) {
    case 'active': return <CheckCircle className="w-3 h-3" />;
    case 'pending': return <Clock className="w-3 h-3" />;
    case 'approved': return <CheckCircle className="w-3 h-3" />;
    case 'paused': return <AlertCircle className="w-3 h-3" />;
    case 'completed': return <CheckCircle className="w-3 h-3" />;
    case 'rejected': return <X className="w-3 h-3" />;
    case 'draft': return <Edit className="w-3 h-3" />;
    default: return <Clock className="w-3 h-3" />;
  }
};

export default function AdsPage() {
  const { settings: appSettings } = useAppSettings();
  const { isProvider, isAdmin } = useRoleAccess();
  const canCreateAds = isProvider || isAdmin;
  
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 12,
    count: 0
  });
  const router = useRouter();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const paginationRef = useRef(pagination);

  const normalizeAdCampaign = useCallback((campaign: Partial<AdCampaign> & Record<string, unknown>): AdCampaign => {
    return {
      ...campaign,
      _id: campaign._id || campaign.id,
      id: campaign.id || campaign._id,
      title: campaign.title || (campaign.content?.headline as string) || 'Untitled Ad',
      description: campaign.description || (campaign.content?.body as string) || '',
      type: campaign.type || 'banner',
      category: campaign.category || 'products',
      status: campaign.status || 'draft',
      images: Array.isArray(campaign.images)
        ? campaign.images.map((img: string | AdImage | Record<string, unknown>) =>
            typeof img === 'string'
              ? { url: img, alt: (campaign.title || '') as string }
              : {
                  url: (img as AdImage).url || (img as AdImage).publicId || '',
                  publicId: (img as AdImage).publicId,
                  thumbnail: (img as AdImage).thumbnail,
                  alt: (img as AdImage).alt || (campaign.title || '') as string
                }
          )
        : [],
      advertiser: typeof campaign.advertiser === 'string'
        ? { id: campaign.advertiser }
        : {
            _id: campaign.advertiser?._id || campaign.advertiser?.id,
            id: campaign.advertiser?.id || campaign.advertiser?._id,
            user: campaign.advertiser?.user,
            businessName: campaign.advertiser?.businessName,
            businessType: campaign.advertiser?.businessType,
            verification: campaign.advertiser?.verification
          },
      budget: (() => {
        if (campaign.budget && typeof campaign.budget === 'object' && 'total' in campaign.budget) {
          return campaign.budget as AdCampaign['budget'];
        }
        const budgetValue = typeof campaign.budget === 'number' ? campaign.budget : 0;
        return {
          total: budgetValue || 0,
          daily: undefined,
          currency: (campaign as { currency?: string }).currency || 'PHP'
        };
      })(),
      schedule: (() => {
        if (campaign.schedule && typeof campaign.schedule === 'object' && 'startDate' in campaign.schedule) {
          return campaign.schedule as AdCampaign['schedule'];
        }
        return {
          startDate: (campaign as { startDate?: string | Date }).startDate || new Date(),
          endDate: (campaign as { endDate?: string | Date }).endDate || new Date(),
          timeSlots: []
        };
      })(),
      performance: (() => {
        if (campaign.performance && typeof campaign.performance === 'object' && 'impressions' in campaign.performance) {
          return campaign.performance as AdCampaign['performance'];
        }
        const perf = campaign.performance as AdCampaign['performance'] | undefined;
        return {
          impressions: campaign.impressions || campaign.impressionCount || perf?.impressions || 0,
          clicks: campaign.clicks || campaign.clickCount || perf?.clicks || 0,
          conversions: (typeof campaign.conversions === 'number' ? campaign.conversions : (perf?.conversions ?? 0)),
          spend: campaign.spent || perf?.spend || 0,
          ctr: (typeof campaign.ctr === 'number' ? campaign.ctr : (perf?.ctr ?? 0)),
          cpc: (typeof campaign.cpc === 'number' ? campaign.cpc : (perf?.cpc ?? 0)),
          cpm: (typeof campaign.cpm === 'number' ? campaign.cpm : (perf?.cpm ?? 0))
        };
      })(),
      targetAudience: campaign.targetAudience && typeof campaign.targetAudience === 'object' && !Array.isArray(campaign.targetAudience)
        ? campaign.targetAudience
        : campaign.targetAudience && Array.isArray(campaign.targetAudience)
          ? { demographics: { interests: campaign.targetAudience } }
          : campaign.targetAudience || {},
      isActive: campaign.isActive !== undefined ? campaign.isActive : true,
      views: campaign.views || 0,
      clicks: campaign.clicks || campaign.clickCount || 0,
      impressions: campaign.impressions || campaign.impressionCount || 0
    };
  }, []);

  const fetchAds = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('page', paginationRef.current.current.toString());
      params.append('limit', paginationRef.current.limit.toString());
      
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedType) params.append('type', selectedType);
      if (selectedStatus) params.append('status', selectedStatus);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);

      const data = await apiRequest<AdsResponse>(`${API_ENDPOINTS.ads}?${params.toString()}`);
      
      let campaignsData: AdCampaign[] = [];
      let paginationData: AdsPagination | undefined;
      
      if (Array.isArray(data)) {
        campaignsData = (data as Array<Partial<AdCampaign> & Record<string, unknown>>).map((campaign) => normalizeAdCampaign(campaign));
      } else if (data && typeof data === 'object') {
        const dataObj = data as Record<string, unknown>;
        if ('success' in dataObj && dataObj.success) {
          const campaignsArray = (dataObj.data || dataObj.campaigns || dataObj.ads || []) as Array<Partial<AdCampaign> & Record<string, unknown>>;
          campaignsData = campaignsArray.map((campaign) => normalizeAdCampaign(campaign));
          paginationData = dataObj.pagination as AdsPagination | undefined;
        } else if ('data' in dataObj && Array.isArray(dataObj.data)) {
          campaignsData = (dataObj.data as Array<Partial<AdCampaign> & Record<string, unknown>>).map((campaign) => normalizeAdCampaign(campaign));
          paginationData = dataObj.pagination as AdsPagination | undefined;
        }
      }
      
      setAds(campaignsData);
      if (paginationData) {
        const newPagination = { ...paginationRef.current, ...paginationData };
        paginationRef.current = newPagination;
        setPagination(newPagination);
      } else {
        const newPagination = { ...paginationRef.current, total: campaignsData.length, count: campaignsData.length, pages: 1 };
        paginationRef.current = newPagination;
        setPagination(newPagination);
      }
    } catch (error) {
      logger.error('Error fetching ads', error instanceof Error ? error : new Error(String(error)));
      setError(error instanceof Error ? error.message : 'Failed to fetch ads');
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchQuery, selectedCategory, selectedType, selectedStatus, sortBy, sortOrder, normalizeAdCampaign]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setDebouncedSearchQuery(searchQuery), 500);
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [searchQuery]);

  useEffect(() => { paginationRef.current = pagination; }, [pagination]);
  useEffect(() => { fetchAds(); }, [debouncedSearchQuery, selectedCategory, selectedType, selectedStatus, sortBy, sortOrder, fetchAds]);

  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      const matchesSearch = !debouncedSearchQuery || 
                           ad.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                           ad.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || ad.category === selectedCategory;
      const matchesType = !selectedType || ad.type === selectedType;
      const matchesStatus = !selectedStatus || ad.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesType && matchesStatus;
    });
  }, [ads, debouncedSearchQuery, selectedCategory, selectedType, selectedStatus]);

  const sortedAds = useMemo(() => {
    return [...filteredAds].sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;
      switch (sortBy) {
        case 'title': aValue = a.title; bValue = b.title; break;
        case 'budget': aValue = a.budget?.total || 0; bValue = b.budget?.total || 0; break;
        case 'spent': aValue = a.performance?.spend || a.spent || 0; bValue = b.performance?.spend || b.spent || 0; break;
        case 'ctr': aValue = a.performance?.ctr || 0; bValue = b.performance?.ctr || 0; break;
        default: aValue = new Date(a.createdAt || 0).getTime(); bValue = new Date(b.createdAt || 0).getTime(); break;
      }
      return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
  }, [filteredAds, sortBy, sortOrder]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedType) count++;
    if (selectedStatus) count++;
    return count;
  }, [selectedCategory, selectedType, selectedStatus]);

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedType("");
    setSelectedStatus("");
    setSearchQuery("");
  };

  const formatPrice = (price: number) => formatCurrency(price, 'PHP', { appSettings, showSymbol: true });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 relative overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl border-2 border-gray-200 p-4 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
          <div className="flex gap-6">
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 animate-pulse space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-200 rounded"></div>)}
              </div>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-xl border-2 border-gray-200 p-4 animate-pulse">
                  <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl animate-float animation-delay-4000"></div>
      </div>

      <div className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Ads — Promote Your Business
              </h1>
              <p className="text-gray-600">
                Create and manage advertising campaigns to reach your target audience.
              </p>
            </div>
            {canCreateAds && (
              <button
                onClick={() => router.push('/ads/create')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                Create Ad
              </button>
            )}
          </div>
        </div>

        {/* Subheader Links */}
        <div className="mb-6 flex items-center gap-6 border-b border-gray-200 pb-4 flex-wrap">
          <Link href="/ads/analytics" className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group">
            <BarChart3 className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Analytics</span>
          </Link>
          <Link href="/ads/audiences" className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group">
            <Target className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Audiences</span>
          </Link>
          <Link href="/support" className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors group">
            <Headphones className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Support</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search ads by title, description, or advertiser..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all shadow-sm hover:shadow-md bg-white"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6 space-y-6 sticky top-24">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                  {activeFiltersCount > 0 && (
                    <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-medium rounded-full">{activeFiltersCount}</span>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white font-medium">
                    {categories.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ad Type</label>
                  <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white font-medium">
                    {adTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white font-medium">
                    {statuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
                  </select>
                </div>

                {activeFiltersCount > 0 && (
                  <button onClick={clearFilters} className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Ad Tips */}
              <div className="pt-6 border-t-2 border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Ad Tips</h2>
                <ul className="space-y-3">
                  {adTips.map((tip, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <Zap className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Help Section */}
              <div className="pt-6 border-t-2 border-gray-200">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-start gap-3 mb-3">
                    <HelpCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Need Help?</h3>
                      <p className="text-xs text-gray-600 mt-1">Learn how to create effective ad campaigns.</p>
                    </div>
                  </div>
                  <Link href="/support" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-all border border-purple-200 font-medium text-sm">
                    <Headphones className="w-4 h-4" />
                    Get Support
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-600 text-sm">{sortedAds.length} ad{sortedAds.length !== 1 ? 's' : ''} found</p>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white font-medium">
                {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            {error ? (
              <div className="bg-white rounded-xl border-2 border-red-200 p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Ads</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button onClick={fetchAds} className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium">
                  Try Again
                </button>
              </div>
            ) : sortedAds.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
                  <Megaphone className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Ads Found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || activeFiltersCount > 0 ? "Try adjusting your filters." : "Create your first ad campaign to get started."}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {activeFiltersCount > 0 && (
                    <button onClick={clearFilters} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg font-semibold">
                      Clear Filters
                    </button>
                  )}
                  {canCreateAds && (
                    <button onClick={() => router.push('/ads/create')} className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium">
                      Create Your First Ad
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedAds.map((ad, index) => (
                  <AdCard key={ad.id || ad._id || `ad-${index}`} ad={ad} formatPrice={formatPrice} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AdCardProps {
  ad: AdCampaign;
  formatPrice: (price: number) => string;
}

const AdCard = React.memo(function AdCard({ ad, formatPrice }: AdCardProps) {
  const router = useRouter();
  const adId = ad.id || ad._id || '';
  
  const getImageUrl = () => {
    const images = ad.content?.images || ad.images || [];
    if (!images || images.length === 0) return null;
    const firstImage = images[0];
    return typeof firstImage === 'string' ? firstImage : (firstImage.url || firstImage.thumbnail || null);
  };
  const imageUrl = getImageUrl();
  
  const advertiser = typeof ad.advertiser === 'string' 
    ? { businessName: 'Unknown Advertiser', verification: { isVerified: false } }
    : ad.advertiser || {};
  const advertiserName = advertiser.businessName || 'Unknown Advertiser';
  
  const clicks = ad.performance?.clicks || ad.clicks || ad.clickCount || 0;
  const impressions = ad.performance?.impressions || ad.impressions || 0;
  const spend = ad.performance?.spend || ad.spent || 0;
  const budget = ad.budget?.total || 0;

  return (
    <Link
      href={`/ads/${adId}`}
      className={`group bg-white rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 overflow-hidden`}
    >
      <div className="relative">
        {imageUrl ? (
          <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
            <Image src={imageUrl} alt={ad.title} width={400} height={225} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        ) : (
          <div className="aspect-[16/9] bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            <Megaphone className="w-12 h-12 text-purple-400" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${getStatusColor(ad.status)}`}>
            {getStatusIcon(ad.status)}
            <span className="capitalize">{ad.status}</span>
          </span>
        </div>
        
        {/* Featured Badge */}
        {(ad.isPromoted || ad.isFeatured || ad.promotion?.status === 'active') && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-yellow-500 text-white rounded text-xs font-bold flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              Featured
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-purple-600 transition-colors flex-1">
            {ad.content?.headline || ad.title}
          </h3>
          <div className="flex gap-1 ml-2">
            <button onClick={(e) => { e.preventDefault(); router.push(`/ads/${adId}`); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-purple-600 transition-colors">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.preventDefault(); router.push(`/ads/${adId}/edit`); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-purple-600 transition-colors">
              <Edit className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ad.content?.body || ad.description}</p>

        {/* Tags */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-lg font-medium">
            {ad.category?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Ad'}
          </span>
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">
            {ad.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Banner'}
          </span>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 gap-3 text-sm mb-3 pt-3 border-t border-gray-100">
          <div>
            <p className="text-gray-500 text-xs">Budget</p>
            <p className="font-semibold text-gray-900">{formatPrice(budget)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Spent</p>
            <p className="font-semibold text-gray-900">{formatPrice(spend)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Impressions</p>
            <p className="font-semibold text-gray-900">{impressions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Clicks</p>
            <p className="font-semibold text-gray-900">{clicks.toLocaleString()}</p>
          </div>
        </div>

        {/* Advertiser */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {advertiserName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{advertiserName}</p>
            <p className="text-xs text-gray-500">{ad.createdAt ? new Date(ad.createdAt).toLocaleDateString() : ''}</p>
          </div>
          {advertiser.verification?.isVerified && (
            <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />
          )}
        </div>
      </div>
    </Link>
  );
});
