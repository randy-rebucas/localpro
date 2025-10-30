"use client";

import { useSession } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { makeClientAuthenticatedRequestWithEndpointSafe, makeClientAuthenticatedRequestWithPathSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { Loading } from "@/components/ui/loading";
import Image from "next/image";
import { isValidImageUrl, getPlaceholderImageUrl } from '@/lib/image-utils';
import {
  Megaphone,
  Search,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  X,
  DollarSign,
  RefreshCw,
  MoreHorizontal,
  Ban,
  Check,
  Pause,
  Play
} from "lucide-react";

interface Advertiser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profile?: {
    bio?: string;
    company?: string;
  };
  isVerified: boolean;
}

interface TargetAudience {
  demographics: {
    ageRange: [number, number];
    gender: string[];
    location: string[];
    interests: string[];
  };
  behavior: {
    userTypes: string[];
    activityLevel: string;
  };
}

interface Content {
  callToAction: {
    text: string;
    url: string;
  };
  logo: {
    url: string;
    publicId: string;
    thumbnail: string;
  };
  headline: string;
  body: string;
  images: Array<{
    url: string;
    publicId: string;
    thumbnail: string;
    _id: string;
  }>;
}

interface Budget {
  total: number;
  daily: number;
  currency: string;
}

interface Bidding {
  strategy: string;
}

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  _id: string;
}

interface Schedule {
  startDate: string;
  endDate: string;
  timeSlots: TimeSlot[];
}

interface Performance {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpm: number;
}

interface Ad {
  _id: string;
  title: string;
  description: string;
  category: string;
  type: 'banner' | 'featured-listing' | 'sponsored-product' | 'training-school';
  status: 'draft' | 'pending' | 'active' | 'paused' | 'expired' | 'rejected';
  isActive: boolean;
  targetAudience: TargetAudience;
  content: Content;
  budget: Budget;
  bidding: Bidding;
  schedule: Schedule;
  performance: Performance;
  advertiser: Advertiser | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export default function AdminAdsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    count: 0,
    total: 0,
    page: 1,
    pages: 1
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async (page = 1) => {
    try {
      setLoading(true);
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'ads' as keyof typeof API_ENDPOINTS,
        { method: 'GET', query: { page: String(page) } }
      );
      const result = await response.json();

      if (result.success) {
        // Use actual API data
        setAds(result.data);
        setPagination({
          count: result.count || 0,
          total: result.total || 0,
          page: result.page || 1,
          pages: result.pages || 1
        });
        setError(null);
      } else {
        // Handle API errors
        setAds([]);
        setError(result.message || "Failed to fetch ads data");
      }
    } catch (error) {
      console.error("Error fetching ads:", error);
      setAds([]);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading ads management..." />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => fetchAds()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.content?.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.content?.body?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.advertiser?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.advertiser?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || ad.category === filterCategory;
    const matchesStatus = filterStatus === "all" || ad.status === filterStatus;
    const matchesType = filterType === "all" || ad.type === filterType;
    return matchesSearch && matchesCategory && matchesStatus && matchesType;
  });

  // Calculate stats from real data
  const totalAds = ads.length;
  const activeAds = ads.filter(ad => ad.status === 'active').length;
  const pendingAds = ads.filter(ad => ad.status === 'pending').length;
  const totalBudget = ads.reduce((sum, ad) => sum + (ad.budget?.total || 0), 0);

  const getStatusColor = (status: Ad['status']) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'paused': return 'text-gray-600 bg-gray-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'draft': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: Ad['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'paused': return <Pause className="w-3 h-3" />;
      case 'expired': return <X className="w-3 h-3" />;
      case 'rejected': return <Ban className="w-3 h-3" />;
      case 'draft': return <Edit className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const handleStatusChange = async (adId: string, newStatus: Ad['status']) => {
    try {
      const response = await makeClientAuthenticatedRequestWithPathSafe(
        'adsUpdate' as keyof typeof API_ENDPOINTS,
        [adId, 'status'],
        {},
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update local state with the updated ad data
          setAds(ads.map(ad =>
            ad._id === adId ? { ...ad, ...result.data } : ad
          ));
        } else {
          console.error('Failed to update ad status:', result.message);
        }
      } else {
        console.error('Failed to update ad status:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating ad status:', error);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterCategory("all");
    setFilterStatus("all");
    setFilterType("all");
  };

  const refreshData = () => {
    fetchAds(pagination.page);
  };

  const hasActiveFilters = () => {
    return searchTerm !== "" ||
      filterCategory !== "all" ||
      filterStatus !== "all" ||
      filterType !== "all";
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Ads Management
          </h1>
          <p className="text-gray-600 text-sm">Monitor and manage all advertising campaigns</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={refreshData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 hover:shadow-md"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
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
              <p className="text-lg font-bold text-gray-900">{totalAds}</p>
              <p className="text-xs text-gray-500">All campaigns</p>
            </div>
            <Megaphone className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Active Ads</p>
              <p className="text-lg font-bold text-gray-900">{activeAds}</p>
              <p className="text-xs text-gray-500">Currently running</p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Pending Review</p>
              <p className="text-lg font-bold text-gray-900">{pendingAds}</p>
              <p className="text-xs text-gray-500">Awaiting approval</p>
            </div>
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500">Total Budget</p>
              <p className="text-lg font-bold text-gray-900">${totalBudget.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Allocated funds</p>
            </div>
            <DollarSign className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
            <div className="flex items-center space-x-2">
              {hasActiveFilters() && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 focus:outline-none"
                >
                  <X className="w-3 h-3 mr-1" />
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="w-3 h-3 mr-1" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
            </div>
          </div>
        </div>
        {/* Search and Basic Filters - Conditionally Rendered */}
        {showFilters && (
          <div className="p-4">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Search Ads</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by title, description, or advertiser..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="sm:w-48">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="Hardware Stores">Hardware Stores</option>
                    <option value="Suppliers">Suppliers</option>
                    <option value="Training Schools">Training Schools</option>
                    <option value="Equipment Rental">Equipment Rental</option>
                    <option value="Cleaning Services">Cleaning Services</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Moving Services">Moving Services</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="sm:w-48">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="expired">Expired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="sm:w-48">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="featured-listing">Featured Listing</option>
                    <option value="sponsored-product">Sponsored Product</option>
                    <option value="training-school">Training School</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ads Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">All Ads</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshData}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ad Details
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target Audience
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Advertiser
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center">
                    <div className="text-center">
                      <Megaphone className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        {ads.length === 0 ? 'No ads available' : 'No ads found'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {ads.length === 0 
                          ? 'No advertising campaigns have been created yet.' 
                          : 'Try adjusting your search or filters.'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAds.map((ad, index) => (
                  <tr key={ad._id || index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="flex items-center">
                        <div className="h-8 w-8 flex-shrink-0">
                          {ad.content?.logo?.thumbnail && isValidImageUrl(ad.content.logo.thumbnail) ? (
                            <Image 
                              src={ad.content.logo.thumbnail} 
                              alt="Ad logo" 
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded object-cover"
                            />
                          ) : (
                            <Image 
                              src={getPlaceholderImageUrl(32, 32, 'Ad')} 
                              alt="Ad logo placeholder" 
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-xs font-medium text-gray-900">
                            {ad.title}
                          </div>
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {ad.content?.headline || ad.description}
                          </div>
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {ad.content?.body}
                          </div>
                          <div className="flex items-center mt-1 flex-wrap gap-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-purple-600 bg-purple-100">
                              {ad.category}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-blue-600 bg-blue-100">
                              {ad.type}
                            </span>
                            {ad.content?.callToAction && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-100">
                                CTA: {ad.content.callToAction.text}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div>
                        <div className="text-xs font-medium text-gray-900">
                          Age: {ad.targetAudience?.demographics?.ageRange?.[0]}-{ad.targetAudience?.demographics?.ageRange?.[1]}
                        </div>
                        <div className="text-xs text-gray-500">
                          Gender: {ad.targetAudience?.demographics?.gender?.join(', ')}
                        </div>
                        <div className="text-xs text-gray-500">
                          Location: {ad.targetAudience?.demographics?.location?.join(', ')}
                        </div>
                        <div className="text-xs text-gray-500">
                          Interests: {ad.targetAudience?.demographics?.interests?.join(', ')}
                        </div>
                        <div className="text-xs text-gray-500">
                          User Types: {ad.targetAudience?.behavior?.userTypes?.join(', ')}
                        </div>
                        <div className="text-xs text-gray-500">
                          Activity: {ad.targetAudience?.behavior?.activityLevel}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div>
                        {ad.advertiser ? (
                          <>
                            <div className="text-xs font-medium text-gray-900">
                              {ad.advertiser.firstName} {ad.advertiser.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {ad.advertiser.email}
                            </div>
                            <div className="flex items-center mt-1">
                              {ad.advertiser.isVerified ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-100">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                                  Unverified
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-gray-500 italic">
                            No advertiser assigned
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div>
                        <div className="text-xs font-medium text-gray-900">
                          ${ad.budget?.total?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Daily: ${ad.budget?.daily?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Currency: {ad.budget?.currency || 'USD'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Spent: ${ad.performance?.spend?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div>
                        <div className="text-xs font-medium text-gray-900">
                          {ad.performance?.clicks?.toLocaleString() || '0'} clicks
                        </div>
                        <div className="text-xs text-gray-500">
                          {ad.performance?.impressions?.toLocaleString() || '0'} impressions
                        </div>
                        <div className="text-xs text-gray-500">
                          CTR: {ad.performance?.ctr?.toFixed(2) || '0.00'}%
                        </div>
                        <div className="text-xs text-gray-500">
                          Conversions: {ad.performance?.conversions?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div>
                        <div className="text-xs font-medium text-gray-900">
                          Start: {new Date(ad.schedule?.startDate || '').toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          End: {new Date(ad.schedule?.endDate || '').toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Time Slots: {ad.schedule?.timeSlots?.length || 0}
                        </div>
                        {ad.schedule?.timeSlots?.slice(0, 2).map((slot, index) => (
                          <div key={index} className="text-xs text-gray-500">
                            {slot.day}: {slot.startTime}-{slot.endTime}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ad.status)}`}>
                          {getStatusIcon(ad.status)}
                          <span className="ml-1 capitalize">{ad.status}</span>
                        </span>
                        {ad.isActive && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-100">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        )}
                        {ad.status === 'rejected' && (
                          <span className="text-xs text-red-600">
                            Rejected - Review required
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {/* View ad details */ }}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        {ad.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(ad._id, 'active')}
                              className="inline-flex items-center px-2 py-1 border border-green-300 shadow-sm text-xs font-medium rounded text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              title="Approve"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(ad._id, 'rejected')}
                              className="inline-flex items-center px-2 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              title="Reject"
                            >
                              <Ban className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        {ad.status === 'active' && (
                          <button
                            onClick={() => handleStatusChange(ad._id, 'paused')}
                            className="inline-flex items-center px-2 py-1 border border-yellow-300 shadow-sm text-xs font-medium rounded text-yellow-700 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                            title="Pause"
                          >
                            <Pause className="w-3 h-3" />
                          </button>
                        )}
                        {ad.status === 'paused' && (
                          <button
                            onClick={() => handleStatusChange(ad._id, 'active')}
                            className="inline-flex items-center px-2 py-1 border border-green-300 shadow-sm text-xs font-medium rounded text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            title="Resume"
                          >
                            <Play className="w-3 h-3" />
                          </button>
                        )}
                        <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          <MoreHorizontal className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
