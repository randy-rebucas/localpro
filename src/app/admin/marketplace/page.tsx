"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Store,
  Search,
  Edit,
  Trash2,
  Eye,
  Star,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter,
  Download,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";

interface MarketplaceService {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  provider: {
    _id: string;
    firstName: string;
    lastName: string;
    profile: {
      rating: number;
    };
  };
  pricing: {
    type: 'hourly' | 'fixed' | 'package';
    basePrice: number;
    currency: string;
  };
  serviceType: 'one_time' | 'recurring' | 'subscription';
  estimatedDuration: {
    min: number;
    max: number;
  };
  teamSize: number;
  equipmentProvided: boolean;
  materialsIncluded: boolean;
  warranty: {
    hasWarranty: boolean;
    duration: number;
    description: string;
  };
  insurance: {
    covered: boolean;
    coverageAmount: number;
  };
  emergencyService: {
    available: boolean;
    surcharge: number;
    responseTime: string;
  };
  servicePackages: Array<{
    _id: string;
    name: string;
    description: string;
    price: number;
    features: string[];
    duration: number;
  }>;
  addOns: Array<{
    _id: string;
    name: string;
    description: string;
    price: number;
    category: string;
  }>;
  features: string[];
  requirements: string[];
  serviceArea: string[];
  availability: {
    timezone: string;
    schedule: any[];
  };
  isActive: boolean;
  rating: {
    average: number;
    count: number;
  };
  images: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface MarketplaceStats {
  totalServices: number;
  activeServices: number;
  pendingServices: number;
  rejectedServices: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  topCategory: string;
  growthRate: number;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  trends: {
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ week: string; count: number }>;
    monthly: Array<{ month: string; count: number }>;
  };
  topServices: Array<{ id: string; name: string; bookings: number }>;
  categoryStats: Array<{ category: string; count: number }>;
  performanceMetrics: {
    averageBookings: number;
    averageRevenue: number;
    conversionRate: number;
  };
}

// Data mapping function to transform API response
const mapServiceData = (apiService: any): MarketplaceService => {
  return {
    _id: apiService._id || '',
    title: apiService.title || '',
    description: apiService.description || '',
    category: apiService.category || '',
    subcategory: apiService.subcategory || '',
    provider: {
      _id: apiService.provider?._id || '',
      firstName: apiService.provider?.firstName || '',
      lastName: apiService.provider?.lastName || '',
      profile: {
        rating: apiService.provider?.profile?.rating || 0
      }
    },
    pricing: {
      type: apiService.pricing?.type || 'fixed',
      basePrice: apiService.pricing?.basePrice || 0,
      currency: apiService.pricing?.currency || 'USD'
    },
    serviceType: apiService.serviceType || 'one_time',
    estimatedDuration: {
      min: apiService.estimatedDuration?.min || 0,
      max: apiService.estimatedDuration?.max || 0
    },
    teamSize: apiService.teamSize || 1,
    equipmentProvided: apiService.equipmentProvided || false,
    materialsIncluded: apiService.materialsIncluded || false,
    warranty: {
      hasWarranty: apiService.warranty?.hasWarranty || false,
      duration: apiService.warranty?.duration || 0,
      description: apiService.warranty?.description || ''
    },
    insurance: {
      covered: apiService.insurance?.covered || false,
      coverageAmount: apiService.insurance?.coverageAmount || 0
    },
    emergencyService: {
      available: apiService.emergencyService?.available || false,
      surcharge: apiService.emergencyService?.surcharge || 0,
      responseTime: apiService.emergencyService?.responseTime || ''
    },
    servicePackages: apiService.servicePackages || [],
    addOns: apiService.addOns || [],
    features: apiService.features || [],
    requirements: apiService.requirements || [],
    serviceArea: apiService.serviceArea || [],
    availability: {
      timezone: apiService.availability?.timezone || 'UTC',
      schedule: apiService.availability?.schedule || []
    },
    isActive: apiService.isActive || false,
    rating: {
      average: apiService.rating?.average || 0,
      count: apiService.rating?.count || 0
    },
    images: apiService.images || [],
    createdAt: apiService.createdAt || '',
    updatedAt: apiService.updatedAt || '',
    __v: apiService.__v || 0
  };
};

export default function MarketplacePage() {
  const [services, setServices] = useState<MarketplaceService[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'status' | 'createdAt' | 'price' | 'rating' | 'bookings'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters for marketplace data
      const queryParams = new URLSearchParams();
      queryParams.set('type', 'listings'); // This is crucial - we need listings, not overview
      queryParams.set('page', currentPage.toString());
      queryParams.set('limit', itemsPerPage.toString());
      if (searchTerm) queryParams.set('search', searchTerm);
      if (categoryFilter !== 'all') queryParams.set('category', categoryFilter);
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);
      queryParams.set('sortBy', sortBy);
      queryParams.set('sortOrder', sortOrder);

      const [dataResponse, statsResponse] = await Promise.all([
        fetch(`/api/admin/marketplace?${queryParams}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        }),
        fetch('/api/admin/marketplace/stats?period=week', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        })
      ]);

      if (!dataResponse.ok) {
        const errorData = await dataResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch marketplace data');
      }

      if (!statsResponse.ok) {
        const errorData = await statsResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch marketplace statistics');
      }

      const dataResult = await dataResponse.json();
      const statsResult = await statsResponse.json();

      // Handle the API response structure
      if (dataResult.success && dataResult.data) {
        // Ensure data is an array before mapping
        if (Array.isArray(dataResult.data)) {
          const mappedServices = dataResult.data.map(mapServiceData);
          setServices(mappedServices);
          setTotalCount(dataResult.pagination?.total || dataResult.data.length);
        } else {
          console.warn('Expected array data but received:', typeof dataResult.data, dataResult.data);
          setServices([]);
          setTotalCount(0);
        }
      } else {
        setServices([]);
        setTotalCount(0);
      }
      
      // Handle stats response - it should be an object, not an array
      const statsData = statsResult.data || statsResult;
      if (Array.isArray(statsData)) {
        // If it's an array, create a default stats object
        setStats({
          totalServices: 0,
          activeServices: 0,
          pendingServices: 0,
          rejectedServices: 0,
          totalBookings: 0,
          totalRevenue: 0,
          averageRating: 0,
          topCategory: 'N/A',
          growthRate: 0,
          todayCount: 0,
          weekCount: 0,
          monthCount: 0,
          trends: { daily: [], weekly: [], monthly: [] },
          topServices: [],
          categoryStats: [],
          performanceMetrics: { averageBookings: 0, averageRevenue: 0, conversionRate: 0 }
        });
      } else {
        setStats(statsData);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching marketplace data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load marketplace data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, categoryFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh marketplace data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSort = (field: 'title' | 'status' | 'createdAt' | 'price' | 'rating' | 'bookings') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'cleaning': return 'bg-blue-100 text-blue-800';
      case 'plumbing': return 'bg-green-100 text-green-800';
      case 'electrical': return 'bg-yellow-100 text-yellow-800';
      case 'moving': return 'bg-purple-100 text-purple-800';
      case 'landscaping': return 'bg-emerald-100 text-emerald-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Loading
        size="xl"
        text="Loading marketplace data..."
        fullScreen={true}
        variant="default"
      />
    );
  }

  if (error) {
    return (
      <AdminErrorState
        error={error}
        onRetry={() => window.location.reload()}
        retryText="Try Again"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Marketplace Management
          </h1>
          <p className="text-gray-600 text-sm">Manage services, bookings, and reviews</p>
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
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded shadow p-3 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Services</p>
                <p className="text-lg font-bold text-gray-900">
                  {Number(stats?.totalServices || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {stats?.todayCount || 0} today
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0 ml-4">
                <Store className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Active Services</p>
                <p className="text-lg font-bold text-gray-900">
                  {Number(stats?.activeServices || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Currently active
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg flex-shrink-0 ml-4">
                <Store className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Pending Services</p>
                <p className="text-lg font-bold text-gray-900">
                  {Number(stats?.pendingServices || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Awaiting approval
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg flex-shrink-0 ml-4">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Total Revenue</p>
                <p className="text-lg font-bold text-gray-900">
                  ${Number(stats?.totalRevenue || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  All time
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg flex-shrink-0 ml-4">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Average Rating</p>
                <p className="text-2xl font-bold text-gray-700">{Number(stats?.averageRating || 0).toFixed(1)}</p>
              </div>
              <div className="flex items-center">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Top Category</p>
                <p className="text-2xl font-bold text-gray-700">{stats?.topCategory || 'N/A'}</p>
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Growth Rate</p>
                <p className="text-2xl font-bold text-gray-700">+{stats?.growthRate || 0}%</p>
              </div>
              <div className="flex items-center">
                {(stats?.growthRate || 0) >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
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
                    placeholder="Search services..."
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
                  <option value="all">All Categories</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="electrical">Electrical</option>
                  <option value="moving">Moving</option>
                  <option value="landscaping">Landscaping</option>
                  <option value="maintenance">Maintenance</option>
                </select>
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
                {totalCount} services found
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Marketplace Services</h3>
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gray-500">Sort:</span>
                <button
                  onClick={() => handleSort('title')}
                  className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${sortBy === 'title' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  Title
                  {sortBy === 'title' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('status')}
                  className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${sortBy === 'status' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  Status
                  {sortBy === 'status' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('createdAt')}
                  className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${sortBy === 'createdAt' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  Date
                  {sortBy === 'createdAt' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('price')}
                  className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${sortBy === 'price' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  Price
                  {sortBy === 'price' && (
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
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div>
                        <div className="text-xs font-medium text-gray-900">{service.title || 'N/A'}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{service.description || 'No description'}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {service.subcategory && (
                            <span className="bg-gray-100 px-1 py-0.5 rounded text-xs">{service.subcategory}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        {service.provider?.firstName} {service.provider?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">ID: {service.provider?._id || 'N/A'}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getCategoryColor(service.category || 'other')}`}>
                        {service.category || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      <div>
                        <div className="font-medium">
                          ${Number(service.pricing?.basePrice || 0).toFixed(2)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {service.pricing?.type === 'hourly' ? '/hour' : service.pricing?.type === 'package' ? '/package' : 'fixed'}
                        </div>
                        {service.servicePackages?.length > 0 && (
                          <div className="text-xs text-blue-600">
                            {service.servicePackages.length} packages
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="ml-1 text-xs text-gray-900">{Number(service.rating?.average || 0).toFixed(1)}</span>
                        <span className="ml-1 text-xs text-gray-500">({service.rating?.count || 0})</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(service.isActive ? 'active' : 'inactive')}`}>
                        {service.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <span className="text-xs">Duration: {service.estimatedDuration?.min}-{service.estimatedDuration?.max}h</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs">Team: {service.teamSize} people</span>
                        </div>
                        {service.equipmentProvided && (
                          <div className="text-xs text-green-600">Equipment included</div>
                        )}
                        {service.insurance?.covered && (
                          <div className="text-xs text-blue-600">Insured</div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900" title="View Details">
                          <Eye className="w-3 h-3" />
                        </button>
                        <button className="text-green-600 hover:text-green-900" title="Edit Service">
                          <Edit className="w-3 h-3" />
                        </button>
                        <button className="text-red-600 hover:text-red-900" title="Delete Service">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {services.length === 0 && !loading && (
            <div className="text-center py-8">
              <Store className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No services found</h3>
              <p className="text-xs text-gray-500">
                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters or search criteria.'
                  : 'No marketplace services have been created yet.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
