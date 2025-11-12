"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Target, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Filter, 
  Search, 
  Download, 
  RefreshCw,
  Eye,
  User,
  Mail,
  Phone,
  MapPin,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Play,
  TrendingUp
} from "lucide-react";
import { makeClientAuthenticatedRequestWithEndpointSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { logger } from "@/lib/logger";
import { Referral, ReferralStatus, ReferralType, RewardStatus } from "@/types/referrals";

// Extended Referral interface for admin page
interface ReferralData extends Omit<Referral, 'referrer' | 'referee' | 'status' | 'referralType' | 'createdAt' | 'updatedAt'> {
  id: string;
  _id?: string;
  referrerId: string;
  referrerName: string;
  referrerEmail: string;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
  referredUserPhone?: string;
  referredUserLocation?: string;
  status: ReferralStatus | 'pending' | 'completed' | 'cancelled';
  referralType?: ReferralType;
  rewardAmount: number;
  rewardStatus: RewardStatus | 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  notes?: string;
  source: string;
  campaign?: string;
}

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  completedReferrals: number;
  totalRewards: number;
  paidRewards: number;
  pendingRewards: number;
  conversionRate: number;
  topReferrers: Array<{
    id: string;
    name: string;
    email: string;
    totalReferrals: number;
    completedReferrals: number;
    totalRewards: number;
  }>;
}

interface ReferralAnalytics {
  trends?: Array<{
    date: string;
    count: number;
    completed: number;
    conversionRate: number;
  }>;
  referralTypes?: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  conversionRate?: number;
  summary?: {
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalRewards: number;
    averageReward: number;
  };
  timeRange?: string;
  groupBy?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [analytics, setAnalytics] = useState<ReferralAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    rewardStatus: 'all',
    search: '',
    dateRange: 'all'
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedReferrals, setSelectedReferrals] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUsingFallbackData, setIsUsingFallbackData] = useState(false);
  const [processingReferral, setProcessingReferral] = useState<string | null>(null);

  // Fetch referrals data
  const fetchReferrals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        status: filters.status,
        rewardStatus: filters.rewardStatus,
        search: filters.search,
        dateRange: filters.dateRange,
        sortBy,
        sortOrder
      });

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'referralsAnalytics' as keyof typeof API_ENDPOINTS,
        { method: 'GET', query: Object.fromEntries(queryParams) }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch referrals: ${response.status}`);
      }

      const data = await response.json();
      
      logger.debug('Referrals API response', { hasData: !!data, success: data.success });
      
      if (data.success) {
        // Ensure data is always an array
        const referralsData = Array.isArray(data.data) ? data.data : [];
        logger.debug('Processed referrals data', { count: referralsData.length });
        setReferrals(referralsData);
        setPagination(data.pagination);
        // Check if we're using real data or fallback
        // Real data will have different ID format, fallback uses 'ref_' prefix
        const isFallbackData = referralsData.length > 0 && referralsData[0].id?.startsWith('ref_');
        setIsUsingFallbackData(isFallbackData);
      } else {
        throw new Error(data.error || 'Failed to fetch referrals');
      }
    } catch (err) {
      logger.error('Error fetching referrals', err instanceof Error ? err : new Error(String(err)));
      // Don't set error state immediately, let the API handle fallback
      logger.debug('Referrals fetch error, will use fallback data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, sortBy, sortOrder]);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      const timeRange = filters.dateRange !== 'all' ? filters.dateRange : 'month';
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'referralsAnalytics' as keyof typeof API_ENDPOINTS,
        { 
          method: 'GET', 
          query: { 
            timeRange,
            groupBy: 'day'
          } 
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setAnalytics(data.data);
        // Also update stats from analytics summary if available
        if (data.data.summary) {
          setStats({
            totalReferrals: data.data.summary.totalReferrals || 0,
            pendingReferrals: data.data.summary.pendingReferrals || 0,
            completedReferrals: data.data.summary.completedReferrals || 0,
            totalRewards: data.data.summary.totalRewards || 0,
            paidRewards: 0, // Not in summary
            pendingRewards: 0, // Not in summary
            conversionRate: data.data.conversionRate || 0,
            topReferrers: []
          });
        }
      } else {
        logger.warn('Analytics API returned error', { error: data.error });
      }
    } catch (err) {
      logger.error('Error fetching analytics', err instanceof Error ? err : new Error(String(err)));
    }
  }, [filters.dateRange]);

  // Fetch stats data (legacy/fallback)
  const fetchStats = useCallback(async () => {
    try {
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'referralsStats' as keyof typeof API_ENDPOINTS,
        { method: 'GET', query: { timeRange: filters.dateRange !== 'all' ? filters.dateRange : 'month' } }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        // Merge with existing stats if analytics didn't provide summary
        setStats(prev => ({
          ...prev,
          ...data.data,
          conversionRate: prev?.conversionRate || data.data.conversionRate || 0
        }));
      }
    } catch (err) {
      logger.error('Error fetching stats', err instanceof Error ? err : new Error(String(err)));
    }
  }, [filters.dateRange]);

  // Process referral completion
  const handleProcessReferral = async (referralId: string, triggerAction?: string) => {
    try {
      setProcessingReferral(referralId);
      setError(null);

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'referralsProcess' as keyof typeof API_ENDPOINTS,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referralId,
            triggerAction: triggerAction || 'manual_completion'
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to process referral');
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh data after processing
        await fetchReferrals();
        await fetchAnalytics();
        await fetchStats();
      } else {
        throw new Error(data.message || 'Failed to process referral');
      }
    } catch (err) {
      logger.error('Error processing referral', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to process referral');
    } finally {
      setProcessingReferral(null);
    }
  };

  useEffect(() => {
    fetchReferrals();
    fetchAnalytics();
    fetchStats();
  }, [fetchReferrals, fetchAnalytics, fetchStats]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // const handleSort = (field: string) => {
  //   if (sortBy === field) {
  //     setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  //   } else {
  //     setSortBy(field);
  //     setSortOrder('desc');
  //   }
  // };

  const handleSelectReferral = (referralId: string) => {
    setSelectedReferrals(prev => 
      prev.includes(referralId) 
        ? prev.filter(id => id !== referralId)
        : [...prev, referralId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReferrals.length === referrals.length) {
      setSelectedReferrals([]);
    } else {
      setSelectedReferrals(referrals.map(r => r.id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRewardStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading && referrals.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Referrals</h2>
          <p className="text-gray-600">Fetching referral data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchReferrals}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Fallback Data Notification */}
      {isUsingFallbackData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Demo Data Active
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  The referrals analytics API returned empty data. You&apos;re viewing demo data to demonstrate the referrals management interface.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Referrals Management
          </h1>
          <p className="text-gray-600 text-sm">Manage and track referral programs</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 hover:shadow-md">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          <button 
            onClick={fetchReferrals}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 hover:shadow-md"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Analytics Section */}
      {analytics && ((analytics.trends && analytics.trends.length > 0) || (analytics.referralTypes && analytics.referralTypes.length > 0)) && (
        <div className="bg-white rounded shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
              Referral Analytics
            </h3>
            {analytics.conversionRate !== undefined && (
              <div className="text-sm text-gray-600">
                Conversion Rate: <span className="font-semibold text-gray-900">{(analytics.conversionRate * 100).toFixed(1)}%</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.referralTypes && analytics.referralTypes.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Referrals by Type</h4>
                <div className="space-y-2">
                  {analytics.referralTypes.map((type, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 capitalize">{type.type.replace('_', ' ')}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-900">{type.count}</span>
                        <span className="text-xs text-gray-500">({type.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {analytics.trends && analytics.trends.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">Recent Trends (Last {analytics.trends.length} days)</h4>
                <div className="space-y-2">
                  {analytics.trends.slice(-7).map((trend, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600">{new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-gray-600">{trend.count} total</span>
                        <span className="text-xs text-green-600">{trend.completed} completed</span>
                        <span className="text-xs text-blue-600">{(trend.conversionRate * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Referrals</p>
                <p className="text-lg font-bold text-gray-900">{stats.totalReferrals}</p>
                <p className="text-xs text-gray-500">{stats.conversionRate}% conversion</p>
              </div>
              <Target className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Pending</p>
                <p className="text-lg font-bold text-gray-900">{stats.pendingReferrals}</p>
                <p className="text-xs text-gray-500">Awaiting completion</p>
              </div>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Completed</p>
                <p className="text-lg font-bold text-gray-900">{stats.completedReferrals}</p>
                <p className="text-xs text-gray-500">Successfully converted</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Rewards</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalRewards)}</p>
                <p className="text-xs text-gray-500">{formatCurrency(stats.paidRewards)} paid</p>
              </div>
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded shadow">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
              >
                <Filter className="w-3 h-3 mr-1" />
                Filters
                {showFilters ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
              </button>
            </div>
          </div>
        </div>
        
        {showFilters && (
          <div className="px-4 py-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reward Status</label>
                <select
                  value={filters.rewardStatus}
                  onChange={(e) => handleFilterChange('rewardStatus', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Rewards</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search referrals..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full px-6 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Referrals Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">
              Referrals ({referrals.length})
            </h3>
            <div className="flex items-center space-x-2">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="rewardAmount-desc">Highest Reward</option>
                <option value="rewardAmount-asc">Lowest Reward</option>
                <option value="status-asc">Status A-Z</option>
                <option value="status-desc">Status Z-A</option>
              </select>
            </div>
          </div>
        </div>
        
        {!loading && (!Array.isArray(referrals) || referrals.length === 0) ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No Referrals Found</h3>
            <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
              {filters.status !== 'all' || filters.rewardStatus !== 'all' || filters.search || filters.dateRange !== 'all'
                ? "No referrals match your current filters. Try adjusting your search criteria or clearing filters to see more results."
                : "There are no referrals at this time. New referrals will appear here as users refer others to the platform."}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {filters.status !== 'all' || filters.rewardStatus !== 'all' || filters.search || filters.dateRange !== 'all' ? (
                <button
                  onClick={() => {
                    setFilters({ status: 'all', rewardStatus: 'all', search: '', dateRange: 'all' });
                    setCurrentPage(1);
                  }}
                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Clear Filters
                </button>
              ) : null}
              <button
                onClick={fetchReferrals}
                className="px-4 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedReferrals.length === referrals.length && referrals.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referrer
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referred User
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reward
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Array.isArray(referrals) && referrals.length > 0 ? referrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedReferrals.includes(referral.id)}
                          onChange={() => handleSelectReferral(referral.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {referral.referrerName}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {referral.referrerEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {referral.referredUserName}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {referral.referredUserEmail}
                            </div>
                            {referral.referredUserPhone && (
                              <div className="text-xs text-gray-500 flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {referral.referredUserPhone}
                              </div>
                            )}
                            {referral.referredUserLocation && (
                              <div className="text-xs text-gray-500 flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {referral.referredUserLocation}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                            {referral.status}
                          </span>
                          <div className="text-xs text-gray-500">
                            {referral.completedAt ? `Completed ${formatDate(referral.completedAt)}` : 'In progress'}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(referral.rewardAmount)}
                          </div>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getRewardStatusColor(referral.rewardStatus)}`}>
                            {referral.rewardStatus}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {formatDate(referral.createdAt)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {referral.source}
                        </div>
                        {referral.campaign && (
                          <div className="text-xs text-blue-600">
                            {referral.campaign}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {referral.source}
                        </div>
                        {referral.campaign && (
                          <div className="text-xs text-blue-600">
                            {referral.campaign}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button 
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {referral.status === 'pending' && (
                            <button
                              onClick={() => handleProcessReferral(referral.id || referral._id || '', 'manual_completion')}
                              disabled={processingReferral === (referral.id || referral._id || '')}
                              className="p-1 text-green-600 hover:text-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Process Referral"
                            >
                              {processingReferral === (referral.id || referral._id || '') ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button 
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="More Options"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : null}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                      disabled={currentPage === pagination.pages}
                      className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Top Referrers */}
      {stats && stats.topReferrers.length > 0 && (
        <div className="bg-white rounded shadow">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Top Referrers</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {stats.topReferrers.slice(0, 5).map((referrer, index) => (
                <div key={referrer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{referrer.name}</div>
                      <div className="text-xs text-gray-500">{referrer.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {referrer.completedReferrals} completed
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(referrer.totalRewards)} earned
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
