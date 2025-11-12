"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download, 
  Filter, 
  Search,
  User,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Check,
  X,
  AlertCircle
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { makeClientAuthenticatedRequestWithEndpointSafe, makeClientAuthenticatedRequestWithPathSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { logger } from "@/lib/logger";
import { VerificationRequest, VerificationType, VerificationStatus, VerificationDocument } from "@/types/trust-verification";

// Extended VerificationRequest interface for admin page
interface TrustVerificationRequest extends Omit<VerificationRequest, 'user' | 'type' | 'status' | 'documents' | 'createdAt' | 'updatedAt' | 'submittedAt' | 'expiresAt' | 'personalInfo'> {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    profile: {
      avatar?: string;
      rating: number;
    };
  };
  type: VerificationType | 'identity' | 'identity_verification' | 'business' | 'business_verification' | 'professional_verification' | 'education_verification' | 'address' | 'bank_account' | 'insurance' | 'certification';
  status: VerificationStatus | 'pending' | 'approved' | 'rejected' | 'under_review' | 'expired';
  documents: Array<VerificationDocument & {
    _id?: string;
    isVerified?: boolean;
    uploadedAt?: string;
  }>;
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    ssn?: string;
    phoneNumber?: string;
    email?: string;
    [key: string]: unknown;
  };
  businessInfo?: {
    businessName?: string;
    businessType?: string;
    registrationNumber?: string;
    taxId?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    [key: string]: unknown;
  };
  addressInfo?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    coordinates?: {
      lat?: number;
      lng?: number;
    };
    [key: string]: unknown;
  };
  bankInfo?: {
    accountNumber?: string;
    routingNumber?: string;
    bankName?: string;
    accountType?: string;
    [key: string]: unknown;
  };
  isActive: boolean;
  submittedAt: string;
  expiresAt: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

interface TrustVerificationStats {
  totalRequests: number;
  requestsByStatus: Array<{
    status: string;
    count: number;
  }>;
  requestsByType: Array<{
    type: string;
    count: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    count: number;
    [key: string]: unknown;
  }>;
  averageProcessingTime: number;
  // Legacy/compatibility fields
  pendingRequests?: number;
  approvedRequests?: number;
  rejectedRequests?: number;
  underReviewRequests?: number;
  averageReviewTime?: string;
  verificationRate?: number;
  monthlyTrend?: Array<{
    month: string;
    requests: number;
    approved: number;
    rejected: number;
  }>;
  topVerificationTypes?: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

export default function AdminTrustVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TrustVerificationStats | null>(null);
  const [requests, setRequests] = useState<TrustVerificationRequest[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    count: 0
  });
  
  // Filters and search
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: '',
    dateRange: 'all'
  });
  const [sortBy, setSortBy] = useState('submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch statistics
      const statsResponse = await makeClientAuthenticatedRequestWithEndpointSafe(
        'trustVerificationStatistics' as keyof typeof API_ENDPOINTS,
        { method: 'GET' }
      );
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success && statsData.data) {
          // Transform data to include legacy fields for backward compatibility
          const transformedStats: TrustVerificationStats = {
            ...statsData.data,
            // Calculate legacy fields from requestsByStatus
            pendingRequests: statsData.data.requestsByStatus?.find((s: { status: string }) => s.status === 'pending')?.count || 0,
            approvedRequests: statsData.data.requestsByStatus?.find((s: { status: string }) => s.status === 'approved')?.count || 0,
            rejectedRequests: statsData.data.requestsByStatus?.find((s: { status: string }) => s.status === 'rejected')?.count || 0,
            underReviewRequests: statsData.data.requestsByStatus?.find((s: { status: string }) => s.status === 'under_review')?.count || 0,
            averageReviewTime: statsData.data.averageProcessingTime ? `${statsData.data.averageProcessingTime}ms` : '0ms',
            verificationRate: statsData.data.totalRequests > 0 
              ? ((statsData.data.requestsByStatus?.find((s: { status: string }) => s.status === 'approved')?.count || 0) / statsData.data.totalRequests) * 100
              : 0,
            monthlyTrend: statsData.data.monthlyTrends?.map((trend: { month: string; count: number }) => ({
              month: trend.month,
              requests: trend.count,
              approved: 0,
              rejected: 0
            })) || [],
            topVerificationTypes: statsData.data.requestsByType?.map((type: { type: string; count: number }) => ({
              type: type.type,
              count: type.count,
              percentage: statsData.data.totalRequests > 0 ? (type.count / statsData.data.totalRequests) * 100 : 0
            })) || []
          };
          setStats(transformedStats);
        } else if (statsData.totalRequests !== undefined) {
          // Handle case where data is at root level
          setStats(statsData as TrustVerificationStats);
        }
      }

      // Fetch requests
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.type !== 'all' && { type: filters.type }),
        ...(filters.search && { search: filters.search }),
        ...(filters.dateRange !== 'all' && { dateRange: filters.dateRange }),
        sortBy,
        sortOrder
      });

      const requestsResponse = await makeClientAuthenticatedRequestWithEndpointSafe(
        'trustVerificationRequests' as keyof typeof API_ENDPOINTS,
        { method: 'GET', query: Object.fromEntries(queryParams) }
      );
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        if (requestsData.success) {
          setRequests(requestsData.data || []);
          setPagination({
            page: requestsData.page || 1,
            limit: pagination.limit, // Keep the current limit, don't use count
            total: requestsData.total || 0,
            pages: requestsData.pages || 1,
            count: requestsData.count || 0 // count is the number of items in current page
          });
        } else {
          throw new Error(requestsData.error || 'Failed to fetch verification requests');
        }
      } else {
        throw new Error('Failed to fetch verification requests');
      }
    } catch (err) {
      logger.error('Error fetching trust verification data', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters.status, filters.type, filters.search, filters.dateRange, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (requestId: string, newStatus: string, notes?: string, trustScore?: number) => {
    try {
      const response = await makeClientAuthenticatedRequestWithPathSafe(
        'trustVerificationReview' as keyof typeof API_ENDPOINTS,
        [requestId, 'review'],
        {},
        { 
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ 
            status: newStatus, 
            adminNotes: notes,
            trustScore: trustScore
          }) 
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await fetchData(); // Refresh data
        } else {
          throw new Error(result.message || 'Failed to review request');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to review request');
      }
    } catch (err) {
      logger.error('Error reviewing request', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to review request');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedRequests.length === 0) return;

    try {
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'trustVerificationRequests' as keyof typeof API_ENDPOINTS,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestIds: selectedRequests, action: bulkAction })
        }
      );

      if (response.ok) {
        setSelectedRequests([]);
        setBulkAction('');
        await fetchData();
      } else {
        throw new Error('Failed to perform bulk action');
      }
    } catch (err) {
      logger.error('Error performing bulk action', err instanceof Error ? err : new Error(String(err)), { action: bulkAction, requestCount: selectedRequests.length });
      setError(err instanceof Error ? err.message : 'Failed to perform bulk action');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'under_review': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading trust verification data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
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
            Trust Verification
          </h1>
          <p className="text-gray-600 text-sm">Manage user verification requests and trust badges</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={fetchData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Total Requests</p>
                  <p className="text-lg font-bold text-gray-900">{stats.totalRequests}</p>
                  <p className="text-xs text-gray-500">All time</p>
                </div>
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Pending</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stats.pendingRequests || stats.requestsByStatus?.find(s => s.status === 'pending')?.count || 0}
                  </p>
                  <p className="text-xs text-gray-500">Awaiting review</p>
                </div>
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            
            <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Approved</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stats.approvedRequests || stats.requestsByStatus?.find(s => s.status === 'approved')?.count || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.verificationRate ? `${stats.verificationRate.toFixed(1)}%` : '0%'} rate
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white rounded shadow p-3 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">Rejected</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stats.rejectedRequests || stats.requestsByStatus?.find(s => s.status === 'rejected')?.count || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    Avg: {stats.averageReviewTime || (stats.averageProcessingTime ? `${stats.averageProcessingTime}ms` : '0ms')}
                  </p>
                </div>
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>

          {/* Statistics Breakdown */}
          {(stats.requestsByStatus?.length > 0 || stats.requestsByType?.length > 0 || stats.monthlyTrends?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.requestsByStatus && stats.requestsByStatus.length > 0 && (
                <div className="bg-white rounded shadow p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Requests by Status</h3>
                  <div className="space-y-2">
                    {stats.requestsByStatus.map((statusItem) => (
                      <div key={statusItem.status} className="flex items-center justify-between">
                        <span className="text-xs text-gray-700 capitalize">{statusItem.status.replace(/_/g, ' ')}</span>
                        <span className="text-xs font-medium text-gray-900">{statusItem.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.requestsByType && stats.requestsByType.length > 0 && (
                <div className="bg-white rounded shadow p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Requests by Type</h3>
                  <div className="space-y-2">
                    {stats.requestsByType.map((typeItem) => (
                      <div key={typeItem.type} className="flex items-center justify-between">
                        <span className="text-xs text-gray-700 capitalize">{typeItem.type.replace(/_/g, ' ')}</span>
                        <span className="text-xs font-medium text-gray-900">{typeItem.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {stats.averageProcessingTime !== undefined && (
                <div className="bg-white rounded shadow p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Processing Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700">Average Processing Time</span>
                      <span className="text-xs font-medium text-gray-900">
                        {stats.averageProcessingTime > 0 
                          ? `${(stats.averageProcessingTime / 1000).toFixed(2)}s` 
                          : '0s'}
                      </span>
                    </div>
                    {stats.monthlyTrends && stats.monthlyTrends.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-700 mb-2">Recent Trends</p>
                        <div className="space-y-1">
                          {stats.monthlyTrends.slice(-3).map((trend, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">{trend.month}</span>
                              <span className="text-gray-900 font-medium">{trend.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Filters & Search */}
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
                Filters
                {showFilters ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
              </button>
              {selectedRequests.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">{selectedRequests.length} selected</span>
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="">Bulk Actions</option>
                    <option value="approve">Approve Selected</option>
                    <option value="reject">Reject Selected</option>
                    <option value="under_review">Mark Under Review</option>
                  </select>
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    className="px-2 py-1 bg-blue-600 text-white text-xs rounded disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {showFilters && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="identity_verification">Identity Verification</option>
                  <option value="business_verification">Business Verification</option>
                  <option value="professional_verification">Professional Verification</option>
                  <option value="education_verification">Education Verification</option>
                </select>
              </div>
              
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    placeholder="Search by name, email, or ID..."
                    className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilters({status: 'all', type: 'all', search: '', dateRange: 'all'})}
                  className="px-3 py-1 text-xs border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear
                </button>
                <button
                  onClick={fetchData}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Verification Requests</h3>
            {requests.length > 0 && (
              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="submittedAt">Date Submitted</option>
                  <option value="status">Status</option>
                  <option value="type">Type</option>
                  <option value="createdAt">Created Date</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {requests.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No Verification Requests</h3>
            <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
              {filters.status !== 'all' || filters.type !== 'all' || filters.search || filters.dateRange !== 'all'
                ? "No verification requests match your current filters. Try adjusting your search criteria or clearing filters to see more results."
                : "There are no verification requests at this time. New requests will appear here as users submit their verification documents."}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {filters.status !== 'all' || filters.type !== 'all' || filters.search || filters.dateRange !== 'all' ? (
                <button
                  onClick={() => setFilters({status: 'all', type: 'all', search: '', dateRange: 'all'})}
                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Clear Filters
                </button>
              ) : null}
              <button
                onClick={fetchData}
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
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRequests.length === requests.length && requests.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRequests(requests.map(r => r._id));
                          } else {
                            setSelectedRequests([]);
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documents</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRequests.includes(request._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRequests([...selectedRequests, request._id]);
                            } else {
                              setSelectedRequests(selectedRequests.filter(id => id !== request._id));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          {request.user.profile?.avatar ? (
                            <Image 
                              src={request.user.profile.avatar || '/default-avatar.png'} 
                              alt={`${request.user.firstName} ${request.user.lastName}`}
                              width={40}
                              height={40}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {request.user.firstName} {request.user.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              Rating: {request.user.profile?.rating?.toFixed(1) || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-medium text-gray-900 capitalize">
                          {request.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatDate(request.submittedAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-1">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">{request.documents?.length || 0}</span>
                          {request.documents && request.documents.length > 0 && request.documents.some(doc => doc.isVerified) && (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {/* View details modal */}}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(request._id, 'approved')}
                                className="text-green-600 hover:text-green-800 transition-colors"
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleStatusChange(request._id, 'rejected')}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button 
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="More Options"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                      disabled={pagination.page <= 1}
                      className="px-3 py-1 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-500">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                      disabled={pagination.page >= pagination.pages}
                      className="px-3 py-1 text-xs border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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
    </div>
  );
}
