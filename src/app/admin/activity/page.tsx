"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  RefreshCw,
  Filter,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  Activity,
  User,
  BarChart3,
  TrendingUp,
  Clock,
  FileText,
  ShoppingCart,
  Briefcase,
  MessageSquare,
  DollarSign
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { createAuthFetchOptions, getApiToken } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

interface ActivityItem {
  _id: string;
  type: string;
  category: string;
  action: string;
  description: string;
  details?: Record<string, unknown>;
  targetEntity?: {
    type: string;
    id: string;
    name?: string;
    url?: string;
  };
  relatedEntities?: Array<{
    type: string;
    id: string;
    name?: string;
    role?: string;
  }>;
  location?: {
    type: string;
    coordinates?: number[];
    address?: string;
    city?: string;
    country?: string;
  };
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    device?: string;
    browser?: string;
    os?: string;
    appVersion?: string;
    sessionId?: string;
    requestId?: string;
  };
  visibility: string;
  isVisible: boolean;
  tags?: string[];
  impact: string;
  points: number;
  analytics?: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
  };
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    profile?: {
      avatar?: { url?: string; thumbnail?: string };
    };
  };
  age?: string;
  createdAt: string;
  updatedAt: string;
}

interface ActivityStatistics {
  totalActivities?: number;
  totalPoints?: number;
  uniqueUsers?: number;
  categoryBreakdown?: Record<string, number>;
  typeBreakdown?: Record<string, number>;
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'points' | 'impact'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [timeframeFilter, setTimeframeFilter] = useState<string>("7d");
  const [statistics, setStatistics] = useState<ActivityStatistics | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);

  const fetchStatistics = useCallback(async () => {
    try {
      if (!getApiToken()) return;

      const url = `${API_BASE_URL}${API_ENDPOINTS.activitiesStatsGlobal}?timeframe=${timeframeFilter}`;
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        logger.warn('Failed to fetch activity statistics');
        return;
      }

      const result = await response.json();
      if (result.success && result.data) {
        setStatistics(result.data.stats || result.data);
      }
    } catch (err) {
      logger.error('Error fetching activity statistics', err instanceof Error ? err : new Error(String(err)));
    }
  }, [timeframeFilter]);

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
      if (categoryFilter !== 'all') queryParams.set('categories', categoryFilter);
      if (typeFilter !== 'all') queryParams.set('types', typeFilter);
      queryParams.set('timeframe', timeframeFilter);
      queryParams.set('limit', '100');

      const url = `${API_BASE_URL}${API_ENDPOINTS.activitiesFeed}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, createAuthFetchOptions({ method: 'GET' }));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const statusCode = response.status;
        let errorMessage = errorData.error || errorData.message || 'Failed to fetch activities';
        
        // Provide more helpful error messages based on status code
        if (statusCode === 500) {
          errorMessage = 'The activity service is temporarily unavailable. Please try again later.';
          logger.warn('Activity API returned 500 error', { url, statusCode, errorData });
        } else if (statusCode === 401 || statusCode === 403) {
          errorMessage = 'Access denied. Please check your authentication.';
        } else if (statusCode === 404) {
          errorMessage = 'Activity endpoint not found. Please contact support.';
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      let activitiesData: ActivityItem[] = [];
      if (result.success && result.data) {
        if (result.data.activities) {
          activitiesData = result.data.activities;
        } else if (Array.isArray(result.data)) {
          activitiesData = result.data;
        }
      } else if (Array.isArray(result)) {
        activitiesData = result;
      }

      // Sort activities
      activitiesData.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'createdAt') {
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortBy === 'points') {
          comparison = b.points - a.points;
        } else if (sortBy === 'impact') {
          const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          comparison = (impactOrder[b.impact as keyof typeof impactOrder] || 0) - (impactOrder[a.impact as keyof typeof impactOrder] || 0);
        }
        return sortOrder === 'asc' ? -comparison : comparison;
      });

      setActivities(activitiesData);
      setTotalCount(activitiesData.length);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load activities';
      // Only log as error if it's not a known server issue
      if (errorMessage.includes('temporarily unavailable')) {
        logger.warn('Activity service unavailable', { message: errorMessage });
      } else {
        logger.error('Error fetching activities', err instanceof Error ? err : new Error(String(err)));
      }
      setError(errorMessage);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categoryFilter, typeFilter, timeframeFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
    fetchStatistics();
  }, [fetchData, fetchStatistics]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      await fetchData();
      await fetchStatistics();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSort = (field: 'createdAt' | 'points' | 'impact') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      marketplace: <ShoppingCart className="w-4 h-4" />,
      job_board: <Briefcase className="w-4 h-4" />,
      academy: <FileText className="w-4 h-4" />,
      financial: <DollarSign className="w-4 h-4" />,
      communication: <MessageSquare className="w-4 h-4" />,
      authentication: <User className="w-4 h-4" />,
      profile: <User className="w-4 h-4" />
    };
    return icons[category] || <Activity className="w-4 h-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      marketplace: 'bg-blue-100 text-blue-800',
      job_board: 'bg-green-100 text-green-800',
      academy: 'bg-purple-100 text-purple-800',
      financial: 'bg-yellow-100 text-yellow-800',
      communication: 'bg-cyan-100 text-cyan-800',
      authentication: 'bg-gray-100 text-gray-800',
      profile: 'bg-indigo-100 text-indigo-800',
      agency: 'bg-orange-100 text-orange-800',
      referral: 'bg-pink-100 text-pink-800',
      verification: 'bg-emerald-100 text-emerald-800',
      supplies: 'bg-amber-100 text-amber-800',
      rentals: 'bg-rose-100 text-rose-800',
      advertising: 'bg-violet-100 text-violet-800',
      system: 'bg-slate-100 text-slate-800',
      social: 'bg-fuchsia-100 text-fuchsia-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getImpactColor = (impact: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[impact] || 'bg-gray-100 text-gray-800';
  };

  if (loading && activities.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading activity data..." />
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
            <Activity className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error.includes('temporarily unavailable') ? 'Service Unavailable' : 'Unable to Load Activities'}
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          {error.includes('temporarily unavailable') && (
            <p className="text-sm text-gray-500 mb-4">
              The activity tracking service may be undergoing maintenance or experiencing high load. 
              This doesn&apos;t affect other parts of the application.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Management</h1>
          <p className="text-gray-600 text-sm">Monitor platform activity and user engagement</p>
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
            className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalActivities?.toLocaleString() || 0}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Points</p>
                <p className="text-2xl font-bold text-green-600">{statistics.totalPoints?.toLocaleString() || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Unique Users</p>
                <p className="text-2xl font-bold text-purple-600">{statistics.uniqueUsers?.toLocaleString() || 0}</p>
              </div>
              <User className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Categories</p>
                <p className="text-2xl font-bold text-orange-600">
                  {statistics.categoryBreakdown ? Object.keys(statistics.categoryBreakdown).length : 0}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {statistics?.categoryBreakdown && Object.keys(statistics.categoryBreakdown).length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Activity by Category</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statistics.categoryBreakdown).map(([category, count]) => (
              <span key={category} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
                {getCategoryIcon(category)}
                <span className="ml-1">{category}: {count}</span>
              </span>
            ))}
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="all">All Categories</option>
                  <option value="marketplace">Marketplace</option>
                  <option value="job_board">Job Board</option>
                  <option value="academy">Academy</option>
                  <option value="financial">Financial</option>
                  <option value="communication">Communication</option>
                  <option value="authentication">Authentication</option>
                  <option value="profile">Profile</option>
                  <option value="agency">Agency</option>
                  <option value="referral">Referral</option>
                  <option value="verification">Verification</option>
                  <option value="supplies">Supplies</option>
                  <option value="rentals">Rentals</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="all">All Types</option>
                  <option value="service_created">Service Created</option>
                  <option value="booking_created">Booking Created</option>
                  <option value="booking_completed">Booking Completed</option>
                  <option value="job_applied">Job Applied</option>
                  <option value="course_enrolled">Course Enrolled</option>
                  <option value="payment_made">Payment Made</option>
                  <option value="message_sent">Message Sent</option>
                  <option value="profile_update">Profile Update</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Timeframe</label>
                <select
                  value={timeframeFilter}
                  onChange={(e) => setTimeframeFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                >
                  <option value="1h">Last Hour</option>
                  <option value="1d">Last Day</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setTypeFilter('all');
                  setTimeframeFilter('7d');
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <div className="text-xs text-gray-500">
                {totalCount} activities found
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Activities</h3>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">Sort:</span>
              <button
                onClick={() => handleSort('createdAt')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'createdAt' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Time
                {sortBy === 'createdAt' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('points')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'points' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Points
                {sortBy === 'points' && (
                  sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />
                )}
              </button>
              <button
                onClick={() => handleSort('impact')}
                className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${
                  sortBy === 'impact' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Impact
                {sortBy === 'impact' && (
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
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activities.map((activity) => (
                <tr key={activity._id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div>
                      <div className="text-xs font-semibold text-gray-900">{activity.action}</div>
                      <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">
                        {activity.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-3 h-3 text-gray-400 mr-1" />
                      <div>
                        <div className="text-xs text-gray-900">
                          {activity.user?.firstName} {activity.user?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{activity.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(activity.category)}`}>
                      {getCategoryIcon(activity.category)}
                      <span className="ml-1">{activity.category}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getImpactColor(activity.impact)}`}>
                      {activity.impact}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="text-xs font-medium text-green-600">+{activity.points}</span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {activity.age || new Date(activity.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                    <button 
                      onClick={() => {
                        setSelectedActivity(activity);
                        setViewModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="View details"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {activities.length === 0 && (
          <div className="text-center py-8">
            <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No activities found</h3>
            <p className="text-xs text-gray-500">Try adjusting your filters or timeframe.</p>
          </div>
        )}
      </div>

      {/* View Activity Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedActivity(null);
        }}
        title="Activity Details"
        size="lg"
      >
        {selectedActivity && (
          <div className="space-y-4">
            {/* Activity Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{selectedActivity.action}</h3>
              <p className="text-sm text-gray-600 mt-1">{selectedActivity.description}</p>
              <div className="flex items-center space-x-2 mt-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(selectedActivity.category)}`}>
                  {getCategoryIcon(selectedActivity.category)}
                  <span className="ml-1">{selectedActivity.category}</span>
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getImpactColor(selectedActivity.impact)}`}>
                  {selectedActivity.impact}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  +{selectedActivity.points} pts
                </span>
              </div>
            </div>

            {/* User */}
            <div>
              <label className="text-xs font-medium text-gray-500">User</label>
              <div className="mt-1 flex items-center">
                <User className="w-4 h-4 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium">{selectedActivity.user?.firstName} {selectedActivity.user?.lastName}</p>
                  <p className="text-xs text-gray-500">{selectedActivity.user?.email}</p>
                </div>
              </div>
            </div>

            {/* Target Entity */}
            {selectedActivity.targetEntity && (
              <div>
                <label className="text-xs font-medium text-gray-500">Target</label>
                <div className="mt-1 bg-gray-50 p-3 rounded">
                  <p className="text-sm"><strong>Type:</strong> {selectedActivity.targetEntity.type}</p>
                  {selectedActivity.targetEntity.name && (
                    <p className="text-sm"><strong>Name:</strong> {selectedActivity.targetEntity.name}</p>
                  )}
                  <p className="text-xs text-gray-500 font-mono mt-1">ID: {selectedActivity.targetEntity.id}</p>
                </div>
              </div>
            )}

            {/* Location */}
            {selectedActivity.location && (
              <div>
                <label className="text-xs font-medium text-gray-500">Location</label>
                <p className="text-sm mt-1">
                  {selectedActivity.location.city}, {selectedActivity.location.country}
                </p>
              </div>
            )}

            {/* Metadata */}
            {selectedActivity.metadata && (
              <div>
                <label className="text-xs font-medium text-gray-500">Metadata</label>
                <div className="mt-1 bg-gray-50 p-3 rounded text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    {selectedActivity.metadata.device && (
                      <p><strong>Device:</strong> {selectedActivity.metadata.device}</p>
                    )}
                    {selectedActivity.metadata.browser && (
                      <p><strong>Browser:</strong> {selectedActivity.metadata.browser}</p>
                    )}
                    {selectedActivity.metadata.os && (
                      <p><strong>OS:</strong> {selectedActivity.metadata.os}</p>
                    )}
                    {selectedActivity.metadata.ipAddress && (
                      <p><strong>IP:</strong> {selectedActivity.metadata.ipAddress}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Analytics */}
            {selectedActivity.analytics && (
              <div>
                <label className="text-xs font-medium text-gray-500">Analytics</label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  <div className="bg-blue-50 p-2 rounded text-center">
                    <p className="text-xs text-gray-500">Views</p>
                    <p className="text-sm font-bold text-blue-600">{selectedActivity.analytics.views || 0}</p>
                  </div>
                  <div className="bg-red-50 p-2 rounded text-center">
                    <p className="text-xs text-gray-500">Likes</p>
                    <p className="text-sm font-bold text-red-600">{selectedActivity.analytics.likes || 0}</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded text-center">
                    <p className="text-xs text-gray-500">Shares</p>
                    <p className="text-sm font-bold text-green-600">{selectedActivity.analytics.shares || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded text-center">
                    <p className="text-xs text-gray-500">Comments</p>
                    <p className="text-sm font-bold text-purple-600">{selectedActivity.analytics.comments || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tags */}
            {selectedActivity.tags && selectedActivity.tags.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500">Tags</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedActivity.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Created</label>
                <p className="text-sm">{new Date(selectedActivity.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Visibility</label>
                <p className="text-sm">{selectedActivity.visibility}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

