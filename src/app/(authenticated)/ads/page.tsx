"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Megaphone,
  Search,
  Eye,
  MapPin,
  CheckCircle,
  SlidersHorizontal,
  Grid,
  List,
  RefreshCw,
  Plus,
  Edit,
  Clock,
  AlertCircle,
  X,
  TrendingUp,
  DollarSign,
  Star
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { apiRequest, API_ENDPOINTS } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/loading";
import { logger } from "@/lib/logger";

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

// Ad Campaign Image Interface
interface AdImage {
  url: string;
  publicId?: string;
  thumbnail?: string;
  alt?: string;
}

// Ad Campaign Entity Interface (matching data-entities.md)
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
  } | string; // Can be populated object or just ID
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
  images?: AdImage[] | string[]; // Support both formats
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
  
  // Legacy fields for backward compatibility
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

const getStatusColor = (status: AdCampaign['status']) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'approved': return 'bg-blue-100 text-blue-800';
    case 'paused': return 'bg-gray-100 text-gray-800';
    case 'completed': return 'bg-purple-100 text-purple-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'draft': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: AdCampaign['status']) => {
  switch (status) {
    case 'active': return <CheckCircle className="w-4 h-4" />;
    case 'pending': return <Clock className="w-4 h-4" />;
    case 'approved': return <CheckCircle className="w-4 h-4" />;
    case 'paused': return <AlertCircle className="w-4 h-4" />;
    case 'completed': return <CheckCircle className="w-4 h-4" />;
    case 'rejected': return <X className="w-4 h-4" />;
    case 'draft': return <Edit className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

export default function AdsPage() {
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortBy] = useState('createdAt');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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

  // Normalize ad campaign data from API response
  const normalizeAdCampaign = useCallback((campaign: Partial<AdCampaign> & Record<string, unknown>): AdCampaign => {
    return {
      ...campaign,
      _id: campaign._id || campaign.id,
      id: campaign.id || campaign._id,
      // Ensure required fields have defaults
      title: campaign.title || (campaign.content?.headline as string) || 'Untitled Ad',
      description: campaign.description || (campaign.content?.body as string) || '',
      type: campaign.type || 'banner',
      category: campaign.category || 'products',
      status: campaign.status || 'draft',
      // Handle images
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
      // Handle advertiser
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
      // Handle budget
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
      // Handle schedule
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
      // Handle performance
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
      // Handle targetAudience (legacy array format support)
      targetAudience: campaign.targetAudience && typeof campaign.targetAudience === 'object' && !Array.isArray(campaign.targetAudience)
        ? campaign.targetAudience
        : campaign.targetAudience && Array.isArray(campaign.targetAudience)
          ? { demographics: { interests: campaign.targetAudience } }
          : campaign.targetAudience || {},
      // Set defaults
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
      
      // Don't filter by status - show all user's ads regardless of status
      
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedType) params.append('type', selectedType);
      if (selectedStatus) params.append('status', selectedStatus);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);

      const data = await apiRequest<AdsResponse>(`${API_ENDPOINTS.ads}?${params.toString()}`);
      
      // Handle different response formats
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
        const newPagination = {
          ...paginationRef.current,
          ...paginationData
        };
        paginationRef.current = newPagination;
        setPagination(newPagination);
      } else {
        const newPagination = {
          ...paginationRef.current,
          total: campaignsData.length,
          count: campaignsData.length,
          pages: 1
        };
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

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Update pagination ref when pagination state changes
  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  // Fetch ads when filters or search change
  useEffect(() => {
    fetchAds();
  }, [debouncedSearchQuery, selectedCategory, selectedType, selectedStatus, sortBy, sortOrder, fetchAds]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: ads.length,
      active: ads.filter(ad => ad.status === 'active').length,
      totalBudget: ads.reduce((sum, ad) => sum + (ad.budget?.total || 0), 0),
      totalSpent: ads.reduce((sum, ad) => sum + (ad.performance?.spend || ad.spent || 0), 0)
    };
  }, [ads]);

  // Filter and sort ads
  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      const matchesSearch = !debouncedSearchQuery || 
                           ad.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                           ad.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                           (typeof ad.advertiser === 'object' && !Array.isArray(ad.advertiser) && 
                            (ad.advertiser.businessName || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
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
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'budget':
          aValue = a.budget?.total || 0;
          bValue = b.budget?.total || 0;
          break;
        case 'spent':
          aValue = a.performance?.spend || a.spent || 0;
          bValue = b.performance?.spend || b.spent || 0;
          break;
        case 'ctr':
          aValue = a.performance?.ctr || 0;
          bValue = b.performance?.ctr || 0;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredAds, sortBy, sortOrder]);

  const handleViewAd = (adId: string) => {
    router.push(`/ads/${adId}`);
  };

  const handleCreateAd = () => {
    router.push('/ads/create');
  };

  const handleEditAd = (adId: string) => {
    router.push(`/ads/${adId}/edit`);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ads</h1>
            <p className="text-gray-600">Manage your advertising campaigns</p>
          </div>
        </div>
        <ListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card interactive={false}>
          <EmptyState
            icon={Megaphone}
            iconColor="text-red-600"
            iconBgColor="bg-red-100"
            title="Unable to Load Ads"
            description={error}
            actions={[
              {
                type: "button",
                onClick: fetchAds,
                label: "Try Again",
                icon: RefreshCw,
                variant: "primary"
              }
            ]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <PageHeader
        title="Ads"
        subtitle="Manage your advertising campaigns and reach your target audience"
        actions={[
          {
            type: "button",
            onClick: handleCreateAd,
            label: "Create Ad",
            icon: Plus,
            variant: "primary"
          }
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Ads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Megaphone className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Ads</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalBudget.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalSpent.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Main Layout: Filters on Left, Content on Right */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left Sidebar - Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <Card className="p-4 sticky top-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <SlidersHorizontal className="w-5 h-5 text-gray-400" />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {adTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div>
                <button
                  onClick={() => {
                    setSelectedCategory("");
                    setSelectedType("");
                    setSelectedStatus("");
                    setSearchQuery("");
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </Card>
        </aside>

        {/* Right Content Area */}
        <div className="flex-1 space-y-4">
          {/* Search and Controls */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="flex-1">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-green-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search ads, categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-gray-600">
                  {sortedAds.length} ad{sortedAds.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <button
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
              >
                {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </button>
            </div>

            {sortedAds.length === 0 ? (
              <Card interactive={false}>
                <EmptyState
                  icon={Megaphone}
                  iconColor="text-purple-600"
                  iconBgColor="bg-purple-100"
                  title="No Ads Found"
                  description="We couldn't find any ads matching your criteria. Try adjusting your search terms or filters."
                  actions={[
                    {
                      type: "button",
                      onClick: () => {
                        setSearchQuery("");
                        setSelectedCategory("");
                        setSelectedType("");
                        setSelectedStatus("");
                      },
                      label: "Clear All Filters",
                      variant: "primary"
                    },
                    {
                      type: "button",
                      onClick: handleCreateAd,
                      label: "Create Your First Ad",
                      variant: "secondary"
                    }
                  ]}
                />
              </Card>
            ) : (
              <>
                <div className={`grid gap-4 ${
                  viewMode === "grid" 
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
                    : "grid-cols-1"
                }`}>
                  {sortedAds.map((ad, index) => (
                    <AdCard
                      key={ad.id || ad._id || `ad-${index}`}
                      ad={ad}
                      viewMode={viewMode}
                      onView={handleViewAd}
                      onEdit={handleEditAd}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface AdCardProps {
  ad: AdCampaign;
  viewMode: "grid" | "list";
  onView: (adId: string) => void;
  onEdit: (adId: string) => void;
}

const AdCard = React.memo(function AdCard({ ad, viewMode, onView, onEdit }: AdCardProps) {
  const adId = ad.id || ad._id || '';
  
  // Get image URL (handle both formats)
  const getImageUrl = () => {
    // Check content.images first, then images
    const images = ad.content?.images || ad.images || [];
    if (!images || images.length === 0) return null;
    const firstImage = images[0];
    return typeof firstImage === 'string' ? firstImage : (firstImage.url || firstImage.thumbnail || null);
  };
  const imageUrl = getImageUrl();
  
  // Get advertiser name
  const advertiser = typeof ad.advertiser === 'string' 
    ? { businessName: 'Unknown Advertiser', verification: { isVerified: false } }
    : ad.advertiser || {};
  const advertiserName = advertiser.businessName || 'Unknown Advertiser';
  
  // Get location
  const locationCity = ad.location?.city || '';
  const locationState = ad.location?.state || '';
  
  // Get schedule dates
  const startDate = ad.schedule?.startDate ? new Date(ad.schedule.startDate) : null;
  const endDate = ad.schedule?.endDate ? new Date(ad.schedule.endDate) : null;
  
  // Get performance metrics
  const clicks = ad.performance?.clicks || ad.clicks || ad.clickCount || 0;
  const spend = ad.performance?.spend || ad.spent || 0;
  const ctr = ad.performance?.ctr || 0;
  const budget = ad.budget?.total || 0;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group ${
        viewMode === "list" ? "flex" : ""
      }`}
    >
      <div className={viewMode === "list" ? "flex-1 p-4" : "p-4"}>
        <div className={viewMode === "list" ? "flex gap-6" : ""}>
          {/* Ad Image */}
          <div className={`${viewMode === "list" ? "w-48 h-32" : "w-full h-40"} bg-gray-200 rounded-lg mb-3 flex-shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300 relative`}>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={
                  (() => {
                    const images = ad.content?.images || ad.images || [];
                    if (Array.isArray(images) && images.length > 0) {
                      const firstImg = images[0];
                      if (typeof firstImg === 'object' && 'alt' in firstImg && typeof firstImg.alt === 'string') {
                        return firstImg.alt;
                      }
                    }
                    return ad.title || 'Ad image';
                  })()
                }
                width={viewMode === "list" ? 192 : 400}
                height={viewMode === "list" ? 128 : 192}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <span className="text-sm">No Image</span>
                </div>
              </div>
            )}
            {/* Status Badge */}
            <div className="absolute top-2 right-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(ad.status)}`}>
                {getStatusIcon(ad.status)}
                <span className="capitalize">{ad.status}</span>
              </span>
            </div>
            {/* Promoted Badge */}
            {(ad.isPromoted || ad.isFeatured || ad.promotion?.status === 'active') && (
              <div className="absolute top-2 left-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Promoted
                </span>
              </div>
            )}
          </div>

          {/* Ad Details */}
          <div className={viewMode === "list" ? "flex-1" : ""}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-gray-700 line-clamp-1 flex-1">
                {ad.content?.headline || ad.title}
              </h3>
              <div className="flex gap-1 ml-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onView(adId)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(adId)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
              {ad.content?.body || ad.description}
            </p>

            {/* Ad Meta */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {ad.category?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Ad'}
              </span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {ad.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Ad'}
              </span>
              {(locationCity || locationState) && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {locationCity && locationState ? `${locationCity}, ${locationState}` : locationCity || locationState}
                </span>
              )}
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-3 border-t pt-3">
              <div>
                <p className="text-gray-500 text-xs">Budget</p>
                <p className="font-medium">₱{budget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Spent</p>
                <p className="font-medium">₱{spend.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Clicks</p>
                <p className="font-medium">{clicks.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">CTR</p>
                <p className="font-medium">{ctr.toFixed(2)}%</p>
              </div>
            </div>

            {/* Schedule Info */}
            {startDate && endDate && (
              <div className="text-xs text-gray-500 mb-2">
                {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
              </div>
            )}

            {/* Advertiser Info */}
            <div className="mt-4 pt-3 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {advertiserName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{advertiserName}</p>
                    <p className="text-xs text-gray-500">
                      {ad.createdAt ? new Date(ad.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  {advertiser.verification?.isVerified && (
                    <div className="relative group">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Verified Advertiser
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
