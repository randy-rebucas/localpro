"use client";

import { useState, useEffect } from "react";
import { 
  Activity, 
  Filter, 
  Search, 
  Calendar, 
  Clock, 
  RefreshCw,
  TrendingUp,
  MessageSquare,
  Settings,
  Bell,
  User,
  Shield,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Eye,
  ArrowRight,
  Download,
  MoreHorizontal
} from "lucide-react";
import ErrorBoundary from "@/components/error-boundary";
import { Loading } from "@/components/ui/loading";
import { useSession } from "@/hooks/useAuth";

export interface ActivityItem {
  id: string;
  type: string;
  action: string;
  description: string;
  timestamp: string;
  icon: string;
  status?: "success" | "warning" | "error" | "info";
  metadata?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

const getActivityIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'dashboard':
      return <Activity className="w-5 h-5 text-blue-600" />;
    case 'marketplace':
      return <Shield className="w-5 h-5 text-green-600" />;
    case 'academy':
      return <User className="w-5 h-5 text-purple-600" />;
    case 'profile':
      return <User className="w-5 h-5 text-indigo-600" />;
    case 'messages':
      return <MessageSquare className="w-5 h-5 text-orange-600" />;
    case 'settings':
      return <Settings className="w-5 h-5 text-gray-600" />;
    case 'notifications':
      return <Bell className="w-5 h-5 text-yellow-600" />;
    case 'login':
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'logout':
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    default:
      return <Info className="w-5 h-5 text-blue-600" />;
  }
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-800';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    case 'info':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getTypeBadge = (type: string) => {
  const styles = {
    dashboard: "bg-blue-100 text-blue-800",
    marketplace: "bg-green-100 text-green-800",
    academy: "bg-purple-100 text-purple-800",
    profile: "bg-indigo-100 text-indigo-800",
    messages: "bg-orange-100 text-orange-800",
    settings: "bg-gray-100 text-gray-800",
    notifications: "bg-yellow-100 text-yellow-800",
    login: "bg-green-100 text-green-800",
    logout: "bg-red-100 text-red-800"
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type.toLowerCase() as keyof typeof styles] || styles.dashboard}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDetailedDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        if (session?.user?.id) {
          const response = await fetch(`/api/logs/user/${session.user.id}/activity`);
          if (response.ok) {
            const activityData = await response.json();
            setActivities(activityData);
          } else {
            throw new Error('Failed to fetch activities');
          }
        }
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Failed to load activity data');
        
        // Fallback to mock data for development
        setActivities([
          {
            id: '1',
            type: 'dashboard',
            action: 'Dashboard accessed',
            description: 'User accessed the main dashboard',
            timestamp: new Date().toISOString(),
            status: 'success',
            userId: session?.user?.id || 'user-1',
            sessionId: 'session-123',
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          {
            id: '2',
            type: 'marketplace',
            action: 'Service viewed',
            description: 'Viewed cleaning service details',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            status: 'info',
            userId: session?.user?.id || 'user-1',
            sessionId: 'session-123',
            ipAddress: '192.168.1.1'
          },
          {
            id: '3',
            type: 'profile',
            action: 'Profile updated',
            description: 'Updated personal information',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: 'success',
            userId: session?.user?.id || 'user-1',
            sessionId: 'session-123'
          },
          {
            id: '4',
            type: 'messages',
            action: 'Message sent',
            description: 'Sent message to service provider',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            status: 'success',
            userId: session?.user?.id || 'user-1',
            sessionId: 'session-123'
          },
          {
            id: '5',
            type: 'settings',
            action: 'Settings changed',
            description: 'Updated notification preferences',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: 'info',
            userId: session?.user?.id || 'user-1',
            sessionId: 'session-123'
          },
          {
            id: '6',
            type: 'login',
            action: 'User login',
            description: 'Successfully logged into the platform',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'success',
            userId: session?.user?.id || 'user-1',
            sessionId: 'session-123',
            ipAddress: '192.168.1.1'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated" && session?.user?.id) {
      fetchActivities();
    }
  }, [session, status]);

  const refreshActivity = async () => {
    setLoading(true);
    try {
      if (session?.user?.id) {
        const response = await fetch(`/api/logs/user/${session.user.id}/activity`);
        if (response.ok) {
          const activityData = await response.json();
          setActivities(activityData);
        }
      }
    } catch (error) {
      console.error('Error refreshing activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || activity.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || activity.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== "all") {
      const activityDate = new Date(activity.timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = diffInHours < 24;
          break;
        case 'week':
          matchesDate = diffInHours < 168; // 7 days
          break;
        case 'month':
          matchesDate = diffInHours < 720; // 30 days
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const getActivityStats = () => {
    const total = activities.length;
    const today = activities.filter(a => {
      const diffInHours = (new Date().getTime() - new Date(a.timestamp).getTime()) / (1000 * 60 * 60);
      return diffInHours < 24;
    }).length;
    const thisWeek = activities.filter(a => {
      const diffInHours = (new Date().getTime() - new Date(a.timestamp).getTime()) / (1000 * 60 * 60);
      return diffInHours < 168;
    }).length;
    const success = activities.filter(a => a.status === 'success').length;
    
    return { total, today, thisWeek, success };
  };

  const stats = getActivityStats();

  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-200 rounded"></div>
                  <div className="h-6 bg-gray-200 rounded w-48"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to Load Activity</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Activity Log
                </h1>
                <p className="text-gray-600 text-lg mt-1">
                  Track your account activity and system interactions
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.total}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
                <div className="text-sm text-gray-500">Today</div>
              </div>
              <div className="w-px h-12 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{stats.success}</div>
                <div className="text-sm text-gray-500">Success</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Filter & Search</h3>
          </div>
          <button
            onClick={refreshActivity}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search activities by action or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            >
              <option value="all">All Types</option>
              <option value="dashboard">📊 Dashboard</option>
              <option value="marketplace">🛡️ Marketplace</option>
              <option value="academy">🎓 Academy</option>
              <option value="profile">👤 Profile</option>
              <option value="messages">💬 Messages</option>
              <option value="settings">⚙️ Settings</option>
              <option value="notifications">🔔 Notifications</option>
              <option value="login">🔐 Login</option>
              <option value="logout">🚪 Logout</option>
            </select>
          </div>
          
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            >
              <option value="all">All Status</option>
              <option value="success">✅ Success</option>
              <option value="warning">⚠️ Warning</option>
              <option value="error">❌ Error</option>
              <option value="info">ℹ️ Info</option>
            </select>
          </div>
        </div>
        
        {/* Additional Options */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showDetails"
                checked={showDetails}
                onChange={(e) => setShowDetails(e.target.checked)}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="showDetails" className="text-sm text-gray-600">
                Show technical details
              </label>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Showing {filteredActivities.length} of {activities.length} activities
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Activity className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">No Activities Found</h3>
            <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
              {searchQuery || typeFilter !== "all" || statusFilter !== "all" 
                ? "Try adjusting your filters to see more activities."
                : "No activity data available at the moment."}
            </p>
            {(searchQuery || typeFilter !== "all" || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredActivities.map((activity) => {
            const isExpanded = expandedId === activity.id;
            
            return (
              <div
                key={activity.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50">
                        {getActivityIcon(activity.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2 text-gray-800">{activity.action}</h3>
                          <div className="flex items-center gap-3 mb-3">
                            {getTypeBadge(activity.type)}
                            {activity.status && (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                                {activity.status}
                              </span>
                            )}
                            <span className="text-sm text-gray-500 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {formatDate(activity.timestamp)}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => toggleExpanded(activity.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                          title="Toggle details"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <p className="text-gray-700 leading-relaxed mb-4">
                        {activity.description}
                      </p>
                      
                      {isExpanded && showDetails && (
                        <div className="pt-4 border-t border-gray-200 space-y-3">
                          <h4 className="text-sm font-semibold text-gray-800 mb-3">Technical Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Timestamp:</span>
                              <p className="text-gray-800">{formatDetailedDate(activity.timestamp)}</p>
                            </div>
                            {activity.userId && (
                              <div>
                                <span className="font-medium text-gray-600">User ID:</span>
                                <p className="text-gray-800 font-mono text-xs">{activity.userId}</p>
                              </div>
                            )}
                            {activity.sessionId && (
                              <div>
                                <span className="font-medium text-gray-600">Session ID:</span>
                                <p className="text-gray-800 font-mono text-xs">{activity.sessionId}</p>
                              </div>
                            )}
                            {activity.ipAddress && (
                              <div>
                                <span className="font-medium text-gray-600">IP Address:</span>
                                <p className="text-gray-800 font-mono text-xs">{activity.ipAddress}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
