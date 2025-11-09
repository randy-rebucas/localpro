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
  DollarSign,
  Image as ImageIcon
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";
import { CampaignStatus } from "@/types/ads";

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
  };
  budget: {
    total: number;
    daily?: number;
    currency?: string;
  };
  schedule: {
    startDate: string | Date;
    endDate: string | Date;
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
  const [ads, setAds] = useState<AdCampaignWithAdvertiser[]>([]);
  const [stats, setStats] = useState<AdStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdCampaignWithAdvertiser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchPendingAds = useCallback(async () => {
    try {
      if (!getApiToken()) {
        logger.warn('No API token found, cannot fetch pending ads');
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      // Use the main ads endpoint with status filter to avoid routing conflicts
      // The /api/ads/pending endpoint may be interpreted as /api/ads/:id where id="pending"
      const params = new URLSearchParams();
      params.append('status', 'pending');
      const url = `${API_BASE_URL}${API_ENDPOINTS.ads}?${params.toString()}`;
      
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
        logger.error('Network error fetching pending ads', error, {
          url,
          errorType: 'network',
          message: error.message
        });
        throw new Error(`Network error: Unable to connect to the server. Please check your connection and try again.`);
      }

      // Handle HTTP errors
      if (!response.ok) {
        let errorMessage = `Failed to fetch pending ads (${response.status} ${response.statusText})`;
        
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
        
        logger.error('HTTP error fetching pending ads', new Error(errorMessage), {
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
        logger.error('JSON parse error fetching pending ads', error, {
          url,
          status: response.status,
          errorType: 'parse'
        });
        throw new Error('Invalid response format from server. Please try again later.');
      }
      
      // Handle different response formats from /api/ads endpoint
      let adsData: AdCampaignWithAdvertiser[] = [];
      
      if (Array.isArray(result)) {
        // Direct array response
        adsData = result;
      } else if (result && typeof result === 'object') {
        // Object response with success/data structure
        if (result.success && result.data) {
          adsData = Array.isArray(result.data) ? result.data : [];
        } else if (result.data && Array.isArray(result.data)) {
          // Response with data array but no success field
          adsData = result.data;
        } else if (result.error || result.message) {
          // Error response
          const errorMsg = result.error || result.message || 'Failed to fetch pending ads';
          logger.error('API returned unsuccessful response', new Error(errorMsg), {
            url,
            response: result,
            errorType: 'api'
          });
          throw new Error(errorMsg);
        }
      }
      
      setAds(adsData);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error fetching pending ads', error, {
        endpoint: `${API_ENDPOINTS.ads}?status=pending`,
        baseUrl: API_BASE_URL
      });
      setError(error.message);
      setAds([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchStatistics = useCallback(async () => {
    try {
      if (!getApiToken()) {
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.adsStatistics}`,
        createAuthFetchOptions({
          method: 'GET'
        })
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.warn('Failed to fetch statistics', errorData);
        return;
      }

      const result = await response.json();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      const error: Error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error fetching statistics', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchPendingAds(), fetchStatistics()]);
    setLastUpdated(new Date());
  }, [fetchPendingAds, fetchStatistics]);

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

  // Filter ads
  const filteredAds = ads.filter(ad => {
    const matchesSearch = !searchTerm || 
      ad.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ad.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || ad.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || ad.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
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
    "pending",
    "approved",
    "active",
    "paused",
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
      {(stats || loading) && (
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
                  {loading ? '...' : `$${stats?.totalRevenue ? stats.totalRevenue.toLocaleString() : '0'}`}
                </p>
                <p className="text-xs text-gray-500">
                  Total earnings
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0 ml-4">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white rounded shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
          </div>
        </div>

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
            <div className="text-xs text-gray-500">
              {filteredAds.length} ads found
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Pending Ads</h3>
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
                      No pending ads found
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
                            <>
                              ${ad.budget.total.toLocaleString()}
                              {ad.budget.currency && ` ${ad.budget.currency}`}
                            </>
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
                    ${ad.budget.total.toLocaleString()}
                    {ad.budget.daily && ` (Daily: $${ad.budget.daily.toLocaleString()})`}
                    {ad.budget.currency && ` ${ad.budget.currency}`}
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

