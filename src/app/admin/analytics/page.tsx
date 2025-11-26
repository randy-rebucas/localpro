'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Search,
  X
} from 'lucide-react';
import { makeClientAuthenticatedRequestWithEndpointSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { logger } from "@/lib/logger";
import { AnalyticsEvent, AnalyticsEventType } from "@/types/analytics";

// Extended AnalyticsEvent interface for admin page
interface AnalyticsEventWithUser extends Omit<AnalyticsEvent, 'userId' | 'timestamp'> {
  _id: string;
  userId: string | {
    _id: string;
    name?: string;
    email?: string;
  };
  eventType: AnalyticsEventType;
  timestamp: string | Date;
}

interface CustomAnalyticsResponse {
  success: boolean;
  count: number;
  data: AnalyticsEventWithUser[];
}

interface AnalyticsStats {
  totalEvents: number;
  uniqueUsers: number;
  eventsByType: Record<string, number>;
  eventsByDevice: Record<string, number>;
  eventsByModule: Record<string, number>;
}

export default function AdminAnalyticsPage() {
  const [events, setEvents] = useState<AnalyticsEventWithUser[]>([]);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const eventTypes: AnalyticsEventType[] = [
    'page_view',
    'service_view',
    'booking_created',
    'booking_completed',
    'job_view',
    'job_application',
    'course_enrollment',
    'product_purchase',
    'referral_click',
    'referral_completed',
    'subscription_upgrade',
    'payment_completed',
    'search_performed',
    'filter_applied',
    'user_registration',
    'user_login',
    'profile_update'
  ];

  const modules = [
    'marketplace',
    'jobs',
    'academy',
    'supplies',
    'rentals',
    'facility-care',
    'referrals',
    'agencies',
    'ads',
    'communication'
  ];

  const fetchCustomAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams: Record<string, string> = {};
      if (eventTypeFilter !== 'all') {
        queryParams.eventType = eventTypeFilter;
      }
      if (moduleFilter !== 'all') {
        queryParams.module = moduleFilter;
      }
      if (startDate) {
        queryParams.startDate = new Date(startDate).toISOString();
      }
      if (endDate) {
        queryParams.endDate = new Date(endDate).toISOString();
      }

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        'analyticsCustom' as keyof typeof API_ENDPOINTS,
        { 
          method: 'GET',
          query: queryParams
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Failed to fetch analytics (${response.status})`);
      }

      const result: CustomAnalyticsResponse = await response.json();
      
      if (result.success && result.data) {
        setEvents(result.data || []);
        
        // Calculate stats
        const uniqueUserIds = new Set<string>();
        const eventsByType: Record<string, number> = {};
        const eventsByDevice: Record<string, number> = {};
        const eventsByModule: Record<string, number> = {};

        result.data.forEach(event => {
          // Count unique users
          const userId = typeof event.userId === 'string' ? event.userId : event.userId._id;
          uniqueUserIds.add(userId);

          // Count by event type
          eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;

          // Count by device type
          const deviceType = event.metadata?.deviceType || 'unknown';
          eventsByDevice[deviceType] = (eventsByDevice[deviceType] || 0) + 1;

          // Count by module (extract from eventData or metadata)
          const moduleName = (event.eventData?.module as string) || 'unknown';
          eventsByModule[moduleName] = (eventsByModule[moduleName] || 0) + 1;
        });

        setStats({
          totalEvents: result.count || result.data.length,
          uniqueUsers: uniqueUserIds.size,
          eventsByType,
          eventsByDevice,
          eventsByModule
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Error fetching custom analytics', error);
      setError(error.message);
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventTypeFilter, moduleFilter, startDate, endDate]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await fetchCustomAnalytics();
    setLastUpdated(new Date());
  }, [fetchCustomAnalytics]);

  useEffect(() => {
    fetchCustomAnalytics();
  }, [fetchCustomAnalytics]);

  // Filter events by search term
  const filteredEvents = events.filter(event => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const eventType = event.eventType.toLowerCase();
    const userId = typeof event.userId === 'string' 
      ? event.userId 
      : (event.userId.name || event.userId.email || event.userId._id || '').toLowerCase();
    const metadata = JSON.stringify(event.metadata || {}).toLowerCase();
    const eventData = JSON.stringify(event.eventData || {}).toLowerCase();
    
    return eventType.includes(searchLower) || 
           userId.includes(searchLower) ||
           metadata.includes(searchLower) ||
           eventData.includes(searchLower);
  });

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatEventType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getUserDisplay = (userId: string | { _id: string; name?: string; email?: string }) => {
    if (typeof userId === 'string') {
      return userId.substring(0, 8) + '...';
    }
    return userId.name || userId.email || userId._id.substring(0, 8) + '...';
  };

  const clearFilters = () => {
    setEventTypeFilter('all');
    setModuleFilter('all');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  const hasActiveFilters = eventTypeFilter !== 'all' || 
                          moduleFilter !== 'all' || 
                          startDate || 
                          endDate || 
                          searchTerm;

  if (loading && !refreshing) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 text-xs">Query and analyze analytics events</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded shadow p-3 border-l-4 border-gray-300">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !events.length) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 text-xs">Query and analyze analytics events</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded shadow p-4">
          <div className="flex items-center">
            <X className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={fetchCustomAnalytics}
              className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700"
            >
              Try Again
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
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 text-xs">Query and analyze analytics events</p>
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
                <p className="text-xs font-medium text-gray-500">Total Events</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : stats.totalEvents.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">All events</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0 ml-3">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Unique Users</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : stats.uniqueUsers.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Active users</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0 ml-3">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Event Types</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : Object.keys(stats.eventsByType).length}
                </p>
                <p className="text-xs text-gray-500">Different types</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0 ml-3">
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow p-3 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500">Filtered</p>
                <p className="text-lg font-bold text-gray-900">
                  {loading ? '...' : filteredEvents.length.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">Showing results</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0 ml-3">
                <Filter className="w-4 h-4 text-orange-600" />
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
              <div className="text-xs text-gray-500">
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search events..."
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Event Type</label>
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>
                      {formatEventType(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Module</label>
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Modules</option>
                  {modules.map(module => (
                    <option key={module} value={module}>
                      {module.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={clearFilters}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all filters
              </button>
              <button
                onClick={fetchCustomAnalytics}
                className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Events Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-gray-900">Analytics Events</h3>
            <button
              onClick={() => {
                const dataStr = JSON.stringify(filteredEvents.slice(0, 100), null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
                link.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-gray-500">
                    {loading ? 'Loading events...' : 'No events found'}
                  </td>
                </tr>
              ) : (
                filteredEvents.slice(0, 100).map((event) => (
                  <tr key={event._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                      {formatDate(event.timestamp)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {formatEventType(event.eventType)}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                      {getUserDisplay(event.userId)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                      <div className="flex flex-col">
                        <span>{event.metadata?.deviceType || 'Unknown'}</span>
                        {event.metadata?.browser && (
                          <span className="text-gray-400 text-[10px]">{event.metadata.browser}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                      {event.metadata?.location ? (
                        <div className="flex flex-col">
                          {event.metadata.location.city && (
                            <span>{event.metadata.location.city}</span>
                          )}
                          {event.metadata.location.country && (
                            <span className="text-gray-400 text-[10px]">{event.metadata.location.country}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      <details className="cursor-pointer">
                        <summary className="text-blue-600 hover:text-blue-800 text-[10px]">View</summary>
                        <pre className="mt-1 p-1.5 bg-gray-50 rounded text-[10px] overflow-auto max-h-24">
                          {JSON.stringify({ 
                            eventData: event.eventData, 
                            metadata: event.metadata 
                          }, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredEvents.length > 100 && (
            <div className="px-4 py-2 text-xs text-gray-500 text-center border-t border-gray-200">
              Showing first 100 of {filteredEvents.length} events
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
