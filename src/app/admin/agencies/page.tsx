"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  Trash2, 
  RefreshCw,
  Filter,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  CheckCircle,
  Shield,
  MapPin,
  BarChart3
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import toast from "react-hot-toast";

interface Agency {
  _id: string;
  name: string;
  description?: string;
  owner: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    profile?: {
      avatar?: { url?: string; thumbnail?: string };
    };
  };
  providers?: Array<{
    user: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    status: string;
    commissionRate: number;
    joinedAt: string;
  }>;
  admins?: Array<{
    user: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    role: string;
  }>;
  contact?: {
    email?: string;
    phone?: string;
    website?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  business?: {
    type?: string;
    registrationNumber?: string;
    licenseNumber?: string;
  };
  verification?: {
    isVerified: boolean;
    verifiedAt?: string;
  };
  analytics?: {
    totalBookings?: number;
    totalRevenue?: number;
    averageRating?: number;
    totalReviews?: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AgencyStatistics {
  totalAgencies?: number;
  activeAgencies?: number;
  verifiedAgencies?: number;
  totalProviders?: number;
  totalRevenue?: number;
}

export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'providers'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  const [statistics, setStatistics] = useState<AgencyStatistics | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [loadingAgencyDetails, setLoadingAgencyDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchStatistics = useCallback(async () => {
    try {
      if (!getApiToken()) return;

      // Calculate statistics from agencies data
      const activeCount = agencies.filter(a => a.isActive).length;
      const verifiedCount = agencies.filter(a => a.verification?.isVerified).length;
      const totalProviders = agencies.reduce((sum, a) => sum + (a.providers?.length || 0), 0);

      setStatistics({
        totalAgencies: agencies.length,
        activeAgencies: activeCount,
        verifiedAgencies: verifiedCount,
        totalProviders: totalProviders,
        totalRevenue: agencies.reduce((sum, a) => sum + (a.analytics?.totalRevenue || 0), 0)
      });
    } catch (err) {
      logger.error('Error calculating agency statistics', err instanceof Error ? err : new Error(String(err)));
    }
  }, [agencies]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!getApiToken()) {
        logger.warn('No API token found');
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.set('search', searchTerm);
      queryParams.set('sortBy', sortBy);
      queryParams.set('sortOrder', sortOrder);
      queryParams.set('limit', '100');

      const url = `${API_BASE_URL}${API_ENDPOINTS.agencies}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch agencies`);
      }

      const result = await response.json();
      
      let agenciesData: Agency[] = [];
      if (result.success && result.data) {
        agenciesData = Array.isArray(result.data) ? result.data : [];
      } else if (Array.isArray(result)) {
        agenciesData = result;
      }

      // Apply client-side filters
      let filteredAgencies = agenciesData;
      
      if (statusFilter !== 'all') {
        filteredAgencies = filteredAgencies.filter(a => 
          statusFilter === 'active' ? a.isActive : !a.isActive
        );
      }
      
      if (verificationFilter !== 'all') {
        filteredAgencies = filteredAgencies.filter(a => 
          verificationFilter === 'verified' ? a.verification?.isVerified : !a.verification?.isVerified
        );
      }

      setAgencies(filteredAgencies);
      setTotalCount(filteredAgencies.length);
      setLastUpdated(new Date());
    } catch (err) {
      logger.error('Error fetching agencies', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to load agencies');
      setAgencies([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, sortBy, sortOrder, statusFilter, verificationFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (agencies.length > 0) {
      fetchStatistics();
    }
  }, [agencies, fetchStatistics]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSort = (field: 'name' | 'createdAt' | 'providers') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewAgency = async (agency: Agency) => {
    try {
      setLoadingAgencyDetails(true);
      if (!getApiToken()) return;
      
      const url = `${API_BASE_URL}${API_ENDPOINTS.agenciesById}/${agency._id}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        throw new Error('Failed to fetch agency details');
      }

      const result = await response.json();
      setSelectedAgency(result.data || result);
      setViewModalOpen(true);
    } catch (err) {
      logger.error('Error fetching agency details', err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to fetch agency details');
    } finally {
      setLoadingAgencyDetails(false);
    }
  };

  const handleVerifyAgency = async (verified: boolean) => {
    if (!selectedAgency?._id) return;
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      // Use PATCH and the correct endpoint for verification
      const url = `${API_BASE_URL}/api/agencies/${selectedAgency._id}/verification`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'PATCH',
        body: JSON.stringify({
          verification: {
            isVerified: verified,
            verifiedAt: verified ? new Date().toISOString() : null
          }
        })
      }));

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch {}
        logger.error('Agency verification update failed. Response:', new Error(errorText));
        let errorData: Record<string, unknown> = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {}
        throw new Error(typeof errorData.error === 'string' ? errorData.error : (typeof errorText === 'string' && errorText) ? errorText : 'Failed to update verification status');
      }

      toast.success(verified ? 'Agency verified successfully' : 'Agency verification revoked');
      setVerifyModalOpen(false);
      setSelectedAgency(null);
      await fetchData();
    } catch (err) {
      logger.error('Error updating agency verification', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to update verification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAgency = async () => {
    if (!selectedAgency?._id) return;
    
    try {
      setSubmitting(true);
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.agenciesById}/${selectedAgency._id}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'DELETE' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete agency');
      }

      toast.success('Agency deleted successfully');
      setDeleteModalOpen(false);
      setSelectedAgency(null);
      await fetchData();
    } catch (err) {
      logger.error('Error deleting agency', err instanceof Error ? err : new Error(String(err)));
      toast.error(err instanceof Error ? err.message : 'Failed to delete agency');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (agency: Agency) => {
    try {
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.agenciesById}/${agency._id}`;
      const response = await fetch(url, createAuthFetchOptions({
        method: 'PUT',
        body: JSON.stringify({ isActive: !agency.isActive })
      }));

      if (!response.ok) {
        throw new Error('Failed to update agency status');
      }

      toast.success(`Agency ${agency.isActive ? 'deactivated' : 'activated'} successfully`);
      await fetchData();
    } catch (err) {
      logger.error('Error toggling agency status', err instanceof Error ? err : new Error(String(err)));
      toast.error('Failed to update agency status');
    }
  };

  if (loading && agencies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading agencies data..." />
      </div>
    );
  }

  if (error && agencies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
          <h1 className="text-2xl font-bold text-gray-900">Agencies Management</h1>
          <p className="text-gray-600 text-sm">Manage agencies, verify, and oversee providers</p>
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

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Agencies</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalAgencies || 0}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Active Agencies</p>
                <p className="text-2xl font-bold text-green-600">{statistics.activeAgencies || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Verified</p>
                <p className="text-2xl font-bold text-purple-600">{statistics.verifiedAgencies || 0}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Providers</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.totalProviders || 0}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Revenue (PHP)</p>
                <p className="text-2xl font-bold text-yellow-600">₱{(statistics.totalRevenue || 0).toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-yellow-500" />
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
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="w-3 h-3 mr-1" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                <Download className="w-3 h-3 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search agencies..."
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Verification</label>
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setVerificationFilter('all');
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="text-xs text-gray-500">
                {totalCount} agencies found
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Agencies</h3>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">Sort:</span>
              <button
                onClick={() => handleSort('name')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'name' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Name
                {sortBy === 'name' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('providers')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'providers' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Providers
                {sortBy === 'providers' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('createdAt')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'createdAt' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Date
                {sortBy === 'createdAt' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agency</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Providers</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agencies.map((agency) => (
                <tr key={agency._id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-xs font-semibold text-gray-900">{agency.name}</div>
                        <div className="text-xs text-gray-600 line-clamp-1">
                          {agency.description || 'No description'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-xs text-gray-900">
                      {agency.owner?.firstName} {agency.owner?.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{agency.owner?.email}</div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center text-xs text-gray-600">
                      <MapPin className="w-3 h-3 mr-1" />
                      {agency.contact?.address?.city || 'N/A'}, {agency.contact?.address?.country || ''}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Users className="w-3 h-3 mr-1" />
                      {agency.providers?.length || 0}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(agency)}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        agency.isActive 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {agency.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {agency.verification?.isVerified ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    {new Date(agency.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewAgency(agency)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View details"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedAgency(agency);
                          setVerifyModalOpen(true);
                        }}
                        className="text-purple-600 hover:text-purple-900"
                        title="Verify agency"
                      >
                        <Shield className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedAgency(agency);
                          setDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Delete agency"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {agencies.length === 0 && (
          <div className="text-center py-8">
            <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No agencies found</h3>
            <p className="text-xs text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>

      {/* View Agency Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedAgency(null);
        }}
        title="Agency Details"
        size="xl"
      >
        {loadingAgencyDetails ? (
          <div className="flex justify-center py-8">
            <Loading size="md" />
          </div>
        ) : selectedAgency ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Name</label>
                  <p className="text-sm font-semibold">{selectedAgency.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    selectedAgency.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedAgency.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500">Description</label>
                  <p className="text-sm text-gray-700">{selectedAgency.description || 'No description'}</p>
                </div>
              </div>
            </div>

            {/* Owner Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Owner</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500">Name</label>
                  <p className="text-sm">{selectedAgency.owner?.firstName} {selectedAgency.owner?.lastName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Email</label>
                  <p className="text-sm">{selectedAgency.owner?.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            {selectedAgency.contact && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Email</label>
                    <p className="text-sm">{selectedAgency.contact.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Phone</label>
                    <p className="text-sm">{selectedAgency.contact.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Website</label>
                    <p className="text-sm">{selectedAgency.contact.website || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Address</label>
                    <p className="text-sm">
                      {selectedAgency.contact.address 
                        ? `${selectedAgency.contact.address.city || ''}, ${selectedAgency.contact.address.country || ''}`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Providers */}
            {selectedAgency.providers && selectedAgency.providers.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Providers ({selectedAgency.providers.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedAgency.providers.map((provider, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div>
                        <p className="text-sm font-medium">{provider.user?.firstName} {provider.user?.lastName}</p>
                        <p className="text-xs text-gray-500">Commission: {provider.commissionRate}%</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        provider.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {provider.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics */}
            {selectedAgency.analytics && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Analytics</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Total Bookings</p>
                    <p className="text-lg font-bold text-blue-600">{selectedAgency.analytics.totalBookings || 0}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Total Revenue (PHP)</p>
                    <p className="text-lg font-bold text-green-600">₱{(selectedAgency.analytics.totalRevenue || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Avg Rating</p>
                    <p className="text-lg font-bold text-yellow-600">{selectedAgency.analytics.averageRating?.toFixed(1) || 'N/A'}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-xs text-gray-500">Total Reviews</p>
                    <p className="text-lg font-bold text-purple-600">{selectedAgency.analytics.totalReviews || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Verify Agency Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => {
          setVerifyModalOpen(false);
          setSelectedAgency(null);
        }}
        title="Verify Agency"
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setVerifyModalOpen(false);
                setSelectedAgency(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            {selectedAgency?.verification?.isVerified ? (
              <button
                onClick={() => handleVerifyAgency(false)}
                disabled={submitting}
                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Revoking...' : 'Revoke Verification'}
              </button>
            ) : (
              <button
                onClick={() => handleVerifyAgency(true)}
                disabled={submitting}
                className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Verifying...' : 'Verify Agency'}
              </button>
            )}
          </div>
        }
      >
        {selectedAgency && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              {selectedAgency.verification?.isVerified 
                ? `Are you sure you want to revoke verification for "${selectedAgency.name}"?`
                : `Are you sure you want to verify "${selectedAgency.name}"?`}
            </p>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-xs text-gray-500">Current Status</p>
              <p className="text-sm font-medium">
                {selectedAgency.verification?.isVerified ? 'Verified' : 'Not Verified'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Agency Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedAgency(null);
        }}
        title="Delete Agency"
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedAgency(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAgency}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Deleting...' : 'Delete Agency'}
            </button>
          </div>
        }
      >
        {selectedAgency && (
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete the agency <strong>{selectedAgency.name}</strong>? 
              This action cannot be undone and will affect all associated providers.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

