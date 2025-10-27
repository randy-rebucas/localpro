"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Users2, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck,
  UserX,
  Phone,
  MapPin,
  RefreshCw,
  Filter,
  Download,
  Plus,
  Eye,
  ChevronDown,
  ChevronUp,
  Star,
  TrendingUp,
  Clock
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";

// Define types locally
interface Provider {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending' | 'rejected';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  profileCompleteness?: number;
  verificationStatus?: 'verified' | 'pending' | 'rejected';
  // Provider-specific fields
  profile?: {
    businessName?: string;
    businessType?: string;
    serviceAreas?: string[];
    specialties?: string[];
    rating?: number;
    totalReviews?: number;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    bio?: string;
  };
  verification?: {
    phoneVerified?: boolean;
    emailVerified?: boolean;
    identityVerified?: boolean;
    businessVerified?: boolean;
    addressVerified?: boolean;
    bankAccountVerified?: boolean;
    verifiedAt?: string;
  };
  performance?: {
    completionRate?: number;
    cancellationRate?: number;
    averageRating?: number;
    totalBookings?: number;
    totalEarnings?: number;
    responseTime?: number;
  };
  subscription?: {
    type?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
  };
  trustScore?: number;
  badges?: Array<{
    type: string;
    description: string;
    earnedAt: string;
  }>;
  tags?: string[];
  notes?: string[];
}

// Helper function to transform API provider data to frontend format
const transformProviderData = (apiProvider: {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  role?: string;
  status?: string;
  isActive?: boolean;
  isVerified?: boolean;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  profileCompleteness?: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  businessInfo?: {
    businessName?: string;
    businessType?: string;
    licenseNumber?: string;
    taxId?: string;
  };
  services?: string[];
  rating?: {
    average?: number;
    count?: number;
  };
  joinedAt?: string;
  lastActive?: string;
  notes?: string[];
  profile?: {
    businessName?: string;
    businessType?: string;
    serviceAreas?: string[];
    specialties?: string[];
    rating?: number;
    totalReviews?: number;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    bio?: string;
  };
  verification?: {
    phoneVerified?: boolean;
    emailVerified?: boolean;
    identityVerified?: boolean;
    businessVerified?: boolean;
    addressVerified?: boolean;
    bankAccountVerified?: boolean;
    verifiedAt?: string;
  };
  performance?: {
    completionRate?: number;
    cancellationRate?: number;
    averageRating?: number;
    totalBookings?: number;
    totalEarnings?: number;
    responseTime?: number;
  };
  subscription?: {
    type?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
  };
  trustScore?: number;
  badges?: Array<{
    type: string;
    description: string;
    earnedAt: string;
  }>;
  tags?: string[];
}): Provider => {
  return {
    _id: apiProvider._id,
    firstName: apiProvider.firstName || '',
    lastName: apiProvider.lastName || '',
    email: apiProvider.email || '',
    phoneNumber: apiProvider.phoneNumber || apiProvider.phone,
    status: (apiProvider.status as 'active' | 'inactive' | 'suspended' | 'pending' | 'rejected') || 'pending',
    isActive: apiProvider.isActive || false,
    isVerified: apiProvider.isVerified || false,
    createdAt: apiProvider.createdAt || new Date().toISOString(),
    updatedAt: apiProvider.updatedAt || new Date().toISOString(),
    lastLogin: apiProvider.lastLogin,
    profileCompleteness: apiProvider.profileCompleteness || 0,
    verificationStatus: apiProvider.verification?.phoneVerified && 
                       apiProvider.verification?.emailVerified ? 'verified' : 'pending',
    profile: apiProvider.profile,
    verification: apiProvider.verification,
    performance: apiProvider.performance,
    subscription: apiProvider.subscription,
    trustScore: apiProvider.trustScore,
    badges: apiProvider.badges,
    tags: apiProvider.tags,
    notes: apiProvider.notes
  };
};

interface ProviderStats {
  totalProviders: number;
  activeProviders: number;
  pendingProviders: number;
  suspendedProviders: number;
  newProvidersToday: number;
  newProvidersWeek: number;
  newProvidersMonth: number;
  averageRating: number;
  totalEarnings: number;
  trends: {
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ week: string; count: number }>;
    monthly: Array<{ month: string; count: number }>;
  };
  topCategories: Array<{ category: string; count: number }>;
  statusStats: Array<{ status: string; count: number }>;
  performanceMetrics: {
    averageCompletionRate: number;
    averageResponseTime: number;
    averageRating: number;
  };
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [slowRequest, setSlowRequest] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'rating' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Helper function to add timeout to fetch requests
  const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number = 10000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    }
  };

  const fetchData = useCallback(async () => {
    let slowRequestTimer: NodeJS.Timeout | null = null;
    
    try {
      setLoading(true);
      setError(null);
      setSlowRequest(false);

      // Set a timer to show slow request warning
      slowRequestTimer = setTimeout(() => {
        setSlowRequest(true);
      }, 10000); // Show warning after 10 seconds

      // Build query parameters for providers data
      const queryParams = new URLSearchParams();
      queryParams.set('type', 'providers');
      queryParams.set('page', currentPage.toString());
      queryParams.set('limit', itemsPerPage.toString());
      if (searchTerm) queryParams.set('search', searchTerm);
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);
      if (categoryFilter !== 'all') queryParams.set('category', categoryFilter);
      queryParams.set('sortBy', sortBy);
      queryParams.set('sortOrder', sortOrder);

      const [dataResponse, statsResponse] = await Promise.all([
        fetchWithTimeout(`/api/admin/providers?${queryParams}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }, 20000), // 20 second timeout for providers data
        fetchWithTimeout('/api/admin/providers?type=overview', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }, 10000).catch(err => { // 10 second timeout for stats
          console.warn('Failed to fetch stats, using fallback:', err);
          return {
            ok: true,
            json: () => Promise.resolve({
              totalProviders: 0,
              activeProviders: 0,
              pendingProviders: 0,
              suspendedProviders: 0,
              newProvidersToday: 0,
              newProvidersWeek: 0,
              newProvidersMonth: 0,
              averageRating: 0,
              totalEarnings: 0,
              trends: { daily: [], weekly: [], monthly: [] },
              topCategories: [],
              statusStats: [],
              performanceMetrics: {
                averageCompletionRate: 0,
                averageResponseTime: 0,
                averageRating: 0
              }
            })
          };
        })
      ]);

      if (!dataResponse.ok) {
        const errorData = await dataResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch providers data');
      }

      if (!statsResponse.ok) {
        const errorData = await statsResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch providers statistics');
      }

      const dataResult = await dataResponse.json();
      const statsResult = await statsResponse.json();

      // Transform the API response data to match frontend expectations
      let providersData: Provider[] = [];

      if (dataResult.success && dataResult.data) {
        // Handle the new API response structure
        if (dataResult.data.providers && Array.isArray(dataResult.data.providers)) {
          providersData = dataResult.data.providers.map(transformProviderData);
        } else if (Array.isArray(dataResult.data)) {
          // Fallback for old structure
          providersData = dataResult.data.map(transformProviderData);
        }
      } else if (Array.isArray(dataResult.data)) {
        // Fallback for direct array response
        providersData = dataResult.data.map(transformProviderData);
      }

      setProviders(providersData);
      
      // Handle stats response - it should be an object, not an array
      const statsData = statsResult.data || statsResult;
      if (Array.isArray(statsData)) {
        // If it's an array, create a default stats object
        setStats({
          totalProviders: 0,
          activeProviders: 0,
          pendingProviders: 0,
          suspendedProviders: 0,
          newProvidersToday: 0,
          newProvidersWeek: 0,
          newProvidersMonth: 0,
          averageRating: 0,
          totalEarnings: 0,
          trends: { daily: [], weekly: [], monthly: [] },
          topCategories: [],
          statusStats: [],
          performanceMetrics: {
            averageCompletionRate: 0,
            averageResponseTime: 0,
            averageRating: 0
          }
        });
      } else {
        setStats(statsData);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching providers data:', err);
      let errorMessage = 'Failed to load providers data';
      
      if (err instanceof Error) {
        if (err.message.includes('timed out')) {
          errorMessage = 'Request timed out. The server may be slow. Please try again.';
        } else if (err.message.includes('aborted')) {
          errorMessage = 'Request was cancelled. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      if (slowRequestTimer) {
        clearTimeout(slowRequestTimer);
      }
      setLoading(false);
      setSlowRequest(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, categoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (err) {
      console.error('Error refreshing data:', err);
      let errorMessage = 'Failed to refresh providers data';
      
      if (err instanceof Error) {
        if (err.message.includes('timed out')) {
          errorMessage = 'Refresh timed out. The server may be slow. Please try again.';
        } else if (err.message.includes('aborted')) {
          errorMessage = 'Refresh was cancelled. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSort = (field: 'name' | 'status' | 'rating' | 'createdAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewProvider = (providerId: string) => {
    // TODO: Implement provider view modal or navigation
    console.log('View provider:', providerId);
  };

  const handleEditProvider = (providerId: string) => {
    // TODO: Implement provider edit modal or navigation
    console.log('Edit provider:', providerId);
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (window.confirm('Are you sure you want to delete this provider?')) {
      try {
        const response = await fetch(`/api/admin/providers/${providerId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to delete provider');
        }

        await fetchData(); // Refresh the data
      } catch (err) {
        console.error('Error deleting provider:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete provider');
      }
    }
  };

  const handleUpdateProviderStatus = async (providerId: string, status: string, reason?: string) => {
    try {
      const response = await fetch(`/api/admin/providers/${providerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, reason })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update provider status');
      }

      await fetchData(); // Refresh the data
    } catch (err) {
      console.error('Error updating provider status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update provider status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getVerificationColor = (verified: boolean) => {
    return verified ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loading size="xl" text="Loading providers data..." />
          {slowRequest && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Slow Response:</strong> The request is taking longer than usual. 
                This might be due to a large dataset or slow external API. Please wait...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <AdminErrorState 
        error={error}
        onRetry={fetchData}
        retryText="Try Again"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Provider Management
          </h1>
          <p className="text-gray-600 text-sm">Manage service providers, verification, and performance</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={() => console.log('Create new provider')}
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Provider
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
      {(stats || loading) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Providers</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : (stats?.totalProviders || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {loading ? '...' : (stats?.newProvidersToday || 0)} today
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0 ml-4">
                <Users2 className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Active Providers</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : (stats?.activeProviders || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Currently active
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg flex-shrink-0 ml-4">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Pending Approval</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : (stats?.pendingProviders || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Awaiting verification
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0 ml-4">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Average Rating</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : (stats?.averageRating || 0).toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">
                  {loading ? '...' : (stats?.totalEarnings || 0).toLocaleString()} earned
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0 ml-4">
                <Star className="w-5 h-5 text-purple-600" />
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
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Filter className="w-3 h-3 mr-1" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </button>
              <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Download className="w-3 h-3 mr-1" />
                Export
              </button>
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
                    placeholder="Search providers..."
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
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="repair">Repair</option>
                  <option value="installation">Installation</option>
                  <option value="consultation">Consultation</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCategoryFilter('all');
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="text-xs text-gray-500">
                {providers.length} providers found
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Providers</h3>
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
                onClick={() => handleSort('status')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'status' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Status
                {sortBy === 'status' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('rating')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'rating' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Rating
                {sortBy === 'rating' && (
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {providers.map((provider) => (
                <tr key={provider._id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <Users2 className="w-4 h-4 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-xs font-semibold text-gray-900">
                          {provider.firstName} {provider.lastName}
                        </div>
                        <div className="text-xs text-gray-600">{provider.email}</div>
                        {provider.profile?.businessName && (
                          <div className="text-xs text-gray-500">{provider.profile.businessName}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(provider.status)}`}>
                      {provider.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getVerificationColor(provider.isVerified)}`}>
                        {provider.isVerified ? 'VERIFIED' : 'PENDING'}
                      </span>
                      {provider.trustScore && (
                        <span className="text-xs text-gray-500">
                          Score: {provider.trustScore}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                    <div className="space-y-1">
                      {provider.profile?.rating && (
                        <div className="flex items-center">
                          <Star className="w-3 h-3 mr-1 text-yellow-500" />
                          <span>{provider.profile.rating.toFixed(1)} ({provider.profile.totalReviews || 0} reviews)</span>
                        </div>
                      )}
                      {provider.performance?.completionRate && (
                        <div className="flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                          <span>{provider.performance.completionRate}% completion</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-700">
                    <div className="space-y-1">
                      {provider.phoneNumber && (
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1 text-gray-500" />
                          <span>{provider.phoneNumber}</span>
                        </div>
                      )}
                      {provider.profile?.address && (
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-gray-500" />
                          <span>
                            {provider.profile.address.city}, {provider.profile.address.state}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewProvider(provider._id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View provider details"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleEditProvider(provider._id)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit provider"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      {provider.status === 'active' ? (
                        <button 
                          onClick={() => handleUpdateProviderStatus(provider._id, 'suspended', 'Admin action')}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Suspend provider"
                        >
                          <UserX className="w-3 h-3" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateProviderStatus(provider._id, 'active')}
                          className="text-green-600 hover:text-green-900"
                          title="Activate provider"
                        >
                          <UserCheck className="w-3 h-3" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteProvider(provider._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete provider"
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

        {providers.length === 0 && (
          <div className="text-center py-8">
            <Users2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No providers found</h3>
            <p className="text-xs text-gray-500">Try adjusting your filters or search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
